#!/bin/bash
# ============================================
# 律植 - 清理后代码部署脚本
# 构建并推送到阿里云服务器
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 变量配置
APP_NAME="律植"
ALIYUN_REGISTRY="crpi-aalux2tdca5t1zgj.cn-shanghai.personal.cr.aliyuncs.com"
ALIYUN_NAMESPACE="lvzhi_01"
SERVER_IP="8.159.156.192"
IMAGE_TAG="latest-cleaned-$(date +%Y%m%d%H%M)"

# 显示信息
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  $APP_NAME - 清理后代码部署${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${CYAN}镜像标签: $IMAGE_TAG${NC}"
echo -e "${CYAN}服务器: $SERVER_IP${NC}"
echo ""

# 0. 检查 Docker 登录状态
echo -e "${YELLOW}[0/6] 检查 Docker 登录状态...${NC}"
if docker manifest inspect "$ALIYUN_REGISTRY/$ALIYUN_NAMESPACE/lvzhi:latest" > /dev/null 2>&1; then
    echo -e "${GREEN}已登录阿里云镜像仓库${NC}"
else
    echo -e "${YELLOW}需要登录阿里云镜像仓库...${NC}"
    echo "请运行: docker login $ALIYUN_REGISTRY"
    exit 1
fi

# 1. 确认本地构建
echo ""
echo -e "${YELLOW}[1/6] 确认清理后的代码...${NC}"

cd /Users/wanghongfei/Desktop/智能体项目/律植项目

echo "组件目录清理状态:"
echo "  - home/: $([ -d apps/web/components/home ] && echo "存在" || echo "已删除")"
echo "  - workbench/: $([ -d apps/web/components/workbench ] && echo "存在" || echo "已删除")"
echo "  - classroom/: $([ -d apps/web/components/classroom ] && echo "存在" || echo "已删除")"
echo "  - jobs/: $([ -d apps/web/components/jobs ] && echo "存在" || echo "已删除")"
echo "  - ranking/: $([ -d apps/web/components/ranking ] && echo "存在" || echo "已删除")"
echo "  - lawyer/: $([ -d apps/web/components/lawyer ] && echo "存在" || echo "已删除")"
echo "  - agent/: $(ls apps/web/components/agent/*.tsx 2>/dev/null | wc -l) 个文件"
echo "  - community/: $(ls apps/web/components/community/*.tsx 2>/dev/null | wc -l) 个文件"
echo "  - ui/: $(ls apps/web/components/ui/*.tsx 2>/dev/null | wc -l) 个文件"

echo ""
read -p "确认部署清理后的代码到测试服务器? (y/n): " confirm
if [ "$confirm" != "y" ]; then
    echo "取消部署"
    exit 0
fi

# 2. 构建 Web 镜像
echo ""
echo -e "${YELLOW}[2/6] 构建 Web 镜像...${NC}"
echo -e "${YELLOW}这可能需要 5-15 分钟，请耐心等待...${NC}"

docker build \
    --target web-runner \
    --build-arg NEXT_PUBLIC_API_URL="https://www.lvxzhi.com/api" \
    -t "lvzhi-web:$IMAGE_TAG" \
    -f Dockerfile \
    . 2>&1 | tail -20

echo -e "${GREEN}Web 镜像构建完成${NC}"

# 3. 推送镜像到 ACR
echo ""
echo -e "${YELLOW}[3/6] 推送镜像到阿里云 ACR...${NC}"

# 标签镜像
docker tag "lvzhi-web:$IMAGE_TAG" "$ALIYUN_REGISTRY/$ALIYUN_NAMESPACE/lvzhi-web:$IMAGE_TAG"

# 推送
echo "推送 Web 镜像..."
docker push "$ALIYUN_REGISTRY/$ALIYUN_NAMESPACE/lvzhi-web:$IMAGE_TAG"

echo -e "${GREEN}镜像推送完成${NC}"

# 4. SSH 到服务器更新配置
echo ""
echo -e "${YELLOW}[4/6] SSH 到服务器更新配置...${NC}"

ssh root@$SERVER_IP << 'ENDSSH'
set -e
cd /opt/lvzhi

echo "更新 docker-compose.yml 使用新镜像..."
# 备份
cp docker-compose.yml docker-compose.yml.backup-$(date +%Y%m%d%H%M)

# 更新镜像版本（使用 latest 以便拉取最新）
sed -i 's|lvzhi:latest|lvzhi-'$1':latest|g' docker-compose.yml 2>/dev/null || true

# 拉取新镜像
echo "拉取新镜像..."
docker compose pull

# 重启服务
echo "重启服务..."
docker compose up -d --no-deps web

# 查看状态
echo ""
echo "服务状态:"
docker compose ps

echo ""
echo "Web 容器日志 (最后10行):"
docker compose logs --tail=10 web
ENDSSH

echo -e "${GREEN}服务器更新完成${NC}"

# 5. 验证部署
echo ""
echo -e "${YELLOW}[5/6] 验证部署...${NC}"

sleep 5

echo -e "${CYAN}检查服务器状态...${NC}"
ssh root@$SERVER_IP "docker compose ps && curl -s -o /dev/null -w '%{http_code}' http://localhost/ || echo 'check failed'"

# 6. 完成
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "访问地址:"
echo "  前端: http://$SERVER_IP"
echo "  API: http://$SERVER_IP/api"
echo ""
echo "镜像标签: $IMAGE_TAG"
echo ""
echo -e "${YELLOW}注意：仅更新了 Web 前端，API 保持不变${NC}"
echo ""
