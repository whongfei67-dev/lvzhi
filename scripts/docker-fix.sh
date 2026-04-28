#!/bin/bash
# ============================================
# 律植 - Docker Desktop 问题诊断与修复脚本
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}║   律植 (Lvzhi) - Docker Desktop 问题诊断与修复           ║${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================
# 步骤 1: 检查 Docker Desktop 应用
# ============================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}步骤 1: 检查 Docker Desktop 应用${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -d "/Applications/Docker.app" ]; then
    echo -e "${GREEN}✓${NC} Docker Desktop 应用已安装"
else
    echo -e "${RED}✗${NC} Docker Desktop 应用未找到"
    echo ""
    echo "请从以下网址下载安装："
    echo "  https://www.docker.com/products/docker-desktop/"
    exit 1
fi

# ============================================
# 步骤 2: 检查 Docker Desktop 进程
# ============================================
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}步骤 2: 检查 Docker Desktop 进程${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if pgrep -x "Docker" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Docker Desktop 进程正在运行"
    DOCKER_PID=$(pgrep -x "Docker")
    echo "    PID: $DOCKER_PID"
elif pgrep -f "com.docker.hyperkit" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Docker Desktop (HyperKit) 正在运行"
elif pgrep -f "com.docker.vmnetd" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Docker Desktop (VMNet) 正在运行"
else
    echo -e "${RED}✗${NC} Docker Desktop 未运行"
    echo ""
    echo -e "${YELLOW}解决方案：${NC}"
    echo "  方法 1: 手动启动"
    echo "    - 打开 Finder"
    echo "    - 进入 Applications（应用程序）文件夹"
    echo "    - 双击 Docker 图标"
    echo ""
    echo "  方法 2: 命令行启动"
    echo "    open -a Docker"
    echo ""
    echo "  方法 3: 如果启动无响应"
    echo "    - 强制退出 Docker Desktop (⌘+Option+Esc)"
    echo "    - 重新启动 Docker Desktop"
    echo ""
    read -p "请先启动 Docker Desktop，然后按回车继续..."
fi

# ============================================
# 步骤 3: 等待 Docker API 就绪
# ============================================
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}步骤 3: 等待 Docker API 就绪${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo "正在等待 Docker API 响应..."

for i in {1..60}; do
    if docker info > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Docker API 已就绪 (等待了 ${i} 秒)"
        break
    fi

    if [ $i -eq 60 ]; then
        echo -e "${RED}✗${NC} Docker API 启动超时（60秒）"
        echo ""
        echo -e "${YELLOW}可能的问题：${NC}"
        echo "  1. Docker Desktop 后端启动失败"
        echo "  2. 虚拟机配置损坏"
        echo "  3. 磁盘空间不足"
        echo ""
        echo -e "${YELLOW}建议的解决方案：${NC}"
        echo "  1. 打开 Docker Desktop → Settings → Troubleshoot"
        echo "  2. 点击 'Reset to factory defaults'"
        echo "  3. 或者删除 ~/Library/Containers/com.docker.docker 目录"
        exit 1
    fi

    sleep 1
    echo -n "."
done
echo ""

# ============================================
# 步骤 4: 显示 Docker 信息
# ============================================
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}步骤 4: Docker 环境信息${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "${GREEN}Docker 版本:${NC}"
docker --version

echo ""
echo -e "${GREEN}Docker Compose 版本:${NC}"
docker compose version

echo ""
echo -e "${GREEN}运行中的容器:${NC}"
docker ps -a

# ============================================
# 步骤 5: Docker 系统状态
# ============================================
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}步骤 5: Docker 系统状态${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "${GREEN}磁盘使用情况:${NC}"
docker system df

# ============================================
# 步骤 6: 检查项目配置
# ============================================
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}步骤 6: 检查律植项目配置${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cd "$(dirname "$0")/.."

if [ -f "docker-compose.yml" ]; then
    echo -e "${GREEN}✓${NC} docker-compose.yml 存在"

    # 检查 .env 文件
    if [ -f "deploy/.env" ]; then
        echo -e "${GREEN}✓${NC} deploy/.env 存在"
    else
        echo -e "${YELLOW}⚠${NC} deploy/.env 不存在"
        if [ -f "deploy/env.example" ]; then
            echo "    复制模板..."
            cp deploy/env.example deploy/.env
            echo -e "${YELLOW}    请编辑 deploy/.env 填写必要的配置！${NC}"
        fi
    fi

    # 检查容器健康状态
    echo ""
    echo -e "${GREEN}服务健康状态:${NC}"
    docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Health}}" 2>/dev/null || echo "    (需要 docker compose config 验证)"
else
    echo -e "${RED}✗${NC} docker-compose.yml 不存在"
fi

# ============================================
# 步骤 7: 清理建议
# ============================================
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}步骤 7: 清理与优化（可选）${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo "如果 Docker 运行缓慢，可以执行以下清理："
echo ""
echo "  # 清理未使用的镜像和容器"
echo "  docker system prune -a"
echo ""
echo "  # 清理构建缓存"
echo "  docker builder prune -a"
echo ""
echo "  # 完全重置 Docker"
echo "  # (这会删除所有容器、镜像、卷)"
echo "  # docker system prune -a --volumes"

# ============================================
# 完成
# ============================================
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}║   ✓ Docker 环境诊断完成！                                 ║${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}下一步操作：${NC}"
echo ""
echo "  1. 启动律植服务:"
echo "     docker compose up -d"
echo ""
echo "  2. 查看服务日志:"
echo "     docker compose logs -f"
echo ""
echo "  3. 查看服务状态:"
echo "     docker compose ps"
echo ""
echo "  4. 如果构建失败，尝试:"
echo "     docker compose build --no-cache"
echo ""
