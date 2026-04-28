/**
 * 监控仪表盘配置
 * 
 * 支持阿里云 ARMS / Prometheus + Grafana
 * 
 * 使用方法:
 *   1. 导入 JSON 到 Grafana
 *   2. 或导入 YAML 到 Prometheus Alertmanager
 */

import fs from 'fs'
import path from 'path'

const OUTPUT_DIR = path.join(process.cwd(), 'deploy/monitoring')

/**
 * Grafana Dashboard 配置
 */
const grafanaDashboard = {
  title: '律植 (Lvzhi) 监控仪表盘',
  tags: ['lvzhi', 'api', 'frontend'],
  timezone: 'Asia/Shanghai',
  panels: [
    // 访问量
    {
      title: '请求量 (QPS)',
      targets: [
        { expr: 'rate(http_requests_total[5m])', legendFormat: '{{method}} {{path}}' },
      ],
      gridPos: { x: 0, y: 0, w: 12, h: 8 },
    },
    // 响应时间
    {
      title: '响应时间 (P95/P99)',
      targets: [
        { expr: 'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))', legendFormat: 'P95' },
        { expr: 'histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))', legendFormat: 'P99' },
      ],
      gridPos: { x: 12, y: 0, w: 12, h: 8 },
    },
    // 错误率
    {
      title: '错误率',
      targets: [
        { expr: 'rate(http_requests_errors_total[5m]) / rate(http_requests_total[5m])', legendFormat: 'Error Rate' },
      ],
      gridPos: { x: 0, y: 8, w: 8, h: 8 },
    },
    // CPU 使用率
    {
      title: 'CPU 使用率',
      targets: [
        { expr: 'rate(process_cpu_seconds_total[5m]) * 100', legendFormat: 'CPU %' },
      ],
      gridPos: { x: 8, y: 8, w: 8, h: 8 },
    },
    // 内存使用率
    {
      title: '内存使用率',
      targets: [
        { expr: 'process_resident_memory_bytes / 1024 / 1024', legendFormat: 'Memory (MB)' },
      ],
      gridPos: { x: 16, y: 8, w: 8, h: 8 },
    },
    // AI 调用量
    {
      title: 'AI 调用量',
      targets: [
        { expr: 'rate(ai_api_calls_total[5m])', legendFormat: 'AI Calls/s' },
      ],
      gridPos: { x: 0, y: 16, w: 12, h: 8 },
    },
    // AI 成本
    {
      title: 'AI 成本统计',
      targets: [
        { expr: 'rate(ai_cost_total[5m])', legendFormat: 'Cost/s' },
      ],
      gridPos: { x: 12, y: 16, w: 12, h: 8 },
    },
    // 数据库连接
    {
      title: '数据库连接池',
      targets: [
        { expr: 'pg_pool_connections_active', legendFormat: 'Active' },
        { expr: 'pg_pool_connections_idle', legendFormat: 'Idle' },
      ],
      gridPos: { x: 0, y: 24, w: 12, h: 8 },
    },
    // Redis 缓存命中率
    {
      title: 'Redis 缓存命中率',
      targets: [
        { expr: 'rate(redis_hits_total[5m]) / (rate(redis_hits_total[5m]) + rate(redis_misses_total[5m]))', legendFormat: 'Hit Rate' },
      ],
      gridPos: { x: 12, y: 24, w: 12, h: 8 },
    },
  ],
}

/**
 * Prometheus Alert 规则
 */
const prometheusAlerts = {
  groups: [
    {
      name: 'lvzhi-api-alerts',
      rules: [
        {
          alert: 'HighErrorRate',
          expr: 'rate(http_requests_errors_total[5m]) / rate(http_requests_total[5m]) > 0.01',
          for: '5m',
          labels: { severity: 'critical' },
          annotations: {
            summary: 'API 错误率超过 1%',
            description: '当前错误率: {{ $value }}',
          },
        },
        {
          alert: 'HighLatency',
          expr: 'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.5',
          for: '5m',
          labels: { severity: 'warning' },
          annotations: {
            summary: 'P95 响应时间超过 500ms',
            description: '当前 P95: {{ $value }}s',
          },
        },
        {
          alert: 'APIUnavailable',
          expr: 'up{job="lvzhi-api"} == 0',
          for: '1m',
          labels: { severity: 'critical' },
          annotations: {
            summary: 'API 服务不可用',
            description: 'API 服务已停止响应',
          },
        },
        {
          alert: 'HighMemoryUsage',
          expr: 'process_resident_memory_bytes / 1024 / 1024 / 1024 > 0.8',
          for: '10m',
          labels: { severity: 'warning' },
          annotations: {
            summary: '内存使用率超过 80%',
            description: '当前使用: {{ $value }} GB',
          },
        },
        {
          alert: 'HighCPUUsage',
          expr: 'rate(process_cpu_seconds_total[5m]) > 0.8',
          for: '10m',
          labels: { severity: 'warning' },
          annotations: {
            summary: 'CPU 使用率超过 80%',
            description: '当前使用率: {{ $value }}',
          },
        },
        {
          alert: 'DatabaseConnectionPoolExhausted',
          expr: 'pg_pool_connections_active / pg_pool_connections_max > 0.9',
          for: '5m',
          labels: { severity: 'critical' },
          annotations: {
            summary: '数据库连接池即将耗尽',
            description: '当前活跃连接: {{ $value }}',
          },
        },
        {
          alert: 'AICostSpike',
          expr: 'rate(ai_cost_total[5m]) > 100',
          for: '5m',
          labels: { severity: 'warning' },
          annotations: {
            summary: 'AI 成本异常增加',
            description: '当前成本速率: ¥{{ $value }}/s',
          },
        },
      ],
    },
  ],
}

/**
 * Grafana Datasource 配置
 */
const grafanaDatasources = [
  {
    name: 'Prometheus',
    type: 'prometheus',
    access: 'proxy',
    url: process.env.PROMETHEUS_URL || 'http://localhost:9090',
    isDefault: true,
  },
  {
    name: '阿里云 ARMS',
    type: 'prometheus',
    access: 'proxy',
    url: process.env.ARMS_PROMETHEUS_URL || 'http://localhost:8008',
  },
]

/**
 * 生成配置文件
 */
async function generateConfigs() {
  console.log('📊 正在生成监控配置...')
  
  // 确保目录存在
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  
  // 保存 Grafana Dashboard
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'grafana-dashboard.json'),
    JSON.stringify(grafanaDashboard, null, 2)
  )
  console.log(`✅ Grafana Dashboard: ${OUTPUT_DIR}/grafana-dashboard.json`)
  
  // 保存 Prometheus Alerts
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'prometheus-alerts.yml'),
    yamlStringify(prometheusAlerts)
  )
  console.log(`✅ Prometheus Alerts: ${OUTPUT_DIR}/prometheus-alerts.yml`)
  
  // 保存 Datasources
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'grafana-datasources.json'),
    JSON.stringify(grafanaDatasources, null, 2)
  )
  console.log(`✅ Grafana Datasources: ${OUTPUT_DIR}/grafana-datasources.json`)
  
  // 生成部署说明
  const deploymentGuide = `# 监控配置部署指南

## 前置条件

1. 已安装 Prometheus + Grafana
2. 或使用阿里云 ARMS

## Prometheus 配置

1. 将 \`prometheus-alerts.yml\` 复制到 Prometheus 配置目录

\`\`\`yaml
# prometheus.yml
rule_files:
  - "prometheus-alerts.yml"
\`\`\`

2. 重启 Prometheus

\`\`\`bash
docker-compose restart prometheus
\`\`\`

## Grafana 配置

1. 添加 Prometheus Datasource
   - 导入 \`grafana-datasources.json\`

2. 导入 Dashboard
   - 导入 \`grafana-dashboard.json\`

## 阿里云 ARMS

1. 登录阿里云 ARMS 控制台
2. 创建 Prometheus 实例
3. 配置服务发现
4. 导入 Dashboard JSON

## 告警通知配置

### 邮件通知
\`\`\`yaml
# alertmanager.yml
receivers:
  - name: 'email'
    email_configs:
      - to: 'admin@lvzhi.com'
\`\`\`

### 钉钉通知
\`\`\`yaml
  - name: 'dingtalk'
    dingtalk_configs:
      - webhook_url: 'https://oapi.dingtalk.com/robot/send?access_token=xxx'
\`\`\`

### Slack 通知
\`\`\`yaml
  - name: 'slack'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/xxx'
\`\`\`
`

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'DEPLOYMENT_GUIDE.md'),
    deploymentGuide
  )
  console.log(`✅ 部署指南: ${OUTPUT_DIR}/DEPLOYMENT_GUIDE.md`)
}

/**
 * 简单的 YAML 序列化
 */
function yamlStringify(obj, indent = 0) {
  const spaces = '  '.repeat(indent)
  let result = ''
  
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue
    
    if (Array.isArray(value)) {
      result += `${spaces}${key}:\n`
      for (const item of value) {
        result += `${spaces}  - ${yamlStringifyObject(item, indent + 1)}`
      }
    } else if (typeof value === 'object') {
      result += `${spaces}${key}:\n${yamlStringify(value, indent + 1)}`
    } else {
      result += `${spaces}${key}: ${value}\n`
    }
  }
  
  return result
}

function yamlStringifyObject(obj, indent) {
  const spaces = '  '.repeat(indent)
  const entries = Object.entries(obj)
  
  if (entries.length === 0) return '{}\n'
  
  let result = ''
  for (const [key, value] of entries) {
    if (typeof value === 'object') {
      result += `${spaces}${key}:\n${yamlStringifyObject(value, indent + 1)}`
    } else {
      result += `${spaces}${key}: ${value}\n`
    }
  }
  return result
}

/**
 * 主函数
 */
async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗')
  console.log('║           律植 (Lvzhi) 监控配置生成器                         ║')
  console.log('╚═══════════════════════════════════════════════════════════════╝')
  
  await generateConfigs()
  
  console.log('\n╔═══════════════════════════════════════════════════════════════╗')
  console.log('║                   配置生成完成!                                 ║')
  console.log('╚═══════════════════════════════════════════════════════════════╝')
}

main().catch(console.error)
