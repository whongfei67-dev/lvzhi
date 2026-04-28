# ============================================
# 律植 - 腾讯云部署配置
# CVM + COS + CDB + Lighthouse
# ============================================

# ============================================
# 方案 A: Docker Compose 部署到 CVM
# ============================================

# 腾讯云 CVM 实例推荐配置
# ----------------------------------------
# 测试环境: 轻量应用服务器 2核2G ~ 60元/月
# 生产环境: CVM S5.MEDIUM4 (2核4G) ~ 100元/月
# 高可用环境: CVM S5.2XLARGE16 (8核16G) + CLB ~ 400元/月

# 腾讯云 CVM 部署脚本
#!/bin/bash
# deploy-to-cvm.sh

set -e

# 变量配置
APP_DIR="/opt/lvzhi"
DOMAIN="your-domain.cn"

echo "===== 律植部署脚本 - 腾讯云 CVM ====="

# 1. 安装 Docker
if ! command -v docker &> /dev/null; then
    echo "[1/6] 安装 Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

# 2. 安装 Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "[2/6] 安装 Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# 3. 安装 Nginx
if ! command -v nginx &> /dev/null; then
    echo "[3/6] 安装 Nginx..."
    yum install -y nginx  # CentOS
    # apt-get install -y nginx  # Ubuntu
fi

# 4. 创建应用目录
echo "[4/6] 创建应用目录..."
mkdir -p $APP_DIR
cd $APP_DIR

# 5. 克隆或更新代码
if [ -d ".git" ]; then
    echo "[5/6] 更新代码..."
    git pull
else
    echo "[5/6] 克隆代码..."
    git clone https://github.com/your-repo/lvzhi.git .
fi

# 6. 配置并启动
echo "[6/6] 启动服务..."
cp deploy/env.example .env
echo "请编辑 $APP_DIR/.env 文件配置环境变量"
nano $APP_DIR/.env

# 启动服务
docker-compose -f docker-compose.yml up -d --build

# 配置 Nginx
cp deploy/nginx.conf /etc/nginx/conf.d/lvzhi.conf
nginx -t && systemctl reload nginx

echo "===== 部署完成 ====="


# ============================================
# 方案 B: 腾讯云 TKE (Kubernetes) 部署
# ============================================

apiVersion: apps/v1
kind: Deployment
metadata:
  name: lvzhi-web
  namespace: lvzhi
spec:
  replicas: 2
  selector:
    matchLabels:
      app: lvzhi-web
  template:
    metadata:
      labels:
        app: lvzhi-web
    spec:
      containers:
        - name: web
          image: ccr.ccs.tencentyun.com/your-namespace/lvzhi-web:latest
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: "production"
            - name: NEXT_PUBLIC_API_URL
              value: "http://lvzhi-api:3001"
          resources:
            requests:
              cpu: 250m
              memory: 512Mi
            limits:
              cpu: 1000m
              memory: 1Gi
          livenessProbe:
            httpGet:
              path: /
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: lvzhi-api
  namespace: lvzhi
spec:
  replicas: 2
  selector:
    matchLabels:
      app: lvzhi-api
  template:
    metadata:
      labels:
        app: lvzhi-api
    spec:
      containers:
        - name: api
          image: ccr.ccs.tencentyun.com/your-namespace/lvzhi-api:latest
          ports:
            - containerPort: 3001
          env:
            - name: NODE_ENV
              value: "production"
            - name: PORT
              value: "3001"

---
apiVersion: v1
kind: Service
metadata:
  name: lvzhi-web-svc
  namespace: lvzhi
spec:
  type: ClusterIP
  ports:
    - port: 80
      targetPort: 3000
  selector:
    app: lvzhi-web

---
apiVersion: v1
kind: Service
metadata:
  name: lvzhi-api-svc
  namespace: lvzhi
spec:
  type: ClusterIP
  ports:
    - port: 80
      targetPort: 3001
  selector:
    app: lvzhi-api


# ============================================
# 方案 C: 腾讯云 COS + CDN 静态部署
# ============================================

# 1. 构建
pnpm --filter web build

# 2. 上传到 COS
coscli cp -r apps/web/out/ cos://lvzhi-assets-123456789.ap-guangzhou.myqcloud.com/ \
  --secret-id $TENCENT_SECRET_ID \
  --secret-key $TENCENT_SECRET_KEY

# 3. 配置 CDN
# 腾讯云 CDN 控制台添加加速域名
# 源站类型: COS 源站
# 加速域名为 your-domain.cn

# 4. 配置 SSL
# CDN 控制台 HTTPS 配置


# ============================================
# 腾讯云必做安全配置
# ============================================

# 1. 安全组规则
# ----------------------------------------
# 入方向:
# - 80/tcp (HTTP)
# - 443/tcp (HTTPS)
# - 22/tcp (SSH, 仅限指定 IP)
#
# 出方向:
# - 全部放行

# 2. 云数据库 CDB 安全
# ----------------------------------------
# - 开启 SSL 连接
# - 设置白名单 IP
# - 开启自动备份
# - 配置主从复制（高可用）

# 3. 对象存储 COS 安全
# ----------------------------------------
# - 设置防盗链
# - 配置 Bucket 策略
# - 开启服务端加密
# - 配置生命周期规则

# 4. 监控告警
# ----------------------------------------
# 云监控配置:
# - CPU 使用率 > 80%
# - 内存使用率 > 85%
# - 磁盘使用率 > 80%
# - HTTP 错误率 > 1%
# - 响应时间 > 3s


# ============================================
# 腾讯云数据库迁移指南
# ============================================

# 从 Docker PostgreSQL 迁移到腾讯云 CDB
# 1. 导出数据
pg_dump -h localhost -U lvzhi -d lvzhi > backup.sql

# 2. 导入到 CDB
psql -h cdbsql-tencent.cloud.tencent.com -U lvzhi -d lvzhi < backup.sql

# 3. 更新环境变量
# DATABASE_URL=postgresql://lvzhi:password@cdbsql-tencent.cloud.tencent.com:5432/lvzhi
