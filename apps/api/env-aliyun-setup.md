# ============================================
# 律植 (Lvzhi) API 环境变量配置 - 阿里云版
# ============================================
# 
# 使用说明：
# 1. 复制此文件为 .env
# 2. 填写实际的密钥和连接信息
#
# ============================================

# 端口
PORT=4000

# 前端 URL（用于 CORS）
WEB_URL=http://localhost:3000

# ============================================
# 数据库配置 - 阿里云 PolarDB
# ============================================
# 主机：lvzhi-prod.pg.polardb.rds.aliyuncs.com
# 端口：5432
# 数据库：data01
# 用户：mamba_01

DATABASE_URL=postgresql://mamba_01:Wxwzcfwhf205@lvzhi-prod.pg.polardb.rds.aliyuncs.com:5432/data01?sslmode=require

# 数据库连接池配置
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
DATABASE_CONNECTION_TIMEOUT=30000

# ============================================
# JWT 配置
# ============================================
# 用于生成和验证 JWT Token（需要自行生成）
JWT_SECRET=your_jwt_secret_here_generate_with_openssl_rand_base64_32
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# ============================================
# 阿里云 OSS 配置（文件存储）- 待配置
# ============================================
OSS_ACCESS_KEY_ID=your_oss_access_key
OSS_ACCESS_KEY_SECRET=your_oss_secret
OSS_BUCKET=lvzhi-files
OSS_REGION=cn-shanghai
OSS_ENDPOINT=oss-cn-shanghai.aliyuncs.com

# ============================================
# 阿里云 SMS 配置（短信服务）- 待配置
# ============================================
ALIYUN_SMS_ACCESS_KEY=your_sms_access_key
ALIYUN_SMS_ACCESS_SECRET=your_sms_secret
ALIYUN_SMS_SIGN_NAME=律植
ALIYUN_SMS_TEMPLATE_LOGIN=your_login_template_code

# ============================================
# AI/LLM 配置 - 待配置
# ============================================
ZHIPU_API_KEY=your_zhipu_api_key
DASHSCOPE_API_KEY=your_dashscope_api_key

# ============================================
# 支付配置 - 待配置
# ============================================
ALIPAY_APP_ID=your_alipay_app_id
WECHAT_PAY_APP_ID=your_wechat_app_id

# ============================================
# 开发环境
# ============================================
NODE_ENV=development
LOG_LEVEL=debug
