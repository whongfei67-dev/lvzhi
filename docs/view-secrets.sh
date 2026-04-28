#!/bin/bash
# ============================================
# 律植 - 加密密钥查看器
# ============================================
# 安全提示：查看密钥需要验证身份
# 口令：身份证号后四位
# ============================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENCRYPTED_FILE="$SCRIPT_DIR/secrets.enc"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 显示欢迎信息
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  律植 - 加密密钥查看器${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查加密文件是否存在
if [ ! -f "$ENCRYPTED_FILE" ]; then
    echo -e "${RED}❌ 错误：加密文件 secrets.enc 不存在${NC}"
    exit 1
fi

# 身份验证
echo -e "${YELLOW}🔐 安全验证${NC}"
echo -e "请输入您的身份证号后四位："
read -s -p "> " ID_LAST4
echo ""

# 验证身份证后四位
if [ "$ID_LAST4" != "0032" ]; then
    echo -e "${RED}❌ 身份验证失败：身份证号后四位不正确${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 身份验证通过${NC}"
echo ""

# 解密并显示
echo -e "${BLUE}📄 解密内容如下：${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 解密并显示
RESULT=$(echo "$ID_LAST4" | openssl aes-256-cbc -d -pbkdf2 -salt -in "$ENCRYPTED_FILE" -pass stdin 2>/dev/null)

if [ $? -eq 0 ] && [ -n "$RESULT" ]; then
    echo -e "${GREEN}$RESULT${NC}"
else
    echo -e "${RED}❌ 解密失败，请检查文件完整性${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${YELLOW}⚠️  注意：请勿将解密内容分享给他人${NC}"
echo -e "${BLUE}========================================${NC}"
