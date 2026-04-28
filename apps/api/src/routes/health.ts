import type { FastifyPluginAsync } from 'fastify'
import { healthCheck } from '../lib/database.js'

export const healthRoute: FastifyPluginAsync = async (app) => {
  // 根路径：避免浏览器打开 http://host:4000/ 时出现「无法连接」误解（实际多为未启动或非 Web 端口）
  app.get('/', async () => {
    return {
      service: 'lvzhi-api',
      hint: '这是 API 服务，不是网站首页。请打开 Next 站点（默认 http://127.0.0.1:3000/project-test 联调测试页）。',
      health: '/health',
      healthDetailed: '/health/detailed',
    }
  })

  // 基础健康检查
  app.get('/health', async () => {
    return { 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'lvzhi-api'
    }
  })

  // 详细健康检查（包含数据库）
  app.get('/health/detailed', async () => {
    const dbHealth = await healthCheck()
    
    return {
      status: dbHealth.status === 'ok' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      service: 'lvzhi-api',
      database: {
        status: dbHealth.status,
        latency: dbHealth.latency ? `${dbHealth.latency}ms` : undefined,
        error: dbHealth.error,
      },
    }
  })
}
