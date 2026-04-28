#!/bin/bash
# ============================================
# 律植 - 阿里云一键部署脚本
# 服务器IP：8.159.156.192
# 创建时间：2026-04-03
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 变量配置
APP_NAME="律植"
APP_DIR="/opt/lvzhi"
GIT_REPO="https://github.com/whongfei67-dev/lvzhi.git"

# 显示欢迎信息
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  $APP_NAME - 阿里云一键部署脚本${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${CYAN}服务器: 8.159.156.192${NC}"
echo -e "${CYAN}部署目录: $APP_DIR${NC}"
echo ""

# 检查是否以root运行
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}请使用 sudo 或以 root 用户运行此脚本${NC}"
    exit 1
fi

# 1. 检查系统环境
echo -e "${YELLOW}[1/8] 检查系统环境...${NC}"

# 检查是否为Ubuntu/Debian
if [ -f /etc/os-release ]; then
    . /etc/os-release
    echo "操作系统: $NAME $VERSION"
else
    echo -e "${RED}无法检测操作系统${NC}"
    exit 1
fi

# 检查内存
TOTAL_MEM=$(free -m | awk '/^Mem:/{print $2}')
echo "总内存: ${TOTAL_MEM}MB"

if [ "$TOTAL_MEM" -lt 2048 ]; then
    echo -e "${YELLOW}警告: 建议至少2GB内存${NC}"
fi

echo ""

# 2. 安装Docker
echo -e "${YELLOW}[2/8] 检查并安装 Docker...${NC}"

if command -v docker &> /dev/null; then
    echo -e "${GREEN}Docker 已安装: $(docker --version)${NC}"
else
    echo "安装 Docker..."
    apt-get update
    apt-get install -y ca-certificates curl gnupg lsb-release
    
    # 添加Docker GPG密钥
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    
    # 添加Docker仓库
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # 安装Docker
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    echo -e "${GREEN}Docker 安装完成: $(docker --version)${NC}"
fi

# 启动Docker
systemctl start docker
systemctl enable docker

# 添加当前用户到docker组（如果存在）
if [ -n "$SUDO_USER" ]; then
    usermod -aG docker "$SUDO_USER"
fi

echo ""

# 3. 检查Docker Compose
echo -e "${YELLOW}[3/8] 检查 Docker Compose...${NC}"

if docker compose version &> /dev/null; then
    echo -e "${GREEN}Docker Compose 已安装: $(docker compose version)${NC}"
elif command -v docker-compose &> /dev/null; then
    echo -e "${GREEN}Docker Compose 已安装: $(docker-compose --version)${NC}"
else
    echo -e "${RED}Docker Compose 未安装${NC}"
    exit 1
fi

echo ""

# 4. 创建应用目录
echo -e "${YELLOW}[4/8] 创建应用目录...${NC}"

mkdir -p "$APP_DIR"
cd "$APP_DIR"
echo "应用目录: $APP_DIR"

echo ""

# 5. 克隆或更新代码
echo -e "${YELLOW}[5/8] 克隆/更新代码...${NC}"

if [ -d ".git" ]; then
    echo "代码已存在，执行 git pull..."
    git pull
else
    echo "克隆代码仓库..."
    git clone "$GIT_REPO" .
fi

echo -e "${GREEN}代码更新完成${NC}"

echo ""

# 6. 配置环境变量
echo -e "${YELLOW}[6/8] 配置环境变量...${NC}"

if [ ! -f "deploy/.env" ]; then
    echo "复制环境变量模板..."
    cp deploy/env.example deploy/.env
    echo -e "${YELLOW}请编辑 $APP_DIR/deploy/.env 配置文件${NC}"
    echo ""
    echo "主要需要配置:"
    echo "  1. 数据库连接 (DATABASE_URL)"
    echo "  2. JWT密钥 (JWT_SECRET)"
    echo "  3. AI服务密钥 (ZHIPU_API_KEY 等)"
    echo "  4. 阿里云OSS配置"
    echo "  5. 支付配置 (支付宝/微信)"
    echo ""
    echo -e "${YELLOW}按 Enter 继续...${NC}"
    read
    nano "$APP_DIR/deploy/.env"
else
    echo -e "${GREEN}环境变量文件已存在${NC}"
fi

echo ""

# 7. 构建和启动服务
echo -e "${YELLOW}[7/8] 构建 Docker 镜像...${NC}"
echo -e "${YELLOW}这可能需要10-20分钟，请耐心等待...${NC}"

docker compose build --no-cache

echo -e "${GREEN}镜像构建完成${NC}"
echo ""

echo -e "${YELLOW}[8/8] 启动服务...${NC}"

docker compose up -d

# 等待服务启动
echo "等待服务启动..."
sleep 10

echo ""

# 8. 验证部署
echo -e "${YELLOW}验证部署状态...${NC}"

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  服务状态${NC}"
echo -e "${BLUE}========================================${NC}"

docker compose ps

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  健康检查${NC}"
echo -e "${BLUE}========================================${NC}"

# 健康检查
sleep 5

echo -e "${CYAN}检查Nginx: ${NC}"
curl -s http://localhost/health && echo -e " ${GREEN}✓${NC}" || echo -e " ${RED}✗${NC}"

echo -e "${CYAN}检查API: ${NC}"
curl -s http://localhost/api/health && echo -e " ${GREEN}✓${NC}" || echo -e " ${RED}✗${NC}"

echo ""

# 完成
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "访问地址:"
echo "  前端: http://8.159.156.192"
echo "  API: http://8.159.156.192/api"
echo "  健康检查: http://8.159.156.192/health"
echo ""
echo "常用命令:"
echo "  查看日志: docker compose logs -f"
echo "  重启服务: docker compose restart"
echo "  停止服务: docker compose down"
echo ""
echo -e "${YELLOW}后续步骤:${NC}"
echo "  1. 配置域名DNS解析"
echo "  2. 配置SSL证书"
echo "  3. 完成ICP备案"
echo "  4. 配置支付接口"
echo ""
