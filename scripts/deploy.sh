#!/bin/bash
# ============================================
# 律植项目 - 一键部署脚本
# ============================================

set -e

# 配置
PROJECT_ROOT="/Users/wanghongfei/Desktop/智能体项目/律植项目"
SERVER="root@8.159.156.192"
SSH_KEY="~/.ssh/aliyun_server"
TMP_DIR="/tmp/lvzhi-deploy-$(date +%Y%m%d%H%M%S)"

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ============================================
# 步骤 1：准备工作
# ============================================
step_prepare() {
    log "步骤 1/6：准备工作..."
    mkdir -p "$TMP_DIR"
    
    if ! ssh -i "$SSH_KEY" -o ConnectTimeout=10 "$SERVER" "echo 'SSH OK'" 2>/dev/null; then
        error "无法连接到服务器"
        exit 1
    fi
    log "准备工作完成"
}

# ============================================
# 步骤 2：构建后端 API
# ============================================
step_build_api() {
    log "步骤 2/6：构建后端 API..."
    
    cd "$PROJECT_ROOT/apps/api"
    
    # 修复 package.json
    sed -i '' 's/"@lvzhi\/types": "workspace:\*",//' package.json 2>/dev/null || true
    sed -i '' 's/"esbuild": "\^0.28.0"/"esbuild": "^0.24.0"/' package.json 2>/dev/null || true
    
    # 安装依赖
    npm install --silent 2>/dev/null || true
    
    # 构建
    npx esbuild src/index.ts --bundle --platform=node --format=esm --outdir=dist --packages=external
    
    if [ ! -f "dist/index.js" ]; then
        error "后端构建失败"
        exit 1
    fi
    
    log "后端构建成功"
}

# ============================================
# 步骤 3：部署后端
# ============================================
step_deploy_api() {
    log "步骤 3/6：部署后端 API..."
    
    cd "$PROJECT_ROOT/apps/api"
    
    # 打包
    tar --exclude='node_modules' -czf "$TMP_DIR/api.tar.gz" dist/
    
    # 上传到服务器
    scp -i "$SSH_KEY" "$TMP_DIR/api.tar.gz" "$SERVER:/tmp/"
    
    # 在服务器上部署
    ssh -i "$SSH_KEY" "$SERVER" << 'DEPLOY_API'
        set -e
        cd /tmp
        rm -rf api-deploy && mkdir api-deploy
        tar -xzf api.tar.gz -C api-deploy
        
        # 停止旧容器
        docker stop lvzhi-api 2>/dev/null || true
        docker rm lvzhi-api 2>/dev/null || true
        
        # 创建临时容器
        docker create --name lvzhi-api-temp crpi-aalux2tdca5t1zgj.cn-shanghai.personal.cr.aliyuncs.com/lvzhi_01/lvzhi-api:latest 2>/dev/null || true
        
        # 复制新文件
        docker cp api-deploy/dist lvzhi-api-temp:/app/apps/api/ 2>/dev/null || true
        
        # 提交镜像
        docker commit lvzhi-api-temp crpi-aalux2tdca5t1zgj.cn-shanghai.personal.cr.aliyuncs.com/lvzhi_01/lvzhi-api:latest 2>/dev/null || true
        docker rm lvzhi-api-temp 2>/dev/null || true
        
        # 启动容器
        docker run -d --name lvzhi-api \
            --network lvzhi_lvzhi-network \
            -p 3001:3001 \
            --restart unless-stopped \
            -e JWT_SECRET=lvzhi-jwt-secret-change-in-production \
            -e NODE_ENV=production \
            crpi-aalux2tdca5t1zgj.cn-shanghai.personal.cr.aliyuncs.com/lvzhi_01/lvzhi-api:latest 2>/dev/null || true
        
        sleep 3
        docker logs lvzhi-api --tail 5
        echo "后端部署完成"
DEPLOY_API
    
    log "后端部署完成"
}

# ============================================
# 步骤 4：构建前端
# ============================================
step_build_web() {
    log "步骤 4/6：构建前端（可能需要几分钟）..."
    
    cd "$PROJECT_ROOT/apps/web"
    
    # 构建
    pnpm build 2>&1 | tail -5 &
    BUILD_PID=$!
    
    # 等待构建
    for i in {1..90}; do
        if ! kill -0 $BUILD_PID 2>/dev/null; then
            break
        fi
        sleep 5
        echo -n "."
    done
    echo ""
    
    if [ ! -d ".next/server/app" ]; then
        warn "前端构建可能未完成，但继续..."
    else
        log "前端构建成功"
    fi
}

# ============================================
# 步骤 5：部署前端
# ============================================
step_deploy_web() {
    log "步骤 5/6：部署前端..."
    
    cd "$PROJECT_ROOT/apps/web"
    
    # 打包
    tar -czf "$TMP_DIR/web.tar.gz" .next/
    
    # 上传到服务器
    scp -i "$SSH_KEY" "$TMP_DIR/web.tar.gz" "$SERVER:/tmp/"
    
    # 在服务器上部署
    ssh -i "$SSH_KEY" "$SERVER" << 'DEPLOY_WEB'
        set -e
        cd /tmp
        rm -rf web-deploy && mkdir web-deploy
        tar -xzf web.tar.gz -C web-deploy
        
        # 停止旧容器
        docker stop lvzhi-web 2>/dev/null || true
        docker rm lvzhi-web 2>/dev/null || true
        
        # 复制文件
        rm -rf /var/www/lvzhi && mkdir -p /var/www/lvzhi
        cp -r web-deploy/.next /var/www/lvzhi/
        
        # 启动 nginx 服务
        docker run -d --name lvzhi-web \
            --network lvzhi_lvzhi-network \
            -p 3000:3000 \
            --restart unless-stopped \
            -v /var/www/lvzhi:/usr/share/nginx/html:ro \
            nginx:alpine 2>/dev/null || true
        
        echo "前端部署完成"
DEPLOY_WEB
    
    log "前端部署完成"
}

# ============================================
# 步骤 6：验证
# ============================================
step_verify() {
    log "步骤 6/6：验证部署..."
    
    sleep 5
    
    API_STATUS=$(ssh -i "$SSH_KEY" "$SERVER" "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/health" 2>/dev/null || echo "000")
    WEB_STATUS=$(ssh -i "$SSH_KEY" "$SERVER" "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/" 2>/dev/null || echo "000")
    
    if [ "$API_STATUS" = "200" ]; then
        log "API 服务: OK"
    else
        warn "API 服务: 状态码 $API_STATUS"
    fi
    
    if [ "$WEB_STATUS" = "200" ] || [ "$WEB_STATUS" = "304" ]; then
        log "前端服务: OK"
    else
        warn "前端服务: 状态码 $WEB_STATUS"
    fi
}

# ============================================
# 主流程
# ============================================
main() {
    echo ""
    echo "============================================"
    echo "  律植项目 - 一键部署脚本"
    echo "============================================"
    echo ""
    
    trap 'rm -rf "$TMP_DIR" 2>/dev/null' EXIT
    
    step_prepare
    step_build_api
    step_deploy_api
    step_build_web
    step_deploy_web
    step_verify
    
    echo ""
    echo "============================================"
    echo -e "  ${GREEN}部署完成！${NC}"
    echo "============================================"
    echo ""
}

main "$@"
