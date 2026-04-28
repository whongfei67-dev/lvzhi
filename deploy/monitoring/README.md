# 律植 (Lvzhi) 监控仪表盘配置

## 概述

监控仪表盘用于展示：
- 访问量（UV/PV）
- API 请求量与延迟
- AI 调用量与费用
- 错误率与告警
- 数据库连接数
- 支付成功率

## 组件

### 1. Prometheus（指标采集）
- 采集 API 指标
- 采集系统指标
- 采集 AI 调用指标

### 2. Grafana（可视化）
- 预置仪表盘 JSON
- 告警规则

### 3. Loki（日志）
- 日志收集
- 日志查询

## 使用方法

### 启动监控栈
```bash
cd deploy/monitoring
docker-compose up -d
```

### 访问地址
- Grafana: http://localhost:3001 (admin/admin)
- Prometheus: http://localhost:9090
- Loki: http://localhost:3100

### API 指标端点

确保 API 服务暴露以下指标端点：
```bash
curl http://localhost:4000/metrics
```

## 告警规则

告警规则配置在 `alerts/` 目录：

- `api-high-latency.yml` - API 延迟过高 (> 1s)
- `api-error-rate.yml` - 错误率过高 (> 5%)
- `ai-quota-exceeded.yml` - AI 配额超限
- `payment-failed.yml` - 支付失败率过高

## 阿里云集成

### 阿里云 ARMS
```bash
# 部署 ARMS Agent
kubectl apply -f arms-agent.yaml
```

### 阿里云日志服务 SLS
```bash
# 配置日志采集
aliyun log enablelog --project=lvzhi-logs --region=cn-shanghai
```

## 指标列表

| 指标名 | 类型 | 说明 |
|--------|------|------|
| `api_requests_total` | Counter | API 请求总数 |
| `api_request_duration_seconds` | Histogram | 请求延迟分布 |
| `api_errors_total` | Counter | 错误总数 |
| `ai_calls_total` | Counter | AI 调用总数 |
| `ai_call_cost_total` | Counter | AI 调用费用 |
| `payment_amount_total` | Counter | 支付金额 |
| `payment_count_total` | Counter | 支付次数 |
| `db_connections_active` | Gauge | 活跃数据库连接 |
