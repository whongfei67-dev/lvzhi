# 律植生产发布初始化手册

> 目标：完成 GitHub 自动发布到阿里云 ECS 的一次可回滚上线。

## 1) GitHub Secrets 清单（必须）

在仓库 `Settings -> Secrets and variables -> Actions` 中新增：

- `ACR_REGISTRY`：例如 `crpi-xxxx.cn-shanghai.personal.cr.aliyuncs.com`
- `ACR_USERNAME`：阿里云容器镜像仓库账号
- `ACR_PASSWORD`：阿里云容器镜像仓库密码/令牌
- `ECS_HOST`：ECS 公网 IP 或可达域名
- `ECS_USER`：登录用户（建议非 root，具备 docker 权限）
- `ECS_SSH_KEY`：私钥内容（PEM）
- `ECS_PORT`：可选，默认 `22`
- `ECS_APP_DIR`：可选，默认 `/opt/lvzhi`
- `ECS_ENV_FILE`：可选，例如 `/opt/lvzhi/deploy/.env`

建议额外在 `Settings -> Environments -> production`：

- 开启 Required reviewers（至少 1 人）
- 限制允许部署的分支为 `main`

这样可以实现“自动构建 + 人工审批后部署”。

## 2) ECS 首次初始化命令

以下命令在 ECS 执行（Ubuntu 示例）：

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl git

# 安装 Docker
curl -fsSL https://get.docker.com | sudo sh
sudo systemctl enable docker
sudo systemctl start docker

# 创建目录
sudo mkdir -p /opt/lvzhi
sudo chown -R "$USER":"$USER" /opt/lvzhi
cd /opt/lvzhi

# 拉取仓库（替换为你的真实仓库）
git clone <your-repo-url> .

# 初始化环境文件
cp deploy/.env.template deploy/.env
```

然后编辑 `deploy/.env` 填写真实值，重点是：

- `DATABASE_URL`（建议 PolarDB/RDS 内网地址）
- `POSTGRES_*` / `REDIS_*`
- `JWT_SECRET`（至少 32 位随机串）
- `ALIYUN_OSS_*`
- `MINIMAX_API_KEY`（或你实际使用的模型服务密钥）
- `ALLOWED_ORIGINS=https://www.lvxzhi.com,https://lvxzhi.com`

## 3) 强制密钥轮换清单（本次必须执行）

因为历史配置已出现过明文，建议立即轮换：

- 数据库账号密码（至少应用账号）
- `JWT_SECRET`
- OSS `AccessKey`
- AI 平台 `API Key`
- 任何第三方支付/短信密钥（如已接入）

轮换后仅保存在：

- ECS 的 `deploy/.env`
- GitHub Secrets

不要再写入仓库文件。

## 4) 首次发布演练（建议 10 分钟内完成）

1. 推送一次 `main`（可仅改注释）
2. 观察 GitHub Action：
   - `build-and-push` 成功
   - 进入 `production` 审批
3. 人工审批后执行部署
4. 在 ECS 验证：

```bash
cd /opt/lvzhi
docker compose --env-file deploy/.env ps
curl -I https://www.lvxzhi.com
curl https://www.lvxzhi.com/api/health
```

5. 检查回滚点是否生成：

```bash
cat /opt/lvzhi/deploy/.history/previous_tag
```

## 5) 一键回滚演练（必须至少跑一次）

```bash
cd /opt/lvzhi
./deploy/rollback-to-previous.sh
docker compose --env-file deploy/.env ps
```

若回滚后健康检查恢复，说明发布链路具备止损能力。

## 6) 常见问题排查

- Action 构建成功但部署失败：优先检查 `ECS_SSH_KEY`、`ECS_USER`、`ECS_HOST`、防火墙 22 端口。
- ECS 拉镜像失败：检查 `ACR_REGISTRY/ACR_USERNAME/ACR_PASSWORD` 和镜像命名空间权限。
- 容器起不来：`docker compose --env-file deploy/.env logs -f api web nginx`
- API 500：优先核对 `DATABASE_URL`、数据库白名单、VPC 网络连通。

---

## 快速执行清单

如需“只看步骤不看解释”，直接使用：`deploy/GO_LIVE_CHECKLIST.md`
