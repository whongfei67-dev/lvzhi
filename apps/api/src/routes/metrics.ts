/**
 * 律植 API 指标端点
 *
 * 暴露 /metrics 端点供 Prometheus 采集
 * 统计 API 请求量、延迟、错误率等指标
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

// 指标存储 (使用简单内存存储，生产环境建议使用 Redis)
interface Metrics {
  requestsTotal: Map<string, number>;
  requestDuration: Map<string, number[]>;
  errorsTotal: Map<string, number>;
  aiCallsTotal: Map<string, number>;
  aiCallCost: number;
  paymentAmount: number;
  paymentCount: Map<string, number>;
}

const metrics: Metrics = {
  requestsTotal: new Map(),
  requestDuration: new Map(),
  errorsTotal: new Map(),
  aiCallsTotal: new Map(),
  aiCallCost: 0,
  paymentAmount: 0,
  paymentCount: new Map(),
};

const HISTOGRAM_BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

/**
 * 记录 API 请求
 */
export function recordRequest(method: string, path: string, statusCode: number, durationMs: number) {
  const key = `${method}_${path}_${statusCode}`;

  // 记录请求总数
  metrics.requestsTotal.set(key, (metrics.requestsTotal.get(key) || 0) + 1);

  // 记录延迟分布
  if (!metrics.requestDuration.has(key)) {
    metrics.requestDuration.set(key, []);
  }
  metrics.requestDuration.get(key)!.push(durationMs);

  // 记录错误
  if (statusCode >= 400) {
    metrics.errorsTotal.set(key, (metrics.errorsTotal.get(key) || 0) + 1);
  }
}

/**
 * 记录 AI 调用
 */
export function recordAICall(provider: string, tokens: number, cost: number, status: 'success' | 'failed' | 'timeout') {
  const key = `${provider}_${status}`;
  metrics.aiCallsTotal.set(key, (metrics.aiCallsTotal.get(key) || 0) + 1);
  metrics.aiCallCost += cost;
}

/**
 * 记录支付
 */
export function recordPayment(channel: string, amount: number, status: 'success' | 'failed') {
  const key = `${channel}_${status}`;
  metrics.paymentCount.set(key, (metrics.paymentCount.get(key) || 0) + 1);
  if (status === 'success') {
    metrics.paymentAmount += amount;
  }
}

/**
 * 计算百分位数
 */
function calculatePercentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * 生成 Prometheus 格式的指标
 */
function generatePrometheusMetrics(): string {
  const lines: string[] = [];

  // HELP 和 TYPE 注释
  lines.push('# HELP api_requests_total Total API requests');
  lines.push('# TYPE api_requests_total counter');

  // API 请求总数
  for (const [key, count] of metrics.requestsTotal.entries()) {
    const [method, path, status] = key.split('_');
    lines.push(`api_requests_total{method="${method}",path="${path}",status="${status}"} ${count}`);
  }

  // API 请求延迟分布
  lines.push('');
  lines.push('# HELP api_request_duration_seconds API request duration in seconds');
  lines.push('# TYPE api_request_duration_seconds histogram');

  for (const [key, values] of metrics.requestDuration.entries()) {
    const [method, path, status] = key.split('_');

    // 计算每个 bucket 的计数
    for (const bucket of HISTOGRAM_BUCKETS) {
      const bucketCount = values.filter(v => v / 1000 <= bucket).length;
      lines.push(`api_request_duration_seconds_bucket{method="${method}",path="${path}",status="${status}",le="${bucket}"} ${bucketCount}`);
    }
    // +Inf bucket
    lines.push(`api_request_duration_seconds_bucket{method="${method}",path="${path}",status="${status}",le="+Inf"} ${values.length}`);

    // 计算 P50, P95, P99
    lines.push(`api_request_duration_seconds_sum{method="${method}",path="${path}",status="${status}"} ${values.reduce((a, b) => a + b, 0) / 1000}`);
    lines.push(`api_request_duration_seconds_count{method="${method}",path="${path}",status="${status}"} ${values.length}`);
  }

  // 错误总数
  lines.push('');
  lines.push('# HELP api_errors_total Total API errors');
  lines.push('# TYPE api_errors_total counter');

  for (const [key, count] of metrics.errorsTotal.entries()) {
    const [method, path, status] = key.split('_');
    lines.push(`api_errors_total{method="${method}",path="${path}",status="${status}"} ${count}`);
  }

  // AI 调用统计
  lines.push('');
  lines.push('# HELP ai_calls_total Total AI calls');
  lines.push('# TYPE ai_calls_total counter');

  for (const [key, count] of metrics.aiCallsTotal.entries()) {
    const [provider, status] = key.split('_');
    lines.push(`ai_calls_total{provider="${provider}",status="${status}"} ${count}`);
  }

  lines.push('');
  lines.push('# HELP ai_call_cost_total Total AI call cost in CNY');
  lines.push('# TYPE ai_call_cost_total counter');
  lines.push(`ai_call_cost_total ${metrics.aiCallCost}`);

  // 支付统计
  lines.push('');
  lines.push('# HELP payment_amount_total Total payment amount in CNY');
  lines.push('# TYPE payment_amount_total counter');
  lines.push(`payment_amount_total ${metrics.paymentAmount}`);

  lines.push('');
  lines.push('# HELP payment_count_total Total payment count');
  lines.push('# TYPE payment_count_total counter');

  for (const [key, count] of metrics.paymentCount.entries()) {
    const [channel, status] = key.split('_');
    lines.push(`payment_count_total{channel="${channel}",status="${status}"} ${count}`);
  }

  return lines.join('\n');
}

/**
 * 注册指标路由
 */
export async function registerMetricsRoutes(app: FastifyInstance) {
  // Prometheus 格式指标端点
  app.get('/metrics', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.header('Content-Type', 'text/plain; charset=utf-8');
    return generatePrometheusMetrics();
  });

  // JSON 格式指标端点（用于调试）
  app.get('/api/metrics', async (request: FastifyRequest, reply: FastifyReply) => {
    const data: Record<string, unknown> = {};

    // 转换 Map 为对象
    data.requestsTotal = Object.fromEntries(metrics.requestsTotal);
    data.errorsTotal = Object.fromEntries(metrics.errorsTotal);
    data.aiCallsTotal = Object.fromEntries(metrics.aiCallsTotal);
    data.paymentCount = Object.fromEntries(metrics.paymentCount);

    data.aiCallCost = metrics.aiCallCost;
    data.paymentAmount = metrics.paymentAmount;

    // 计算延迟百分位数
    const durationStats: Record<string, { p50: number; p95: number; p99: number; count: number }> = {};
    for (const [key, values] of metrics.requestDuration.entries()) {
      if (values.length > 0) {
        durationStats[key] = {
          p50: calculatePercentile(values, 50),
          p95: calculatePercentile(values, 95),
          p99: calculatePercentile(values, 99),
          count: values.length,
        };
      }
    }
    data.durationStats = durationStats;

    return reply.send(data);
  });

  // 重置指标（仅开发环境）
  app.post('/api/metrics/reset', async (request: FastifyRequest, reply: FastifyReply) => {
    if (process.env.NODE_ENV === 'production') {
      return reply.status(403).send({ error: 'Not allowed in production' });
    }

    metrics.requestsTotal.clear();
    metrics.requestDuration.clear();
    metrics.errorsTotal.clear();
    metrics.aiCallsTotal.clear();
    metrics.aiCallCost = 0;
    metrics.paymentAmount = 0;
    metrics.paymentCount.clear();

    return reply.send({ success: true });
  });
}
