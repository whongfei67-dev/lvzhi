/**
 * 律植 (Lvzhi) 压测配置
 * 
 * 使用方法:
 *   k6 run load-test/scenarios.js
 *   k6 run load-test/scenarios.js --env BASE_URL=http://localhost:4000
 *   k6 run load-test/scenarios.js --env BASE_URL=https://api.lvzhi.com
 */

export const options = {
  scenarios: {
    // 场景1: 首页 + 智能体列表 (500并发)
    home_and_agents: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 100 },
        { duration: '1m', target: 300 },
        { duration: '1m', target: 500 },
        { duration: '30s', target: 0 },
      ],
      tags: { scenario: 'home_agents' },
    },
    
    // 场景2: AI 对话接口 (50并发)
    ai_chat: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '1m', target: 30 },
        { duration: '1m', target: 50 },
        { duration: '30s', target: 0 },
      ],
      tags: { scenario: 'ai_chat' },
    },
    
    // 场景3: 登录接口 (防刷测试)
    login_rapid: {
      executor: 'per-vu-iterations',
      vus: 5,
      iterations: 10,
      maxDuration: '2m',
      tags: { scenario: 'login_rapid' },
    },
    
    // 场景4: 支付接口 (100并发)
    payment: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 50 },
        { duration: '1m', target: 100 },
        { duration: '30s', target: 0 },
      ],
      tags: { scenario: 'payment' },
    },
    
    // 场景5: 文件上传
    file_upload: {
      executor: 'constant-vus',
      vus: 10,
      duration: '2m',
      tags: { scenario: 'file_upload' },
    },
    
    // 场景6: 高并发写入 (评论/点赞)
    write_operations: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 100 },
        { duration: '1m', target: 200 },
        { duration: '30s', target: 0 },
      ],
      tags: { scenario: 'write_operations' },
    },
  },
  
  thresholds: {
    // HTTP 相关指标
    http_req_duration: ['p(95)<500', 'p(99)<2000'],
    http_req_failed: ['rate<0.01'],
    
    // 自定义指标
    'http_req_duration{scenario:ai_chat}': ['p(95)<3000'],
    'http_req_duration{scenario:payment}': ['p(95)<1000'],
  },
}

// 默认配置
export const defaultConfig = {
  BASE_URL: __ENV.BASE_URL || 'http://localhost:4000',
  API_TIMEOUT: '30s',
}

// 性能目标
export const targets = {
  qps_api: 500,
  qps_ai: 50,
  p95_latency: '500ms',
  p99_latency: '2s',
  error_rate: '1%',
}
