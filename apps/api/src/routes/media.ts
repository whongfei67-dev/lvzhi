import crypto from 'crypto'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { errors } from '../utils/response.js'

function normalizeHost(raw: string): string {
  return String(raw || '').trim().toLowerCase()
}

function isAliyunOssHost(host: string): boolean {
  return host === 'aliyuncs.com' || host.endsWith('.aliyuncs.com')
}

function isAllowedMediaHost(host: string): boolean {
  const envEndpoint = normalizeHost(process.env.OSS_ENDPOINT || process.env.ALIYUN_OSS_ENDPOINT || '')
  const envBucket = normalizeHost(process.env.OSS_BUCKET || process.env.ALIYUN_OSS_BUCKET || '')
  const envCdnRaw = String(process.env.OSS_CDN_URL || process.env.ALIYUN_OSS_CDN_URL || '').trim()
  let envCdnHost = ''
  if (envCdnRaw) {
    try {
      envCdnHost = normalizeHost(new URL(envCdnRaw).host)
    } catch {
      envCdnHost = ''
    }
  }

  const bucketEndpointHost = envEndpoint && envBucket ? `${envBucket}.${envEndpoint}` : ''
  if (bucketEndpointHost && host === bucketEndpointHost) return true
  if (envCdnHost && host === envCdnHost) return true
  return isAliyunOssHost(host)
}

function getOssCredential() {
  const accessKeyId = process.env.OSS_ACCESS_KEY_ID || process.env.ALIYUN_OSS_ACCESS_KEY_ID || ''
  const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET || process.env.ALIYUN_OSS_ACCESS_KEY_SECRET || ''
  return { accessKeyId, accessKeySecret }
}

function buildSignedUrl(rawUrl: string, expiresInSeconds: number): string {
  const { accessKeyId, accessKeySecret } = getOssCredential()
  if (!accessKeyId || !accessKeySecret) {
    throw new Error('OSS credentials not configured')
  }

  const parsed = new URL(rawUrl)
  const host = normalizeHost(parsed.host)
  if (!isAllowedMediaHost(host)) {
    throw new Error(`Media host not allowed: ${host}`)
  }

  const firstDot = host.indexOf('.')
  if (firstDot <= 0) {
    throw new Error('Invalid OSS host format')
  }
  const bucket = host.slice(0, firstDot)
  const endpoint = host.slice(firstDot + 1)
  if (!bucket || !endpoint) {
    throw new Error('Invalid OSS bucket endpoint')
  }

  const key = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''))
  if (!key || key.includes('..')) {
    throw new Error('Invalid OSS object key')
  }

  const expiration = Math.floor(Date.now() / 1000) + expiresInSeconds
  const canonicalString = [
    'GET',
    '',
    '',
    expiration,
    `/${bucket}/${key}`,
  ].join('\n')
  const signature = crypto
    .createHmac('sha1', accessKeySecret)
    .update(canonicalString)
    .digest('base64')

  return `https://${bucket}.${endpoint}/${encodeURI(key)}?OSSAccessKeyId=${encodeURIComponent(accessKeyId)}&Expires=${expiration}&Signature=${encodeURIComponent(signature)}`
}

export const mediaRoute: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.get('/api/media', async (request, reply) => {
    const { url } = request.query as { url?: string }
    const raw = String(url || '').trim()
    if (!raw) {
      return errors.badRequest(reply, 'Missing media url')
    }

    try {
      const signed = buildSignedUrl(raw, 600)
      return reply.redirect(302, signed)
    } catch (err) {
      request.log.warn({ err, url: raw }, 'Failed to sign media url')
      return errors.forbidden(reply, '无法访问该媒体资源')
    }
  })
}

