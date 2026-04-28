#!/bin/bash
# ============================================
# 律植 - Docker Desktop 问题诊断与恢复脚本
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}║   律植 (Lvzhi) - Docker Desktop 问题诊断与恢复         ║${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 诊断函数
diagnose_docker() {
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Docker Desktop 诊断${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    # 检查 Docker.app 存在性
    echo -e "${YELLOW}1. 检查 Docker.app...${NC}"
    if [ -d "/Applications/Docker.app" ]; then
        echo -e "${GREEN}✓${NC} Docker.app 存在"
        echo "  路径: /Applications/Docker.app"
    else
        echo -e "${RED}✗${NC} Docker.app 不存在"
    fi
    echo ""

    # 检查 Docker 进程
    echo -e "${YELLOW}2. 检查 Docker 进程...${NC}"
    if pgrep -x "Docker" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Docker 进程正在运行"
        pgrep -x "Docker" | xargs ps -p | tail -1
    else
        echo -e "${RED}✗${NC} Docker 进程未运行"
    fi
    echo ""

    # 检查 Docker socket
    echo -e "${YELLOW}3. 检查 Docker socket...${NC}"
    if [ -S ~/.docker/run/docker.sock ]; then
        echo -e "${GREEN}✓${NC} Docker socket 存在"
        ls -la ~/.docker/run/docker.sock
    else
        echo -e "${RED}✗${NC} Docker socket 不存在"
    fi
    echo ""

    # 测试 Docker API
    echo -e "${YELLOW}4. 测试 Docker API...${NC}"
    if docker info > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Docker API 可访问"
    else
        echo -e "${RED}✗${NC} Docker API 不可访问"
    fi
    echo ""
}

# 恢复函数
restore_docker() {
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Docker Desktop 恢复步骤${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "请按以下步骤操作："
    echo ""
    echo -e "${RED}步骤 1: 强制退出 Docker Desktop${NC}"
    echo "  1. 按 ⌘ + Option + Esc 打开强制退出窗口"
    echo "  2. 找到 'Docker Desktop' 并点击 '强制退出'"
    echo "  3. 确认"
    echo ""
    echo -e "${RED}步骤 2: 清除 Docker 数据（谨慎）${NC}"
    echo "  如果 Docker 无法正常启动，可以尝试清除数据："
    echo "  rm -rf ~/Library/Containers/com.docker.docker"
    echo "  rm -rf ~/Library/Application\ Support/Docker"
    echo "  rm -rf ~/.docker"
    echo ""
    echo -e "${RED}步骤 3: 重新启动 Docker Desktop${NC}"
    echo "  1. 在 Finder 中打开 Applications 文件夹"
    echo "  2. 双击 'Docker Desktop'"
    echo "  3. 等待 Docker 启动完成（菜单栏图标变亮）"
    echo ""
    echo -e "${RED}步骤 4: 验证 Docker${NC}"
    echo "  docker info"
    echo "  docker ps"
    echo ""
}

# 执行诊断
diagnose_docker

# 提供恢复指导
restore_docker
