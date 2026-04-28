/**
 * 律植 (Lvzhi) 压测场景
 * 
 * 包含 6 个压测场景:
 * 1. 首页 + 智能体列表 (500并发)
 * 2. AI 对话接口 (50并发)
 * 3. 登录接口暴力测试
 * 4. 支付接口 (100并发)
 * 5. 文件上传接口
 * 6. 高并发写入 (评论/点赞)
 */

import http from 'k6/http'
import { check, sleep, group } from 'k6'
import { Rate, Trend } from 'k6/metrics'
import { defaultConfig } from './config.js'

const config = defaultConfig

// 自定义指标
const errorRate = new Rate('errors')
const aiDuration = new Trend('ai_chat_duration')
const loginDuration = new Trend('login_duration')
const paymentDuration = new Trend('payment_duration')

// 测试数据 (会通过 setup 动态生成)
const testUsers = __ENV.TEST_USERS ? JSON.parse(__ENV.TEST_USERS) : []
const testAgents = __ENV.TEST_AGENTS ? JSON.parse(__ENV.TEST_AGENTS) : []

/**
 * Setup: 准备测试数据
 */
export function setup() {
  console.log('Setting up load test data...')
  
  // 返回测试数据
  return {
    timestamp: Date.now(),
  }
}

/**
 * 场景1: 首页 + 智能体列表 (500并发)
 */
export function scenarioHomeAndAgents() {
  group('Home & Agents', () => {
    // 健康检查
    const healthRes = http.get(`${config.BASE_URL}/health`)
    check(healthRes, {
      'health check status 200': (r) => r.status === 200,
    })
    
    // 首页数据
    const homeRes = http.get(`${config.BASE_URL}/api/agents?limit=10`)
    check(homeRes, {
      'agents list status 200': (r) => r.status === 200,
      'agents list has data': (r) => {
        try {
          const body = JSON.parse(r.body)
          return body.code === 200 || Array.isArray(body.data)
        } catch (e) {
          return false
        }
      },
    })
    
    sleep(0.1)
    
    // 分类筛选
    const categoryRes = http.get(`${config.BASE_URL}/api/agents?category=法律咨询&limit=20`)
    check(categoryRes, {
      'category filter status 200': (r) => r.status === 200,
    })
    
    // 搜索
    const searchRes = http.get(`${config.BASE_URL}/api/agents?search=合同&limit=10`)
    check(searchRes, {
      'search status 200': (r) => r.status === 200,
    })
  })
}

/**
 * 场景2: AI 对话 (50并发)
 */
export function scenarioAIChat(token) {
  group('AI Chat', () => {
    const payload = JSON.stringify({
      message: '我想咨询一下劳动合同的问题',
      agent_id: 'test-agent-1',
      stream: false,
    })
    
    const params = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      timeout: '60s',
    }
    
    const start = Date.now()
    const aiRes = http.post(`${config.BASE_URL}/api/ai/chat`, payload, params)
    aiDuration.add(Date.now() - start)
    
    check(aiRes, {
      'ai chat status 200': (r) => r.status === 200,
      'ai chat has response': (r) => {
        try {
          const body = JSON.parse(r.body)
          return body.code === 200 || body.data
        } catch (e) {
          return false
        }
      },
    })
    
    // 测试流式输出
    const streamPayload = JSON.stringify({
      message: '请解释一下什么是竞业限制',
      agent_id: 'test-agent-1',
      stream: true,
    })
    
    const streamRes = http.post(`${config.BASE_URL}/api/ai/chat/stream`, streamPayload, params)
    check(streamRes, {
      'ai stream status 200': (r) => r.status === 200,
    })
  })
}

/**
 * 场景3: 登录接口暴力测试 (防刷验证)
 */
export function scenarioLoginRapid() {
  group('Login Rapid Test', () => {
    const payloads = [
      { email: 'test@example.com', password: 'wrongpassword' },
      { email: 'admin@example.com', password: 'admin123' },
      { email: 'user@test.com', password: 'test' },
    ]
    
    for (let i = 0; i < payloads.length; i++) {
      const payload = JSON.stringify(payloads[i])
      const params = {
        headers: { 'Content-Type': 'application/json' },
      }
      
      const start = Date.now()
      const loginRes = http.post(`${config.BASE_URL}/api/auth/login`, payload, params)
      loginDuration.add(Date.now() - start)
      
      check(loginRes, {
        [`login attempt ${i + 1} handled`]: (r) => r.status === 200 || r.status === 401,
      })
      
      // 检查是否被限流
      if (loginRes.status === 429) {
        console.log('Rate limit triggered after rapid login attempts')
        errorRate.add(1, { type: 'rate_limit' })
        break
      }
      
      sleep(0.5)
    }
  })
}

/**
 * 场景4: 支付接口 (100并发)
 */
export function scenarioPayment(token) {
  group('Payment', () => {
    const payloads = [
      { amount: 100, payment_method: 'alipay' },
      { amount: 200, payment_method: 'wechat' },
      { amount: 500, payment_method: 'balance' },
    ]
    
    for (const payload of payloads) {
      const body = JSON.stringify(payload)
      const params = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
      
      const start = Date.now()
      const payRes = http.post(`${config.BASE_URL}/api/payments/alipay`, body, params)
      paymentDuration.add(Date.now() - start)
      
      check(payRes, {
        'payment request handled': (r) => r.status === 200 || r.status === 400 || r.status === 401,
      })
    }
  })
}

/**
 * 场景5: 文件上传
 */
export function scenarioFileUpload(token) {
  group('File Upload', () => {
    // 生成 1MB 测试文件
    const fileContent = 'x'.repeat(1024 * 1024)
    
    const params = {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
    
    const uploadRes = http.post(
      `${config.BASE_URL}/api/upload`,
      fileContent,
      params
    )
    
    check(uploadRes, {
      'upload handled': (r) => r.status === 200 || r.status === 413 || r.status === 401,
    })
  })
}

/**
 * 场景6: 高并发写入 (评论/点赞)
 */
export function scenarioWriteOperations(token) {
  group('Write Operations', () => {
    // 点赞
    const likePayload = JSON.stringify({
      post_id: 'test-post-1',
    })
    
    const likeParams = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    }
    
    const likeRes = http.post(
      `${config.BASE_URL}/api/community/posts/test-post-1/like`,
      likePayload,
      likeParams
    )
    
    check(likeRes, {
      'like handled': (r) => r.status === 200 || r.status === 401,
    })
    
    // 评论
    const commentPayload = JSON.stringify({
      post_id: 'test-post-1',
      content: `Load test comment ${Date.now()}`,
    })
    
    const commentRes = http.post(
      `${config.BASE_URL}/api/community/comments`,
      commentPayload,
      likeParams
    )
    
    check(commentRes, {
      'comment handled': (r) => r.status === 200 || r.status === 401,
    })
    
    sleep(0.1)
  })
}

/**
 * 默认场景 (所有接口混合)
 */
export default function () {
  // 健康检查
  const healthRes = http.get(`${config.BASE_URL}/health`)
  check(healthRes, {
    'health check passed': (r) => r.status === 200,
  })
  
  // 智能体列表
  const agentsRes = http.get(`${config.BASE_URL}/api/agents?limit=10`)
  check(agentsRes, {
    'agents list passed': (r) => r.status === 200,
  })
  
  // 社区帖子
  const postsRes = http.get(`${config.BASE_URL}/api/community/posts?limit=10`)
  check(postsRes, {
    'posts list passed': (r) => r.status === 200,
  })
  
  sleep(1)
}

/**
 * Teardown: 清理测试数据
 */
export function teardown(data) {
  console.log('Load test completed')
  console.log(`Total duration: ${(Date.now() - data.timestamp) / 1000}s`)
}
