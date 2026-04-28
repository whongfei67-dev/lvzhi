/**
 * 微信登录工具模块
 * 实现微信 OAuth2.0 授权登录
 */

import crypto from 'crypto'

// ============================================
// 微信登录配置
// ============================================

export interface WechatAuthConfig {
  appId: string
  appSecret: string
  redirectUri: string
}

export interface WechatUserInfo {
  openid: string
  unionid?: string
  nickname?: string
  headimgurl?: string
  sex?: number
  country?: string
  province?: string
  city?: string
}

// ============================================
// 微信 OAuth2.0 授权 URL 生成
// ============================================

/**
 * 生成微信授权跳转 URL
 * @param config 微信应用配置
 * @param state 随机状态码（防止 CSRF）
 */
export function generateWechatAuthUrl(config: WechatAuthConfig, state: string): string {
  const baseUrl = 'https://open.weixin.qq.com/connect/qrconnect'
  const params = new URLSearchParams({
    appid: config.appId,
    redirect_uri: encodeURIComponent(config.redirectUri),
    response_type: 'code',
    scope: 'snsapi_login',
    state,
  })

  return `${baseUrl}?${params.toString()}`
}

/**
 * 生成微信移动端授权 URL（用于 H5/微信内）
 */
export function generateWechatMobileAuthUrl(config: WechatAuthConfig, state: string): string {
  const baseUrl = 'https://open.weixin.qq.com/connect/oauth2/authorize'
  const params = new URLSearchParams({
    appid: config.appId,
    redirect_uri: encodeURIComponent(config.redirectUri),
    response_type: 'code',
    scope: 'snsapi_userinfo',
    state,
  })

  return `${baseUrl}?${params.toString()}#wechat_redirect`
}

// ============================================
// 微信 Access Token 获取
// ============================================

/**
 * 通过授权码获取 Access Token
 */
export async function getWechatAccessToken(
  code: string
): Promise<{
  access_token: string
  expires_in: number
  refresh_token: string
  openid: string
  unionid?: string
} | null> {
  const appId = process.env.WECHAT_APP_ID || ''
  const appSecret = process.env.WECHAT_APP_SECRET || ''

  const url = 'https://api.weixin.qq.com/sns/oauth2/access_token'
  const params = new URLSearchParams({
    appid: appId,
    secret: appSecret,
    code,
    grant_type: 'authorization_code',
  })

  try {
    const response = await fetch(`${url}?${params.toString()}`)
    const data = await response.json()

    if (data.errcode) {
      console.error('Wechat access_token error:', data)
      return null
    }

    return {
      access_token: data.access_token,
      expires_in: data.expires_in,
      refresh_token: data.refresh_token,
      openid: data.openid,
      unionid: data.unionid,
    }
  } catch (err) {
    console.error('Failed to get Wechat access_token:', err)
    return null
  }
}

/**
 * 刷新 Access Token
 */
export async function refreshWechatAccessToken(
  refreshToken: string
): Promise<{
  access_token: string
  expires_in: number
  openid: string
} | null> {
  const appId = process.env.WECHAT_APP_ID || ''
  const appSecret = process.env.WECHAT_APP_SECRET || ''

  const url = 'https://api.weixin.qq.com/sns/oauth2/refresh_token'
  const params = new URLSearchParams({
    appid: appId,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })

  try {
    const response = await fetch(`${url}}?${params.toString()}`)
    const data = await response.json()

    if (data.errcode) {
      console.error('Wechat refresh_token error:', data)
      return null
    }

    return {
      access_token: data.access_token,
      expires_in: data.expires_in,
      openid: data.openid,
    }
  } catch (err) {
    console.error('Failed to refresh Wechat access_token:', err)
    return null
  }
}

// ============================================
// 微信用户信息获取
// ============================================

/**
 * 获取微信用户信息
 */
export async function getWechatUserInfo(
  accessToken: string,
  openid: string
): Promise<WechatUserInfo | null> {
  const url = 'https://api.weixin.qq.com/sns/userinfo'
  const params = new URLSearchParams({
    access_token: accessToken,
    openid,
    lang: 'zh_CN',
  })

  try {
    const response = await fetch(`${url}}?${params.toString()}`)
    const data = await response.json()

    if (data.errcode) {
      console.error('Wechat userinfo error:', data)
      return null
    }

    return {
      openid: data.openid,
      unionid: data.unionid,
      nickname: data.nickname,
      headimgurl: data.headimgurl,
      sex: data.sex,
      country: data.country,
      province: data.province,
      city: data.city,
    }
  } catch (err) {
    console.error('Failed to get Wechat userinfo:', err)
    return null
  }
}

// ============================================
// 微信登录状态验证
// ============================================

/**
 * 生成随机 state 参数
 */
export function generateState(): string {
  return crypto.randomBytes(16).toString('hex')
}

/**
 * 验证 state 参数（防止 CSRF）
 */
export function validateState(
  receivedState: string,
  storedState: string
): boolean {
  if (!receivedState || !storedState) return false
  if (receivedState.length !== storedState.length) return false

  return crypto.timingSafeEqual(
    Buffer.from(receivedState),
    Buffer.from(storedState)
  )
}

/**
 * 生成微信 JS SDK 签名（用于前端调用微信 JSSDK）
 */
export async function generateWechatJSSignature(
  jsApiTicket: string,
  noncestr: string,
  timestamp: number,
  url: string
): Promise<string> {
  const signatureParams = `jsapi_ticket=${jsApiTicket}&noncestr=${noncestr}&timestamp=${timestamp}&url=${url}`
  const signature = crypto
    .createHash('sha1')
    .update(signatureParams)
    .digest('hex')

  return signature
}

// ============================================
// 微信开放平台 Access Token（应用级，非用户级）
// ============================================

let jsApiTicketCache: { ticket: string; expiresAt: number } | null = null

/**
 * 获取微信 JS SDK Ticket（带缓存）
 */
export async function getWechatJsApiTicket(): Promise<string | null> {
  const now = Date.now()

  // 检查缓存
  if (jsApiTicketCache && jsApiTicketCache.expiresAt > now) {
    return jsApiTicketCache.ticket
  }

  const appId = process.env.WECHAT_APP_ID || ''
  const appSecret = process.env.WECHAT_APP_SECRET || ''

  const url = 'https://api.weixin.qq.com/cgi-bin/ticket/getticket'
  const params = new URLSearchParams({
    access_token: await getWechatComponentAccessToken(),
    type: 'jsapi',
  })

  try {
    const response = await fetch(`${url}?${params.toString()}`)
    const data = await response.json()

    if (data.errcode !== 0) {
      console.error('Wechat jsapi_ticket error:', data)
      return null
    }

    // 缓存（提前 5 分钟过期）
    jsApiTicketCache = {
      ticket: data.ticket,
      expiresAt: now + (data.expires_in - 300) * 1000,
    }

    return data.ticket
  } catch (err) {
    console.error('Failed to get Wechat jsapi_ticket:', err)
    return null
  }
}

/**
 * 获取微信开放平台 component_access_token
 * （第三方应用使用，独立开发可跳过）
 */
async function getWechatComponentAccessToken(): Promise<string> {
  // 独立应用直接返回 component_access_token
  // 第三方应用需要先获取 component_verify_ticket
  const appId = process.env.WECHAT_APP_ID || ''
  const appSecret = process.env.WECHAT_APP_SECRET || ''

  const url = 'https://api.weixin.qq.com/cgi-bin/token'
  const params = new URLSearchParams({
    grant_type: 'client_credential',
    appid: appId,
    secret: appSecret,
  })

  try {
    const response = await fetch(`${url}?${params.toString()}`)
    const data = await response.json()

    if (data.access_token) {
      return data.access_token
    }

    throw new Error('Failed to get component_access_token')
  } catch (err) {
    console.error('Failed to get component_access_token:', err)
    throw err
  }
}