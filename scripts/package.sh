#!/bin/bash
# ============================================
# 律植 - 本地打包脚本
# 使用方法: ./scripts/package.sh
# ============================================

set -e

echo "========================================"
echo "律植项目打包脚本"
echo "========================================"

# 配置
PROJECT_NAME="lvzhi"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BUILD_DIR="./deploy-package"
SERVER_USER="root"
SERVER_HOST="your-server-ip"  # 替换为你的服务器IP

# 清理旧文件
echo "[1/5] 清理旧构建文件..."
rm -rf $BUILD_DIR
mkdir -p $BUILD_DIR

# 安装依赖
echo "[2/5] 安装依赖..."
pnpm install

# 构建 Web 前端
echo "[3/5] 构建 Web 前端..."
pnpm build:web

# 构建 API 后端
echo "[4/5] 构建 API 后端..."
pnpm build:api

# 打包
echo "[5/5] 打包项目..."
tar -czvf ${PROJECT_NAME}_${TIMESTAMP}.tar.gz \
  -C apps/web/.next \
  -C apps/api/dist \
  -C . \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='apps/api/dist' \
  --exclude='.git' \
  --exclude='*.log' \
  .

# 更好的打包方式 - 分开打包
echo "创建完整部署包..."
rm -rf $BUILD_DIR/*
mkdir -p $BUILD_DIR/{web,api,config}

# 复制前端构建
echo "  - 复制前端文件..."
cp -r apps/web/.next $BUILD_DIR/web/
cp apps/web/package.json $BUILD_DIR/web/
cp -r apps/web/public $BUILD_DIR/web/ 2>/dev/null || true

# 复制后端构建
echo "  - 复制后端文件..."
cp -r apps/api/dist $BUILD_DIR/api/
cp apps/api/package.json $BUILD_DIR/api/

# 复制配置文件
echo "  - 复制配置文件..."
cp deploy/.env $BUILD_DIR/config/.env

# 创建部署脚本
cat > $BUILD_DIR/deploy.sh << 'DEPLOY_EOF'
#!/bin/bash
# 服务器端部署脚本
set -e
APP_DIR="/root/lvzhi"
echo "部署到 $APP_DIR..."
DEPLOY_EOF

# 打包
tar -czvf ${PROJECT_NAME}_${TIMESTAMP}_full.tar.gz -C $BUILD_DIR .
rm -rf $BUILD_DIR

echo ""
echo "========================================"
echo "打包完成!"
echo "========================================"
echo "输出文件: ${PROJECT_NAME}_${TIMESTAMP}_full.tar.gz"
echo ""
echo "下一步:"
echo "1. 上传到服务器: scp ${PROJECT_NAME}_${TIMESTAMP}_full.tar.gz root@your-server:/root/"
echo "2. 在服务器执行部署（见 deploy-guide.md）"
echo "========================================"
