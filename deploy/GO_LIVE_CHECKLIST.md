# 律植上线打勾清单（控制台执行版）

> 用法：从上到下逐项打勾，未勾项不进入下一阶段。

## A. GitHub 仓库（10 分钟）

- 打开仓库 `Settings -> Secrets and variables -> Actions`
- 新增 `ACR_REGISTRY`
- 新增 `ACR_USERNAME`
- 新增 `ACR_PASSWORD`
- 新增 `ECS_HOST`
- 新增 `ECS_USER`
- 新增 `ECS_SSH_KEY`
- （可选）新增 `ECS_PORT`
- （可选）新增 `ECS_APP_DIR`
- （可选）新增 `ECS_ENV_FILE`
- 打开 `Settings -> Environments -> production`
- 配置 `Required reviewers`（至少 1 人）
- 限制部署分支为 `main`

## B. 阿里云 ECS（20 分钟）

- 登录 ECS
- 安装 Docker 并启动服务
- 创建目录 `/opt/lvzhi`
- 拉取仓库到 `/opt/lvzhi`
- 执行 `cp deploy/.env.template deploy/.env`
- 编辑 `deploy/.env` 填真实生产值
- 确认 `NGINX_HTTP_PORT=80`、`NGINX_HTTPS_PORT=443`
- 执行 `systemctl stop nginx && systemctl disable nginx`（避免占用 80/443）
- 执行 `chmod +x deploy/update-from-registry.sh deploy/rollback-to-previous.sh`
- 验证 `docker compose version` 正常

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
- 在 ECS 执行：`docker compose --env-file deploy/.env ps`
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

---

关联文档：

- `deploy/PROD_BOOTSTRAP.md`
- `deploy/DEPLOY_GUIDE.md`
- `release-sop.md`