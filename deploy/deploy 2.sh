#!/bin/bash
# ============================================
# 律植 - 一键部署脚本
# 支持阿里云 ECS 和腾讯云 CVM
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 变量配置
APP_NAME="律植"
APP_DIR="/opt/lvzhi"
DOMAIN=""
DEPLOY_METHOD="docker"  # docker, k8s, static

# 显示帮助信息
show_help() {
    echo "===== 律植一键部署脚本 ====="
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -d, --domain       网站域名 (必需)"
    echo "  -m, --method       部署方式: docker|k8s|static (默认: docker)"
    echo "  -p, --path         安装路径 (默认: /opt/lvzhi)"
    echo "  -h, --help         显示帮助"
    echo ""
    echo "示例:"
    echo "  $0 -d lvzhi.cn -m docker"
    echo "  $0 --domain lvzhi.cn --method k8s"
    echo ""
}

# 解析参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--domain)
            DOMAIN="$2"
            shift 2
            ;;
        -m|--method)
            DEPLOY_METHOD="$2"
            shift 2
            ;;
        -p|--path)
            APP_DIR="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}未知选项: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# 检查必需参数
if [ -z "$DOMAIN" ]; then
    echo -e "${RED}错误: 必须指定域名${NC}"
    show_help
    exit 1
fi

echo -e "${GREEN}===== 律植部署开始 =====${NC}"
echo "域名: $DOMAIN"
echo "部署方式: $DEPLOY_METHOD"
echo "安装路径: $APP_DIR"

# 1. 检查系统环境
echo -e "\n${YELLOW}[1/7] 检查系统环境...${NC}"

if ! command -v docker &> /dev/null; then
    echo "安装 Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
else
    echo "Docker 已安装: $(docker --version)"
fi

if ! command -v docker-compose &> /dev/null; then
    echo "安装 Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
else
    echo "Docker Compose 已安装: $(docker-compose --version)"
fi

if ! command -v git &> /dev/null; then
    echo "安装 Git..."
    apt-get update && apt-get install -y git
fi

# 2. 创建目录
echo -e "\n${YELLOW}[2/7] 创建目录...${NC}"
mkdir -p $APP_DIR
cd $APP_DIR

# 3. 克隆代码
echo -e "\n${YELLOW}[3/7] 克隆代码...${NC}"
if [ -d ".git" ]; then
    echo "代码已存在，更新中..."
    git pull
else
    echo "请输入 Git 仓库地址 (留空使用示例):"
    read -r REPO_URL
    if [ -z "$REPO_URL" ]; then
        echo "请手动克隆代码到 $APP_DIR"
        echo "或修改脚本中的 REPO_URL"
        exit 1
    fi
    git clone "$REPO_URL" .
fi

# 4. 配置环境变量
echo -e "\n${YELLOW}[4/7] 配置环境变量...${NC}"
if [ ! -f ".env" ]; then
    cp deploy/env.example .env
    echo -e "${YELLOW}请编辑 $APP_DIR/.env 文件配置必要的环境变量${NC}"
    echo "主要需要配置:"
    echo "  - JWT_SECRET (JWT 密钥)"
    echo "  - 数据库密码"
    echo "  - AI 服务密钥"
    echo "  - 存储服务密钥"
    echo ""
    echo "按 Enter 继续..."
    read
fi

# 5. 构建镜像
echo -e "\n${YELLOW}[5/7] 构建 Docker 镜像...${NC}"
docker-compose -f docker-compose.yml build --no-cache

# 6. 启动服务
echo -e "\n${YELLOW}[6/7] 启动服务...${NC}"
docker-compose -f docker-compose.yml up -d

# 7. 配置 Nginx
echo -e "\n${YELLOW}[7/7] 配置 Nginx...${NC}"
cat > /etc/nginx/conf.d/lvzhi.conf <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

nginx -t && systemctl reload nginx

# 完成
echo -e "\n${GREEN}===== 部署完成 =====${NC}"
echo ""
echo "访问地址: http://$DOMAIN"
echo "API 地址: http://$DOMAIN/api"
echo ""
echo "常用命令:"
echo "  查看日志: docker-compose -f $APP_DIR/docker-compose.yml logs -f"
echo "  重启服务: docker-compose -f $APP_DIR/docker-compose.yml restart"
echo "  停止服务: docker-compose -f $APP_DIR/docker-compose.yml down"
echo ""
echo "后续步骤:"
echo "  1. 配置 SSL 证书 (推荐 Let's Encrypt)"
echo "  2. 配置域名 DNS 解析"
echo "  3. 申请 ICP 备案"
echo "  4. 配置支付接口 (支付宝/微信支付)"
