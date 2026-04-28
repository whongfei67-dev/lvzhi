#!/bin/bash
# ============================================
# 律植 - Let's Encrypt 证书自动申请脚本
# 使用 acme.sh + 阿里云 DNS
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 配置参数（敏感信息请通过环境变量注入）
ALICLOUD_ACCESS_KEY="${ALICLOUD_ACCESS_KEY:-}"
ALICLOUD_ACCESS_SECRET="${ALICLOUD_ACCESS_SECRET:-}"
DOMAINS="lvxzhi.com www.lvxzhi.com"
CERT_DIR="/opt/lvzhi/deploy/ssl"
EMAIL="admin@lvxzhi.com"

echo -e "${GREEN}===== 律植 SSL 证书申请脚本 =====${NC}"

# 1. 检查并安装 acme.sh
echo -e "\n${YELLOW}[1/5] 检查 acme.sh...${NC}"
if [ ! -d "$HOME/.acme.sh" ]; then
    echo "安装 acme.sh..."
    curl https://get.acme.sh | sh -s email=$EMAIL
else
    echo "acme.sh 已安装"
fi

# 2. 配置阿里云 DNS API
echo -e "\n${YELLOW}[2/5] 配置阿里云 DNS API...${NC}"
if [ -z "$ALICLOUD_ACCESS_KEY" ] || [ -z "$ALICLOUD_ACCESS_SECRET" ]; then
    echo -e "${RED}❌ 缺少 ALICLOUD_ACCESS_KEY / ALICLOUD_ACCESS_SECRET 环境变量${NC}"
    echo "请先执行："
    echo "  export ALICLOUD_ACCESS_KEY=your_access_key_id"
    echo "  export ALICLOUD_ACCESS_SECRET=your_access_key_secret"
    exit 1
fi
export Ali_Key="$ALICLOUD_ACCESS_KEY"
export Ali_Secret="$ALICLOUD_ACCESS_SECRET"

# 3. 申请证书
echo -e "\n${YELLOW}[3/5] 申请 Let's Encrypt 证书...${NC}"
mkdir -p $CERT_DIR

# 构建域名参数
DOMAIN_ARGS=""
for domain in $DOMAINS; do
    DOMAIN_ARGS="$DOMAIN_ARGS -d $domain"
done

~/.acme.sh/acme.sh --issue --dns dns_ali $DOMAIN_ARGS

# 4. 安装证书
echo -e "\n${YELLOW}[4/5] 安装证书到 $CERT_DIR...${NC}"
~/.acme.sh/acme.sh --install-cert -d ${DOMAINS%% *} \
    --key-file "$CERT_DIR/privkey.pem" \
    --fullchain-file "$CERT_DIR/fullchain.pem" \
    --reloadcmd "docker-compose -f /opt/lvzhi/docker-compose.yml exec -T nginx nginx -s reload"

echo -e "\n${GREEN}证书已安装到 $CERT_DIR${NC}"

# 5. 验证
echo -e "\n${YELLOW}[5/5] 验证证书...${NC}"
if [ -f "$CERT_DIR/fullchain.pem" ]; then
    echo -e "${GREEN}✅ 证书申请成功！${NC}"
    echo ""
    echo "证书文件:"
    echo "  - $CERT_DIR/fullchain.pem"
    echo "  - $CERT_DIR/privkey.pem"
    echo ""
    echo "证书将在 60 天后自动续期"
else
    echo -e "${RED}❌ 证书申请失败，请检查日志${NC}"
    exit 1
fi
