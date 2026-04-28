/**
 * 阿里云短信服务工具模块
 * 实现短信验证码发送功能
 */

import crypto from 'crypto'

// ============================================
// 阿里云 SMS 配置
// ============================================

export interface AliyunSMSConfig {
  accessKeyId: string
  accessKeySecret: string
  signName: string
  templateCode: string
}

export interface SMSResult {
  success: boolean
  message?: string
  requestId?: string
  bizId?: string
}

// ============================================
// 签名算法
// ============================================

/**
 * 生成阿里云 API 签名
 * @param secret 秘钥
 * @param parameters 参数
 */
function generateSignature(secret: string, parameters: Record<string, string>): string {
  const sortedKeys = Object.keys(parameters).sort()
  const canonicalizedQueryString = sortedKeys
    .map(key => {
      const value = encodeURIComponent(parameters[key])
      return `${encodeURIComponent(key)}=${value}`
    })
    .join('&')

  const stringToSign = `GET&${encodeURIComponent('/')}&${encodeURIComponent(canonicalizedQueryString)}`

  const hmac = crypto.createHmac('sha1', secret + '&')
  hmac.update(stringToSign)
  return hmac.digest('base64')
}

// ============================================
// 短信发送
// ============================================

/**
 * 发送短信验证码
 * @param phone 手机号
 * @param code 验证码
 */
export async function sendSMSCode(phone: string, code: string): Promise<SMSResult> {
  const accessKeyId = process.env.ALIYUN_ACCESS_KEY_ID || ''
  const accessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET || ''
  const signName = process.env.ALIYUN_SMS_SIGN_NAME || ''
  const templateCode = process.env.ALIYUN_SMS_TEMPLATE_CODE || ''

  // 检查是否配置
  if (!accessKeyId || !accessKeySecret) {
    // 开发模式只记录发送请求，不暴露验证码
    console.log(`[DEV] SMS Code requested for ${phone} (code hidden in production)`)
    return {
      success: true,
      message: 'Development mode: SMS code logged to console',
    }
  }

  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  // 构建请求参数
  const params: Record<string, string> = {
    Format: 'JSON',
    Version: '2017-05-25',
    SignatureMethod: 'HMAC-SHA1',
    SignatureVersion: '1.0',
    SignatureNonce: `${Date.now()}`,
    AccessKeyId: accessKeyId,
    Timestamp: timestamp,
    RegionId: 'cn-hangzhou',
    Action: 'SendSms',
    PhoneNumbers: phone,
    SignName: signName,
    TemplateCode: templateCode,
    TemplateParam: JSON.stringify({ code }),
  }

  // 生成签名
  params.Signature = generateSignature(accessKeySecret, params)

  // 构建 URL
  const url = 'https://dysmsapi.aliyuncs.com/?' + Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&')

  try {
    const response = await fetch(url, {
      method: 'GET',
    })

    const data = await response.json()

    if (data.Code === 'OK') {
      return {
        success: true,
        requestId: data.RequestId,
        bizId: data.BizId,
      }
    } else {
      console.error('Aliyun SMS error:', data)
      return {
        success: false,
        message: data.Message || 'Failed to send SMS',
      }
    }
  } catch (err) {
    console.error('Failed to send SMS:', err)
    return {
      success: false,
      message: 'Network error',
    }
  }
}

// ============================================
// 短信验证（查询发送状态）
// ============================================

/**
 * 查询短信发送状态
 */
export async function querySMSStatus(bizId: string): Promise<{
  success: boolean
  message?: string
  sendStatus?: string
}> {
  const accessKeyId = process.env.ALIYUN_ACCESS_KEY_ID || ''
  const accessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET || ''

  if (!accessKeyId || !accessKeySecret) {
    return {
      success: false,
      message: 'Aliyun SMS not configured',
    }
  }

  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  const params: Record<string, string> = {
    Format: 'JSON',
    Version: '2017-05-25',
    SignatureMethod: 'HMAC-SHA1',
    SignatureVersion: '1.0',
    SignatureNonce: `${Date.now()}`,
    AccessKeyId: accessKeyId,
    Timestamp: timestamp,
    RegionId: 'cn-hangzhou',
    Action: 'QuerySendDetails',
    BizId: bizId,
  }

  params.Signature = generateSignature(accessKeySecret, params)

  const url = 'https://dysmsapi.aliyuncs.com/?' + Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&')

  try {
    const response = await fetch(url, {
      method: 'GET',
    })

    const data = await response.json()

    if (data.Code === 'OK') {
      return {
        success: true,
        sendStatus: data.SmsSendDetailDTOs?.SmsSendDetailDTO?.[0]?.SendStatus,
      }
    } else {
      return {
        success: false,
        message: data.Message,
      }
    }
  } catch (err) {
    return {
      success: false,
      message: 'Network error',
    }
  }
}

// ============================================
// 批量发送（营销短信等）
// ============================================

/**
 * 批量发送短信
 */
export async function sendBatchSMS(
  phones: string[],
  signName: string,
  templateCode: string,
  templateParam: Record<string, string>
): Promise<SMSResult> {
  const accessKeyId = process.env.ALIYUN_ACCESS_KEY_ID || ''
  const accessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET || ''

  if (!accessKeyId || !accessKeySecret) {
    console.log(`[DEV] Batch SMS to ${phones.join(', ')}:`, templateParam)
    return {
      success: true,
      message: 'Development mode',
    }
  }

  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  const params: Record<string, string> = {
    Format: 'JSON',
    Version: '2017-05-25',
    SignatureMethod: 'HMAC-SHA1',
    SignatureVersion: '1.0',
    SignatureNonce: `${Date.now()}`,
    AccessKeyId: accessKeyId,
    Timestamp: timestamp,
    RegionId: 'cn-hangzhou',
    Action: 'SendBatchSms',
    PhoneNumberJson: JSON.stringify(phones),
    SignNameJson: JSON.stringify([signName]),
    TemplateCode: templateCode,
    TemplateParamJson: JSON.stringify([templateParam]),
  }

  params.Signature = generateSignature(accessKeySecret, params)

  const url = 'https://dysmsapi.aliyuncs.com/?' + Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&')

  try {
    const response = await fetch(url, {
      method: 'GET',
    })

    const data = await response.json()

    if (data.Code === 'OK') {
      return {
        success: true,
        requestId: data.RequestId,
        bizId: data.BizId,
      }
    } else {
      return {
        success: false,
        message: data.Message,
      }
    }
  } catch (err) {
    return {
      success: false,
      message: 'Network error',
    }
  }
}

// ============================================
// 配置检查
// ============================================

/**
 * 检查阿里云 SMS 是否已配置
 */
export function isSMSConfigured(): boolean {
  return !!(
    process.env.ALIYUN_ACCESS_KEY_ID &&
    process.env.ALIYUN_ACCESS_KEY_SECRET &&
    process.env.ALIYUN_SMS_SIGN_NAME &&
    process.env.ALIYUN_SMS_TEMPLATE_CODE
  )
}

/**
 * 获取 SMS 配置信息（不含敏感信息）
 */
export function getSMSConfig(): {
  configured: boolean
  signName?: string
  templateCode?: string
} {
  return {
    configured: isSMSConfigured(),
    signName: process.env.ALIYUN_SMS_SIGN_NAME,
    templateCode: process.env.ALIYUN_SMS_TEMPLATE_CODE,
  }
}