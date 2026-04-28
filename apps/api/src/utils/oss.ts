/**
 * 阿里云 OSS 文件存储工具
 * 支持上传、下载、删除文件、生成上传凭证、CORS 配置等
 */

import crypto from 'crypto'

// OSS 配置类型
interface OSSConfig {
  accessKeyId: string
  accessKeySecret: string
  bucket: string
  region: string
  endpoint: string
  cdnDomain?: string
}

// 文件类型白名单
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/markdown',
  'application/zip',
  'application/x-rar-compressed',
]

// 最大文件大小（50MB）
export const MAX_FILE_SIZE = 50 * 1024 * 1024

// 获取 OSS 配置
function getOSSConfig(): OSSConfig {
  return {
    accessKeyId: process.env.OSS_ACCESS_KEY_ID || process.env.ALIYUN_OSS_ACCESS_KEY_ID || '',
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || process.env.ALIYUN_OSS_ACCESS_KEY_SECRET || '',
    bucket: process.env.OSS_BUCKET || process.env.ALIYUN_OSS_BUCKET || 'lvzhi-files',
    region: process.env.OSS_REGION || process.env.ALIYUN_OSS_REGION || 'cn-shanghai',
    endpoint: process.env.OSS_ENDPOINT || process.env.ALIYUN_OSS_ENDPOINT || 'oss-cn-shanghai.aliyuncs.com',
    cdnDomain: process.env.OSS_CDN_URL || process.env.ALIYUN_OSS_CDN_URL,
  }
}

// 生成随机文件路径
export function generateFilePath(
  userId: string,
  category: 'avatar' | 'agent' | 'post' | 'document' | 'other',
  originalFilename: string
): string {
  const ext = originalFilename.split('.').pop()?.toLowerCase() || 'bin'
  const timestamp = Date.now()
  const random = crypto.randomBytes(4).toString('hex')
  const sanitizedName = originalFilename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .slice(0, 50)

  const paths: Record<string, string> = {
    avatar: `avatars/${userId}`,
    agent: `agents/${userId}`,
    post: `posts/${userId}`,
    document: `documents/${userId}`,
    other: `other/${userId}`,
  }

  return `${paths[category]}/${timestamp}-${random}-${sanitizedName}.${ext}`
}

// 验证文件类型
export function isFileTypeAllowed(mimeType: string): boolean {
  return ALLOWED_FILE_TYPES.includes(mimeType.toLowerCase())
}

// 验证文件大小
export function isFileSizeAllowed(size: number): boolean {
  return size > 0 && size <= MAX_FILE_SIZE
}

// 生成 OSS 签名 URL（用于前端直传或私有文件访问）
export async function generatePresignedUrl(
  filePath: string,
  expiresIn: number = 3600,
  method: 'GET' | 'PUT' | 'DELETE' = 'GET'
): Promise<string> {
  const config = getOSSConfig()
  const expiration = Math.floor(Date.now() / 1000) + expiresIn

  // 构造签名字符串
  const canonicalString = [
    method.toUpperCase(),
    '',
    '',
    expiration,
    `/${config.bucket}/${filePath}`,
  ].join('\n')

  // 计算签名
  const signature = crypto
    .createHmac('sha1', config.accessKeySecret)
    .update(canonicalString)
    .digest('base64')

  // 生成 URL
  const url = `https://${config.bucket}.${config.endpoint}/${filePath}?OSSAccessKeyId=${config.accessKeyId}&Expires=${expiration}&Signature=${encodeURIComponent(signature)}`

  return url
}

// 生成上传策略（用于前端直传）
export function generateUploadPolicy(
  filePath: string,
  maxSize: number = 50 * 1024 * 1024,
  allowedTypes?: string[]
): {
  policy: string
  signature: string
  ossUrl: string
  config: Record<string, string>
} {
  const config = getOSSConfig()
  const expiration = Math.floor(Date.now() / 1000) + 3600 // 1小时有效期

  // 构造 policy
  const policyObject: Record<string, unknown> = {
    expiration: new Date(expiration * 1000).toISOString(),
    conditions: [
      ['content-length-range', 1, maxSize],
      ['starts-with', '$key', filePath],
    ],
  }

  // 添加文件类型限制
  if (allowedTypes && allowedTypes.length > 0) {
    ;(policyObject.conditions as unknown[]).push([
      'in',
      '$content-type',
      allowedTypes,
    ])
  }

  const policyBase64 = Buffer.from(JSON.stringify(policyObject)).toString('base64')

  // 计算签名
  const signature = crypto
    .createHmac('sha1', config.accessKeySecret)
    .update(policyBase64)
    .digest('base64')

  return {
    policy: policyBase64,
    signature,
    ossUrl: `https://${config.bucket}.${config.endpoint}`,
    config: {
      OSSAccessKeyId: config.accessKeyId,
      key: filePath,
      policy: policyBase64,
      signature,
      success_action_status: '200',
    },
  }
}

// 上传文件到 OSS（服务端上传）
export async function uploadToOSS(
  filePath: string,
  buffer: Buffer,
  contentType?: string
): Promise<string> {
  const config = getOSSConfig()

  if (!config.accessKeyId || !config.accessKeySecret) {
    console.warn('[OSS] No credentials configured, using local fallback')
    return `/uploads/${filePath}`
  }

  const url = `https://${config.bucket}.${config.endpoint}/${filePath}`
  const defaultUsePublicReadAcl = process.env.OSS_UPLOAD_PUBLIC_READ !== 'false'

  async function putObject(usePublicReadAcl: boolean): Promise<{ ok: boolean; status: number; statusText: string; detail: string }> {
    const date = new Date().toUTCString()
    const ossHeaders: Record<string, string> = usePublicReadAcl
      ? { 'x-oss-object-acl': 'public-read' }
      : {}
    const canonicalizedOssHeaders = Object.entries(ossHeaders)
      .map(([k, v]) => [k.toLowerCase().trim(), v.trim()] as const)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}\n`)
      .join('')
    const canonicalString = [
      'PUT',
      '',
      contentType || 'application/octet-stream',
      date,
      `${canonicalizedOssHeaders}/${config.bucket}/${filePath}`,
    ].join('\n')
    const signature = crypto
      .createHmac('sha1', config.accessKeySecret)
      .update(canonicalString)
      .digest('base64')

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType || 'application/octet-stream',
        'Content-Length': buffer.length.toString(),
        'Authorization': `OSS ${config.accessKeyId}:${signature}`,
        'Date': date,
        ...ossHeaders,
      },
      body: buffer,
    })

    const detail = (await response.text().catch(() => '')).slice(0, 220).replace(/\s+/g, ' ').trim()
    return { ok: response.ok, status: response.status, statusText: response.statusText, detail }
  }

  let uploadResult = await putObject(defaultUsePublicReadAcl)
  if (!uploadResult.ok && defaultUsePublicReadAcl) {
    const maybeAclDenied =
      uploadResult.status === 403 &&
      /AccessDenied|Put public object acl/i.test(uploadResult.detail)
    if (maybeAclDenied) {
      console.warn('[OSS] ACL public-read denied, retrying upload without object ACL')
      uploadResult = await putObject(false)
    }
  }

  if (!uploadResult.ok) {
    throw new Error(
      `OSS upload failed: ${uploadResult.status} ${uploadResult.statusText}${uploadResult.detail ? ` (${uploadResult.detail})` : ''}`
    )
  }

  // 返回 CDN 加速 URL（如果有配置）
  const cdnUrl = process.env.OSS_CDN_URL
  return cdnUrl ? `${cdnUrl}/${filePath}` : url
}

// 从 OSS 删除文件
export async function deleteFromOSS(filePath: string): Promise<boolean> {
  const config = getOSSConfig()

  if (!config.accessKeyId || !config.accessKeySecret) {
    console.warn('[OSS] No credentials configured, skip delete')
    return true
  }

  const url = `https://${config.bucket}.${config.endpoint}/${filePath}`
  const date = new Date().toUTCString()

  const signature = crypto
    .createHmac('sha1', config.accessKeySecret)
    .update(`DELETE\n\n\n${date}\n/${config.bucket}/${filePath}`)
    .digest('base64')

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': `OSS ${config.accessKeyId}:${signature}`,
      'Date': date,
    },
  })

  return response.ok
}

// 获取 OSS 文件公开 URL
export function getOSSFileUrl(filePath: string): string {
  const config = getOSSConfig()
  const cdnUrl = process.env.OSS_CDN_URL
  return cdnUrl ? `${cdnUrl}/${filePath}` : `https://${config.bucket}.${config.endpoint}/${filePath}`
}

// 检查 OSS 是否已配置
export function isOSSConfigured(): boolean {
  const config = getOSSConfig()
  return !!(config.accessKeyId && config.accessKeySecret)
}

// ============================================
// OSS Bucket 策略配置（用于控制台配置指南）
// ============================================

/**
 * 生成 OSS CORS 配置 JSON
 * 用于在阿里云 OSS 控制台设置跨域规则
 */
export function generateCORSConfiguration(): {
  CORSRules: Array<{
    AllowedOrigin: string[]
    AllowedMethod: string[]
    AllowedHeader: string[]
    ExposeHeader: string[]
    MaxAgeSeconds: number
  }>
} {
  const allowedOrigins = process.env.OSS_ALLOWED_ORIGINS?.split(',') || [
    'https://lvzhi.com',
    'https://www.lvzhi.com',
  ]

  return {
    CORSRules: [
      {
        AllowedOrigin: allowedOrigins,
        AllowedMethod: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
        AllowedHeader: ['Authorization', 'Content-Type', 'x-oss-security-token'],
        ExposeHeader: ['x-oss-request-id', 'x-oss-object-type'],
        MaxAgeSeconds: 3600,
      },
    ],
  }
}

/**
 * 生成 OSS Referer 防盜链配置
 * 用于在阿里云 OSS 控制台设置防盗链规则
 */
export function generateRefererConfiguration(): {
  RefererList: {
    RefererList: string[]
  }
  RefererWhiteList: {
    RefererWhiteList: string[]
  }
  AllowEmptyReferer: boolean
} {
  const allowedDomains = process.env.OSS_ALLOWED_REFERRERS?.split(',') || [
    'https://lvzhi.com',
    'https://www.lvzhi.com',
  ]

  return {
    RefererList: {
      RefererList: allowedDomains,
    },
    RefererWhiteList: {
      RefererWhiteList: allowedDomains,
    },
    AllowEmptyReferer: false,
  }
}

/**
 * 生成 OSS 生命周期策略
 * 用于自动清理过期文件
 */
export function generateLifecycleConfiguration(): {
  LifecycleConfiguration: {
    Rule: Array<{
      ID: string
      Prefix: string
      Status: string
      Expiration?: { Days: number }
      Transition?: { Days: number; StorageClass: string }
    }>
  }
} {
  return {
    LifecycleConfiguration: {
      Rule: [
        {
          ID: 'clean-temp-uploads',
          Prefix: 'temp/',
          Status: 'Enabled',
          Expiration: { Days: 7 },
        },
        {
          ID: 'move-logs-to-ia',
          Prefix: 'logs/',
          Status: 'Enabled',
          Transition: { Days: 30, StorageClass: 'IA' },
        },
        {
          ID: 'archive-old-files',
          Prefix: 'documents/',
          Status: 'Enabled',
          Transition: { Days: 180, StorageClass: 'Archive' },
        },
      ],
    },
  }
}

// ============================================
// OSS 存储统计
// ============================================

export interface OSSBucketStats {
  bucket: string
  region: string
  objectCount: number
  totalSize: number // bytes
  cdnUrl?: string
}

/**
 * 获取 OSS Bucket 使用统计
 * 注意：需要 OSS 的 GetBucketStat 权限
 */
export async function getBucketStats(): Promise<OSSBucketStats | null> {
  const config = getOSSConfig()

  if (!config.accessKeyId || !config.accessKeySecret) {
    return null
  }

  try {
    const date = new Date().toUTCString()
    const canonicalString = `GET\n\n\n${date}\n/${config.bucket}/?stat`

    const signature = crypto
      .createHmac('sha1', config.accessKeySecret)
      .update(canonicalString)
      .digest('base64')

    const response = await fetch(
      `https://${config.bucket}.${config.endpoint}/?stat`,
      {
        headers: {
          'Authorization': `OSS ${config.accessKeyId}:${signature}`,
          'Date': date,
        },
      }
    )

    if (!response.ok) {
      console.warn('[OSS] Failed to get bucket stats:', response.status)
      return null
    }

    const stats = await response.json()

    return {
      bucket: config.bucket,
      region: config.region,
      objectCount: stats.ObjectCount || 0,
      totalSize: stats.StorageSize || 0,
      cdnUrl: config.cdnDomain,
    }
  } catch (error) {
    console.error('[OSS] Error getting bucket stats:', error)
    return null
  }
}

// ============================================
// 前端直传凭证生成
// ============================================

export interface UploadCredential {
  uploadUrl: string
  filePath: string
  config: Record<string, string>
  expiresIn: number
  maxSize: number
  allowedTypes: string[]
}

/**
 * 生成前端直传凭证
 * 用于让前端直接上传文件到 OSS
 */
export function generateUploadCredential(
  filePath: string,
  options: {
    maxSize?: number
    allowedTypes?: string[]
    expiresIn?: number
  } = {}
): UploadCredential {
  const config = getOSSConfig()
  const { maxSize = MAX_FILE_SIZE, allowedTypes = ALLOWED_FILE_TYPES, expiresIn = 3600 } = options

  const policy = generateUploadPolicy(filePath, maxSize, allowedTypes)

  return {
    uploadUrl: `https://${config.bucket}.${config.endpoint}`,
    filePath,
    config: policy.config,
    expiresIn,
    maxSize,
    allowedTypes,
  }
}

// ============================================
// OSS 配置检查
// ============================================

export interface OSSHealthCheck {
  configured: boolean
  bucket: string
  region: string
  cdnEnabled: boolean
  cdnDomain?: string
  error?: string
}

/**
 * 检查 OSS 配置状态
 */
export function checkOSSHealth(): OSSHealthCheck {
  const config = getOSSConfig()

  if (!config.accessKeyId || !config.accessKeySecret) {
    return {
      configured: false,
      bucket: config.bucket,
      region: config.region,
      cdnEnabled: false,
      error: 'OSS credentials not configured',
    }
  }

  return {
    configured: true,
    bucket: config.bucket,
    region: config.region,
    cdnEnabled: !!config.cdnDomain,
    cdnDomain: config.cdnDomain,
  }
}

