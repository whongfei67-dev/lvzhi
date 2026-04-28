# ============================================
# 律植 - 阿里云部署配置
# ECS + ACK (Kubernetes) + OSS + RDS
# ============================================

# ============================================
# 方案 A: Docker Compose 部署到 ECS
# ============================================

# 阿里云 ECS 实例推荐配置
# ----------------------------------------
# 测试环境: ecs.c6.large (2核4G) ~ 100元/月
# 生产环境: ecs.c7.xlarge (4核8G) ~ 200元/月
# 高可用环境: ecs.g7.2xlarge (8核32G) + SLB ~ 500元/月

# 阿里云 ECS 部署步骤:
# 1. 购买 ECS 实例 (选择 CentOS 8 / Ubuntu 22.04)
# 2. 安装 Docker 和 Docker Compose
# 3. 配置安全组 (开放 80, 443 端口)
# 4. 克隆代码并配置环境变量
# 5. 执行 docker-compose up -d

# ECS 初始化脚本
#!/bin/bash
# deploy-to-ecs.sh

set -e

# 变量配置
APP_DIR="/opt/lvzhi"
DOMAIN="your-domain.cn"

echo "===== 律植部署脚本 - 阿里云 ECS ====="

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

# 3. 安装 Nginx (用于反向代理)
if ! command -v nginx &> /dev/null; then
    echo "[3/6] 安装 Nginx..."
    apt-get update && apt-get install -y nginx
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
# 编辑 .env 文件填入实际配置
echo "请编辑 $APP_DIR/.env 文件配置环境变量"
nano $APP_DIR/.env

# 启动服务
docker-compose -f docker-compose.yml up -d --build

# 配置 Nginx
cp deploy/nginx.conf /etc/nginx/conf.d/lvzhi.conf
nginx -t && systemctl reload nginx

echo "===== 部署完成 ====="
echo "访问 http://your-ecs-ip 检查服务状态"
echo "配置域名后修改 Nginx 配置启用 HTTPS"


# ============================================
# 方案 B: 阿里云 ACK (Kubernetes) 部署
# ============================================

# 创建 ACK 集群后使用以下配置

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
          image: registry.cn-hangzhou.aliyuncs.com/your-namespace/lvzhi-web:latest
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
          readinessProbe:
            httpGet:
              path: /
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5

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
          image: registry.cn-hangzhou.aliyuncs.com/your-namespace/lvzhi-api:latest
          ports:
            - containerPort: 3001
          env:
            - name: NODE_ENV
              value: "production"
            - name: PORT
              value: "3001"
          resources:
            requests:
              cpu: 250m
              memory: 512Mi
            limits:
              cpu: 1000m
              memory: 1Gi

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

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: lvzhi-ingress
  namespace: lvzhi
  annotations:
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  rules:
    - host: your-domain.cn
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: lvzhi-web-svc
                port:
                  number: 80
          - path: /api/
            pathType: Prefix
            backend:
              service:
                name: lvzhi-api-svc
                port:
                  number: 80


# ============================================
# 方案 C: 阿里云 OSS + CDN 静态部署
# (适用于纯静态页面)
# ============================================

# 1. 构建静态页面
pnpm --filter web build

# 2. 上传到 OSS
ossutil cp -r apps/web/out oss://lvzhi-assets/ \
  --endpoint oss-cn-hangzhou.aliyuncs.com \
  --access-key-id $ALIYUN_ACCESS_KEY \
  --access-key-secret $ALIYUN_SECRET_KEY

# 3. 配置 CDN
# 在阿里云 CDN 控制台添加加速域名
# 源站类型: OSS 域名
# 加速域名为 your-domain.cn

# 4. 配置 SSL 证书
# 在 CDN 控制台 - HTTPS 配置中上传证书


# ============================================
# 阿里云必做安全配置
# ============================================

# 1. 安全组规则
# ----------------------------------------
# 入方向规则:
# - 80/tcp (HTTP)
# - 443/tcp (HTTPS)
# - 22/tcp (SSH, 仅限指定 IP)
#
# 出方向规则:
# - 全部放行

# 2. 定期备份
# ----------------------------------------
# 使用阿里云云备份服务
# 或手动备份数据库和文件

# 3. 监控告警
# ----------------------------------------
# 配置云监控:
# - CPU 使用率 > 80% 告警
# - 内存使用率 > 85% 告警
# -磁盘使用率 > 80% 告警
# - HTTP 5xx 错误率 > 1% 告警

# 4. 日志服务
# ----------------------------------------
# 接入阿里云 SLS 日志服务
# 分析 Nginx 访问日志和应用日志
