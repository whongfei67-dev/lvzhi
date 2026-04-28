/**
 * 文件下载 API 路由
 * 支持文件下载（含权限校验和配额扣减）
 */

import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { query } from '../lib/database.js'
import { success, errors } from '../utils/response.js'
import { generatePresignedUrl } from '../utils/oss.js'
import type { JwtPayload } from '../types.js'
import { assertNotTradeRestricted, ensureUserSanctionColumns } from '../utils/user-sanctions.js'

export const downloadRoute: FastifyPluginAsync = async (app: FastifyInstance) => {
  await ensureUserSanctionColumns()

  // ============================================
  // GET /api/download/:id - 下载文件 (需要认证)
  // ============================================
  app.get('/api/download/:id', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const user = request.user as JwtPayload
    const { id } = request.params as { id: string }

    try {
      await assertNotTradeRestricted(String(user.user_id || user.id || ''))
      // 获取文件信息
      const file = await query<{
        id: string
        user_id: string
        filename: string
        original_name: string
        mime_type: string
        size: number
        url: string
      }>('SELECT * FROM uploaded_files WHERE id = $1', [id])

      if (file.rows.length === 0) {
        return errors.notFound(reply, 'File not found')
      }

      const fileData = file.rows[0]

      // 检查文件权限（文件所有者或管理员可下载）
      if (fileData.user_id !== user.user_id && user.role !== 'admin') {
        return errors.forbidden(reply, 'You do not have permission to download this file')
      }

      // 获取下载配额信息
      const quotaResult = await query<{
        daily_limit: number
        today_count: number
        last_reset_date: string
      }>(
        'SELECT daily_limit, today_count, last_reset_date FROM user_download_quotas WHERE user_id = $1',
        [user.user_id]
      )

      // 如果没有配额记录，创建一个默认的
      if (quotaResult.rows.length === 0) {
        // 创建默认配额
        const defaultLimit = 10
        await query(
          `INSERT INTO user_download_quotas (user_id, daily_limit, monthly_limit, total_size_limit_mb, today_count, month_count, last_reset_date)
           VALUES ($1, $2, $3, $4, 0, 0, CURRENT_DATE)
           ON CONFLICT (user_id) DO NOTHING`,
          [user.user_id, defaultLimit, defaultLimit * 10, 500]
        )
        
        // 重新查询
        const newQuota = await query<{
          daily_limit: number
          today_count: number
        }>(
          'SELECT daily_limit, today_count FROM user_download_quotas WHERE user_id = $1',
          [user.user_id]
        )
        
        if (newQuota.rows[0].today_count >= newQuota.rows[0].daily_limit) {
          return errors.badRequest(reply, `Daily download quota exceeded. You have used ${newQuota.rows[0].today_count}/${newQuota.rows[0].daily_limit} downloads today.`)
        }
        
        // 更新配额
        await query(
          'UPDATE user_download_quotas SET today_count = today_count + 1, last_download_at = NOW(), updated_at = NOW() WHERE user_id = $1',
          [user.user_id]
        )
      } else {
        const quota = quotaResult.rows[0]
        
        // 检查是否需要重置每日计数
        const today = new Date().toISOString().split('T')[0]
        if (quota.last_reset_date < today) {
          // 重置每日计数
          await query(
            'UPDATE user_download_quotas SET today_count = 1, last_reset_date = CURRENT_DATE, last_download_at = NOW(), updated_at = NOW() WHERE user_id = $1',
            [user.user_id]
          )
        } else {
          // 检查配额
          if (quota.today_count >= quota.daily_limit) {
            return errors.badRequest(reply, `Daily download quota exceeded. You have used ${quota.today_count}/${quota.daily_limit} downloads today.`)
          }
          
          // 更新配额
          await query(
            'UPDATE user_download_quotas SET today_count = today_count + 1, last_download_at = NOW(), updated_at = NOW() WHERE user_id = $1',
            [user.user_id]
          )
        }
      }

      // 记录下载日志
      const ipAddress = request.ip
      await query(
        `INSERT INTO file_downloads (user_id, file_id, ip_address, downloaded_at)
         VALUES ($1, $2, $3::inet, NOW())`,
        [user.user_id, id, ipAddress]
      )

      // 返回文件下载链接（使用签名 URL 限制有效期）
      const downloadUrl = await generatePresignedUrl(fileData.filename, 3600, 'GET')

      // 获取更新后的配额
      const updatedQuota = await query<{
        today_count: number
        daily_limit: number
      }>(
        'SELECT today_count, daily_limit FROM user_download_quotas WHERE user_id = $1',
        [user.user_id]
      )

      return success(reply, {
        download_url: downloadUrl,
        file_name: fileData.original_name,
        mime_type: fileData.mime_type,
        size: fileData.size,
        quota_remaining: updatedQuota.rows[0]?.daily_limit - updatedQuota.rows[0]?.today_count || 0
      })

    } catch (err) {
      console.error('Download error:', err)
      if (err instanceof Error && err.message.includes('限制下载/购买')) {
        return errors.forbidden(reply, err.message)
      }
      return errors.internal(reply, 'Failed to process download request')
    }
  })

  // ============================================
  // GET /api/download/quota - 获取用户下载配额信息
  // ============================================
  app.get('/api/download/quota', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const user = request.user as JwtPayload

    try {
      const quotaResult = await query<{
        daily_limit: number
        today_count: number
        monthly_limit: number
        month_count: number
        last_reset_date: string
      }>(
        'SELECT daily_limit, today_count, monthly_limit, month_count, last_reset_date FROM user_download_quotas WHERE user_id = $1',
        [user.user_id]
      )

      // 如果没有记录，返回默认配额
      if (quotaResult.rows.length === 0) {
        const defaultLimit = 10
        return success(reply, {
          daily_limit: defaultLimit,
          today_count: 0,
          daily_remaining: defaultLimit,
          monthly_limit: defaultLimit * 10,
          month_count: 0,
          monthly_remaining: defaultLimit * 10
        })
      }

      const quota = quotaResult.rows[0]
      
      // 检查是否需要重置每日计数
      const today = new Date().toISOString().split('T')[0]
      let todayCount = quota.today_count
      if (quota.last_reset_date < today) {
        todayCount = 0
      }

      return success(reply, {
        daily_limit: quota.daily_limit,
        today_count: todayCount,
        daily_remaining: Math.max(0, quota.daily_limit - todayCount),
        monthly_limit: quota.monthly_limit,
        month_count: quota.month_count,
        monthly_remaining: Math.max(0, quota.monthly_limit - quota.month_count)
      })

    } catch (err) {
      console.error('Get quota error:', err)
      return errors.internal(reply, 'Failed to get quota information')
    }
  })

  // ============================================
  // GET /api/download/history - 获取下载历史
  // ============================================
  app.get('/api/download/history', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const user = request.user as JwtPayload
    const { page = '1', pageSize = '20' } = request.query as { page?: string; pageSize?: string }

    const pageNum = parseInt(page)
    const pageSizeNum = parseInt(pageSize)
    const offset = (pageNum - 1) * pageSizeNum

    try {
      const countResult = await query<{ count: string }>(
        'SELECT COUNT(*) as count FROM file_downloads WHERE user_id = $1',
        [user.user_id]
      )
      const total = parseInt(countResult.rows[0]?.count || '0')

      const result = await query(
        `SELECT fd.*, uf.original_name, uf.mime_type, uf.size
         FROM file_downloads fd
         JOIN uploaded_files uf ON fd.file_id = uf.id
         WHERE fd.user_id = $1
         ORDER BY fd.downloaded_at DESC
         LIMIT $2 OFFSET $3`,
        [user.user_id, pageSizeNum, offset]
      )

      return success(reply, {
        items: result.rows,
        total,
        page: pageNum,
        pageSize: pageSizeNum,
        totalPages: Math.ceil(total / pageSizeNum)
      })

    } catch (err) {
      console.error('Get download history error:', err)
      return errors.internal(reply, 'Failed to get download history')
    }
  })

  // ============================================
  // GET /api/download/:id/preview - 预览文件（图片直接返回）
  // ============================================
  app.get('/api/download/:id/preview', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const user = request.user as JwtPayload
    const { id } = request.params as { id: string }

    try {
      const file = await query<{
        id: string
        user_id: string
        filename: string
        original_name: string
        mime_type: string
        url: string
      }>('SELECT * FROM uploaded_files WHERE id = $1', [id])

      if (file.rows.length === 0) {
        return errors.notFound(reply, 'File not found')
      }

      const fileData = file.rows[0]

      if (fileData.user_id !== user.user_id && user.role !== 'admin') {
        return errors.forbidden(reply, 'You do not have permission to preview this file')
      }

      // 只允许图片预览
      const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      if (!imageTypes.includes(fileData.mime_type)) {
        return errors.badRequest(reply, 'Preview is only available for image files')
      }

      const previewUrl = await generatePresignedUrl(fileData.filename, 1800, 'GET')

      return success(reply, {
        preview_url: previewUrl,
        file_name: fileData.original_name,
        mime_type: fileData.mime_type,
        expires_in: 1800
      })

    } catch (err) {
      console.error('Preview error:', err)
      return errors.internal(reply, 'Failed to generate preview')
    }
  })
}
