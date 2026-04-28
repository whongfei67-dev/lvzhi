/**
 * 支付工具模块
 * 支持支付宝和微信支付的签名验证、沙箱测试、正式环境
 */

import crypto from 'crypto'

// ============================================
// 环境配置
// ============================================

export type PaymentEnvironment = 'sandbox' | 'production'

export function getPaymentEnvironment(): PaymentEnvironment {
  if (process.env.NODE_ENV === 'production' &&
      process.env.ALIPAY_APP_ID &&
      process.env.ALIPAY_PRIVATE_KEY &&
      process.env.ALIPAY_PUBLIC_KEY) {
    return 'production'
  }
  return 'sandbox'
}

export function isProductionEnvironment(): boolean {
  return getPaymentEnvironment() === 'production'
}

// ============================================
// 支付宝相关
// ============================================

/**
 * 验证支付宝回调签名
 * @param params 回调参数（包含 sign）
 * @param publicKey 支付宝公钥
 */
export function verifyAlipaySign(params: Record<string, string>, publicKey: string): boolean {
  // 排除 sign 和 sign_type 参数
  const signParams = Object.keys(params)
    .filter(key => key !== 'sign' && key !== 'sign_type')
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&')

  try {
    const verifier = crypto.createVerify('RSA-SHA256')
    verifier.update(signParams)
    return verifier.verify(publicKey, params['sign'], 'base64')
  } catch (err) {
    console.error('Alipay sign verification failed:', err)
    return false
  }
}

/**
 * 验证支付宝回调签名（使用 AES）
 * @param params 回调参数
 * @param apiKey 支付宝 API 密钥
 */
export function verifyAlipaySignWithAES(
  params: Record<string, string>,
  apiKey: string
): boolean {
  const sign = params['sign']
  if (!sign) return false

  // 构建待签名字符串
  const signParams = Object.keys(params)
    .filter(key => key !== 'sign')
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&')

  // 使用 HMAC-SHA256
  const expectedSign = crypto
    .createHmac('sha256', apiKey)
    .update(signParams)
    .digest('base64')

  return sign === expectedSign
}

/**
 * 生成支付宝支付参数（当面付）
 */
export async function createAlipayPrecreateOrder(
  orderId: string,
  amount: number,
  subject: string
): Promise<{ qrCode: string; orderId: string }> {
  const isProd = isProductionEnvironment()

  if (!isProd) {
    // 沙箱环境返回模拟二维码
    console.log(`[SANDBOX] Alipay precreate: ${orderId}, amount: ${amount}`)
    return {
      qrCode: 'https://qr.alipay.com/sandbox/precreate',
      orderId,
    }
  }

  // 生产环境：调用真实支付宝 API
  const appId = process.env.ALIPAY_APP_ID
  const privateKey = process.env.ALIPAY_PRIVATE_KEY
  const alipayPublicKey = process.env.ALIPAY_PUBLIC_KEY

  if (!appId || !privateKey || !alipayPublicKey) {
    throw new Error('Alipay production keys not configured. Please set ALIPAY_APP_ID, ALIPAY_PRIVATE_KEY, and ALIPAY_PUBLIC_KEY')
  }

  // 使用原生 fetch 调用支付宝开放平台 API
  const timestamp = new Date().toISOString()
  const signParams: Record<string, string> = {
    app_id: appId,
    method: 'alipay.trade.precreate',
    charset: 'utf-8',
    sign_type: 'RSA2',
    timestamp,
    version: '1.0',
    notify_url: process.env.ALIPAY_NOTIFY_URL || `${process.env.API_BASE_URL}/api/payments/alipay/callback`,
    biz_content: JSON.stringify({
      out_trade_no: orderId,
      total_amount: amount.toFixed(2),
      subject,
    }),
  }

  // 生成签名
  const signString = Object.keys(signParams)
    .sort()
    .map(key => `${key}=${signParams[key]}`)
    .join('&')

  const sign = crypto
    .createSign('RSA-SHA256')
    .update(signString)
    .sign(privateKey, 'base64')

  signParams.sign = sign

  try {
    const response = await fetch('https://openapi.alipay.com/gateway.do', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(signParams).toString(),
    })

    const data = await response.json()
    const result = data.alipay_trade_precreate_response

    if (result.code === '10000') {
      return {
        qrCode: result.qr_code,
        orderId,
      }
    } else {
      throw new Error(`Alipay API error: ${result.msg} - ${result.sub_msg}`)
    }
  } catch (err) {
    console.error('Alipay API call failed:', err)
    throw err
  }
}

// ============================================
// 微信支付相关
// ============================================

/**
 * 验证微信支付回调签名
 * @param params 回调参数
 * @param apiKey 微信支付 API 密钥
 */
export function verifyWechatSign(params: Record<string, string>, apiKey: string): boolean {
  const sign = params['sign']
  if (!sign) return false

  // 构建待签名字符串（按字典序排列）
  const signParams = Object.keys(params)
    .filter(key => key !== 'sign')
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&')

  // 计算 HMAC-SHA256
  const signature = crypto
    .createHmac('sha256', apiKey)
    .update(signParams + '&key=' + apiKey)
    .digest('hex')
    .toUpperCase()

  return signature === sign
}

/**
 * 生成微信支付二维码链接
 */
export async function createWechatPayOrder(
  orderId: string,
  amount: number,
  description: string
): Promise<{ codeUrl: string; orderId: string }> {
  const isProd = isProductionEnvironment()

  if (!isProd) {
    // 沙箱环境返回模拟链接
    console.log(`[SANDBOX] Wechat pay: ${orderId}, amount: ${amount}`)
    return {
      codeUrl: 'weixin://wxpay/bizpayurl?pr=sandbox',
      orderId,
    }
  }

  // 生产环境：调用真实微信支付 API
  const appId = process.env.WECHAT_APP_ID || process.env.WECHAT_PAY_APP_ID
  const mchId = process.env.WECHAT_PAY_MCH_ID
  const apiKey = process.env.WECHAT_PAY_API_KEY

  if (!appId || !mchId || !apiKey) {
    throw new Error('Wechat Pay production keys not configured. Please set WECHAT_APP_ID, WECHAT_PAY_MCH_ID, and WECHAT_PAY_API_KEY')
  }

  const nonceStr = crypto.randomBytes(16).toString('hex')
  const timestamp = Math.floor(Date.now() / 1000).toString()

  // 统一下单请求参数
  const signParams: Record<string, string | number> = {
    appid: appId,
    mch_id: mchId,
    nonce_str: nonceStr,
    body: description,
    out_trade_no: orderId,
    total_fee: Math.round(amount * 100), // 转为分
    spbill_create_ip: process.env.API_SERVER_IP || '127.0.0.1',
    notify_url: process.env.WECHAT_NOTIFY_URL || `${process.env.API_BASE_URL}/api/payments/wechat/callback`,
    trade_type: 'NATIVE',
  }

  // 生成签名
  const signString = Object.keys(signParams)
    .sort()
    .map(key => `${key}=${signParams[key]}`)
    .join('&')

  const sign = crypto
    .createHmac('sha256', apiKey)
    .update(signString + '&key=' + apiKey)
    .digest('hex')
    .toUpperCase()

  // 构建 XML 请求体
  const xmlBody = Object.keys(signParams)
    .map(key => `<${key}><![CDATA[${signParams[key]}]]></${key}>`)
    .join('') + `<sign><![CDATA[${sign}]]></sign>`

  const xmlRequest = `<xml>${xmlBody}</xml>`

  try {
    // 微信支付 API 需要使用商户证书
    // 这里使用基本实现，正式环境建议使用微信支付 SDK
    const response = await fetch('https://api.mch.weixin.qq.com/pay/unifiedorder', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
      },
      body: xmlRequest,
    })

    const xmlResponse = await response.text()
    const result = parseWechatCallback(xmlResponse)

    if (result.return_code === 'SUCCESS' && result.result_code === 'SUCCESS') {
      return {
        codeUrl: result.code_url,
        orderId,
      }
    } else {
      throw new Error(`Wechat Pay API error: ${result.return_msg || result.err_code_des}`)
    }
  } catch (err) {
    console.error('Wechat Pay API call failed:', err)
    throw err
  }
}

/**
 * 解析微信支付回调的 XML
 */
export function parseWechatCallback(xml: string): Record<string, string> {
  const result: Record<string, string> = {}

  // 简单的 XML 解析（实际应该使用 xml2js 或类似库）
  const regex = /<(\w+)>([^<]*)<\/\1>/g
  let match

  while ((match = regex.exec(xml)) !== null) {
    result[match[1]] = match[2]
  }

  return result
}

// ============================================
// 沙箱工具
// ============================================

export function isSandboxMode(): boolean {
  return !isProductionEnvironment()
}

/**
 * 获取当前支付环境信息
 */
export function getPaymentInfo(): {
  environment: PaymentEnvironment
  alipayConfigured: boolean
  wechatConfigured: boolean
} {
  return {
    environment: getPaymentEnvironment(),
    alipayConfigured: !!(process.env.ALIPAY_APP_ID && process.env.ALIPAY_PRIVATE_KEY),
    wechatConfigured: !!(
      (process.env.WECHAT_APP_ID || process.env.WECHAT_PAY_APP_ID) &&
      process.env.WECHAT_PAY_MCH_ID &&
      process.env.WECHAT_PAY_API_KEY
    ),
  }
}

/**
 * 获取沙箱密钥（在沙箱模式下可用）
 */
export async function getSandboxKeys(): Promise<{
  alipay?: { appId: string; privateKey: string; publicKey: string }
  wechat?: { appId: string; mchId: string; key: string }
}> {
  return {
    alipay: !isProductionEnvironment() && process.env.ALIPAY_SANDBOX_APP_ID ? {
      appId: process.env.ALIPAY_SANDBOX_APP_ID,
      privateKey: process.env.ALIPAY_SANDBOX_PRIVATE_KEY || '',
      publicKey: process.env.ALIPAY_SANDBOX_PUBLIC_KEY || '',
    } : undefined,
    wechat: !isProductionEnvironment() && process.env.WECHAT_SANDBOX_MCH_ID ? {
      appId: process.env.WECHAT_SANDBOX_APP_ID || '',
      mchId: process.env.WECHAT_SANDBOX_MCH_ID,
      key: process.env.WECHAT_SANDBOX_KEY || '',
    } : undefined,
  }
}