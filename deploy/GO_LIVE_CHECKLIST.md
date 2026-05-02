# 律植上线打勾清单（控制台执行版）

> 用法：从上到下逐项打勾，未勾项不进入下一阶段。

## A. GitHub 仓库（10 分钟）

- 打开仓库 `Settings -> Secrets and variables -> Actions`
- 新增 `ACR_REGISTRY`
- 新增 `ACR_USERNAME`
- 新增 `ACR_PASSWORD`
- （可选）新增 `ACR_WEB_REPO`（默认 `lvzhi_01/lvzhi`）
- （可选）新增 `ACR_API_REPO`（默认 `lvzhi_01/lvzhi-api`）
- （可选）新增 `ACR_ADMIN_REPO`（默认 `lvzhi_01/lvzhi-admin`）
- （可选）新增 `ACR_NGINX_REPO`（默认 `lvzhi_01/lvzhi-nginx`）
- 新增 `ECS_HOST`
- 新增 `ECS_USER`
- 新增 `ECS_SSH_KEY`
- （可选）新增 `ECS_PORT`
- （可选）新增 `ECS_APP_DIR`
- （可选）新增 `ECS_ENV_FILE`
- 打开 `Settings -> Environments -> production`
- 配置 `Required reviewers`（至少 1 人）
- 限制部署分支为 `main`
- （可选）在 `Settings -> Variables` 新增 `AUTO_ROLLBACK_ON_HEALTH_FAIL=true`（健康检查失败自动回滚）

## B. 阿里云 ECS（20 分钟）

- 登录 ECS
- 安装 Docker 并启动服务
- 创建目录 `/opt/lvzhi`
- 拉取仓库到 `/opt/lvzhi`
- 执行 `cp deploy/.env.template deploy/.env`
- 编辑 `deploy/.env` 填真实生产值
- 确认 `NGINX_HTTP_PORT=80`、`NGINX_HTTPS_PORT=443`
- 执行 `systemctl stop nginx && systemctl disable nginx`（避免占用 80/443）
- 执行 `chmod +x deploy/update-from-registry.sh deploy/update-on-ecs.sh deploy/disk-preflight.sh deploy/docker-cleanup.sh deploy/install-maintenance-cron.sh deploy/rollback-to-previous.sh`
- 验证 `docker compose version` 正常
- 执行 `./deploy/install-maintenance-cron.sh` 安装每日清理任务

## C. 密钥轮换（必须）

- 轮换数据库账号密码（至少业务账号）
- 轮换 `JWT_SECRET`
- 轮换 OSS AccessKey
- 轮换 AI 服务 API Key
- 若已接入支付/短信，轮换相关密钥
- 新密钥仅保存在 ECS `.env` 和 GitHub Secrets

## D. 首次发布（15 分钟）

- 向 `main` 推送一次提交（可只改注释）
- 打开 GitHub Actions，确认 `Aliyun Production Deploy / deploy-production` 成功
- 在 `production` 环境完成人工审批
- 在 ECS 执行：`./deploy/update-on-ecs.sh`
- 在 ECS 验证：`docker compose --env-file deploy/.env ps`
- 健康检查：`curl https://www.lvxzhi.com/api/health`
- 首页检查：`curl -I https://www.lvxzhi.com`
- 后台检查：`curl -I https://www.lvxzhi.com/admin/login`

## E. 回滚演练（必须）

- 确认存在 `/opt/lvzhi/deploy/.history/previous_tag`
- 执行 `./deploy/rollback-to-previous.sh`
- 再次验证 `docker compose --env-file deploy/.env ps`
- 再次验证 API 健康检查
- 记录回滚耗时（目标 < 10 分钟）

## F. 上线后 30 分钟观察

- 观察 5xx 是否异常上升
- 观察 API 平均响应时间
- 抽查登录/核心流程
- 抽查后台审核流程
- 记录本次上线版本和结果

## G. 固定上线动作（每次都执行）

- 提需求：明确目标、范围、验收口径
- 改代码：本地检查通过后提交并推送
- 推部署：执行 `./deploy/update-on-ecs.sh`（避免默认 `--build`）
- 线上核验：容器健康 + 页面链路 + API 状态码 + 磁盘余量

## H. 稳定性与性能 SLI（建议）

- 部署稳定性：连续 7 次发布无 `no space left on device`
- 磁盘水位：部署后根分区空闲 `>= 25%` 且 `>= FREE_GB_MIN`
- 核心可用性：`/` 与 `/admin/login` 返回 `200/302`，`/api/health` 返回 `200`
- 响应指标：关键 API（如 `/api/lawyers`、`/api/admin/data-overview`）P95 下降 20%+

---

关联文档：

- `deploy/PROD_BOOTSTRAP.md`
- `deploy/DEPLOY_GUIDE.md`
- `release-sop.md`