-- =============================================================
-- 律植数据库完整迁移脚本（正确排序）
-- 按依赖顺序执行所有迁移
-- =============================================================

-- 01. 初始 Schema（核心表）
\i supabase/migrations/001_initial_schema.sql

-- 02. 社区系统
\i supabase/migrations/002_community.sql

-- 03. 重命名角色
\i supabase/migrations/003_rename_role_lawyer_to_creator.sql

-- 04. 产品和订单
\i supabase/migrations/004_products_and_orders.sql

-- 05. 订阅系统
\i supabase/migrations/005_subscriptions.sql

-- 06. 优惠券
\i supabase/migrations/006_coupons.sql

-- 07. 评论和点赞
\i supabase/migrations/007_comments_and_likes.sql

-- 08. 权限系统
\i supabase/migrations/008_permissions.sql

-- 09. API 系统
\i supabase/migrations/009_api_system.sql

-- 10. 扩展和视图
\i supabase/migrations/010_extensions_and_views.sql

-- 11. 认证系统
\i supabase/migrations/011_auth_system.sql

-- 12. 防火墙系统
\i supabase/migrations/012_firewall_system.sql

-- 13. 数据管理
\i supabase/migrations/013_data_management.sql

-- 14. 反爬虫系统
\i supabase/migrations/014_antibot_system.sql

-- 15. 下载和上传安全
\i supabase/migrations/015_download_upload_security.sql

-- 16. 学生认证
\i supabase/migrations/017_student_verification.sql

-- 17. 微信/支付宝认证
\i supabase/migrations/018_wechat_alipay_auth.sql

-- 18. API 使用统计
\i supabase/migrations/019_api_usage_stats.sql

-- 19. 上传文件
\i supabase/migrations/020_uploaded_files.sql

-- 20. Supabase 重复函数
\i supabase/migrations/000_supabase_repeatable.sql

-- =============================================================
-- 完成
-- =============================================================
