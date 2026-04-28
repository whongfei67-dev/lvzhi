/**
 * 律植 (Lvzhi) Node.js 原生压测脚本
 *
 * 不依赖 k6，使用原生 http/https 模块进行压测
 *
 * 使用方法:
 *   node load-test/node-load-test.js                    # 运行所有场景
 *   node load-test/node-load-test.js --scenario=1       # 运行场景1
 *   node load-test/node-load-test.js --concurrency=100  # 100并发
 *   node load-test/node-load-test.js --duration=60      # 持续60秒
 *   node load-test/node-load-test.js --report=html       # 输出HTML报告
 */

import http from 'http';
import https from 'https';
import { URL } from 'url';
import fs from 'fs';
import path from 'path';

// ============================================
// 配置
// ============================================

const CONFIG = {
  // API 地址
  BASE_URL: process.env.BASE_URL || 'http://localhost:4000',

  // 并发数
  CONCURRENCY: parseInt(process.argv.find(arg => arg.startsWith('--concurrency='))?.split('=')[1] || '50'),

  // 持续时间（秒）
  DURATION: parseInt(process.argv.find(arg => arg.startsWith('--duration='))?.split('=')[1] || '30'),

  // 运行的场景
  SCENARIO: process.argv.find(arg => arg.startsWith('--scenario='))?.split('=')[1] || 'all',

  // 输出报告格式: text | json | html
  REPORT: process.argv.find(arg => arg.startsWith('--report='))?.split('=')[1] || 'text',
};

// 解析 URL
const parsedUrl = new URL(CONFIG.BASE_URL);
const isHttps = parsedUrl.protocol === 'https:';
const httpModule = isHttps ? https : http;

// ============================================
// 颜色输出
// ============================================

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
};

function log(level, message) {
  const prefix = {
    info: `${colors.blue}ℹ${colors.reset}`,
    pass: `${colors.green}✓${colors.reset}`,
    fail: `${colors.red}✗${colors.reset}`,
    warn: `${colors.yellow}⚠${colors.reset}`,
    skip: `${colors.dim}○${colors.reset}`,
  }[level] || `${colors.blue}•${colors.reset}`;
  console.log(`${prefix} ${message}`);
}

// ============================================
// HTTP 请求封装
// ============================================

function httpRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: options.path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Lvzhi-LoadTest/1.0',
        ...options.headers,
      },
    };

    const req = httpModule.request(reqOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const latency = Date.now() - startTime;
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }

        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
          parsed,
          latency,
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }

    req.end();
  });
}

// ============================================
// 性能统计
// ============================================

class PerformanceStats {
  constructor() {
    this.latencies = [];
    this.errors = 0;
    this.success = 0;
    this.statusCodes = new Map();
    this.startTime = Date.now();
    this.requestCount = 0;
    this.bytesReceived = 0;
  }

  add(latency, status, body = '') {
    this.latencies.push(latency);
    this.requestCount++;
    this.bytesReceived += body.length;

    if (status >= 200 && status < 300) {
      this.success++;
    } else {
      this.errors++;
    }

    const count = this.statusCodes.get(status) || 0;
    this.statusCodes.set(status, count + 1);
  }

  getStats() {
    const sorted = [...this.latencies].sort((a, b) => a - b);
    const duration = (Date.now() - this.startTime) / 1000;

    return {
      totalRequests: this.requestCount,
      successRequests: this.success,
      failedRequests: this.errors,
      errorRate: this.requestCount > 0 ? (this.errors / this.requestCount * 100).toFixed(2) + '%' : '0%',
      duration: duration.toFixed(2) + 's',
      qps: this.requestCount / duration,
      throughput: (this.bytesReceived / duration / 1024 / 1024).toFixed(2) + ' MB/s',

      // 延迟统计 (ms)
      min: sorted[0] || 0,
      max: sorted[sorted.length - 1] || 0,
      avg: this.latencies.length > 0 ? (this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length).toFixed(2) : 0,
      p50: sorted[Math.floor(sorted.length * 0.5)] || 0,
      p90: sorted[Math.floor(sorted.length * 0.9)] || 0,
      p95: sorted[Math.floor(sorted.length * 0.95)] || 0,
      p99: sorted[Math.floor(sorted.length * 0.99)] || 0,

      // 状态码分布
      statusCodes: Object.fromEntries(this.statusCodes),
    };
  }

  reset() {
    this.latencies = [];
    this.errors = 0;
    this.success = 0;
    this.statusCodes.clear();
    this.startTime = Date.now();
    this.requestCount = 0;
    this.bytesReceived = 0;
  }
}

// ============================================
// 压测场景
// ============================================

const scenarios = {
  /**
   * 场景1: 健康检查 + 智能体列表
   */
  async scenario1(stats) {
    // 健康检查
    try {
      const res = await httpRequest({ path: '/health' });
      stats.add(res.latency, res.status);
    } catch (e) {
      stats.errors++;
    }

    // 智能体列表
    try {
      const res = await httpRequest({ path: '/api/agents?limit=20' });
      stats.add(res.latency, res.status);
    } catch (e) {
      stats.errors++;
    }

    // 社区帖子
    try {
      const res = await httpRequest({ path: '/api/community/posts?limit=20' });
      stats.add(res.latency, res.status);
    } catch (e) {
      stats.errors++;
    }
  },

  /**
   * 场景2: AI 对话接口
   */
  async scenario2(stats, token) {
    const payload = {
      message: '我想咨询劳动合同的问题',
      agent_id: 'test-agent',
      stream: false,
    };

    try {
      const res = await httpRequest({
        path: '/api/ai/chat',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }, payload);
      stats.add(res.latency, res.status);
    } catch (e) {
      stats.errors++;
    }
  },

  /**
   * 场景3: 登录接口 (防刷测试)
   */
  async scenario3(stats) {
    const payloads = [
      { email: 'test@example.com', password: 'wrongpassword' },
      { email: 'admin@example.com', password: 'admin123' },
    ];

    for (const payload of payloads) {
      try {
        const res = await httpRequest({
          path: '/api/auth/login',
          method: 'POST',
        }, payload);
        stats.add(res.latency, res.status);
      } catch (e) {
        stats.errors++;
      }
    }
  },

  /**
   * 场景4: 支付接口
   */
  async scenario4(stats, token) {
    try {
      const res = await httpRequest({
        path: '/api/payments/alipay',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }, { amount: 100, payment_method: 'alipay' });
      stats.add(res.latency, res.status);
    } catch (e) {
      stats.errors++;
    }
  },

  /**
   * 场景5: 文件上传 (小文件)
   */
  async scenario5(stats, token) {
    // 生成 100KB 测试数据
    const data = 'x'.repeat(100 * 1024);

    try {
      const res = await httpRequest({
        path: '/api/upload',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/octet-stream',
        },
      }, data);
      stats.add(res.latency, res.status);
    } catch (e) {
      stats.errors++;
    }
  },

  /**
   * 场景6: 高并发写入 (点赞/评论)
   */
  async scenario6(stats, token) {
    // 点赞
    try {
      const res = await httpRequest({
        path: '/api/community/posts/test-post/like',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }, { post_id: 'test-post' });
      stats.add(res.latency, res.status);
    } catch (e) {
      stats.errors++;
    }

    // 评论
    try {
      const res = await httpRequest({
        path: '/api/community/comments',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }, { post_id: 'test-post', content: 'Load test comment' });
      stats.add(res.latency, res.status);
    } catch (e) {
      stats.errors++;
    }
  },
};

// ============================================
// 获取测试 Token
// ============================================

async function getTestToken() {
  try {
    // 尝试登录测试账号
    const res = await httpRequest({
      path: '/api/auth/login',
      method: 'POST',
    }, {
      email: 'loadtest@test.com',
      password: 'LoadTest123!',
    });

    if (res.parsed?.data?.token) {
      return res.parsed.data.token;
    }
  } catch (e) {
    log('warn', '获取测试 Token 失败，将跳过需要认证的场景');
  }
  return null;
}

// ============================================
// 执行压测
// ============================================

async function runLoadTest(scenarioName, scenarioFn, token = null) {
  const stats = new PerformanceStats();
  const startTime = Date.now();
  const endTime = startTime + CONFIG.DURATION * 1000;

  console.log(`\n${colors.bold}━━━ ${scenarioName} ━━━${colors.reset}`);
  console.log(`并发: ${CONFIG.CONCURRENCY} | 持续: ${CONFIG.DURATION}s | 目标: ${CONFIG.BASE_URL}`);

  // 创建并发 worker
  const workers = [];

  for (let i = 0; i < CONFIG.CONCURRENCY; i++) {
    workers.push(
      (async () => {
        while (Date.now() < endTime) {
          try {
            await scenarioFn(stats, token);
          } catch (e) {
            stats.errors++;
          }
          // 添加小延迟避免完全同步
          await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
        }
      })()
    );
  }

  // 显示进度
  const progressInterval = setInterval(() => {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    const progress = Math.min(100, (elapsed / CONFIG.DURATION) * 100).toFixed(0);
    process.stdout.write(`\r  进度: ${colors.cyan}${progress}%${colors.reset} | 请求: ${stats.requestCount} | 错误: ${stats.errors}`);
  }, 500);

  // 等待所有 worker 完成
  await Promise.all(workers);

  clearInterval(progressInterval);
  console.log(`\r  进度: ${colors.green}100%${colors.reset} | 请求: ${stats.requestCount} | 错误: ${stats.errors}  `);

  return stats;
}

// ============================================
// 输出报告
// ============================================

function printReport(name, stats) {
  const s = stats.getStats();

  console.log(`\n${colors.bold}━━━ ${name} 报告 ━━━${colors.reset}\n`);

  // 概览
  console.log(`${colors.bold}概览${colors.reset}`);
  console.log(`  总请求数: ${s.totalRequests}`);
  console.log(`  成功/失败: ${colors.green}${s.successRequests}${colors.reset} / ${colors.red}${s.failedRequests}${colors.reset}`);
  console.log(`  错误率: ${s.errorRate}`);
  console.log(`  持续时间: ${s.duration}`);
  console.log(`  QPS: ${s.qps.toFixed(2)}`);
  console.log(`  吞吐量: ${s.throughput}`);

  // 延迟统计
  console.log(`\n${colors.bold}延迟统计 (ms)${colors.reset}`);
  console.log(`  最小: ${s.min}`);
  console.log(`  平均: ${s.avg}`);
  console.log(`  P50: ${s.p50}`);
  console.log(`  P90: ${s.p90}`);
  console.log(`  ${colors.yellow}P95: ${s.p95}${colors.reset}`);
  console.log(`  ${colors.red}P99: ${s.p99}${colors.reset}`);
  console.log(`  最大: ${s.max}`);

  // 状态码分布
  console.log(`\n${colors.bold}状态码分布${colors.reset}`);
  for (const [code, count] of Object.entries(s.statusCodes)) {
    const color = code.startsWith('2') ? colors.green : code.startsWith('4') ? colors.yellow : colors.red;
    console.log(`  ${color}${code}${colors.reset}: ${count} (${(count / s.totalRequests * 100).toFixed(1)}%)`);
  }

  // 性能评估
  console.log(`\n${colors.bold}性能评估${colors.reset}`);
  const p95Ok = s.p95 < 500;
  const qpsOk = s.qps >= 50;
  const errorOk = s.errorRate < '1%';

  console.log(`  P95 延迟 < 500ms: ${p95Ok ? `${colors.green}✓ 通过${colors.reset}` : `${colors.red}✗ 未达标${colors.reset}`}`);
  console.log(`  QPS >= 50: ${qpsOk ? `${colors.green}✓ 通过${colors.reset}` : `${colors.red}✗ 未达标${colors.reset}`}`);
  console.log(`  错误率 < 1%: ${errorOk ? `${colors.green}✓ 通过${colors.reset}` : `${colors.red}✗ 未达标${colors.reset}`}`);

  return { stats: s, passed: p95Ok && qpsOk && errorOk };
}

function saveJsonReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    config: CONFIG,
    results: results.map(r => ({
      name: r.name,
      stats: r.stats,
      passed: r.passed,
    })),
  };

  const outputPath = path.join(__dirname, 'load-test-report.json');
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  log('pass', `JSON 报告已保存: ${outputPath}`);
}

function saveHtmlReport(results) {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>律植 压测报告</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px; }
    h2 { color: #666; margin-top: 30px; }
    .scenario { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .passed { color: #4CAF50; font-weight: bold; }
    .failed { color: #f44336; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #4CAF50; color: white; }
    .metric { display: inline-block; margin: 10px 20px 10px 0; }
    .metric-label { color: #666; font-size: 0.9em; }
    .metric-value { font-size: 1.5em; font-weight: bold; color: #333; }
    .summary { background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0; }
  </style>
</head>
<body>
  <h1>律植 (Lvzhi) 压测报告</h1>
  <p>生成时间: ${new Date().toLocaleString('zh-CN')}</p>
  <p>测试配置: 并发 ${CONFIG.CONCURRENCY} | 持续 ${CONFIG.DURATION}s | 目标 ${CONFIG.BASE_URL}</p>

  ${results.map(r => `
    <div class="scenario">
      <h2>${r.name}</h2>
      <div class="${r.passed ? 'passed' : 'failed'}">${r.passed ? '✓ 通过' : '✗ 未达标'}</div>

      <div class="metric">
        <div class="metric-label">总请求数</div>
        <div class="metric-value">${r.stats.totalRequests}</div>
      </div>
      <div class="metric">
        <div class="metric-label">QPS</div>
        <div class="metric-value">${r.stats.qps.toFixed(2)}</div>
      </div>
      <div class="metric">
        <div class="metric-label">错误率</div>
        <div class="metric-value">${r.stats.errorRate}</div>
      </div>

      <h3>延迟统计 (ms)</h3>
      <table>
        <tr><th>指标</th><th>值</th></tr>
        <tr><td>平均</td><td>${r.stats.avg}</td></tr>
        <tr><td>P50</td><td>${r.stats.p50}</td></tr>
        <tr><td>P90</td><td>${r.stats.p90}</td></tr>
        <tr><td>P95</td><td>${r.stats.p95}</td></tr>
        <tr><td>P99</td><td>${r.stats.p99}</td></tr>
        <tr><td>最大</td><td>${r.stats.max}</td></tr>
      </table>

      <h3>状态码分布</h3>
      <table>
        <tr><th>状态码</th><th>数量</th><th>占比</th></tr>
        ${Object.entries(r.stats.statusCodes).map(([code, count]) =>
          `<tr><td>${code}</td><td>${count}</td><td>${(count / r.stats.totalRequests * 100).toFixed(1)}%</td></tr>`
        ).join('')}
      </table>
    </div>
  `).join('')}

  <div class="summary">
    <h2>总结</h2>
    <p>通过: <strong class="passed">${results.filter(r => r.passed).length}</strong> / <strong>${results.length}</strong> 场景</p>
  </div>
</body>
</html>`;

  const outputPath = path.join(__dirname, 'load-test-report.html');
  fs.writeFileSync(outputPath, html);
  log('pass', `HTML 报告已保存: ${outputPath}`);
}

// ============================================
// 主函数
// ============================================

async function main() {
  console.log(`
${colors.bold}╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   律植 (Lvzhi) Node.js 压测脚本                                ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝${colors.reset}
  `);

  console.log(`测试配置:`);
  console.log(`  目标地址: ${CONFIG.BASE_URL}`);
  console.log(`  并发数: ${CONFIG.CONCURRENCY}`);
  console.log(`  持续时间: ${CONFIG.DURATION}s`);
  console.log(`  报告格式: ${CONFIG.REPORT}`);

  // 检查 API 是否可用
  log('info', '检查 API 服务状态...');
  try {
    const res = await httpRequest({ path: '/health' });
    if (res.status === 200) {
      log('pass', `API 服务正常 (${res.latency}ms)`);
    } else {
      log('warn', `API 返回状态码 ${res.status}`);
    }
  } catch (e) {
    log('fail', `无法连接 API 服务: ${e.message}`);
    console.log(`\n请确保 API 服务已启动:`);
    console.log(`  cd apps/api && pnpm dev`);
    process.exit(1);
  }

  // 获取测试 Token
  log('info', '获取测试 Token...');
  const token = await getTestToken();
  if (token) {
    log('pass', '已获取测试 Token');
  } else {
    log('skip', '未获取到 Token，部分场景将跳过');
  }

  // 确定要运行的场景
  const scenarioList = [];
  const scenarioNum = parseInt(CONFIG.SCENARIO);

  if (CONFIG.SCENARIO === 'all' || isNaN(scenarioNum)) {
    for (const [name, fn] of Object.entries(scenarios)) {
      scenarioList.push({ name: name.replace('scenario', '场景$1 '), fn });
    }
  } else if (scenarios[`scenario${scenarioNum}`]) {
    scenarioList.push({
      name: `场景${scenarioNum}`,
      fn: scenarios[`scenario${scenarioNum}`],
    });
  } else {
    log('fail', `未知场景: ${scenarioNum}`);
    console.log(`可用场景: 1-6 或 all`);
    process.exit(1);
  }

  // 运行压测
  console.log(`\n${colors.bold}开始压测...${colors.reset}\n`);

  const results = [];
  const totalStart = Date.now();

  for (const { name, fn } of scenarioList) {
    const stats = await runLoadTest(name, fn, token);
    const result = printReport(name, stats);
    results.push({ name, ...result });
  }

  const totalDuration = (Date.now() - totalStart) / 1000;

  // 总结
  console.log(`\n${colors.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bold}压测完成总结${colors.reset}\n`);

  const passedCount = results.filter(r => r.passed).length;
  console.log(`总耗时: ${totalDuration.toFixed(1)}s`);
  console.log(`通过: ${colors.green}${passedCount}${colors.reset} / ${results.length} 场景`);

  // 保存报告
  if (CONFIG.REPORT === 'json') {
    await saveJsonReport(results);
  } else if (CONFIG.REPORT === 'html') {
    await saveHtmlReport(results);
  }

  console.log(`\n${colors.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  // 退出码
  process.exit(passedCount === results.length ? 0 : 1);
}

main().catch((error) => {
  console.error('压测执行失败:', error);
  process.exit(1);
});
