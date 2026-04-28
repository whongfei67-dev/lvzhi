# 律植部署指南

## 环境要求

| 项目 | 要求 |
|------|------|
| Node.js | >= 18.0.0 |
| npm/pnpm | pnpm 10.16.1+ |
| PostgreSQL | 阿里云 PolarDB |
| 服务器内存 | >= 2GB |

---

## 第一步：本地打包

### 1.1 配置环境变量

修改 `deploy/.env` 文件，确认数据库连接信息：

```env
# 数据库
DATABASE_URL=postgresql://<db_user>:<db_password>@<polardb_private_host>:5432/<db_name>

# API 地址（部署后修改为正式域名）
NEXT_PUBLIC_API_URL=http://你的服务器IP:3001
```

### 1.2 执行打包

```bash
cd 律植项目

# 安装依赖
pnpm install

# 构建项目
pnpm build:web
pnpm build:api

# 打包（手动方式）
mkdir -p deploy-package/{web,api,config}
cp -r apps/web/.next deploy-package/web/
cp -r apps/api/dist deploy-package/api/
cp deploy/.env deploy-package/config/.env

# 创建打包脚本
cat > deploy-package/deploy.sh << 'EOF'
#!/bin/bash
# 服务器部署脚本
EOF

tar -czvf lvzhi_deploy.tar.gz -C deploy-package .
```

---

## 第二步：上传到服务器

```bash
# 上传打包文件
scp lvzhi_deploy.tar.gz root@你的服务器IP:/root/

# SSH 登录服务器
ssh root@你的服务器IP
```

---

## 第三步：服务器配置

### 3.1 安装 Node.js（如果未安装）

```bash
# 使用 nvm 安装
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
nvm alias default 20

# 验证
node -v  # 应该显示 v20.x.x
npm -v
```

### 3.2 安装 PM2

```bash
npm install -g pm2
pm2 install pm2-logrotate
```

### 3.3 创建应用目录

```bash
# 创建目录
mkdir -p /root/lvzhi
mkdir -p /root/lvzhi-backup

# 解压
cd /root
tar -xzvf lvzhi_deploy.tar.gz -C /root/lvzhi
```

---

## 第四步：配置环境变量

```bash
cd /root/lvzhi

# API 环境变量
cat > api/.env << 'EOF'
NODE_ENV=production
PORT=3001

# 数据库
DATABASE_URL=postgresql://<db_user>:<db_password>@<polardb_private_host>:5432/<db_name>

# JWT
JWT_SECRET=replace_with_32_chars_min_secret

# 允许的源（修改为你的域名）
ALLOWED_ORIGINS=http://你的服务器IP:3000
EOF

# Web 环境变量
cat > web/.env.production.local << 'EOF'
NEXT_PUBLIC_API_URL=http://你的服务器IP:3001
EOF
```

---

## 第五步：安装依赖

```bash
cd /root/lvzhi/api
npm install --production

cd /root/lvzhi/web
npm install --production
```

---

## 第六步：配置 PM2

将 `deploy/ecosystem.config.js` 复制到 `/root/lvzhi/ecosystem.config.js`

```bash
cp /root/lvzhi/config/ecosystem.config.js /root/lvzhi/ecosystem.config.js
```

或手动创建：

```bash
cat > /root/lvzhi/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'lvzhi-api',
      script: 'dist/index.js',
      cwd: '/root/lvzhi/api',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/root/.pm2/logs/lvzhi-api-error.log',
      out_file: '/root/.pm2/logs/lvzhi-api-out.log',
      max_memory_restart: '500M',
      autorestart: true
    },
    {
      name: 'lvzhi-web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      cwd: '/root/lvzhi/web',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/root/.pm2/logs/lvzhi-web-error.log',
      out_file: '/root/.pm2/logs/lvzhi-web-out.log',
      max_memory_restart: '1G',
      autorestart: true
    }
  ]
};
EOF
```

---

## 第七步：启动服务

```bash
cd /root/lvzhi

# 启动服务
pm2 start ecosystem.config.js

# 保存进程列表
pm2 save

# 设置开机自启
pm2 startup
```

---

## 第八步：配置 Nginx

### 测试环境

```bash
# 复制 nginx 配置
cp /path/to/nginx-lvzhi-test.conf /etc/nginx/conf.d/lvzhi.conf

# 修改 server_name
sed -i 's/lvzhi-test.yourdomain.com/你的测试域名/g' /etc/nginx/conf.d/lvzhi.conf

# 测试并重载
nginx -t
nginx -s reload
```

### 生产环境

```bash
# 申请 SSL 证书（使用 Let's Encrypt）
certbot --nginx -d www.lvxzhi.com -d lvxzhi.com

# 或使用阿里云证书，将证书放到 /etc/nginx/ssl/
# lvzhi.crt
# lvzhi.key

# 复制配置
cp /path/to/nginx-lvzhi-prod.conf /etc/nginx/conf.d/lvzhi.conf

# 修改为你的正式域名
sed -i 's/www.lvxzhi.com/你的正式域名/g' /etc/nginx/conf.d/lvzhi.conf

# 测试并重载
nginx -t
nginx -s reload
```

---

## 第九步：验证部署

### 本地测试

```bash
# 测试 API
curl http://localhost:3001/health

# 测试 Web
curl http://localhost:3000
```

### 浏览器访问

- 测试环境：`http://你的服务器IP`
- 生产环境：`https://你的域名`

---

## 常用运维命令

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs lvzhi-api   # API 日志
pm2 logs lvzhi-web   # Web 日志

# 重启服务
pm2 restart lvzhi-api
pm2 restart lvzhi-web
pm2 restart all      # 重启所有

# 停止服务
pm2 stop all

# 查看资源使用
pm2 monit

# 查看详细信息
pm2 show lvzhi-api
pm2 show lvzhi-web
```

---

## 更新部署

### 推荐：GitHub Actions 自动发布（含人工审批）

仓库已提供工作流：`.github/workflows/aliyun-prod-deploy.yml`

1. 推送 `main` 后自动构建并推送镜像到 ACR
2. 在 GitHub `production` 环境人工审批
3. 审批后通过 SSH 到 ECS 执行：

```bash
/opt/lvzhi/deploy/update-from-registry.sh <commit_sha>
```

4. 如需回滚：

```bash
/opt/lvzhi/deploy/rollback-to-previous.sh
```

> 首次接入请在 GitHub Secrets 配置：`ACR_REGISTRY`、`ACR_USERNAME`、`ACR_PASSWORD`、`ECS_HOST`、`ECS_USER`、`ECS_SSH_KEY`、`ECS_APP_DIR`（可选）和 `ECS_ENV_FILE`（可选）。

```bash
# 1. 本地重新打包
# 2. 上传到服务器
scp lvzhi_deploy.tar.gz root@你的服务器IP:/root/

# 3. SSH 登录并部署
ssh root@你的服务器IP

# 4. 备份
cp -r /root/lvzhi /root/lvzhi-backup/$(date +%Y%m%d_%H%M%S)

# 5. 解压新版本
rm -rf /root/lvzhi
tar -xzvf lvzhi_deploy.tar.gz -C /root

# 6. 重启
cd /root/lvzhi
pm2 restart all
```

---

## 故障排查

### 服务无法启动

```bash
# 查看详细错误
pm2 logs lvzhi-api --err --lines 50

# 手动启动测试
cd /root/lvzhi/api
node dist/index.js
```

### 数据库连接失败

```bash
# 测试数据库连接
psql "postgresql://<db_user>:<db_password>@<polardb_private_host>:5432/<db_name>"

# 检查防火墙
firewall-cmd --list-ports
```

### 端口被占用

```bash
# 查看端口占用
lsof -i :3000
lsof -i :3001

# 杀掉进程
kill -9 <PID>
```

---

## 文件清单

| 文件 | 位置 | 说明 |
|------|------|------|
| deploy/ecosystem.config.js | /root/lvzhi/ | PM2 配置 |
| deploy/nginx-lvzhi-test.conf | /etc/nginx/conf.d/ | 测试环境 Nginx |
| deploy/nginx-lvzhi-prod.conf | /etc/nginx/conf.d/ | 生产环境 Nginx |
| deploy/.env | /root/lvzhi/config/ | 环境变量备份 |

---

## 联系支持

如有问题，请提供：
1. `pm2 logs` 输出
2. `pm2 status` 输出
3. Nginx 错误日志：`/var/log/nginx/lvzhi-error.log`

---

## 推荐读取

- 初始化发布与 Secrets 配置：`deploy/PROD_BOOTSTRAP.md`
