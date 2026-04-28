/**
 * OSS 上传凭证 API
 * 用于前端直传文件到阿里云 OSS
 */

import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { success, errors } from '../utils/response.js'
import {
  generateUploadCredential,
  generateFilePath,
  isFileTypeAllowed,
  isFileSizeAllowed,
  MAX_FILE_SIZE,
  ALLOWED_FILE_TYPES,
  checkOSSHealth,
} from '../utils/oss.js'
import type { JwtPayload } from '../types.js'

export const ossRoute: FastifyPluginAsync = async (app: FastifyInstance) => {

  // ============================================
  // GET /api/oss/health - OSS 健康检查
  // ============================================
  app.get('/api/oss/health', async (request, reply) => {
    const health = checkOSSHealth()
    return success(reply, health)
  })

  // ============================================
  // POST /api/oss/upload/credential - 获取上传凭证
  // ============================================
  app.post('/api/oss/upload/credential', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const user = request.user as JwtPayload
    const {
      filename,
      contentType,
      size,
      category = 'other',
    } = request.body as {
      filename: string
      contentType: string
      size: number
      category?: 'avatar' | 'agent' | 'post' | 'document' | 'other'
    }

    // 验证必填字段
    if (!filename || !contentType || !size) {
      return errors.badRequest(reply, '缺少必填字段：filename, contentType, size')
    }

    // 验证文件大小
    if (!isFileSizeAllowed(size)) {
      return errors.badRequest(reply, `文件大小超过限制，最大 ${MAX_FILE_SIZE / 1024 / 1024}MB`)
    }

    // 验证文件类型
    if (!isFileTypeAllowed(contentType)) {
      return errors.badRequest(reply, `不支持的文件类型：${contentType}`)
    }

    // 验证分类
    const validCategories = ['avatar', 'agent', 'post', 'document', 'other']
    if (!validCategories.includes(category)) {
      return errors.badRequest(reply, `无效的分类：${category}`)
    }

    // 生成文件路径
    const filePath = generateFilePath(user.id, category, filename)

    // 生成上传凭证
    const credential = generateUploadCredential(filePath, {
      maxSize: MAX_FILE_SIZE,
      allowedTypes: ALLOWED_FILE_TYPES,
      expiresIn: 3600,
    })

    return success(reply, {
      ...credential,
      publicUrl: credential.uploadUrl + '/' + credential.filePath,
    })
  })

  // ============================================
  // POST /api/oss/upload/confirm - 确认上传完成
  // ============================================
  app.post('/api/oss/upload/confirm', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const user = request.user as JwtPayload
    const { filePath, filename, size, contentType } = request.body as {
      filePath: string
      filename: string
      size: number
      contentType: string
    }

    if (!filePath || !filename) {
      return errors.badRequest(reply, '缺少必填字段：filePath, filename')
    }

    // 验证文件路径安全性（防止路径遍历）
    if (filePath.includes('..') || !filePath.startsWith('/')) {
      return errors.badRequest(reply, '无效的文件路径')
    }

    // 记录文件上传日志（可选：写入数据库）
    console.log(`[OSS] File upload confirmed: ${filePath} by user ${user.id}`)

    return success(reply, {
      filePath,
      filename,
      size,
      contentType,
      url: filePath.startsWith('http') ? filePath : `https://${process.env.OSS_BUCKET || 'lvzhi-files'}.${process.env.OSS_ENDPOINT || 'oss-cn-shanghai.aliyuncs.com'}/${filePath}`,
      uploadedAt: new Date().toISOString(),
    })
  })

  // ============================================
  // POST /api/oss/upload/direct - 服务端直接上传
  // ============================================
  app.post('/api/oss/upload/direct', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const user = request.user as JwtPayload
    const { filePath, base64Data, contentType } = request.body as {
      filePath: string
      base64Data: string
      contentType: string
    }

    if (!filePath || !base64Data || !contentType) {
      return errors.badRequest(reply, '缺少必填字段：filePath, base64Data, contentType')
    }

    // 验证文件大小
    const buffer = Buffer.from(base64Data, 'base64')
    if (!isFileSizeAllowed(buffer.length)) {
      return errors.badRequest(reply, `文件大小超过限制，最大 ${MAX_FILE_SIZE / 1024 / 1024}MB`)
    }

    // 验证文件类型
    if (!isFileTypeAllowed(contentType)) {
      return errors.badRequest(reply, `不支持的文件类型：${contentType}`)
    }

    // 导入 OSS 上传函数
    const { uploadToOSS } = await import('../utils/oss.js')

    try {
      const publicUrl = await uploadToOSS(filePath, buffer, contentType)

      return success(reply, {
        filePath,
        url: publicUrl,
        size: buffer.length,
        contentType,
        uploadedAt: new Date().toISOString(),
      })
    } catch (error) {
      console.error('[OSS] Upload failed:', error)
      return errors.internal(reply, '文件上传失败')
    }
  })

  // ============================================
  // DELETE /api/oss/files/:path - 删除文件
  // ============================================
  app.delete<{ Params: { path: string } }>('/api/oss/files/:path*', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const user = request.user as JwtPayload
    const { path } = request.params

    if (!path) {
      return errors.badRequest(reply, '缺少文件路径')
    }

    // 验证文件路径安全性
    if (path.includes('..') || path.includes('://')) {
      return errors.badRequest(reply, '无效的文件路径')
    }

    // TODO: 验证用户是否有权限删除此文件
    // 可以从数据库查询文件所有者

    // 导入 OSS 删除函数
    const { deleteFromOSS } = await import('../utils/oss.js')

    try {
      await deleteFromOSS(path)

      console.log(`[OSS] File deleted: ${path} by user ${user.id}`)

      return success(reply, { deleted: true, path })
    } catch (error) {
      console.error('[OSS] Delete failed:', error)
      return errors.internal(reply, '文件删除失败')
    }
  })

  // ============================================
  // GET /api/oss/config - 获取 OSS 配置信息（公开）
  // ============================================
  app.get('/api/oss/config', async (request, reply) => {
    // 返回允许的文件类型和大小限制
    return success(reply, {
      maxFileSize: MAX_FILE_SIZE,
      allowedTypes: ALLOWED_FILE_TYPES,
      cdnEnabled: !!process.env.OSS_CDN_URL,
      cdnDomain: process.env.OSS_CDN_URL || null,
    })
  })
}

export default ossRoute
