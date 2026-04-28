/**
 * 支付宝登录工具模块
 * 实现支付宝 OAuth2.0 授权登录
 */

import crypto from 'crypto'

// ============================================
// 支付宝登录配置
// ============================================

export interface AlipayAuthConfig {
  appId: string
  privateKey: string
  alipayPublicKey: string
  redirectUri: string
}

export interface AlipayUserInfo {
  userId: string
  avatar?: string
  nickName?: string
  gender?: 'M' | 'F'
  countryCode?: string
  province?: string
  city?: string
}

// ============================================
// 支付宝 OAuth2.0 授权 URL 生成
// ============================================

/**
 * 生成支付宝授权跳转 URL
 * @param config 支付宝应用配置
 * @param state 随机状态码（防止 CSRF）
 */
export function generateAlipayAuthUrl(config: AlipayAuthConfig, state: string): string {
  const baseUrl = 'https://openauth.alipay.com/oauth2/publicAppAuthorize.htm'
  const params = new URLSearchParams({
    app_id: config.appId,
    redirect_uri: encodeURIComponent(config.redirectUri),
    scope: 'auth_user',
    state,
  })

  return `${baseUrl}?${params.toString()}`
}

/**
 * 生成支付宝后台获取用户信息 URL
 */
export function generateAlipayUserInfoUrl(config: AlipayAuthConfig): string {
  return 'https://openapi.alipay.com/gateway.do'
}

// ============================================
// 支付宝请求签名
// ============================================

/**
 * 生成支付宝请求签名
 * @param params 请求参数
 * @param privateKey 私钥
 */
export function signAlipayRequest(
  params: Record<string, string>,
  privateKey: string
): string {
  // 按字典序排列参数
  const signParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&')

  try {
    const signer = crypto.createSign('RSA-SHA256')
    signer.update(signParams)
    return signer.sign(privateKey, 'base64')
  } catch (err) {
    console.error('Alipay sign error:', err)
    throw err
  }
}

/**
 * 验证支付宝回调签名
 * @param params 回调参数
 * @param publicKey 公钥
 */
export function verifyAlipayCallbackSign(
  params: Record<string, string>,
  publicKey: string
): boolean {
  const sign = params['sign']
  if (!sign) return false

  // 构建待签名字符串（使用字典序）
  const signParams = Object.keys(params)
    .filter(key => key !== 'sign' && key !== 'sign_type')
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&')

  try {
    const verifier = crypto.createVerify('RSA-SHA256')
    verifier.update(signParams)
    return verifier.verify(publicKey, sign, 'base64')
  } catch (err) {
    console.error('Alipay callback verify error:', err)
    return false
  }
}

// ============================================
// 支付宝用户信息获取
// ============================================

/**
 * 获取支付宝用户信息
 */
export async function getAlipayUserInfo(
  accessToken: string
): Promise<AlipayUserInfo | null> {
  const appId = process.env.ALIPAY_APP_ID || ''
  const privateKey = process.env.ALIPAY_PRIVATE_KEY || ''
  const publicKey = process.env.ALIPAY_PUBLIC_KEY || ''

  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0]
  const bizContent = JSON.stringify({
    auth_token: accessToken,
  })

  const params: Record<string, string> = {
    app_id: appId,
    method: 'alipay.user.userinfo.share',
    charset: 'UTF-8',
    sign_type: 'RSA2',
    timestamp,
    version: '1.0',
    biz_content: bizContent,
  }

  try {
    const appId = process.env.ALIPAY_APP_ID || ''
    const privateKey = process.env.ALIPAY_PRIVATE_KEY || ''
    const sign = signAlipayRequest(params, privateKey)
    params.sign = sign

    const url = 'https://openapi.alipay.com/gateway.do'
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params).toString(),
    })

    const data = await response.json()

    if (data.error_response) {
      console.error('Alipay userinfo error:', data.error_response)
      return null
    }

    const userInfo = data.alipay_user_userinfo_share_response
    return {
      userId: userInfo.user_id,
      avatar: userInfo.avatar,
      nickName: userInfo.nick_name,
      gender: userInfo.gender,
      countryCode: userInfo.country_code,
      province: userInfo.province,
      city: userInfo.city,
    }
  } catch (err) {
    console.error('Failed to get Alipay userinfo:', err)
    return null
  }
}

// ============================================
// 支付宝登录状态验证
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

// ============================================
// 支付宝 SDK 封装（简化版）
// ============================================

interface AlipayConfig {
  appId: string
  privateKey: string
  alipayPublicKey: string
}

/**
 * 简单的 Alipay SDK 封装
 */
export class AlipaySDK {
  private appId: string
  private privateKey: string
  private alipayPublicKey: string

  constructor(config: AlipayConfig) {
    this.appId = config.appId
    this.privateKey = config.privateKey
    this.alipayPublicKey = config.alipayPublicKey
  }

  /**
   * 执行 Alipay API 调用
   */
  async exec(
    method: string,
    bizContent: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0]

    const params: Record<string, string> = {
      app_id: this.appId,
      method,
      charset: 'UTF-8',
      sign_type: 'RSA2',
      timestamp,
      version: '1.0',
      biz_content: JSON.stringify(bizContent),
    }

    // 生成签名
    const sign = signAlipayRequest(params, this.privateKey)
    params.sign = sign

    try {
      const response = await fetch(
        'https://openapi.alipay.com/gateway.do',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(params).toString(),
        }
      )

      const data = await response.json()

      // 解析响应
      const responseKey = method.replace(/\./g, '_') + '_response'
      return data[responseKey] || data.error_response
    } catch (err) {
      console.error('Alipay exec error:', err)
      throw err
    }
  }

  /**
   * 获取用户信息
   */
  async getUserInfo(authToken: string): Promise<AlipayUserInfo | null> {
    try {
      const result = await this.exec('alipay.user.userinfo.share', {
        auth_token: authToken,
      }) as {
        user_id?: string
        avatar?: string
        nick_name?: string
        gender?: string
      }

      if (!result.user_id) {
        return null
      }

      return {
        userId: result.user_id,
        avatar: result.avatar,
        nickName: result.nick_name,
        gender: result.gender as 'M' | 'F' | undefined,
      }
    } catch (err) {
      console.error('Failed to get Alipay user info:', err)
      return null
    }
  }

  /**
   * 验证回调签名
   */
  verifyCallback(params: Record<string, string>): boolean {
    return verifyAlipayCallbackSign(params, this.alipayPublicKey)
  }
}

// 创建默认 SDK 实例
export function createAlipaySDK(): AlipaySDK | null {
  const appId = process.env.ALIPAY_APP_ID
  const privateKey = process.env.ALIPAY_PRIVATE_KEY
  const publicKey = process.env.ALIPAY_PUBLIC_KEY

  if (!appId || !privateKey || !publicKey) {
    return null
  }

  return new AlipaySDK({ appId, privateKey, alipayPublicKey: publicKey })
}