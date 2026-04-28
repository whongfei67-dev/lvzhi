#!/bin/bash
# ============================================
# 律植 - 服务器部署脚本
# 使用方法: ./deploy-server.sh
# 需要先在本地执行 package.sh 并上传
# ============================================

set -e

# 配置
APP_NAME="lvzhi"
APP_DIR="/root/lvzhi"
BACKUP_DIR="/root/lvzhi-backup"
PACKAGE_FILE="${1:-lvzhi_*_full.tar.gz}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo "========================================"
echo "律植部署脚本"
echo "========================================"

# 检查包文件
if [ ! -f "$PACKAGE_FILE" ]; then
    log_error "找不到部署包: $PACKAGE_FILE"
    log_info "请先上传部署包到当前目录"
    exit 1
fi

# 备份旧版本
if [ -d "$APP_DIR" ]; then
    log_info "备份旧版本到 $BACKUP_DIR/$TIMESTAMP..."
    mkdir -p $BACKUP_DIR
    mv $APP_DIR $BACKUP_DIR/$TIMESTAMP
fi

# 创建目录
log_info "创建应用目录..."
mkdir -p $APP_DIR

# 解压
log_info "解压部署包..."
tar -xzvf $PACKAGE_FILE -C $APP_DIR

# 安装依赖
log_info "安装依赖..."
cd $APP_DIR/api
npm install --production

cd $APP_DIR/web
npm install --production

# 设置环境变量
log_info "配置环境变量..."
if [ -f "$APP_DIR/config/.env" ]; then
    cp $APP_DIR/config/.env $APP_DIR/web/.env.production.local
    cp $APP_DIR/config/.env $APP_DIR/api/.env
fi

# 创建 PM2 配置
log_info "配置 PM2..."
cd $APP_DIR
cat > ecosystem.config.js << 'EOF'
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
      log_file: '/root/.pm2/logs/lvzhi-api.log',
      time: true,
      max_memory_restart: '500M',
      autorestart: true,
      watch: false
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
      log_file: '/root/.pm2/logs/lvzhi-web.log',
      time: true,
      max_memory_restart: '1G',
      autorestart: true,
      watch: false
    }
  ]
};
EOF

# 清理旧进程
log_info "重启服务..."
pm2 delete lvzhi-api 2>/dev/null || true
pm2 delete lvzhi-web 2>/dev/null || true

# 启动服务
pm2 start ecosystem.config.js
pm2 save

# 清理
log_info "清理临时文件..."
rm -f $PACKAGE_FILE

echo ""
echo "========================================"
echo "部署完成!"
echo "========================================"
log_info "API 服务: http://localhost:3001"
log_info "Web 服务: http://localhost:3000"
log_info ""
log_info "常用命令:"
log_info "  pm2 status          - 查看状态"
log_info "  pm2 logs lvzhi-api  - 查看 API 日志"
log_info "  pm2 logs lvzhi-web  - 查看 Web 日志"
log_info "  pm2 restart lvzhi   - 重启服务"
echo "========================================"
