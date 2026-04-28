# 律植 (Lvzhi) 压测工具安装与使用指南

## 安装 k6

### macOS
```bash
brew install k6
```

### Linux
```bash
sudo gpg --krecv-keys 379CE192D401AB61
sudo gpg --armor --export 379CE192D401AB61 | sudo tee /etc/apt/trusted.gpg.d/k6-archive-keyring.gpg >/dev/null
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt update
sudo apt install k6
```

### Windows
使用 [Chocolatey](https://chocolatey.org/):
```powershell
choco install k6
```

或下载安装包: https://github.com/grafana/k6/releases

## 验证安装
```bash
k6 version
```

## 压测准备

### 1. 启动 API 服务
```bash
cd apps/api
pnpm dev
```

### 2. 生成测试数据
```bash
cd apps/api/load-test
node prepare-data.js
```

这会生成:
- 30 个测试账号 (admin/creator/seeker 各 10 个)
- 100 个测试智能体
- 200 个测试帖子

### 3. 运行压测

#### 运行所有场景
```bash
k6 run scenarios.js --env BASE_URL=http://localhost:4000
```

#### 运行指定场景
```bash
# 场景1: 首页 + 智能体列表 (500并发)
k6 run scenarios.js --env BASE_URL=http://localhost:4000 \
  --tags scenario=home_agents \
  --skip-scenario-errors

# 场景2: AI 对话 (50并发)
k6 run scenarios.js --env BASE_URL=http://localhost:4000 \
  --tags scenario=ai_chat \
  --skip-scenario-errors

# 场景3: 登录防刷测试
k6 run scenarios.js --env BASE_URL=http://localhost:4000 \
  --tags scenario=login_rapid \
  --skip-scenario-errors

# 场景4: 支付接口 (100并发)
k6 run scenarios.js --env BASE_URL=http://localhost:4000 \
  --tags scenario=payment \
  --skip-scenario-errors
```

#### 使用测试数据
```bash
k6 run scenarios.js \
  --env BASE_URL=http://localhost:4000 \
  --env TEST_USERS='[{"email":"test@test.com","role":"admin","token":"xxx"}]'
```

## 压测配置

编辑 `config.js` 修改压测参数:

```javascript
export const options = {
  scenarios: {
    // 修改并发数
    home_and_agents: {
      stages: [
        { duration: '30s', target: 500 },  // 改为 500 并发
      ],
    },
  },
}
```

## 性能目标

| 指标 | 目标值 | 压测场景 |
|------|--------|----------|
| QPS (API) | ≥ 500 | 场景1 |
| QPS (AI 对话) | ≥ 50 | 场景2 |
| P95 延迟 | ≤ 500ms | 所有场景 |
| P99 延迟 | ≤ 2s | 所有场景 |
| 错误率 | ≤ 1% | 所有场景 |

## 输出格式

### HTML 报告
```bash
k6 run scenarios.js --out html=report.html
```

### JSON 结果
```bash
k6 run scenarios.js --out json=results.json
```

### InfluxDB + Grafana
```bash
# 启动 InfluxDB
docker run -d --name k6-influxdb -p 8086:8086 influxdb:2.0

# 运行压测并发送到 InfluxDB
k6 run scenarios.js \
  --out influxdb=http://localhost:8086/k6
```

## 常见问题

### Q: k6 报 connection refused
确保 API 服务已启动:
```bash
curl http://localhost:4000/health
```

### Q: 登录测试一直 429
这是正常的，说明 Rate Limit 生效了。k6 会自动检测并记录。

### Q: 如何限制压测时长?
```bash
k6 run scenarios.js --duration 60s
```

## 相关文档

- k6 官方文档: https://k6.io/docs/
- k6 JavaScript API: https://k6.io/docs/javascript-api/
- Grafana k6: https://grafana.com/docs/grafana-cloud/k6/
