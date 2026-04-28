# 数据库迁移 & 服务重启指南

## 一、执行数据库迁移

### 方法1：使用脚本（推荐）

```bash
cd /Users/wanghongfei/Desktop/智能体项目/律植项目
chmod +x scripts/run-migrations.sh
./scripts/run-migrations.sh <你的数据库密码>
```

### 方法2：手动执行 SQL

```bash
# 先设置密码环境变量
export PGPASSWORD="你的数据库密码"

# 然后依次执行
psql -h lvzhi-prod.pg.polardb.rds.aliyuncs.com -p 5432 -U mamba_01 -d data01 \
  -f supabase/migrations/018_trial_invitations.sql

psql -h lvzhi-prod.pg.polardb.rds.aliyuncs.com -p 5432 -U mamba_01 -d data01 \
  -f supabase/migrations/019_ip_protection.sql

psql -h lvzhi-prod.pg.polardb.rds.aliyuncs.com -p 5432 -U mamba_01 -d data01 \
  -f supabase/migrations/020_lawyer_verification.sql
```

---

## 二、重启后端服务

### 查看当前运行状态

```bash
# 查看正在运行的进程
ps aux | grep "node.*api" | grep -v grep
```

### 重启方式

#### 方式1：PM2（如果使用 PM2 管理）

```bash
cd /Users/wanghongfei/Desktop/智能体项目/律植项目/apps/api

# 重启
pm2 restart api

# 查看日志
pm2 logs api

# 监控状态
pm2 monit
```

#### 方式2：直接在终端运行

```bash
cd /Users/wanghongfei/Desktop/智能体项目/律植项目/apps/api

# 停止当前服务（Ctrl+C）

# 重新启动
pnpm dev
# 或
pnpm start  # 生产模式
```

#### 方式3：Docker（如果使用 Docker）

```bash
# 重新构建并启动
docker-compose up -d --force-recreate api

# 查看日志
docker-compose logs -f api
```

---

## 三、验证迁移是否成功

迁移完成后，可以验证表是否创建成功：

```bash
export PGPASSWORD="你的数据库密码"

# 连接数据库
psql -h lvzhi-prod.pg.polardb.rds.aliyuncs.com -p 5432 -U mamba_01 -d data01

# 在 psql 中执行
\d trial_invitations
\d ip_protection_applications
\d lawyer_verification_applications

# 如果看到表结构说明创建成功
\q  # 退出
```

---

## 四、常见问题

### 1. 密码输入错误
```
psql: error: connection to server failed: FATAL: password authentication failed
```
→ 请确认数据库密码正确

### 2. 表已存在
```
ERROR: relation "trial_invitations" already exists
```
→ 这不是错误，说明表已经存在，可以忽略或使用 `IF NOT EXISTS`

### 3. 后端启动失败
```bash
# 查看具体错误
cd apps/api && pnpm dev 2>&1

# 常见问题：
# - 端口被占用：lsof -i :4000 或 :3001
# - 环境变量缺失：检查 .env 文件
# - 模块未找到：pnpm install
```
