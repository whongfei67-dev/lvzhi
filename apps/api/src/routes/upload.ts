/**
 * 文件上传 API 路由
 * 对接阿里云 OSS
 */

import type { FastifyInstance, FastifyPluginAsync, FastifyReply } from 'fastify'
import { query } from '../lib/database.js'
import { success, created, errors } from '../utils/response.js'
import { uploadToOSS, deleteFromOSS } from '../utils/oss.js'
import type { JwtPayload } from '../types.js'
import { isVisitor } from '../plugins/auth.js'

/** 与 JWT 签发字段对齐；authenticate 在 token 无效时会置为 visitor，不可写入 UUID 列 */
function profileUserId(user: JwtPayload): string {
  const id = String(user.user_id || user.id || '').trim()
  if (!id || id === 'visitor') return ''
  return id
}

function rejectIfNotLoggedIn(reply: FastifyReply, user: JwtPayload): boolean {
  if (isVisitor(user) || !profileUserId(user)) {
    errors.unauthorized(reply, '请先登录后再上传')
    return true
  }
  return false
}

function uploadFailureMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) {
    const m = err.message
    if (/invalid input syntax for type uuid/i.test(m)) {
      return '登录态无效，请重新登录后再上传'
    }
    if (/OSS upload failed/i.test(m)) {
      return `文件存储失败（${m.replace(/^OSS upload failed:\s*/i, '').slice(0, 120)}）`
    }
    if (m.length > 0 && m.length < 200) return m
  }
  return fallback
}

// 允许的文件类型
const ALLOWED_FILE_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/zip',
  'application/x-zip-compressed',
  'application/x-7z-compressed',
  'application/vnd.rar',
  'text/plain',
  'text/markdown',
  'application/json',
  'text/csv',
]

// 允许的图片类型
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export const uploadRoute: FastifyPluginAsync = async (app: FastifyInstance) => {

  // ============================================
  // POST /api/upload - 上传文件 (需要认证)
  // ============================================
  app.post('/api/upload', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const user = request.user as JwtPayload
    if (rejectIfNotLoggedIn(reply, user)) return
    const userId = profileUserId(user)

    const data = await request.file().catch(() => null)

    if (!data) {
      return errors.badRequest(reply, '未收到文件，请重试')
    }

    const { filename, mimetype } = data
    // @fastify/multipart v8：toBuffer 在 MultipartFile 根对象上，不在内部的 file 流上
    const buffer = await data.toBuffer()

    if (!buffer.length) {
      return errors.badRequest(reply, '文件为空')
    }

    // 文件大小限制 50MB
    if (buffer.length > 50 * 1024 * 1024) {
      return errors.badRequest(reply, '文件过大（最大 50MB）')
    }

    // 文件类型限制
    if (!ALLOWED_FILE_TYPES.includes(mimetype)) {
      return errors.badRequest(reply, '不支持的文件类型')
    }

    try {
      // 生成唯一文件名
      const ext = filename.split('.').pop() || ''
      const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
      const filePath = `uploads/${userId}/${uniqueName}`

      // 上传到阿里云 OSS
      const url = await uploadToOSS(filePath, buffer, mimetype)

      // 记录到数据库
      const result = await query(
        `INSERT INTO uploaded_files (user_id, filename, original_name, size, mime_type, url, category)
         VALUES ($1, $2, $3, $4, $5, $6, 'other')
         RETURNING id, user_id, filename, original_name, size, mime_type, url, created_at`,
        [userId, uniqueName, filename, buffer.length, mimetype, url]
      )

      return created(reply, result.rows[0], 'File uploaded successfully')

    } catch (err) {
      console.error('Upload error:', err)
      return errors.internal(reply, uploadFailureMessage(err, '上传失败，请稍后重试'))
    }
  })

  // ============================================
  // POST /api/upload/avatar - 上传头像 (需要认证)
  // ============================================
  app.post('/api/upload/avatar', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const user = request.user as JwtPayload
    if (rejectIfNotLoggedIn(reply, user)) return
    const userId = profileUserId(user)

    const data = await request.file().catch(() => null)

    if (!data) {
      return errors.badRequest(reply, '未收到文件，请重试')
    }

    const { filename, mimetype } = data
    // @fastify/multipart v8：toBuffer 在 MultipartFile 根对象上，不在内部的 file 流上
    const buffer = await data.toBuffer()

    if (!buffer.length) {
      return errors.badRequest(reply, '文件为空')
    }

    // 头像限制 5MB
    if (buffer.length > 5 * 1024 * 1024) {
      return errors.badRequest(reply, '图片过大（最大 5MB）')
    }

    // 只允许图片
    if (!ALLOWED_IMAGE_TYPES.includes(mimetype)) {
      return errors.badRequest(reply, '仅支持 jpg / png / gif / webp 图片')
    }

    try {
      const ext = filename.split('.').pop() || 'jpg'
      const uniqueName = `avatar-${userId}-${Date.now()}.${ext}`
      const filePath = `avatars/${uniqueName}`

      // 上传到阿里云 OSS
      const url = await uploadToOSS(filePath, buffer, mimetype)

      // 更新用户头像
      await query(
        'UPDATE profiles SET avatar_url = $1, updated_at = NOW() WHERE id = $2',
        [url, userId]
      )

      // 记录文件
      await query(
        `INSERT INTO uploaded_files (user_id, filename, original_name, size, mime_type, url, category)
         VALUES ($1, $2, $3, $4, $5, $6, 'avatar')`,
        [userId, uniqueName, filename, buffer.length, mimetype, url]
      )

      return success(reply, { url }, 'Avatar uploaded successfully')

    } catch (err) {
      console.error('Avatar upload error:', err)
      return errors.internal(reply, uploadFailureMessage(err, '头像上传失败，请稍后重试'))
    }
  })

  // ============================================
  // POST /api/upload/agent-avatar - 上传智能体头像 (需要认证)
  // ============================================
  app.post('/api/upload/agent-avatar', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const user = request.user as JwtPayload
    if (rejectIfNotLoggedIn(reply, user)) return
    const userId = profileUserId(user)

    const { agent_id } = request.body as { agent_id?: string }
    const data = await request.file().catch(() => null)

    if (!data) {
      return errors.badRequest(reply, '未收到文件，请重试')
    }

    if (!agent_id) {
      return errors.badRequest(reply, '缺少智能体 ID（agent_id）')
    }

    // 验证智能体归属
    const agent = await query<{ creator_id: string }>(
      'SELECT creator_id FROM agents WHERE id = $1',
      [agent_id]
    )

    if (agent.rows.length === 0) {
      return errors.notFound(reply, 'Agent not found')
    }

    if (agent.rows[0].creator_id !== userId && user.role !== 'admin') {
      return errors.forbidden(reply, 'You can only upload avatars for your own agents')
    }

    const { filename, mimetype } = data
    // @fastify/multipart v8：toBuffer 在 MultipartFile 根对象上，不在内部的 file 流上
    const buffer = await data.toBuffer()

    if (!buffer.length) {
      return errors.badRequest(reply, '文件为空')
    }

    // 头像限制 5MB
    if (buffer.length > 5 * 1024 * 1024) {
      return errors.badRequest(reply, '图片过大（最大 5MB）')
    }

    if (!ALLOWED_IMAGE_TYPES.includes(mimetype)) {
      return errors.badRequest(reply, '仅支持 jpg / png / gif / webp 图片')
    }

    try {
      const ext = filename.split('.').pop() || 'jpg'
      const uniqueName = `agent-${agent_id}-${Date.now()}.${ext}`
      const filePath = `agent-avatars/${uniqueName}`

      // 上传到阿里云 OSS
      const url = await uploadToOSS(filePath, buffer, mimetype)

      // 更新智能体头像
      await query(
        'UPDATE agents SET avatar_url = $1, updated_at = NOW() WHERE id = $2',
        [url, agent_id]
      )

      // 记录文件
      await query(
        `INSERT INTO uploaded_files (user_id, filename, original_name, size, mime_type, url, category)
         VALUES ($1, $2, $3, $4, $5, $6, 'agent_avatar')`,
        [userId, uniqueName, filename, buffer.length, mimetype, url]
      )

      return success(reply, { url }, 'Agent avatar uploaded successfully')

    } catch (err) {
      console.error('Agent avatar upload error:', err)
      return errors.internal(reply, uploadFailureMessage(err, '头像上传失败，请稍后重试'))
    }
  })

  // ============================================
  // GET /api/upload/:id - 获取上传记录
  // ============================================
  app.get<{ Params: { id: string } }>('/api/upload/:id', async (request, reply) => {
    const { id } = request.params

    try {
      const result = await query(
        'SELECT * FROM uploaded_files WHERE id = $1',
        [id]
      )

      if (result.rows.length === 0) {
        return errors.notFound(reply, 'File not found')
      }

      return success(reply, result.rows[0])

    } catch (err) {
      console.error('Get upload error:', err)
      return errors.internal(reply, 'Failed to get file')
    }
  })

  // ============================================
  // DELETE /api/upload/:id - 删除上传文件 (需要认证)
  // ============================================
  app.delete<{ Params: { id: string } }>('/api/upload/:id', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { id } = request.params
    const user = request.user as JwtPayload
    if (rejectIfNotLoggedIn(reply, user)) return
    const userId = profileUserId(user)

    try {
      const file = await query<{ user_id: string; url: string; filename: string }>(
        'SELECT user_id, url, filename FROM uploaded_files WHERE id = $1',
        [id]
      )

      if (file.rows.length === 0) {
        return errors.notFound(reply, 'File not found')
      }

      // 只有上传者或管理员可以删除
      if (file.rows[0].user_id !== userId && user.role !== 'admin') {
        return errors.forbidden(reply, 'You can only delete your own files')
      }

      // 从 OSS 删除文件
      const filePath = file.rows[0].filename
      if (filePath && !filePath.startsWith('/uploads/')) {
        await deleteFromOSS(filePath)
      }

      await query('DELETE FROM uploaded_files WHERE id = $1', [id])

      return success(reply, null, 'File deleted successfully')

    } catch (err) {
      console.error('Delete file error:', err)
      return errors.internal(reply, 'Failed to delete file')
    }
  })

  // ============================================
  // GET /api/upload/user/files - 获取用户上传列表 (需要认证)
  // ============================================
  app.get('/api/upload/user/files', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const user = request.user as JwtPayload
    if (rejectIfNotLoggedIn(reply, user)) return
    const userId = profileUserId(user)

    const { page = '1', pageSize = '20' } = request.query as { page?: string; pageSize?: string }

    const pageNum = parseInt(page)
    const pageSizeNum = parseInt(pageSize)
    const offset = (pageNum - 1) * pageSizeNum

    try {
      const countResult = await query<{ count: string }>(
        'SELECT COUNT(*) as count FROM uploaded_files WHERE user_id = $1',
        [userId]
      )
      const total = parseInt(countResult.rows[0]?.count || '0')

      const result = await query(
        `SELECT * FROM uploaded_files
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, pageSizeNum, offset]
      )

      return success(reply, {
        items: result.rows,
        total,
        page: pageNum,
        pageSize: pageSizeNum,
        totalPages: Math.ceil(total / pageSizeNum),
      })

    } catch (err) {
      console.error('Get user files error:', err)
      return errors.internal(reply, 'Failed to get files')
    }
  })
}
