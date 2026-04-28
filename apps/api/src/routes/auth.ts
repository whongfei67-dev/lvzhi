/**
 * 认证相关 API 路由
 */

import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { query, transaction } from '../lib/database.js'
import { generateTokens, verifyRefreshToken } from '../plugins/auth.js'
import { hashPassword, verifyPassword, generateCode } from '../utils/password.js'
import { success, created, errors } from '../utils/response.js'
import { sendSMSCode, isSMSConfigured } from '../utils/sms.js'
import {
  registerSchema,
  loginSchema,
  sendSmsSchema,
  changePasswordSchema,
  resetPasswordSchema,
} from '../utils/validation.js'
import {
  generateWechatAuthUrl,
  generateState,
  getWechatAccessToken,
  getWechatUserInfo,
} from '../utils/wechat.js'
import {
  generateAlipayAuthUrl,
  createAlipaySDK,
} from '../utils/alipay.js'
import type { JwtPayload } from '../types.js'
import { shouldUseSecureCookies } from '../utils/cookie-secure.js'

export const authRoute: FastifyPluginAsync = async (app: FastifyInstance) => {

  // ============================================
  // POST /api/auth/register - 用户注册
  // ============================================
  app.post('/api/auth/register', async (request, reply) => {
    const validation = registerSchema.safeParse(request.body)
    if (!validation.success) {
      return errors.badRequest(reply, validation.error.errors[0].message)
    }

    const { email, password, display_name, role: registerRole } = validation.data

    try {
      // 检查邮箱是否已存在
      const existing = await query<{ id: string }>(
        'SELECT id FROM profiles WHERE email = $1',
        [email]
      )

      if (existing.rows.length > 0) {
        return errors.conflict(reply, 'Email already registered')
      }

      // 哈希密码并创建用户
      const hashedPassword = hashPassword(password)

      const result = await transaction(async (client) => {
        // 创建用户
        const userResult = await client.query<{
          id: string
          email: string
          role: string
          display_name: string
          created_at: string
        }>(
          `INSERT INTO profiles (email, password_hash, display_name, role, verified)
           VALUES ($1, $2, $3, $4, false)
           RETURNING id, email, role, display_name, created_at`,
          [email, hashedPassword, display_name, registerRole]
        )

        const user = userResult.rows[0]

        // 初始化余额
        await client.query(
          `INSERT INTO user_balances (user_id, balance, frozen_balance)
           VALUES ($1, 0, 0)
           ON CONFLICT (user_id) DO NOTHING`,
          [user.id]
        )

        return user
      })

      // 生成 JWT
      const payload: JwtPayload = {
        id: result.id,
        user_id: result.id,
        email: result.email,
        role: result.role as JwtPayload['role'],
      }
      const tokens = generateTokens(app, payload)

      // Set access token as HTTP-only cookie
      reply.setCookie('lvzhi_access_token', tokens.access_token, {
        path: '/',
        httpOnly: true,
        secure: shouldUseSecureCookies(),
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
      reply.setCookie('lvzhi_refresh_token', tokens.refresh_token, {
        path: '/',
        httpOnly: true,
        secure: shouldUseSecureCookies(),
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      })
      // 设置角色 Cookie（供 middleware 使用）
      reply.setCookie('lvzhi_user_role', result.role, {
        path: '/',
        httpOnly: false, // 前端需要读取
        secure: shouldUseSecureCookies(),
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })

      return created(reply, {
        user: {
          id: result.id,
          email: result.email,
          display_name: result.display_name,
          role: result.role,
          created_at: result.created_at,
        },
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      }, 'Registration successful')

    } catch (err) {
      console.error('Registration error:', err)
      return errors.internal(reply, 'Registration failed')
    }
  })

  // ============================================
  // POST /api/auth/login - 邮箱密码登录
  // ============================================
  app.post('/api/auth/login', async (request, reply) => {
    const validation = loginSchema.safeParse(request.body)
    if (!validation.success) {
      return errors.badRequest(reply, validation.error.errors[0].message)
    }

    const { email, password } = validation.data
    const ip = request.ip
    const userAgent = request.headers['user-agent'] || ''

    try {
      // 获取用户信息
      const userResult = await query<{
        id: string
        email: string
        password_hash: string
        role: string
        display_name: string
        verified: boolean
        failed_attempts: number
        locked_until: string | null
      }>(
        `SELECT id, email, password_hash, role, display_name, verified,
                failed_attempts, locked_until
         FROM profiles WHERE email = $1`,
        [email]
      )

      if (userResult.rows.length === 0) {
        // 记录失败登录
        await logLoginAttempt(null, ip, userAgent, 'email', false)
        return errors.unauthorized(reply, '邮箱或密码错误')
      }

      const user = userResult.rows[0]

      // 检查账户是否被锁定
      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        return errors.forbidden(reply, 'Account is temporarily locked')
      }

      if (!user.password_hash) {
        await logLoginAttempt(user.id, ip, userAgent, 'email', false)
        return errors.unauthorized(
          reply,
          '该账号未设置邮箱密码，请使用短信验证码或微信/支付宝登录'
        )
      }

      // 验证密码
      if (!verifyPassword(password, user.password_hash)) {
        // 增加失败次数
        await query(
          `UPDATE profiles
           SET failed_attempts = failed_attempts + 1,
               locked_until = CASE
                 WHEN failed_attempts >= 4 THEN NOW() + INTERVAL '15 minutes'
                 ELSE locked_until
               END
           WHERE id = $1`,
          [user.id]
        )
        await logLoginAttempt(user.id, ip, userAgent, 'email', false)
        return errors.unauthorized(reply, '邮箱或密码错误')
      }

      // 登录成功，重置失败次数
      await query(
        `UPDATE profiles SET failed_attempts = 0, locked_until = NULL WHERE id = $1`,
        [user.id]
      )
      await logLoginAttempt(user.id, ip, userAgent, 'email', true)

      // 生成 JWT
      const payload: JwtPayload = {
        id: user.id,
        user_id: user.id,
        email: user.email,
        role: user.role as JwtPayload['role'],
      }
      const tokens = generateTokens(app, payload)

      // Set access token as HTTP-only cookie
      reply.setCookie('lvzhi_access_token', tokens.access_token, {
        path: '/',
        httpOnly: true,
        secure: shouldUseSecureCookies(),
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
      reply.setCookie('lvzhi_refresh_token', tokens.refresh_token, {
        path: '/',
        httpOnly: true,
        secure: shouldUseSecureCookies(),
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      })
      // 设置角色 Cookie（供 middleware 使用）
      reply.setCookie('lvzhi_user_role', user.role, {
        path: '/',
        httpOnly: false, // 前端需要读取
        secure: shouldUseSecureCookies(),
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })

      return success(reply, {
        user: {
          id: user.id,
          email: user.email,
          display_name: user.display_name,
          role: user.role,
          verified: user.verified,
        },
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      }, 'Login successful')

    } catch (err) {
      console.error('Login error:', err)
      const expose =
        process.env.NODE_ENV !== 'production' || process.env.AUTH_DEBUG_ERRORS === 'true'
      const detail = err instanceof Error ? err.message : String(err)
      return errors.internal(
        reply,
        expose ? `登录服务异常: ${detail}` : '登录失败，请稍后重试'
      )
    }
  })

  // ============================================
  // POST /api/auth/sms/send - 发送短信验证码
  // ============================================
  app.post('/api/auth/sms/send', async (request, reply) => {
    const validation = sendSmsSchema.safeParse(request.body)
    if (!validation.success) {
      return errors.badRequest(reply, validation.error.errors[0].message)
    }

    const { phone } = validation.data

    try {
      // 检查是否配置了阿里云 SMS
      if (!isSMSConfigured()) {
        // 开发环境：生成验证码并记录到日志
        const code = generateCode(6)

        await query(
          `INSERT INTO sms_codes (phone, code, expires_at)
           VALUES ($1, $2, NOW() + INTERVAL '10 minutes')
           ON CONFLICT (phone) DO UPDATE
           SET code = $2, expires_at = NOW() + INTERVAL '10 minutes', used = false`,
          [phone, code]
        )

        // 开发模式只记录发送请求，不暴露验证码
        console.log(`[DEV] SMS Code requested for ${phone} (code hidden)`)
        return success(reply, { expires_in: 600 }, 'SMS code sent (development mode)')
      }

      // 生成验证码
      const code = generateCode(6)

      // 存储验证码到数据库
      await query(
        `INSERT INTO sms_codes (phone, code, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '10 minutes')
         ON CONFLICT (phone) DO UPDATE
         SET code = $2, expires_at = NOW() + INTERVAL '10 minutes', used = false`,
        [phone, code]
      )

      // 调用阿里云 SMS API 发送真实短信
      const result = await sendSMSCode(phone, code)

      if (!result.success) {
        console.error('Failed to send SMS:', result.message)
        return errors.internal(reply, result.message || 'Failed to send SMS')
      }

      return success(reply, {
        expires_in: 600,
        request_id: result.requestId,
      }, 'SMS code sent')

    } catch (err) {
      console.error('Send SMS error:', err)
      return errors.internal(reply, 'Failed to send SMS')
    }
  })

  // ============================================
  // POST /api/auth/sms/login - 短信验证码登录
  // ============================================
  app.post('/api/auth/sms/login', async (request, reply) => {
    const { phone, code } = request.body as { phone: string; code: string }
    const ip = request.ip
    const userAgent = request.headers['user-agent'] || ''

    if (!phone || !code) {
      return errors.badRequest(reply, 'Phone and code are required')
    }

    try {
      // 验证验证码
      const codeResult = await query<{ id: string; expires_at: string; used: boolean }>(
        `SELECT id, expires_at, used FROM sms_codes
         WHERE phone = $1 AND code = $2
         ORDER BY created_at DESC LIMIT 1`,
        [phone, code]
      )

      if (codeResult.rows.length === 0) {
        return errors.unauthorized(reply, 'Invalid verification code')
      }

      const storedCode = codeResult.rows[0]

      if (storedCode.used) {
        return errors.unauthorized(reply, 'Code already used')
      }

      if (new Date(storedCode.expires_at) < new Date()) {
        return errors.unauthorized(reply, 'Code expired')
      }

      // 标记验证码已使用
      await query(`UPDATE sms_codes SET used = true WHERE id = $1`, [storedCode.id])

      // 查找或创建用户
      let user = await query<{
        id: string
        email: string
        role: string
        display_name: string
        verified: boolean
      }>(
        `SELECT id, email, role, display_name, verified FROM profiles WHERE phone = $1`,
        [phone]
      )

      if (user.rows.length === 0) {
        // 创建新用户（手机号登录自动注册）
        const newUser = await query<{
          id: string
          email: string
          role: string
          display_name: string
          verified: boolean
        }>(
          `INSERT INTO profiles (phone, display_name, role, verified)
           VALUES ($1, $2, 'client', true)
           RETURNING id, email, role, display_name, verified`,
          [phone, `用户${phone.slice(-4)}`]
        )
        user = newUser

        // 初始化余额
        await query(
          `INSERT INTO user_balances (user_id, balance, frozen_balance) VALUES ($1, 0, 0)
           ON CONFLICT (user_id) DO NOTHING`,
          [user.rows[0].id]
        )
      }

      const userData = user.rows[0]
      await logLoginAttempt(userData.id, ip, userAgent, 'sms', true)

      // 生成 JWT
      const payload: JwtPayload = {
        id: userData.id,
        user_id: userData.id,
        email: userData.email || '',
        role: userData.role as JwtPayload['role'],
      }
      const tokens = generateTokens(app, payload)

      return success(reply, {
        user: {
          id: userData.id,
          phone,
          display_name: userData.display_name,
          role: userData.role,
          verified: userData.verified,
          is_new_user: user.rows[0] === userData,
        },
        ...tokens,
      }, 'Login successful')

    } catch (err) {
      console.error('SMS login error:', err)
      return errors.internal(reply, 'Login failed')
    }
  })

  // ============================================
  // POST /api/auth/logout - 登出
  // ============================================
  app.post('/api/auth/logout', { preHandler: [app.authenticate] }, async (request, reply) => {
    const cookieOpts = {
      path: '/',
      httpOnly: true,
      secure: shouldUseSecureCookies(),
      sameSite: 'lax' as const,
      maxAge: 0,
    }
    reply.clearCookie('lvzhi_access_token', cookieOpts)
    reply.clearCookie('lvzhi_refresh_token', cookieOpts)
    reply.clearCookie('lvzhi_user_role', { ...cookieOpts, httpOnly: false })
    return success(reply, null, 'Logout successful')
  })

  // ============================================
  // GET /api/auth/wechat/authorize - 获取微信授权链接
  // ============================================
  app.get('/api/auth/wechat/authorize', async (request, reply) => {
    const { redirect_uri } = request.query as { redirect_uri?: string }

    // 使用配置的回调地址或前端微信登录页面
    const callbackUrl = redirect_uri ||
      `${process.env.API_BASE_URL || 'http://localhost:3001'}/api/auth/wechat/callback`

    // 生成随机 state 防止 CSRF
    const state = generateState()

    // 构建微信授权配置
    const wechatConfig = {
      appId: process.env.WECHAT_APP_ID || '',
      appSecret: process.env.WECHAT_APP_SECRET || '',
      redirectUri: callbackUrl,
    }

    // 生成授权 URL
    const authUrl = generateWechatAuthUrl(wechatConfig, state)

    return success(reply, {
      auth_url: authUrl,
      state,
    })
  })

  // ============================================
  // GET /api/auth/wechat/callback - 微信授权回调
  // ============================================
  app.get('/api/auth/wechat/callback', async (request, reply) => {
    const { code, state } = request.query as { code?: string; state?: string }

    if (!code) {
      return reply.redirect(`${process.env.WEB_BASE_URL || 'http://localhost:3000'}/oauth/callback?error=missing_code`)
    }

    // 验证 state（防止 CSRF）
    if (!state) {
      return reply.redirect(`${process.env.WEB_BASE_URL || 'http://localhost:3000'}/oauth/callback?error=missing_state`)
    }

    const ip = request.ip
    const userAgent = request.headers['user-agent'] || ''

    try {
      // 通过 code 获取 access_token
      const tokenData = await getWechatAccessToken(code)

      if (!tokenData) {
        return reply.redirect(`${process.env.WEB_BASE_URL || 'http://localhost:3000'}/oauth/callback?error=token_failed`)
      }

      // 获取微信用户信息
      const wechatUser = await getWechatUserInfo(tokenData.access_token, tokenData.openid)

      if (!wechatUser) {
        return reply.redirect(`${process.env.WEB_BASE_URL || 'http://localhost:3000'}/oauth/callback?error=userinfo_failed`)
      }

      // 查找或创建用户（基于 unionid 或 openid）
      const unionid = wechatUser.unionid || tokenData.openid

      let user = await query<{
        id: string
        email: string
        role: string
        display_name: string
        verified: boolean
        avatar_url: string | null
      }>(
        `SELECT id, email, role, display_name, verified, avatar_url
         FROM profiles WHERE wechat_unionid = $1 OR wechat_openid = $1`,
        [unionid]
      )

      let isNewUser = false

      if (user.rows.length === 0) {
        // 创建新用户
        isNewUser = true
        const newUser = await query<{
          id: string
          email: string
          role: string
          display_name: string
          verified: boolean
          avatar_url: string | null
        }>(
          `INSERT INTO profiles (wechat_unionid, wechat_openid, display_name, avatar_url, role, verified)
           VALUES ($1, $2, $3, $4, 'client', true)
           RETURNING id, email, role, display_name, verified, avatar_url`,
          [unionid, tokenData.openid, wechatUser.nickname || `微信用户${tokenData.openid.slice(-4)}`, wechatUser.headimgurl || null]
        )
        user = newUser

        // 初始化余额
        await query(
          `INSERT INTO user_balances (user_id, balance, frozen_balance) VALUES ($1, 0, 0)
           ON CONFLICT (user_id) DO NOTHING`,
          [user.rows[0].id]
        )
      } else if (!user.rows[0].avatar_url && wechatUser.headimgurl) {
        // 更新头像
        await query(
          `UPDATE profiles SET avatar_url = $1 WHERE id = $2`,
          [wechatUser.headimgurl, user.rows[0].id]
        )
      }

      const userData = user.rows[0]
      await logLoginAttempt(userData.id, ip, userAgent, 'wechat', true)

      // 生成 JWT
      const payload: JwtPayload = {
        id: userData.id,
        user_id: userData.id,
        email: userData.email || '',
        role: userData.role as JwtPayload['role'],
      }
      const tokens = generateTokens(app, payload)

      // 设置角色 Cookie（供 middleware 使用）
      reply.setCookie('lvzhi_user_role', userData.role, {
        path: '/',
        httpOnly: false,
        secure: shouldUseSecureCookies(),
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      })

      // 构建重定向 URL，携带 token 信息
      const redirectUrl = new URL(`${process.env.WEB_BASE_URL || 'http://localhost:3000'}/oauth/callback`)
      redirectUrl.searchParams.set('provider', 'wechat')
      redirectUrl.searchParams.set('access_token', tokens.access_token)
      redirectUrl.searchParams.set('refresh_token', tokens.refresh_token)
      redirectUrl.searchParams.set('user_id', userData.id)
      redirectUrl.searchParams.set('display_name', userData.display_name || '')
      redirectUrl.searchParams.set('role', userData.role)
      redirectUrl.searchParams.set('is_new_user', String(isNewUser))

      return reply.redirect(redirectUrl.toString())

    } catch (err) {
      console.error('Wechat login error:', err)
      return reply.redirect(`${process.env.WEB_BASE_URL || 'http://localhost:3000'}/oauth/callback?error=login_failed`)
    }
  })

  // ============================================
  // GET /api/auth/alipay/authorize - 获取支付宝授权链接
  // ============================================
  app.get('/api/auth/alipay/authorize', async (request, reply) => {
    const { redirect_uri } = request.query as { redirect_uri?: string }

    const callbackUrl = redirect_uri ||
      `${process.env.API_BASE_URL || 'http://localhost:3001'}/api/auth/alipay/callback`

    // 生成随机 state 防止 CSRF
    const state = generateState()

    // 构建支付宝授权配置
    const alipayConfig = {
      appId: process.env.ALIPAY_APP_ID || '',
      privateKey: process.env.ALIPAY_PRIVATE_KEY || '',
      alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY || '',
      redirectUri: callbackUrl,
    }

    // 生成授权 URL
    const authUrl = generateAlipayAuthUrl(alipayConfig, state)

    return success(reply, {
      auth_url: authUrl,
      state,
    })
  })

  // ============================================
  // GET /api/auth/alipay/callback - 支付宝授权回调
  // ============================================
  app.get('/api/auth/alipay/callback', async (request, reply) => {
    const { auth_code, state } = request.query as { auth_code?: string; state?: string }

    if (!auth_code) {
      return reply.redirect(`${process.env.WEB_BASE_URL || 'http://localhost:3000'}/oauth/callback?error=missing_code`)
    }

    if (!state) {
      return reply.redirect(`${process.env.WEB_BASE_URL || 'http://localhost:3000'}/oauth/callback?error=missing_state`)
    }

    const ip = request.ip
    const userAgent = request.headers['user-agent'] || ''

    try {
      const alipaySDK = createAlipaySDK()

      if (!alipaySDK) {
        return reply.redirect(`${process.env.WEB_BASE_URL || 'http://localhost:3000'}/oauth/callback?error=sdk_not_configured`)
      }

      // 使用 auth_code 获取 access_token
      const tokenResult = await alipaySDK.exec('alipay.system.oauth.token', {
        grant_type: 'authorization_code',
        code: auth_code,
      }) as {
        access_token?: string
        user_id?: string
        expires_in?: number
        re_expires_in?: number
      }

      if (!tokenResult.access_token) {
        return reply.redirect(`${process.env.WEB_BASE_URL || 'http://localhost:3000'}/oauth/callback?error=token_failed`)
      }

      // 获取用户信息
      const alipayUser = await alipaySDK.getUserInfo(tokenResult.access_token)

      if (!alipayUser) {
        return reply.redirect(`${process.env.WEB_BASE_URL || 'http://localhost:3000'}/oauth/callback?error=userinfo_failed`)
      }

      // 查找或创建用户
      let user = await query<{
        id: string
        email: string
        role: string
        display_name: string
        verified: boolean
        avatar_url: string | null
      }>(
        `SELECT id, email, role, display_name, verified, avatar_url
         FROM profiles WHERE alipay_user_id = $1`,
        [alipayUser.userId]
      )

      let isNewUser = false

      if (user.rows.length === 0) {
        // 创建新用户
        isNewUser = true
        const newUser = await query<{
          id: string
          email: string
          role: string
          display_name: string
          verified: boolean
          avatar_url: string | null
        }>(
          `INSERT INTO profiles (alipay_user_id, display_name, avatar_url, role, verified)
           VALUES ($1, $2, $3, 'client', true)
           RETURNING id, email, role, display_name, verified, avatar_url`,
          [alipayUser.userId, alipayUser.nickName || `支付宝用户${alipayUser.userId.slice(-4)}`, alipayUser.avatar || null]
        )
        user = newUser

        // 初始化余额
        await query(
          `INSERT INTO user_balances (user_id, balance, frozen_balance) VALUES ($1, 0, 0)
           ON CONFLICT (user_id) DO NOTHING`,
          [user.rows[0].id]
        )
      } else if (!user.rows[0].avatar_url && alipayUser.avatar) {
        // 更新头像
        await query(
          `UPDATE profiles SET avatar_url = $1 WHERE id = $2`,
          [alipayUser.avatar, user.rows[0].id]
        )
      }

      const userData = user.rows[0]
      await logLoginAttempt(userData.id, ip, userAgent, 'alipay', true)

      // 生成 JWT
      const payload: JwtPayload = {
        id: userData.id,
        user_id: userData.id,
        email: userData.email || '',
        role: userData.role as JwtPayload['role'],
      }
      const tokens = generateTokens(app, payload)

      // 构建重定向 URL，携带 token 信息
      const redirectUrl = new URL(`${process.env.WEB_BASE_URL || 'http://localhost:3000'}/oauth/callback`)
      redirectUrl.searchParams.set('provider', 'alipay')
      redirectUrl.searchParams.set('access_token', tokens.access_token)
      redirectUrl.searchParams.set('refresh_token', tokens.refresh_token)
      redirectUrl.searchParams.set('user_id', userData.id)
      redirectUrl.searchParams.set('display_name', userData.display_name || '')
      redirectUrl.searchParams.set('role', userData.role)
      redirectUrl.searchParams.set('is_new_user', String(isNewUser))

      return reply.redirect(redirectUrl.toString())

    } catch (err) {
      console.error('Alipay login error:', err)
      return reply.redirect(`${process.env.WEB_BASE_URL || 'http://localhost:3000'}/oauth/callback?error=login_failed`)
    }
  })

  // ============================================
  // GET /api/auth/me - 获取当前用户信息
  // ============================================
  app.get('/api/auth/me', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user as JwtPayload
    const userId = String(user?.user_id || user?.id || '').trim()
    if (!userId || userId === 'visitor') {
      return errors.unauthorized(reply, '请先登录')
    }

    try {
      type MeRow = {
        id: string
        email: string
        phone?: string
        role: string
        display_name: string
        avatar_url?: string
        bio?: string
        verified: boolean
        balance: number
        created_at: string
      }

      let result
      try {
        result = await query<MeRow>(
          `SELECT p.id, p.email, p.phone, p.role, p.display_name,
                p.avatar_url, p.bio, p.verified, b.balance, p.created_at
         FROM profiles p
         LEFT JOIN user_balances b ON b.user_id = p.id
         WHERE p.id = $1`,
          [userId]
        )
      } catch (fullErr) {
        // 兼容未执行完整迁移（如 user_balances / phone / verified 列缺失）时的会话探活
        request.log.warn({ err: fullErr }, '[auth/me] full profile query failed, fallback to minimal')
        result = await query<MeRow>(
          `SELECT p.id, p.email, p.role, p.display_name, p.avatar_url, p.bio, p.created_at
           FROM profiles p
           WHERE p.id = $1`,
          [userId]
        )
        result.rows = result.rows.map((r) => ({
          ...r,
          phone: r.phone ?? '',
          verified: Boolean(r.verified),
          balance: Number(r.balance ?? 0),
        }))
      }

      if (result.rows.length === 0) {
        return errors.notFound(reply, 'User not found')
      }

      return success(reply, result.rows[0])

    } catch (err) {
      console.error('Get user error:', err)
      return errors.internal(reply, 'Failed to get user info')
    }
  })

  // ============================================
  // POST /api/auth/refresh - 刷新 Token
  // ============================================
  app.post('/api/auth/refresh', async (request, reply) => {
    const { refresh_token } = request.body as { refresh_token?: string }

    if (!refresh_token) {
      return errors.badRequest(reply, 'Refresh token is required')
    }

    try {
      const payload = verifyRefreshToken(app, refresh_token)

      // 检查用户是否仍然存在
      const user = await query<{ id: string; role: string }>(
        'SELECT id, role FROM profiles WHERE id = $1',
        [payload.user_id]
      )

      if (user.rows.length === 0) {
        return errors.unauthorized(reply, 'User not found')
      }

      const newPayload: JwtPayload = {
        id: payload.user_id,
        user_id: payload.user_id,
        email: payload.email,
        role: user.rows[0].role as JwtPayload['role'],
      }

      const tokens = generateTokens(app, newPayload)
      return success(reply, tokens, 'Token refreshed')

    } catch (err) {
      return errors.unauthorized(reply, 'Invalid refresh token')
    }
  })

  // ============================================
  // POST /api/auth/change-password - 修改密码
  // ============================================
  app.post('/api/auth/change-password', { preHandler: [app.authenticate] }, async (request, reply) => {
    const validation = changePasswordSchema.safeParse(request.body)
    if (!validation.success) {
      return errors.badRequest(reply, validation.error.errors[0].message)
    }

    const { old_password, new_password } = validation.data
    const user = request.user as JwtPayload

    try {
      // 验证旧密码
      const userResult = await query<{ password_hash: string }>(
        'SELECT password_hash FROM profiles WHERE id = $1',
        [user.user_id]
      )

      if (userResult.rows.length === 0) {
        return errors.notFound(reply, 'User not found')
      }

      if (!verifyPassword(old_password, userResult.rows[0].password_hash)) {
        return errors.unauthorized(reply, 'Incorrect old password')
      }

      // 更新密码
      const hashedPassword = hashPassword(new_password)
      await query(
        'UPDATE profiles SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [hashedPassword, user.user_id]
      )

      return success(reply, null, 'Password changed successfully')

    } catch (err) {
      console.error('Change password error:', err)
      return errors.internal(reply, 'Failed to change password')
    }
  })

  // ============================================
  // POST /api/auth/forgot-password - 忘记密码
  // ============================================
  app.post('/api/auth/forgot-password', async (request, reply) => {
    const { email } = request.body as { email?: string }

    if (!email) {
      return errors.badRequest(reply, 'Email is required')
    }

    try {
      // 检查用户是否存在
      const user = await query<{ id: string }>(
        'SELECT id FROM profiles WHERE email = $1',
        [email]
      )

      if (user.rows.length === 0) {
        // 为防止枚举攻击，返回成功
        return success(reply, null, 'If the email exists, a reset link will be sent')
      }

      // 生成重置码
      const code = generateCode(6)

      await query(
        `INSERT INTO password_reset_codes (email, code, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '1 hour')
         ON CONFLICT (email) DO UPDATE
         SET code = $2, expires_at = NOW() + INTERVAL '1 hour', used = false`,
        [email, code]
      )

      // TODO: 发送重置邮件
      // 开发模式只记录请求，不暴露重置码
      console.log(`[DEV] Password reset requested for ${email}`)

      return success(reply, null, 'If the email exists, a reset link will be sent')

    } catch (err) {
      console.error('Forgot password error:', err)
      return errors.internal(reply, 'Failed to process request')
    }
  })

  // ============================================
  // POST /api/auth/reset-password - 重置密码
  // ============================================
  app.post('/api/auth/reset-password', async (request, reply) => {
    const validation = resetPasswordSchema.safeParse(request.body)
    if (!validation.success) {
      return errors.badRequest(reply, validation.error.errors[0].message)
    }

    const { email, code, new_password } = validation.data

    try {
      // 验证重置码
      const codeResult = await query<{ id: string; expires_at: string; used: boolean }>(
        `SELECT id, expires_at, used FROM password_reset_codes
         WHERE email = $1 AND code = $2
         ORDER BY created_at DESC LIMIT 1`,
        [email, code]
      )

      if (codeResult.rows.length === 0) {
        return errors.unauthorized(reply, 'Invalid reset code')
      }

      const storedCode = codeResult.rows[0]

      if (storedCode.used) {
        return errors.unauthorized(reply, 'Code already used')
      }

      if (new Date(storedCode.expires_at) < new Date()) {
        return errors.unauthorized(reply, 'Code expired')
      }

      // 更新密码
      const hashedPassword = hashPassword(new_password)
      await query(
        'UPDATE profiles SET password_hash = $1, updated_at = NOW() WHERE email = $2',
        [hashedPassword, email]
      )

      // 标记码已使用
      await query(`UPDATE password_reset_codes SET used = true WHERE id = $1`, [storedCode.id])

      return success(reply, null, 'Password reset successfully')

    } catch (err) {
      console.error('Reset password error:', err)
      return errors.internal(reply, 'Failed to reset password')
    }
  })
}

// 辅助函数：记录登录历史
async function logLoginAttempt(
  userId: string | null,
  ip: string,
  userAgent: string,
  method: 'email' | 'sms' | 'wechat' | 'alipay',
  success: boolean
) {
  try {
    await query(
      `INSERT INTO login_history (user_id, ip_address, user_agent, login_method, success)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, ip, userAgent, method, success]
    )
  } catch (err) {
    console.error('Failed to log login attempt:', err)
  }
}
