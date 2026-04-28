-- =============================================================
-- Repeatable Prelude For Existing Supabase Database
-- =============================================================

DO $$
BEGIN
  IF to_regclass('public.profiles') IS NOT NULL THEN
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
    UPDATE public.profiles
    SET role = 'creator'
    WHERE role = 'lawyer';
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('seeker', 'creator', 'recruiter', 'client', 'admin'));
  END IF;
END $$;

DO $$ BEGIN IF to_regclass('public.profiles') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "profiles: own read/write" ON public.profiles'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.profiles') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "profiles: public read" ON public.profiles'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.seeker_profiles') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "seeker_profiles: own read/write" ON public.seeker_profiles'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.lawyer_profiles') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "lawyer_profiles: own insert" ON public.lawyer_profiles'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.lawyer_profiles') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "lawyer_profiles: own update" ON public.lawyer_profiles'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.lawyer_profiles') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "lawyer_profiles: own delete" ON public.lawyer_profiles'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.lawyer_profiles') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "lawyer_profiles: public read" ON public.lawyer_profiles'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.recruiter_profiles') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "recruiter_profiles: own read/write" ON public.recruiter_profiles'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.jobs') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "jobs: recruiter manage" ON public.jobs'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.jobs') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "jobs: public read active" ON public.jobs'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.applications') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "applications: seeker manage" ON public.applications'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.applications') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "applications: recruiter read" ON public.applications'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.agents') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "agents: creator manage" ON public.agents'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.agents') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "agents: public read active" ON public.agents'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.agent_demos') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "agent_demos: insert authenticated" ON public.agent_demos'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.agent_demos') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "agent_demos: own read" ON public.agent_demos'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.agent_demos') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "agent_demos: creator read" ON public.agent_demos'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.promo_orders') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "promo_orders: own read/write" ON public.promo_orders'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.agents') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "agents: admin manage" ON public.agents'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.agent_favorites') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "agent_favorites: public read" ON public.agent_favorites'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.agent_favorites') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "agent_favorites: auth insert" ON public.agent_favorites'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.agent_favorites') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "agent_favorites: own delete" ON public.agent_favorites'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.agent_ratings') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "agent_ratings: public read" ON public.agent_ratings'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.agent_ratings') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "agent_ratings: auth insert" ON public.agent_ratings'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.agent_ratings') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "agent_ratings: own update" ON public.agent_ratings'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.user_follows') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "user_follows: public read" ON public.user_follows'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.user_follows') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "user_follows: auth insert" ON public.user_follows'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.user_follows') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "user_follows: own delete" ON public.user_follows'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.community_posts') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "community_posts: public read" ON public.community_posts'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.community_posts') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "community_posts: auth insert" ON public.community_posts'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.community_posts') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "community_posts: own update" ON public.community_posts'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.community_posts') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "community_posts: own delete" ON public.community_posts'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.products') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "products_select_active" ON products'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.products') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "products_insert_creator" ON products'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.products') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "products_update_own" ON products'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.products') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "products_delete_own" ON products'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.orders') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "orders_select_own" ON orders'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.orders') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "orders_insert_own" ON orders'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.orders') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "orders_update_own" ON orders'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.user_balances') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "balances_select_own" ON user_balances'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.balance_transactions') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "balance_tx_select_own" ON balance_transactions'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.subscriptions') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "subscriptions_select_own" ON subscriptions'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.subscriptions') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "subscriptions_insert_own" ON subscriptions'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.subscriptions') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "subscriptions_update_own" ON subscriptions'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.subscription_history') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "subscription_history_select_own" ON subscription_history'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.coupons') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "coupons_select_all" ON coupons'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.coupons') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "coupons_manage_admin" ON coupons'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.coupon_usages') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "coupon_usages_select_own" ON coupon_usages'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.user_coupons') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "user_coupons_select_own" ON user_coupons'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.comments') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "comments_select_all" ON comments'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.comments') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "comments_insert_authenticated" ON comments'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.comments') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "comments_update_own" ON comments'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.comments') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "comments_delete_own" ON comments'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.likes') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "likes_select_all" ON likes'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.likes') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "likes_insert_authenticated" ON likes'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.likes') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "likes_delete_own" ON likes'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.permissions') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "permissions_select_all" ON permissions'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.role_permissions') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "role_permissions_select_all" ON role_permissions'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.user_permissions') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "user_permissions_select_own" ON user_permissions'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.user_permissions') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "user_permissions_manage_admin" ON user_permissions'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.api_credentials') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "api_credentials_select_own" ON api_credentials'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.api_credentials') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "api_credentials_insert_creator" ON api_credentials'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.api_credentials') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "api_credentials_update_own" ON api_credentials'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.api_credentials') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "api_credentials_delete_own" ON api_credentials'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.api_call_logs') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "api_call_logs_select_own" ON api_call_logs'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.api_usage_stats') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "api_usage_stats_select_own" ON api_usage_stats'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.login_history') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "login_history_select_own" ON login_history'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.email_verifications') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "email_verifications_select_own" ON email_verifications'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.password_resets') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "password_resets_no_select" ON password_resets'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.security_events') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "security_events_select_own" ON security_events'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.account_locks') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "account_locks_select_own" ON account_locks'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.oauth_connections') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "oauth_connections_select_own" ON oauth_connections'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.oauth_connections') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "oauth_connections_delete_own" ON oauth_connections'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.user_sessions') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "user_sessions_select_own" ON user_sessions'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.user_sessions') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "user_sessions_delete_own" ON user_sessions'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.login_history') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "login_history_admin_all" ON login_history'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.security_events') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "security_events_admin_all" ON security_events'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.account_locks') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "account_locks_admin_all" ON account_locks'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.ip_blacklist') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "firewall_admin_only" ON ip_blacklist'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.ip_whitelist') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "whitelist_admin_only" ON ip_whitelist'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.rate_limit_records') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "rate_limit_admin_only" ON rate_limit_records'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.firewall_rules') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "firewall_rules_admin_only" ON firewall_rules'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.firewall_logs') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "firewall_logs_admin_only" ON firewall_logs'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.anomaly_detections') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "anomaly_admin_only" ON anomaly_detections'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.captcha_verifications') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "captcha_admin_only" ON captcha_verifications'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.data_backups') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "backups_admin_only" ON data_backups'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.data_restores') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "restores_admin_only" ON data_restores'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.data_exports') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "exports_select_own" ON data_exports'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.data_exports') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "exports_insert_own" ON data_exports'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.data_exports') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "exports_admin_all" ON data_exports'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.data_cleanup_tasks') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "cleanup_tasks_admin_only" ON data_cleanup_tasks'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.data_cleanup_logs') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "cleanup_logs_admin_only" ON data_cleanup_logs'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.data_audit_logs') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "audit_logs_select_own" ON data_audit_logs'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.data_quality_checks') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "quality_checks_admin_only" ON data_quality_checks'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.data_quality_results') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "quality_results_admin_only" ON data_quality_results'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.data_archives') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "archives_admin_only" ON data_archives'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.bot_signatures') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "bot_signatures_admin_only" ON bot_signatures'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.bot_detections') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "bot_detections_admin_only" ON bot_detections'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.access_behavior_analysis') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "access_behavior_admin_only" ON access_behavior_analysis'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.honeypot_traps') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "honeypot_traps_admin_only" ON honeypot_traps'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.honeypot_triggers') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "honeypot_triggers_admin_only" ON honeypot_triggers'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.data_access_controls') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "data_access_controls_admin_only" ON data_access_controls'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.data_masking_rules') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "data_masking_rules_admin_only" ON data_masking_rules'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.javascript_challenges') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "javascript_challenges_admin_only" ON javascript_challenges'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.data_downloads') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "downloads_select_own" ON data_downloads'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.data_downloads') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "downloads_admin_all" ON data_downloads'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.user_download_quotas') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "download_quotas_select_own" ON user_download_quotas'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.file_uploads') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "uploads_select_own" ON file_uploads'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.file_uploads') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "uploads_insert_own" ON file_uploads'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.file_uploads') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "uploads_admin_all" ON file_uploads'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.file_scan_rules') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "scan_rules_admin_only" ON file_scan_rules'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.file_anomaly_detections') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "file_anomaly_admin_only" ON file_anomaly_detections'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.upload_behavior_analysis') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "upload_behavior_admin_only" ON upload_behavior_analysis'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.ip_download_limits') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "ip_download_limits_admin_only" ON ip_download_limits'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.student_verifications') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "student_verifications_select_own" ON student_verifications'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.student_verifications') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "student_verifications_insert_own" ON student_verifications'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.student_verifications') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "student_verifications_update_own" ON student_verifications'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.student_verifications') IS NOT NULL THEN EXECUTE 'DROP POLICY IF EXISTS "student_verifications_admin_all" ON student_verifications'; END IF; END $$;

DO $$ BEGIN IF to_regclass('auth.users') IS NOT NULL THEN EXECUTE 'DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.profiles') IS NOT NULL THEN EXECUTE 'DROP TRIGGER IF EXISTS on_profile_created_balance ON profiles'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.coupon_usages') IS NOT NULL THEN EXECUTE 'DROP TRIGGER IF EXISTS on_coupon_used ON coupon_usages'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.comments') IS NOT NULL THEN EXECUTE 'DROP TRIGGER IF EXISTS on_comment_reply ON comments'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.likes') IS NOT NULL THEN EXECUTE 'DROP TRIGGER IF EXISTS on_comment_liked ON likes'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.likes') IS NOT NULL THEN EXECUTE 'DROP TRIGGER IF EXISTS on_post_liked ON likes'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.likes') IS NOT NULL THEN EXECUTE 'DROP TRIGGER IF EXISTS on_agent_liked ON likes'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.api_call_logs') IS NOT NULL THEN EXECUTE 'DROP TRIGGER IF EXISTS on_api_call_logged ON api_call_logs'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.comments') IS NOT NULL THEN EXECUTE 'DROP TRIGGER IF EXISTS on_post_commented ON comments'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.user_follows') IS NOT NULL THEN EXECUTE 'DROP TRIGGER IF EXISTS on_user_followed ON user_follows'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.applications') IS NOT NULL THEN EXECUTE 'DROP TRIGGER IF EXISTS on_job_applied ON applications'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.profiles') IS NOT NULL THEN EXECUTE 'DROP TRIGGER IF EXISTS audit_profiles_trigger ON profiles'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.honeypot_triggers') IS NOT NULL THEN EXECUTE 'DROP TRIGGER IF EXISTS on_honeypot_triggered ON honeypot_triggers'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.profiles') IS NOT NULL THEN EXECUTE 'DROP TRIGGER IF EXISTS on_profile_created_download_quota ON profiles'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.file_uploads') IS NOT NULL THEN EXECUTE 'DROP TRIGGER IF EXISTS on_file_uploaded ON file_uploads'; END IF; END $$;

DROP INDEX IF EXISTS jobs_recruiter_id_idx;
DROP INDEX IF EXISTS jobs_status_idx;
DROP INDEX IF EXISTS jobs_created_at_idx;
DROP INDEX IF EXISTS applications_job_id_idx;
DROP INDEX IF EXISTS applications_seeker_id_idx;
DROP INDEX IF EXISTS agents_creator_id_idx;
DROP INDEX IF EXISTS agents_status_idx;
DROP INDEX IF EXISTS agent_demos_agent_id_idx;
DROP INDEX IF EXISTS idx_products_creator;
DROP INDEX IF EXISTS idx_products_type;
DROP INDEX IF EXISTS idx_products_status;
DROP INDEX IF EXISTS idx_orders_user;
DROP INDEX IF EXISTS idx_orders_product;
DROP INDEX IF EXISTS idx_orders_status;
DROP INDEX IF EXISTS idx_orders_payment_id;
DROP INDEX IF EXISTS idx_balance_tx_user;
DROP INDEX IF EXISTS idx_balance_tx_type;
DROP INDEX IF EXISTS idx_subscriptions_user;
DROP INDEX IF EXISTS idx_subscriptions_status;
DROP INDEX IF EXISTS idx_subscriptions_product;
DROP INDEX IF EXISTS idx_subscription_history_sub;
DROP INDEX IF EXISTS idx_coupons_code;
DROP INDEX IF EXISTS idx_coupons_valid;
DROP INDEX IF EXISTS idx_coupon_usages_coupon;
DROP INDEX IF EXISTS idx_coupon_usages_user;
DROP INDEX IF EXISTS idx_coupon_usages_order;
DROP INDEX IF EXISTS idx_user_coupons_user;
DROP INDEX IF EXISTS idx_comments_target;
DROP INDEX IF EXISTS idx_comments_user;
DROP INDEX IF EXISTS idx_comments_parent;
DROP INDEX IF EXISTS idx_likes_target;
DROP INDEX IF EXISTS idx_likes_user;
DROP INDEX IF EXISTS idx_permissions_resource;
DROP INDEX IF EXISTS idx_role_permissions_role;
DROP INDEX IF EXISTS idx_user_permissions_user;
DROP INDEX IF EXISTS idx_user_permissions_expires;
DROP INDEX IF EXISTS idx_api_credentials_key;
DROP INDEX IF EXISTS idx_api_credentials_user;
DROP INDEX IF EXISTS idx_api_call_logs_user;
DROP INDEX IF EXISTS idx_api_call_logs_key;
DROP INDEX IF EXISTS idx_api_call_logs_service;
DROP INDEX IF EXISTS idx_api_usage_stats_user;
DROP INDEX IF EXISTS idx_agents_product;
DROP INDEX IF EXISTS idx_community_posts_product;
DROP INDEX IF EXISTS idx_login_history_user;
DROP INDEX IF EXISTS idx_login_history_ip;
DROP INDEX IF EXISTS idx_email_verifications_user;
DROP INDEX IF EXISTS idx_email_verifications_code;
DROP INDEX IF EXISTS idx_password_resets_user;
DROP INDEX IF EXISTS idx_password_resets_token;
DROP INDEX IF EXISTS idx_security_events_user;
DROP INDEX IF EXISTS idx_security_events_type;
DROP INDEX IF EXISTS idx_account_locks_user;
DROP INDEX IF EXISTS idx_account_locks_active;
DROP INDEX IF EXISTS idx_oauth_connections_user;
DROP INDEX IF EXISTS idx_oauth_connections_provider;
DROP INDEX IF EXISTS idx_user_sessions_user;
DROP INDEX IF EXISTS idx_user_sessions_token;
DROP INDEX IF EXISTS idx_user_sessions_expires;
DROP INDEX IF EXISTS idx_ip_blacklist_ip;
DROP INDEX IF EXISTS idx_ip_blacklist_expires;
DROP INDEX IF EXISTS idx_ip_whitelist_ip;
DROP INDEX IF EXISTS idx_rate_limit_identifier;
DROP INDEX IF EXISTS idx_rate_limit_window;
DROP INDEX IF EXISTS idx_firewall_rules_priority;
DROP INDEX IF EXISTS idx_firewall_rules_type;
DROP INDEX IF EXISTS idx_firewall_logs_ip;
DROP INDEX IF EXISTS idx_firewall_logs_rule;
DROP INDEX IF EXISTS idx_firewall_logs_action;
DROP INDEX IF EXISTS idx_firewall_logs_time;
DROP INDEX IF EXISTS idx_anomaly_detections_type;
DROP INDEX IF EXISTS idx_anomaly_detections_severity;
DROP INDEX IF EXISTS idx_anomaly_detections_reviewed;
DROP INDEX IF EXISTS idx_anomaly_detections_ip;
DROP INDEX IF EXISTS idx_captcha_verifications_session;
DROP INDEX IF EXISTS idx_captcha_verifications_ip;
DROP INDEX IF EXISTS idx_data_backups_status;
DROP INDEX IF EXISTS idx_data_backups_type;
DROP INDEX IF EXISTS idx_data_restores_status;
DROP INDEX IF EXISTS idx_data_restores_backup;
DROP INDEX IF EXISTS idx_data_exports_user;
DROP INDEX IF EXISTS idx_data_exports_status;
DROP INDEX IF EXISTS idx_data_exports_expires;
DROP INDEX IF EXISTS idx_data_cleanup_tasks_schedule;
DROP INDEX IF EXISTS idx_data_cleanup_tasks_table;
DROP INDEX IF EXISTS idx_data_cleanup_logs_task;
DROP INDEX IF EXISTS idx_data_cleanup_logs_table;
DROP INDEX IF EXISTS idx_data_audit_logs_table;
DROP INDEX IF EXISTS idx_data_audit_logs_record;
DROP INDEX IF EXISTS idx_data_audit_logs_user;
DROP INDEX IF EXISTS idx_data_audit_logs_operation;
DROP INDEX IF EXISTS idx_data_quality_checks_table;
DROP INDEX IF EXISTS idx_data_quality_checks_schedule;
DROP INDEX IF EXISTS idx_data_quality_results_check;
DROP INDEX IF EXISTS idx_data_quality_results_passed;
DROP INDEX IF EXISTS idx_data_archives_table;
DROP INDEX IF EXISTS idx_bot_signatures_type;
DROP INDEX IF EXISTS idx_bot_signatures_category;
DROP INDEX IF EXISTS idx_bot_detections_ip;
DROP INDEX IF EXISTS idx_bot_detections_method;
DROP INDEX IF EXISTS idx_bot_detections_action;
DROP INDEX IF EXISTS idx_bot_detections_risk;
DROP INDEX IF EXISTS idx_access_behavior_identifier;
DROP INDEX IF EXISTS idx_access_behavior_probability;
DROP INDEX IF EXISTS idx_honeypot_traps_path;
DROP INDEX IF EXISTS idx_honeypot_triggers_trap;
DROP INDEX IF EXISTS idx_honeypot_triggers_ip;
DROP INDEX IF EXISTS idx_data_access_controls_resource;
DROP INDEX IF EXISTS idx_data_masking_rules_table;
DROP INDEX IF EXISTS idx_javascript_challenges_session;
DROP INDEX IF EXISTS idx_javascript_challenges_token;
DROP INDEX IF EXISTS idx_javascript_challenges_ip;
DROP INDEX IF EXISTS idx_data_downloads_user;
DROP INDEX IF EXISTS idx_data_downloads_resource;
DROP INDEX IF EXISTS idx_file_uploads_user;
DROP INDEX IF EXISTS idx_file_uploads_hash;
DROP INDEX IF EXISTS idx_file_uploads_scan_status;
DROP INDEX IF EXISTS idx_file_scan_rules_type;
DROP INDEX IF EXISTS idx_file_anomaly_upload;
DROP INDEX IF EXISTS idx_file_anomaly_type;
DROP INDEX IF EXISTS idx_file_anomaly_severity;
DROP INDEX IF EXISTS idx_file_anomaly_reviewed;
DROP INDEX IF EXISTS idx_upload_behavior_user;
DROP INDEX IF EXISTS idx_upload_behavior_risk;

DO $$ BEGIN IF to_regclass('public.role_permissions') IS NOT NULL THEN EXECUTE 'DELETE FROM role_permissions WHERE role IN (''seeker'',''creator'',''recruiter'',''client'',''admin'')'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.permissions') IS NOT NULL THEN EXECUTE 'DELETE FROM permissions WHERE name IN (''manage_users'',''view_user_details'',''ban_users'',''create_agent'',''publish_agent'',''review_agents'',''delete_any_agent'',''create_post'',''create_paid_post'',''review_posts'',''delete_any_post'',''create_job'',''review_jobs'',''view_own_orders'',''view_all_orders'',''refund_orders'',''access_analytics'',''manage_coupons'',''manage_permissions'')'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.firewall_rules') IS NOT NULL THEN EXECUTE 'DELETE FROM firewall_rules WHERE rule_name IN (''阻止已知恶意 IP 段'',''API 频率限制'',''阻止可疑 User-Agent'')'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.honeypot_traps') IS NOT NULL THEN EXECUTE 'DELETE FROM honeypot_traps WHERE trap_path IN (''/api/internal/admin-data'',''/secret-agents-list'',''/api/v1/users/all'')'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.file_scan_rules') IS NOT NULL THEN EXECUTE 'DELETE FROM file_scan_rules WHERE rule_name IN (''禁止可执行文件'',''禁止超大文件'',''可疑文件名'',''允许的图片格式'',''允许的文档格式'')'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.data_masking_rules') IS NOT NULL THEN EXECUTE 'DELETE FROM data_masking_rules WHERE (table_name, column_name) IN ((''profiles'',''email''),(''profiles'',''phone''),(''lawyer_profiles'',''bar_number''),(''orders'',''payment_id''))'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.bot_signatures') IS NOT NULL THEN EXECUTE 'DELETE FROM bot_signatures WHERE (signature_type, signature_value) IN ((''user_agent'',''Googlebot''),(''user_agent'',''Baiduspider''),(''user_agent'',''bingbot''),(''user_agent'',''scrapy''),(''user_agent'',''python-requests''),(''user_agent'',''curl''),(''user_agent'',''wget''),(''user_agent'',''selenium''),(''user_agent'',''puppeteer''),(''user_agent'',''headless''))'; END IF; END $$;
DO $$ BEGIN IF to_regclass('public.data_access_controls') IS NOT NULL THEN EXECUTE 'DELETE FROM data_access_controls WHERE (resource_type, access_level, rate_limit_per_minute, rate_limit_per_hour, rate_limit_per_day) IN ((''agent'',''public'',10,100,500),(''user_profile'',''authenticated'',5,50,200),(''post'',''public'',10,100,500),(''api_endpoint'',''authenticated'',20,200,1000))'; END IF; END $$;

-- =============================================================
-- 律植（职）MVP 初始数据库 Schema
-- 在 Supabase SQL 编辑器中执行此文件
-- =============================================================

-- 用户档案（扩展 Supabase auth.users）
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  role text not null check (role in ('seeker', 'lawyer', 'recruiter', 'client', 'admin')),
  display_name text,
  avatar_url text,
  bio text,
  phone text,
  verified boolean default false,
  created_at timestamptz default now()
);

-- 求职方详情
create table if not exists public.seeker_profiles (
  user_id uuid references public.profiles on delete cascade primary key,
  education_level text,
  school text,
  graduation_year int,
  skill_tags text[],
  resume_url text,
  ai_skill_portrait jsonb
);

-- 律师详情
create table if not exists public.lawyer_profiles (
  user_id uuid references public.profiles on delete cascade primary key,
  bar_number text unique,
  law_firm text,
  specialty text[],
  years_experience int,
  verified_at timestamptz
);

-- 招聘方/律所详情
create table if not exists public.recruiter_profiles (
  user_id uuid references public.profiles on delete cascade primary key,
  org_name text,
  org_type text check (org_type in ('law_firm', 'enterprise')),
  business_license_url text,
  verified_at timestamptz
);

-- 职位
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  recruiter_id uuid references public.profiles on delete cascade not null,
  title text not null,
  description text,
  requirements text,
  location text,
  salary_range text,
  job_type text check (job_type in ('full_time', 'intern', 'part_time')),
  specialty text[],
  status text default 'active' check (status in ('active', 'closed', 'draft')),
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- 求职申请
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs on delete cascade not null,
  seeker_id uuid references public.profiles on delete cascade not null,
  status text default 'pending' check (
    status in ('pending', 'viewed', 'interviewing', 'rejected', 'offered')
  ),
  cover_letter text,
  applied_at timestamptz default now(),
  unique(job_id, seeker_id)
);

-- 法律智能体
create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references public.profiles on delete cascade not null,
  name text not null,
  description text,
  category text check (
    category in ('contract', 'litigation', 'consultation', 'compliance', 'other')
  ),
  price numeric(10, 2) default 0,
  is_free_trial boolean default true,
  status text default 'pending_review' check (
    status in ('pending_review', 'active', 'rejected')
  ),
  demo_content jsonb,
  created_at timestamptz default now()
);

-- 智能体演示事件
create table if not exists public.agent_demos (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.agents on delete cascade not null,
  viewer_id uuid references public.profiles on delete set null,
  started_at timestamptz default now(),
  completed_at timestamptz,
  converted boolean default false
);

-- 律师推广订单
create table if not exists public.promo_orders (
  id uuid primary key default gen_random_uuid(),
  lawyer_id uuid references public.profiles on delete cascade not null,
  plan_type text check (plan_type in ('basic', 'featured', 'premium')),
  status text default 'active',
  started_at timestamptz,
  expires_at timestamptz,
  amount numeric(10, 2)
);

-- =============================================================
-- 索引
-- =============================================================

create index if not exists jobs_recruiter_id_idx on public.jobs(recruiter_id);
create index if not exists jobs_status_idx on public.jobs(status);
create index if not exists jobs_created_at_idx on public.jobs(created_at desc);
create index if not exists applications_job_id_idx on public.applications(job_id);
create index if not exists applications_seeker_id_idx on public.applications(seeker_id);
create index if not exists agents_creator_id_idx on public.agents(creator_id);
create index if not exists agents_status_idx on public.agents(status);
create index if not exists agent_demos_agent_id_idx on public.agent_demos(agent_id);

-- =============================================================
-- Row Level Security (RLS)
-- =============================================================

-- 开启 RLS
alter table public.profiles enable row level security;
alter table public.seeker_profiles enable row level security;
alter table public.lawyer_profiles enable row level security;
alter table public.recruiter_profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
alter table public.agents enable row level security;
alter table public.agent_demos enable row level security;
alter table public.promo_orders enable row level security;

-- profiles：用户只能读写自己的档案，所有人可以看已验证用户的公开信息
create policy "profiles: own read/write"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles: public read"
  on public.profiles for select
  using (true);

-- seeker_profiles：只有本人可读写
create policy "seeker_profiles: own read/write"
  on public.seeker_profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- lawyer_profiles：本人读写，所有人可读
create policy "lawyer_profiles: own insert"
  on public.lawyer_profiles for insert
  with check (auth.uid() = user_id);

create policy "lawyer_profiles: own update"
  on public.lawyer_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "lawyer_profiles: own delete"
  on public.lawyer_profiles for delete
  using (auth.uid() = user_id);

create policy "lawyer_profiles: public read"
  on public.lawyer_profiles for select
  using (true);

-- recruiter_profiles：只有本人可读写
create policy "recruiter_profiles: own read/write"
  on public.recruiter_profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- jobs：招聘方管理自己的职位，所有人可看 active 职位
create policy "jobs: recruiter manage"
  on public.jobs for all
  using (auth.uid() = recruiter_id)
  with check (auth.uid() = recruiter_id);

create policy "jobs: public read active"
  on public.jobs for select
  using (status = 'active');

-- applications：求职方投递/查看自己的申请，招聘方查看针对自己职位的申请
create policy "applications: seeker manage"
  on public.applications for all
  using (auth.uid() = seeker_id)
  with check (auth.uid() = seeker_id);

create policy "applications: recruiter read"
  on public.applications for select
  using (
    exists (
      select 1 from public.jobs
      where jobs.id = applications.job_id
        and jobs.recruiter_id = auth.uid()
    )
  );

-- agents：律师管理自己的智能体，所有人可看 active 的智能体
create policy "agents: creator manage"
  on public.agents for all
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

create policy "agents: public read active"
  on public.agents for select
  using (status = 'active');

-- agent_demos：任何登录用户可以创建演示记录，只能看自己的记录
create policy "agent_demos: insert authenticated"
  on public.agent_demos for insert
  with check (auth.uid() is not null);

create policy "agent_demos: own read"
  on public.agent_demos for select
  using (auth.uid() = viewer_id);

create policy "agent_demos: creator read"
  on public.agent_demos for select
  using (
    exists (
      select 1 from public.agents
      where agents.id = agent_demos.agent_id
        and agents.creator_id = auth.uid()
    )
  );

-- promo_orders：律师只能看自己的推广订单
create policy "promo_orders: own read/write"
  on public.promo_orders for all
  using (auth.uid() = lawyer_id)
  with check (auth.uid() = lawyer_id);

-- admin：管理员可以读写所有智能体（含待审核）
create policy "agents: admin manage"
  on public.agents for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- =============================================================
-- 触发器：注册时自动创建 profile
-- =============================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'seeker'),
    coalesce(new.raw_user_meta_data->>'display_name', new.email)
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
-- ────────────────────────────────────────────────
-- v2.1 Community features migration
-- 在 Supabase SQL Editor 中执行此文件
-- ────────────────────────────────────────────────

-- 1. agents 表新增字段
alter table public.agents
  add column if not exists pricing_model text not null default 'free'
    check (pricing_model in ('free', 'freemium', 'per_use', 'subscription', 'commercial')),
  add column if not exists monthly_price numeric(10,2),
  add column if not exists tags text[] default '{}';

-- 2. 智能体收藏表
create table if not exists public.agent_favorites (
  id           uuid primary key default gen_random_uuid(),
  agent_id     uuid references public.agents(id)   on delete cascade not null,
  user_id      uuid references public.profiles(id)  on delete cascade not null,
  created_at   timestamptz default now(),
  unique(agent_id, user_id)
);
alter table public.agent_favorites enable row level security;

create policy "agent_favorites: public read"
  on public.agent_favorites for select using (true);
create policy "agent_favorites: auth insert"
  on public.agent_favorites for insert with check (auth.uid() = user_id);
create policy "agent_favorites: own delete"
  on public.agent_favorites for delete using (auth.uid() = user_id);

-- 3. 智能体评分表
create table if not exists public.agent_ratings (
  id           uuid primary key default gen_random_uuid(),
  agent_id     uuid references public.agents(id)   on delete cascade not null,
  user_id      uuid references public.profiles(id)  on delete cascade not null,
  score        int not null check (score between 1 and 5),
  comment      text,
  created_at   timestamptz default now(),
  unique(agent_id, user_id)
);
alter table public.agent_ratings enable row level security;

create policy "agent_ratings: public read"
  on public.agent_ratings for select using (true);
create policy "agent_ratings: auth insert"
  on public.agent_ratings for insert with check (auth.uid() = user_id);
create policy "agent_ratings: own update"
  on public.agent_ratings for update using (auth.uid() = user_id);

-- 4. 用户关注表
create table if not exists public.user_follows (
  id           uuid primary key default gen_random_uuid(),
  follower_id  uuid references public.profiles(id)  on delete cascade not null,
  following_id uuid references public.profiles(id)  on delete cascade not null,
  created_at   timestamptz default now(),
  unique(follower_id, following_id),
  check (follower_id != following_id)
);
alter table public.user_follows enable row level security;

create policy "user_follows: public read"
  on public.user_follows for select using (true);
create policy "user_follows: auth insert"
  on public.user_follows for insert with check (auth.uid() = follower_id);
create policy "user_follows: own delete"
  on public.user_follows for delete using (auth.uid() = follower_id);

-- 5. 社区帖子表
create table if not exists public.community_posts (
  id            uuid primary key default gen_random_uuid(),
  author_id     uuid references public.profiles(id)  on delete cascade not null,
  title         text not null,
  content       text,
  agent_id      uuid references public.agents(id)    on delete set null,
  tags          text[] default '{}',
  view_count    int default 0,
  like_count    int default 0,
  comment_count int default 0,
  created_at    timestamptz default now()
);
alter table public.community_posts enable row level security;

create policy "community_posts: public read"
  on public.community_posts for select using (true);
create policy "community_posts: auth insert"
  on public.community_posts for insert with check (auth.uid() = author_id);
create policy "community_posts: own update"
  on public.community_posts for update using (auth.uid() = author_id);
create policy "community_posts: own delete"
  on public.community_posts for delete using (auth.uid() = author_id);
-- Migrate role value from 'lawyer' to 'creator'
UPDATE profiles SET role = 'creator' WHERE role = 'lawyer';

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('seeker','creator','recruiter','client','admin'));
-- ============================================
-- 004: 商品管理与订单系统
-- ============================================

-- ──────────────────────────────────────────
-- 1. 商品表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_type TEXT NOT NULL CHECK (product_type IN ('agent', 'consultation', 'course', 'content')),
  related_id UUID, -- 关联到 agents/posts 等具体实体
  name TEXT NOT NULL,
  description TEXT,
  pricing_type TEXT CHECK (pricing_type IN ('free', 'one_time', 'subscription', 'usage_based')),
  price DECIMAL(10,2) DEFAULT 0 CHECK (price >= 0),
  currency TEXT DEFAULT 'CNY',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_creator ON products(creator_id);
CREATE INDEX idx_products_type ON products(product_type);
CREATE INDEX idx_products_status ON products(status) WHERE status = 'active';

COMMENT ON TABLE products IS '商品表：智能体、咨询服务、课程等统一抽象';
COMMENT ON COLUMN products.related_id IS '关联实体ID（如 agents.id, community_posts.id）';
COMMENT ON COLUMN products.metadata IS '扩展字段：规格、库存、标签等';

-- ──────────────────────────────────────────
-- 2. 订单表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('purchase', 'subscription', 'recharge')),
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  currency TEXT DEFAULT 'CNY',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'refunded')),
  payment_method TEXT, -- 'alipay', 'wechat', 'balance'
  payment_id TEXT, -- 第三方支付流水号
  metadata JSONB DEFAULT '{}',
  paid_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_user ON orders(user_id, created_at DESC);
CREATE INDEX idx_orders_product ON orders(product_id);
CREATE INDEX idx_orders_status ON orders(status, created_at DESC);
CREATE INDEX idx_orders_payment_id ON orders(payment_id) WHERE payment_id IS NOT NULL;

COMMENT ON TABLE orders IS '订单表：购买、订阅、充值统一管理';
COMMENT ON COLUMN orders.metadata IS '订单详情：商品快照、优惠券、发票信息等';

-- ──────────────────────────────────────────
-- 3. 用户余额表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_balances (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  balance DECIMAL(10,2) DEFAULT 0 CHECK (balance >= 0),
  frozen_balance DECIMAL(10,2) DEFAULT 0 CHECK (frozen_balance >= 0),
  total_recharged DECIMAL(10,2) DEFAULT 0 CHECK (total_recharged >= 0),
  total_consumed DECIMAL(10,2) DEFAULT 0 CHECK (total_consumed >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE user_balances IS '用户余额表：支持内部积分/token体系';
COMMENT ON COLUMN user_balances.frozen_balance IS '冻结余额：待结算订单、提现中等';

-- ──────────────────────────────────────────
-- 4. 余额变动记录
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS balance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN (
    'recharge', 'purchase', 'refund', 'reward',
    'withdrawal', 'system_adjustment', 'api_call'
  )),
  amount DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_balance_tx_user ON balance_transactions(user_id, created_at DESC);
CREATE INDEX idx_balance_tx_type ON balance_transactions(transaction_type, created_at DESC);

COMMENT ON TABLE balance_transactions IS '余额变动记录：包含隐藏的 API 调用扣费';
COMMENT ON COLUMN balance_transactions.metadata IS 'API调用详情：model, tokens, endpoint 等';

-- ──────────────────────────────────────────
-- 5. 触发器：自动创建用户余额
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION create_user_balance()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_balances (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created_balance
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_user_balance();

-- ──────────────────────────────────────────
-- 6. RLS 策略
-- ──────────────────────────────────────────
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_transactions ENABLE ROW LEVEL SECURITY;

-- Products: 所有人可查看 active 商品，创作者管理自己的商品
CREATE POLICY "products_select_active" ON products
  FOR SELECT USING (status = 'active' OR creator_id = auth.uid());

CREATE POLICY "products_insert_creator" ON products
  FOR INSERT WITH CHECK (
    creator_id = auth.uid() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('creator', 'admin'))
  );

CREATE POLICY "products_update_own" ON products
  FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY "products_delete_own" ON products
  FOR DELETE USING (creator_id = auth.uid());

-- Orders: 用户只能查看自己的订单
CREATE POLICY "orders_select_own" ON orders
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "orders_insert_own" ON orders
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "orders_update_own" ON orders
  FOR UPDATE USING (user_id = auth.uid());

-- User Balances: 用户只能查看自己的余额
CREATE POLICY "balances_select_own" ON user_balances
  FOR SELECT USING (user_id = auth.uid());

-- Balance Transactions: 用户只能查看自己的交易记录
CREATE POLICY "balance_tx_select_own" ON balance_transactions
  FOR SELECT USING (user_id = auth.uid());
-- ============================================
-- 005: 订阅系统
-- ============================================

-- ──────────────────────────────────────────
-- 1. 订阅表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'quarterly', 'yearly')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'paused')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  auto_renew BOOLEAN DEFAULT true,
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status, current_period_end);
CREATE INDEX idx_subscriptions_product ON subscriptions(product_id);

COMMENT ON TABLE subscriptions IS '订阅表：月度会员、年度会员等';
COMMENT ON COLUMN subscriptions.cancel_reason IS '取消原因：用于改进产品';

-- ──────────────────────────────────────────
-- 2. 订阅历史记录
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('created', 'renewed', 'cancelled', 'expired', 'paused', 'resumed')),
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  amount DECIMAL(10,2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscription_history_sub ON subscription_history(subscription_id, created_at DESC);

COMMENT ON TABLE subscription_history IS '订阅历史：续费、取消、暂停等事件记录';

-- ──────────────────────────────────────────
-- 3. 自动过期订阅的函数（需配合定时任务）
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION expire_subscriptions()
RETURNS void AS $$
BEGIN
  UPDATE subscriptions
  SET status = 'expired',
      updated_at = NOW()
  WHERE status = 'active'
    AND current_period_end < NOW()
    AND auto_renew = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION expire_subscriptions IS '定时任务：每日执行，自动过期未续费订阅';

-- ──────────────────────────────────────────
-- 4. RLS 策略
-- ──────────────────────────────────────────
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

-- Subscriptions: 用户只能查看和管理自己的订阅
CREATE POLICY "subscriptions_select_own" ON subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "subscriptions_insert_own" ON subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "subscriptions_update_own" ON subscriptions
  FOR UPDATE USING (user_id = auth.uid());

-- Subscription History: 用户只能查看自己的订阅历史
CREATE POLICY "subscription_history_select_own" ON subscription_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM subscriptions
      WHERE subscriptions.id = subscription_history.subscription_id
        AND subscriptions.user_id = auth.uid()
    )
  );
-- ============================================
-- 006: 优惠券系统
-- ============================================

-- ──────────────────────────────────────────
-- 1. 优惠券表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  coupon_type TEXT NOT NULL CHECK (coupon_type IN ('percentage', 'fixed_amount', 'free_trial')),
  discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value > 0),
  min_purchase_amount DECIMAL(10,2) DEFAULT 0 CHECK (min_purchase_amount >= 0),
  max_discount_amount DECIMAL(10,2),
  applicable_products JSONB DEFAULT '[]', -- 空数组表示全部商品可用
  usage_limit INTEGER, -- NULL 表示无限制
  used_count INTEGER DEFAULT 0 CHECK (used_count >= 0),
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_coupons_code ON coupons(code) WHERE is_active = true;
CREATE INDEX idx_coupons_valid ON coupons(valid_from, valid_until) WHERE is_active = true;

COMMENT ON TABLE coupons IS '优惠券表：支持百分比折扣、固定金额、免费试用';
COMMENT ON COLUMN coupons.applicable_products IS '可用商品ID数组，空数组表示全部可用';
COMMENT ON COLUMN coupons.usage_limit IS '总使用次数限制，NULL表示无限制';

-- ──────────────────────────────────────────
-- 2. 优惠券使用记录
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coupon_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  discount_amount DECIMAL(10,2) NOT NULL CHECK (discount_amount >= 0),
  used_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(coupon_id, order_id)
);

CREATE INDEX idx_coupon_usages_coupon ON coupon_usages(coupon_id);
CREATE INDEX idx_coupon_usages_user ON coupon_usages(user_id);
CREATE INDEX idx_coupon_usages_order ON coupon_usages(order_id);

COMMENT ON TABLE coupon_usages IS '优惠券使用记录';

-- ──────────────────────────────────────────
-- 3. 用户优惠券领取记录（支持发放优惠券给特定用户）
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  is_used BOOLEAN DEFAULT false,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ,
  UNIQUE(user_id, coupon_id)
);

CREATE INDEX idx_user_coupons_user ON user_coupons(user_id, is_used);

COMMENT ON TABLE user_coupons IS '用户优惠券：支持定向发放优惠券';

-- ──────────────────────────────────────────
-- 4. 触发器：更新优惠券使用次数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_coupon_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE coupons
  SET used_count = used_count + 1,
      updated_at = NOW()
  WHERE id = NEW.coupon_id;

  -- 更新用户优惠券状态
  UPDATE user_coupons
  SET is_used = true,
      used_at = NOW()
  WHERE user_id = NEW.user_id
    AND coupon_id = NEW.coupon_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_coupon_used
  AFTER INSERT ON coupon_usages
  FOR EACH ROW
  EXECUTE FUNCTION increment_coupon_usage();

-- ──────────────────────────────────────────
-- 5. 验证优惠券有效性的函数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION validate_coupon(
  p_code TEXT,
  p_user_id UUID,
  p_product_id UUID,
  p_amount DECIMAL
)
RETURNS TABLE(
  valid BOOLEAN,
  coupon_id UUID,
  discount_amount DECIMAL,
  message TEXT
) AS $$
DECLARE
  v_coupon RECORD;
  v_discount DECIMAL;
BEGIN
  -- 查询优惠券
  SELECT * INTO v_coupon
  FROM coupons
  WHERE code = p_code
    AND is_active = true
    AND valid_from <= NOW()
    AND (valid_until IS NULL OR valid_until >= NOW());

  -- 优惠券不存在或已过期
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, 0::DECIMAL, '优惠券无效或已过期';
    RETURN;
  END IF;

  -- 检查使用次数限制
  IF v_coupon.usage_limit IS NOT NULL AND v_coupon.used_count >= v_coupon.usage_limit THEN
    RETURN QUERY SELECT false, NULL::UUID, 0::DECIMAL, '优惠券已达使用上限';
    RETURN;
  END IF;

  -- 检查最低消费金额
  IF p_amount < v_coupon.min_purchase_amount THEN
    RETURN QUERY SELECT false, NULL::UUID, 0::DECIMAL,
      '订单金额不满足优惠券使用条件（最低 ' || v_coupon.min_purchase_amount || ' 元）';
    RETURN;
  END IF;

  -- 检查商品适用范围
  IF jsonb_array_length(v_coupon.applicable_products) > 0 THEN
    IF NOT (v_coupon.applicable_products @> to_jsonb(p_product_id)) THEN
      RETURN QUERY SELECT false, NULL::UUID, 0::DECIMAL, '该商品不适用此优惠券';
      RETURN;
    END IF;
  END IF;

  -- 计算折扣金额
  IF v_coupon.coupon_type = 'percentage' THEN
    v_discount := p_amount * v_coupon.discount_value / 100;
  ELSIF v_coupon.coupon_type = 'fixed_amount' THEN
    v_discount := v_coupon.discount_value;
  ELSE
    v_discount := p_amount; -- free_trial 全免
  END IF;

  -- 应用最大折扣限制
  IF v_coupon.max_discount_amount IS NOT NULL THEN
    v_discount := LEAST(v_discount, v_coupon.max_discount_amount);
  END IF;

  -- 折扣不能超过订单金额
  v_discount := LEAST(v_discount, p_amount);

  RETURN QUERY SELECT true, v_coupon.id, v_discount, '优惠券有效';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION validate_coupon IS '验证优惠券并计算折扣金额';

-- ──────────────────────────────────────────
-- 6. RLS 策略
-- ──────────────────────────────────────────
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_coupons ENABLE ROW LEVEL SECURITY;

-- Coupons: 所有人可查看有效优惠券，管理员可管理
CREATE POLICY "coupons_select_all" ON coupons
  FOR SELECT USING (is_active = true);

CREATE POLICY "coupons_manage_admin" ON coupons
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Coupon Usages: 用户只能查看自己的使用记录
CREATE POLICY "coupon_usages_select_own" ON coupon_usages
  FOR SELECT USING (user_id = auth.uid());

-- User Coupons: 用户只能查看自己的优惠券
CREATE POLICY "user_coupons_select_own" ON user_coupons
  FOR SELECT USING (user_id = auth.uid());
-- ============================================
-- 007: 评论与点赞系统
-- ============================================

-- ──────────────────────────────────────────
-- 1. 通用评论表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('agent', 'post', 'product', 'job', 'comment')),
  target_id UUID NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(content) > 0 AND length(content) <= 5000),
  like_count INTEGER DEFAULT 0 CHECK (like_count >= 0),
  reply_count INTEGER DEFAULT 0 CHECK (reply_count >= 0),
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_target ON comments(target_type, target_id, created_at DESC) WHERE is_deleted = false;
CREATE INDEX idx_comments_user ON comments(user_id, created_at DESC);
CREATE INDEX idx_comments_parent ON comments(parent_id) WHERE parent_id IS NOT NULL;

COMMENT ON TABLE comments IS '通用评论表：支持智能体、帖子、商品、职位等多种实体';
COMMENT ON COLUMN comments.parent_id IS '父评论ID，支持多级回复';
COMMENT ON COLUMN comments.is_deleted IS '软删除标记';

-- ──────────────────────────────────────────
-- 2. 通用点赞表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('agent', 'post', 'comment', 'product', 'job')),
  target_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, target_type, target_id)
);

CREATE INDEX idx_likes_target ON likes(target_type, target_id);
CREATE INDEX idx_likes_user ON likes(user_id, created_at DESC);

COMMENT ON TABLE likes IS '通用点赞表：支持多种实体类型';

-- ──────────────────────────────────────────
-- 3. 触发器：更新评论回复数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_comment_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL THEN
    UPDATE comments
    SET reply_count = reply_count + 1,
        updated_at = NOW()
    WHERE id = NEW.parent_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NOT NULL THEN
    UPDATE comments
    SET reply_count = GREATEST(0, reply_count - 1),
        updated_at = NOW()
    WHERE id = OLD.parent_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_comment_reply
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_reply_count();

-- ──────────────────────────────────────────
-- 4. 触发器：更新评论点赞数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_comment_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.target_type = 'comment' THEN
    UPDATE comments
    SET like_count = like_count + 1,
        updated_at = NOW()
    WHERE id = NEW.target_id;
  ELSIF TG_OP = 'DELETE' AND OLD.target_type = 'comment' THEN
    UPDATE comments
    SET like_count = GREATEST(0, like_count - 1),
        updated_at = NOW()
    WHERE id = OLD.target_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_comment_liked
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_like_count();

-- ──────────────────────────────────────────
-- 5. 触发器：更新帖子点赞数（扩展现有 community_posts）
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.target_type = 'post' THEN
    UPDATE community_posts
    SET like_count = like_count + 1
    WHERE id = NEW.target_id;
  ELSIF TG_OP = 'DELETE' AND OLD.target_type = 'post' THEN
    UPDATE community_posts
    SET like_count = GREATEST(0, like_count - 1)
    WHERE id = OLD.target_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_post_liked
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_like_count();

-- ──────────────────────────────────────────
-- 6. 触发器：更新智能体点赞数（扩展现有 agents）
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_agent_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.target_type = 'agent' THEN
    UPDATE agents
    SET metadata = jsonb_set(
      COALESCE(metadata, '{}'),
      '{like_count}',
      to_jsonb(COALESCE((metadata->>'like_count')::int, 0) + 1)
    )
    WHERE id = NEW.target_id;
  ELSIF TG_OP = 'DELETE' AND OLD.target_type = 'agent' THEN
    UPDATE agents
    SET metadata = jsonb_set(
      COALESCE(metadata, '{}'),
      '{like_count}',
      to_jsonb(GREATEST(0, COALESCE((metadata->>'like_count')::int, 0) - 1))
    )
    WHERE id = OLD.target_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_agent_liked
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_like_count();

-- ──────────────────────────────────────────
-- 7. RLS 策略
-- ──────────────────────────────────────────
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Comments: 所有人可查看未删除评论，用户可管理自己的评论
CREATE POLICY "comments_select_all" ON comments
  FOR SELECT USING (is_deleted = false);

CREATE POLICY "comments_insert_authenticated" ON comments
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND user_id = auth.uid()
  );

CREATE POLICY "comments_update_own" ON comments
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "comments_delete_own" ON comments
  FOR DELETE USING (user_id = auth.uid());

-- Likes: 所有人可查看点赞，用户可管理自己的点赞
CREATE POLICY "likes_select_all" ON likes
  FOR SELECT USING (true);

CREATE POLICY "likes_insert_authenticated" ON likes
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND user_id = auth.uid()
  );

CREATE POLICY "likes_delete_own" ON likes
  FOR DELETE USING (user_id = auth.uid());
-- ============================================
-- 008: 权限系统
-- ============================================

-- ──────────────────────────────────────────
-- 1. 权限表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  resource_type TEXT, -- 'user', 'agent', 'post', 'order', 'system'
  action TEXT, -- 'create', 'read', 'update', 'delete', 'manage'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_permissions_resource ON permissions(resource_type);

COMMENT ON TABLE permissions IS '权限表：定义系统中所有可用权限';
COMMENT ON COLUMN permissions.name IS '权限标识：如 manage_users, review_agents, access_analytics';

-- ──────────────────────────────────────────
-- 2. 角色权限关联表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS role_permissions (
  role TEXT NOT NULL CHECK (role IN ('seeker', 'creator', 'recruiter', 'client', 'admin')),
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (role, permission_id)
);

CREATE INDEX idx_role_permissions_role ON role_permissions(role);

COMMENT ON TABLE role_permissions IS '角色权限：定义每个角色的默认权限';

-- ──────────────────────────────────────────
-- 3. 用户特殊权限表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_permissions (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted BOOLEAN DEFAULT true,
  granted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, permission_id)
);

CREATE INDEX idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX idx_user_permissions_expires ON user_permissions(expires_at) WHERE expires_at IS NOT NULL;

COMMENT ON TABLE user_permissions IS '用户特殊权限：覆盖角色默认权限';
COMMENT ON COLUMN user_permissions.granted IS 'true=授予权限, false=撤销权限';
COMMENT ON COLUMN user_permissions.expires_at IS '权限过期时间，NULL表示永久';

-- ──────────────────────────────────────────
-- 4. 检查用户权限的函数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION has_permission(
  p_user_id UUID,
  p_permission_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_role TEXT;
  v_has_permission BOOLEAN;
BEGIN
  -- 获取用户角色
  SELECT role INTO v_user_role
  FROM profiles
  WHERE id = p_user_id;

  -- 管理员拥有所有权限
  IF v_user_role = 'admin' THEN
    RETURN true;
  END IF;

  -- 检查用户特殊权限（优先级最高）
  SELECT granted INTO v_has_permission
  FROM user_permissions up
  JOIN permissions p ON p.id = up.permission_id
  WHERE up.user_id = p_user_id
    AND p.name = p_permission_name
    AND (up.expires_at IS NULL OR up.expires_at > NOW());

  IF FOUND THEN
    RETURN v_has_permission;
  END IF;

  -- 检查角色默认权限
  SELECT EXISTS (
    SELECT 1
    FROM role_permissions rp
    JOIN permissions p ON p.id = rp.permission_id
    WHERE rp.role = v_user_role
      AND p.name = p_permission_name
  ) INTO v_has_permission;

  RETURN COALESCE(v_has_permission, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION has_permission IS '检查用户是否拥有指定权限';

-- ──────────────────────────────────────────
-- 5. 初始化基础权限
-- ──────────────────────────────────────────
INSERT INTO permissions (name, description, resource_type, action) VALUES
  -- 用户管理
  ('manage_users', '管理用户账号', 'user', 'manage'),
  ('view_user_details', '查看用户详细信息', 'user', 'read'),
  ('ban_users', '封禁用户', 'user', 'update'),

  -- 智能体管理
  ('create_agent', '创建智能体', 'agent', 'create'),
  ('publish_agent', '发布智能体', 'agent', 'update'),
  ('review_agents', '审核智能体', 'agent', 'manage'),
  ('delete_any_agent', '删除任意智能体', 'agent', 'delete'),

  -- 帖子管理
  ('create_post', '发布帖子', 'post', 'create'),
  ('create_paid_post', '发布付费帖子', 'post', 'create'),
  ('review_posts', '审核帖子', 'post', 'manage'),
  ('delete_any_post', '删除任意帖子', 'post', 'delete'),

  -- 职位管理
  ('create_job', '发布职位', 'job', 'create'),
  ('review_jobs', '审核职位', 'job', 'manage'),

  -- 订单管理
  ('view_own_orders', '查看自己的订单', 'order', 'read'),
  ('view_all_orders', '查看所有订单', 'order', 'read'),
  ('refund_orders', '退款订单', 'order', 'update'),

  -- 系统管理
  ('access_analytics', '访问数据分析', 'system', 'read'),
  ('manage_coupons', '管理优惠券', 'system', 'manage'),
  ('manage_permissions', '管理权限', 'system', 'manage');

-- ──────────────────────────────────────────
-- 6. 初始化角色权限
-- ──────────────────────────────────────────
-- Seeker（求职者）
INSERT INTO role_permissions (role, permission_id)
SELECT 'seeker', id FROM permissions WHERE name IN (
  'create_post',
  'view_own_orders'
);

-- Creator（创作者）
INSERT INTO role_permissions (role, permission_id)
SELECT 'creator', id FROM permissions WHERE name IN (
  'create_agent',
  'publish_agent',
  'create_post',
  'create_paid_post',
  'view_own_orders'
);

-- Recruiter（招聘方）
INSERT INTO role_permissions (role, permission_id)
SELECT 'recruiter', id FROM permissions WHERE name IN (
  'create_job',
  'view_own_orders'
);

-- Client（法律需求方）
INSERT INTO role_permissions (role, permission_id)
SELECT 'client', id FROM permissions WHERE name IN (
  'create_post',
  'view_own_orders'
);

-- Admin（管理员）- 拥有所有权限，通过 has_permission 函数直接返回 true

-- ──────────────────────────────────────────
-- 7. RLS 策略
-- ──────────────────────────────────────────
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- Permissions: 所有人可查看权限列表
CREATE POLICY "permissions_select_all" ON permissions
  FOR SELECT USING (true);

-- Role Permissions: 所有人可查看角色权限
CREATE POLICY "role_permissions_select_all" ON role_permissions
  FOR SELECT USING (true);

-- User Permissions: 用户可查看自己的特殊权限，管理员可管理
CREATE POLICY "user_permissions_select_own" ON user_permissions
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "user_permissions_manage_admin" ON user_permissions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
-- ============================================
-- 009: API 调用系统（隐藏后门）
-- ============================================

-- ──────────────────────────────────────────
-- 1. API 密钥表（不对外暴露）
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  api_key TEXT UNIQUE NOT NULL,
  api_secret TEXT NOT NULL,
  name TEXT, -- 密钥名称，方便用户管理多个密钥
  rate_limit INTEGER DEFAULT 1000 CHECK (rate_limit > 0),
  daily_quota INTEGER DEFAULT 10000 CHECK (daily_quota > 0),
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_api_credentials_key ON api_credentials(api_key) WHERE is_active = true;
CREATE INDEX idx_api_credentials_user ON api_credentials(user_id);

COMMENT ON TABLE api_credentials IS 'API密钥表：仅后端服务访问，不对外暴露';
COMMENT ON COLUMN api_credentials.rate_limit IS '每分钟请求限制';
COMMENT ON COLUMN api_credentials.daily_quota IS '每日请求配额';

-- ──────────────────────────────────────────
-- 2. API 调用记录表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES api_credentials(id) ON DELETE SET NULL,
  service TEXT NOT NULL CHECK (service IN ('llm', 'embedding', 'image', 'tts', 'stt')),
  model TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_id TEXT,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,
  cost DECIMAL(10,6) DEFAULT 0,
  status TEXT CHECK (status IN ('success', 'error', 'timeout')),
  error_message TEXT,
  latency_ms INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_call_logs_user ON api_call_logs(user_id, created_at DESC);
CREATE INDEX idx_api_call_logs_key ON api_call_logs(api_key_id, created_at DESC);
CREATE INDEX idx_api_call_logs_service ON api_call_logs(service, created_at DESC);

COMMENT ON TABLE api_call_logs IS 'API调用日志：记录所有 LLM/AI 服务调用';
COMMENT ON COLUMN api_call_logs.cost IS '本次调用成本（人民币）';
COMMENT ON COLUMN api_call_logs.metadata IS '请求详情：prompt, response, parameters 等';

-- ──────────────────────────────────────────
-- 3. API 使用统计表（按日汇总）
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_usage_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  service TEXT NOT NULL,
  total_calls INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  total_cost DECIMAL(10,2) DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  UNIQUE(user_id, date, service)
);

CREATE INDEX idx_api_usage_stats_user ON api_usage_stats(user_id, date DESC);

COMMENT ON TABLE api_usage_stats IS 'API使用统计：按日汇总，用于账单和配额管理';

-- ──────────────────────────────────────────
-- 4. 触发器：记录 API 调用并扣费
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION process_api_call()
RETURNS TRIGGER AS $$
DECLARE
  v_balance DECIMAL;
BEGIN
  -- 只处理成功的调用
  IF NEW.status = 'success' AND NEW.cost > 0 THEN
    -- 检查余额
    SELECT balance INTO v_balance
    FROM user_balances
    WHERE user_id = NEW.user_id;

    IF v_balance < NEW.cost THEN
      RAISE EXCEPTION '余额不足，无法完成 API 调用';
    END IF;

    -- 扣除余额
    UPDATE user_balances
    SET balance = balance - NEW.cost,
        total_consumed = total_consumed + NEW.cost,
        updated_at = NOW()
    WHERE user_id = NEW.user_id;

    -- 记录余额变动
    INSERT INTO balance_transactions (
      user_id,
      transaction_type,
      amount,
      balance_after,
      description,
      metadata
    ) VALUES (
      NEW.user_id,
      'api_call',
      -NEW.cost,
      v_balance - NEW.cost,
      'API 调用扣费',
      jsonb_build_object(
        'service', NEW.service,
        'model', NEW.model,
        'tokens', NEW.total_tokens,
        'request_id', NEW.request_id
      )
    );

    -- 更新统计
    INSERT INTO api_usage_stats (
      user_id,
      date,
      service,
      total_calls,
      total_tokens,
      total_cost,
      success_count
    ) VALUES (
      NEW.user_id,
      CURRENT_DATE,
      NEW.service,
      1,
      NEW.total_tokens,
      NEW.cost,
      1
    )
    ON CONFLICT (user_id, date, service)
    DO UPDATE SET
      total_calls = api_usage_stats.total_calls + 1,
      total_tokens = api_usage_stats.total_tokens + EXCLUDED.total_tokens,
      total_cost = api_usage_stats.total_cost + EXCLUDED.total_cost,
      success_count = api_usage_stats.success_count + 1;
  ELSIF NEW.status = 'error' THEN
    -- 记录错误统计
    INSERT INTO api_usage_stats (
      user_id,
      date,
      service,
      total_calls,
      error_count
    ) VALUES (
      NEW.user_id,
      CURRENT_DATE,
      NEW.service,
      1,
      1
    )
    ON CONFLICT (user_id, date, service)
    DO UPDATE SET
      total_calls = api_usage_stats.total_calls + 1,
      error_count = api_usage_stats.error_count + 1;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_api_call_logged
  AFTER INSERT ON api_call_logs
  FOR EACH ROW
  EXECUTE FUNCTION process_api_call();

-- ──────────────────────────────────────────
-- 5. 生成 API 密钥的函数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION generate_api_key(
  p_user_id UUID,
  p_name TEXT DEFAULT NULL
)
RETURNS TABLE(
  api_key TEXT,
  api_secret TEXT
) AS $$
DECLARE
  v_key TEXT;
  v_secret TEXT;
BEGIN
  -- 生成随机密钥（实际应用中应使用更安全的方法）
  v_key := 'lvzhi_' || encode(gen_random_bytes(24), 'base64');
  v_secret := encode(gen_random_bytes(32), 'base64');

  -- 插入密钥
  INSERT INTO api_credentials (user_id, api_key, api_secret, name)
  VALUES (p_user_id, v_key, v_secret, p_name);

  RETURN QUERY SELECT v_key, v_secret;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION generate_api_key IS '生成 API 密钥（仅创作者可用）';

-- ──────────────────────────────────────────
-- 6. 验证 API 密钥的函数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION validate_api_key(
  p_api_key TEXT,
  p_api_secret TEXT
)
RETURNS TABLE(
  valid BOOLEAN,
  user_id UUID,
  rate_limit INTEGER,
  daily_quota INTEGER,
  message TEXT
) AS $$
DECLARE
  v_credential RECORD;
  v_today_calls INTEGER;
BEGIN
  -- 查询密钥
  SELECT * INTO v_credential
  FROM api_credentials
  WHERE api_key = p_api_key
    AND api_secret = p_api_secret
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW());

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, 0, 0, 'API 密钥无效或已过期';
    RETURN;
  END IF;

  -- 检查今日配额
  SELECT COALESCE(SUM(total_calls), 0) INTO v_today_calls
  FROM api_usage_stats
  WHERE user_id = v_credential.user_id
    AND date = CURRENT_DATE;

  IF v_today_calls >= v_credential.daily_quota THEN
    RETURN QUERY SELECT false, NULL::UUID, 0, 0, '今日 API 调用配额已用尽';
    RETURN;
  END IF;

  -- 更新最后使用时间
  UPDATE api_credentials
  SET last_used_at = NOW()
  WHERE id = v_credential.id;

  RETURN QUERY SELECT
    true,
    v_credential.user_id,
    v_credential.rate_limit,
    v_credential.daily_quota,
    'API 密钥有效';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION validate_api_key IS '验证 API 密钥并检查配额';

-- ──────────────────────────────────────────
-- 7. RLS 策略（严格限制访问）
-- ──────────────────────────────────────────
ALTER TABLE api_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_stats ENABLE ROW LEVEL SECURITY;

-- API Credentials: 用户只能查看自己的密钥（不显示 secret）
CREATE POLICY "api_credentials_select_own" ON api_credentials
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "api_credentials_insert_creator" ON api_credentials
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('creator', 'admin'))
  );

CREATE POLICY "api_credentials_update_own" ON api_credentials
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "api_credentials_delete_own" ON api_credentials
  FOR DELETE USING (user_id = auth.uid());

-- API Call Logs: 用户只能查看自己的调用记录
CREATE POLICY "api_call_logs_select_own" ON api_call_logs
  FOR SELECT USING (user_id = auth.uid());

-- API Usage Stats: 用户只能查看自己的统计
CREATE POLICY "api_usage_stats_select_own" ON api_usage_stats
  FOR SELECT USING (user_id = auth.uid());
-- ============================================
-- 010: 扩展现有表以支持新系统
-- ============================================

-- ──────────────────────────────────────────
-- 1. 扩展 agents 表
-- ──────────────────────────────────────────
ALTER TABLE agents ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0 CHECK (view_count >= 0);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS trial_count INTEGER DEFAULT 0 CHECK (trial_count >= 0);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_agents_product ON agents(product_id);

COMMENT ON COLUMN agents.product_id IS '关联商品ID，用于付费智能体';
COMMENT ON COLUMN agents.view_count IS '浏览次数';
COMMENT ON COLUMN agents.trial_count IS '试用次数';
COMMENT ON COLUMN agents.metadata IS '扩展字段：点赞数、收藏数等';

-- ──────────────────────────────────────────
-- 2. 扩展 community_posts 表
-- ──────────────────────────────────────────
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL;
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0 CHECK (view_count >= 0);
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0 CHECK (comment_count >= 0);

CREATE INDEX IF NOT EXISTS idx_community_posts_product ON community_posts(product_id);

COMMENT ON COLUMN community_posts.product_id IS '关联商品ID，用于付费内容';
COMMENT ON COLUMN community_posts.view_count IS '浏览次数';
COMMENT ON COLUMN community_posts.comment_count IS '评论数';

-- ──────────────────────────────────────────
-- 3. 扩展 jobs 表
-- ──────────────────────────────────────────
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0 CHECK (view_count >= 0);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS application_count INTEGER DEFAULT 0 CHECK (application_count >= 0);

COMMENT ON COLUMN jobs.view_count IS '浏览次数';
COMMENT ON COLUMN jobs.application_count IS '申请人数';

-- ──────────────────────────────────────────
-- 4. 扩展 profiles 表
-- ──────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0 CHECK (follower_count >= 0);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0 CHECK (following_count >= 0);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned_until TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned_reason TEXT;

COMMENT ON COLUMN profiles.follower_count IS '粉丝数';
COMMENT ON COLUMN profiles.following_count IS '关注数';
COMMENT ON COLUMN profiles.is_verified IS '认证标识';
COMMENT ON COLUMN profiles.is_banned IS '封禁状态';

-- ──────────────────────────────────────────
-- 5. 触发器：更新帖子评论数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.target_type = 'post' THEN
    UPDATE community_posts
    SET comment_count = comment_count + 1
    WHERE id = NEW.target_id;
  ELSIF TG_OP = 'DELETE' AND OLD.target_type = 'post' THEN
    UPDATE community_posts
    SET comment_count = GREATEST(0, comment_count - 1)
    WHERE id = OLD.target_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_post_commented
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comment_count();

-- ──────────────────────────────────────────
-- 6. 触发器：更新用户关注数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_user_follow_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- 增加被关注者的粉丝数
    UPDATE profiles
    SET follower_count = follower_count + 1
    WHERE id = NEW.following_id;

    -- 增加关注者的关注数
    UPDATE profiles
    SET following_count = following_count + 1
    WHERE id = NEW.follower_id;
  ELSIF TG_OP = 'DELETE' THEN
    -- 减少被关注者的粉丝数
    UPDATE profiles
    SET follower_count = GREATEST(0, follower_count - 1)
    WHERE id = OLD.following_id;

    -- 减少关注者的关注数
    UPDATE profiles
    SET following_count = GREATEST(0, following_count - 1)
    WHERE id = OLD.follower_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_followed
  AFTER INSERT OR DELETE ON user_follows
  FOR EACH ROW
  EXECUTE FUNCTION update_user_follow_count();

-- ──────────────────────────────────────────
-- 7. 触发器：更新职位申请数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_job_application_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE jobs
    SET application_count = application_count + 1
    WHERE id = NEW.job_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE jobs
    SET application_count = GREATEST(0, application_count - 1)
    WHERE id = OLD.job_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_job_applied
  AFTER INSERT OR DELETE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_job_application_count();

-- ──────────────────────────────────────────
-- 8. 创建视图：用户统计概览
-- ──────────────────────────────────────────
CREATE OR REPLACE VIEW user_stats AS
SELECT
  p.id AS user_id,
  p.display_name,
  p.role,
  p.follower_count,
  p.following_count,
  p.is_verified,
  COALESCE(ub.balance, 0) AS balance,
  COALESCE(agent_stats.agent_count, 0) AS agent_count,
  COALESCE(agent_stats.total_favorites, 0) AS total_favorites,
  COALESCE(post_stats.post_count, 0) AS post_count,
  COALESCE(post_stats.total_likes, 0) AS total_post_likes,
  COALESCE(order_stats.total_revenue, 0) AS total_revenue,
  COALESCE(order_stats.order_count, 0) AS order_count
FROM profiles p
LEFT JOIN user_balances ub ON ub.user_id = p.id
LEFT JOIN (
  SELECT
    creator_id,
    COUNT(*) AS agent_count,
    SUM((metadata->>'like_count')::int) AS total_favorites
  FROM agents
  WHERE status = 'active'
  GROUP BY creator_id
) agent_stats ON agent_stats.creator_id = p.id
LEFT JOIN (
  SELECT
    author_id,
    COUNT(*) AS post_count,
    SUM(like_count) AS total_likes
  FROM community_posts
  GROUP BY author_id
) post_stats ON post_stats.author_id = p.id
LEFT JOIN (
  SELECT
    pr.creator_id,
    SUM(o.amount) AS total_revenue,
    COUNT(o.id) AS order_count
  FROM orders o
  JOIN products pr ON pr.id = o.product_id
  WHERE o.status = 'paid'
  GROUP BY pr.creator_id
) order_stats ON order_stats.creator_id = p.id;

COMMENT ON VIEW user_stats IS '用户统计概览：粉丝、作品、收入等';

-- ──────────────────────────────────────────
-- 9. 创建视图：热门智能体排行
-- ──────────────────────────────────────────
CREATE OR REPLACE VIEW trending_agents AS
SELECT
  a.id,
  a.name,
  a.description,
  a.category,
  a.pricing_model,
  a.creator_id,
  p.display_name AS creator_name,
  p.is_verified AS creator_verified,
  a.view_count,
  a.trial_count,
  COALESCE((a.metadata->>'like_count')::int, 0) AS like_count,
  COALESCE(fav.favorite_count, 0) AS favorite_count,
  COALESCE(rating.avg_rating, 0) AS avg_rating,
  COALESCE(rating.rating_count, 0) AS rating_count,
  -- 热度分数：综合浏览、试用、收藏、评分
  (
    a.view_count * 0.1 +
    a.trial_count * 0.3 +
    COALESCE(fav.favorite_count, 0) * 0.4 +
    COALESCE(rating.avg_rating, 0) * COALESCE(rating.rating_count, 0) * 0.2
  ) AS trending_score,
  a.created_at
FROM agents a
JOIN profiles p ON p.id = a.creator_id
LEFT JOIN (
  SELECT agent_id, COUNT(*) AS favorite_count
  FROM agent_favorites
  GROUP BY agent_id
) fav ON fav.agent_id = a.id
LEFT JOIN (
  SELECT agent_id, AVG(score) AS avg_rating, COUNT(*) AS rating_count
  FROM agent_ratings
  GROUP BY agent_id
) rating ON rating.agent_id = a.id
WHERE a.status = 'active'
ORDER BY trending_score DESC;

COMMENT ON VIEW trending_agents IS '热门智能体排行：基于浏览、试用、收藏、评分的综合热度';

-- ──────────────────────────────────────────
-- 10. 创建视图：创作者排行
-- ──────────────────────────────────────────
CREATE OR REPLACE VIEW top_creators AS
SELECT
  p.id,
  p.display_name,
  p.avatar_url,
  p.bio,
  p.is_verified,
  p.follower_count,
  us.agent_count,
  us.total_favorites,
  us.post_count,
  us.total_revenue,
  -- 创作者影响力分数
  (
    p.follower_count * 0.3 +
    us.agent_count * 0.2 +
    us.total_favorites * 0.3 +
    us.total_revenue * 0.2
  ) AS influence_score,
  p.created_at
FROM profiles p
JOIN user_stats us ON us.user_id = p.id
WHERE p.role = 'creator'
ORDER BY influence_score DESC;

COMMENT ON VIEW top_creators IS '创作者排行：基于粉丝、作品、收藏、收入的综合影响力';
-- ============================================
-- 011: 用户认证系统增强
-- ============================================

-- ──────────────────────────────────────────
-- 1. 登录历史记录表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  login_method TEXT NOT NULL CHECK (login_method IN ('password', 'oauth', 'magic_link', 'sms')),
  ip_address INET,
  user_agent TEXT,
  device_type TEXT, -- 'desktop', 'mobile', 'tablet'
  location JSONB, -- {country, city, region}
  success BOOLEAN DEFAULT true,
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_login_history_user ON login_history(user_id, created_at DESC);
CREATE INDEX idx_login_history_ip ON login_history(ip_address, created_at DESC);

COMMENT ON TABLE login_history IS '登录历史：记录所有登录尝试';
COMMENT ON COLUMN login_history.location IS '登录地理位置信息';

-- ──────────────────────────────────────────
-- 2. 邮箱验证记录表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  verification_code TEXT NOT NULL,
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_verifications_user ON email_verifications(user_id);
CREATE INDEX idx_email_verifications_code ON email_verifications(verification_code) WHERE verified = false;

COMMENT ON TABLE email_verifications IS '邮箱验证记录：用于注册和更换邮箱';

-- ──────────────────────────────────────────
-- 3. 密码重置记录表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reset_token TEXT UNIQUE NOT NULL,
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_password_resets_user ON password_resets(user_id, created_at DESC);
CREATE INDEX idx_password_resets_token ON password_resets(reset_token) WHERE used = false;

COMMENT ON TABLE password_resets IS '密码重置记录：用于找回密码';

-- ──────────────────────────────────────────
-- 4. 安全事件记录表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'password_changed',
    'email_changed',
    'suspicious_login',
    'account_locked',
    'account_unlocked',
    'two_factor_enabled',
    'two_factor_disabled'
  )),
  description TEXT,
  ip_address INET,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_security_events_user ON security_events(user_id, created_at DESC);
CREATE INDEX idx_security_events_type ON security_events(event_type, created_at DESC);

COMMENT ON TABLE security_events IS '安全事件记录：密码修改、异常登录等';

-- ──────────────────────────────────────────
-- 5. 账号锁定记录表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS account_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lock_reason TEXT NOT NULL CHECK (lock_reason IN (
    'too_many_failed_logins',
    'suspicious_activity',
    'admin_action',
    'user_request'
  )),
  locked_at TIMESTAMPTZ DEFAULT NOW(),
  locked_until TIMESTAMPTZ,
  locked_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  unlock_token TEXT UNIQUE,
  unlocked_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_account_locks_user ON account_locks(user_id, locked_at DESC);
CREATE INDEX idx_account_locks_active ON account_locks(user_id) WHERE unlocked_at IS NULL;

COMMENT ON TABLE account_locks IS '账号锁定记录：失败登录次数过多、可疑活动等';

-- ──────────────────────────────────────────
-- 6. OAuth 连接记录表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS oauth_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'github', 'wechat', 'dingtalk')),
  provider_user_id TEXT NOT NULL,
  provider_email TEXT,
  provider_name TEXT,
  access_token TEXT, -- 加密存储
  refresh_token TEXT, -- 加密存储
  token_expires_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  UNIQUE(provider, provider_user_id)
);

CREATE INDEX idx_oauth_connections_user ON oauth_connections(user_id);
CREATE INDEX idx_oauth_connections_provider ON oauth_connections(provider, provider_user_id);

COMMENT ON TABLE oauth_connections IS 'OAuth 第三方登录连接记录';

-- ──────────────────────────────────────────
-- 7. 会话管理表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  device_type TEXT,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_sessions_user ON user_sessions(user_id, last_activity_at DESC);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);

COMMENT ON TABLE user_sessions IS '用户会话管理：支持多设备登录和会话控制';

-- ──────────────────────────────────────────
-- 8. 触发器：记录登录历史
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION log_user_login()
RETURNS TRIGGER AS $$
BEGIN
  -- 这个函数需要在应用层调用，因为 Supabase Auth 不会自动触发
  -- 仅作为示例，实际使用时在登录成功后手动插入记录
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ──────────────────────────────────────────
-- 9. 检查账号是否被锁定的函数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION is_account_locked(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_locked BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM account_locks
    WHERE user_id = p_user_id
      AND unlocked_at IS NULL
      AND (locked_until IS NULL OR locked_until > NOW())
  ) INTO v_locked;

  RETURN v_locked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_account_locked IS '检查账号是否被锁定';

-- ──────────────────────────────────────────
-- 10. 记录失败登录并自动锁定账号
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_failed_login(
  p_user_id UUID,
  p_ip_address INET,
  p_user_agent TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_failed_count INTEGER;
  v_should_lock BOOLEAN := false;
BEGIN
  -- 记录失败登录
  INSERT INTO login_history (
    user_id,
    login_method,
    ip_address,
    user_agent,
    success,
    failure_reason
  ) VALUES (
    p_user_id,
    'password',
    p_ip_address,
    p_user_agent,
    false,
    'Invalid credentials'
  );

  -- 统计最近 15 分钟内的失败次数
  SELECT COUNT(*) INTO v_failed_count
  FROM login_history
  WHERE user_id = p_user_id
    AND success = false
    AND created_at > NOW() - INTERVAL '15 minutes';

  -- 超过 5 次失败则锁定账号 30 分钟
  IF v_failed_count >= 5 THEN
    INSERT INTO account_locks (
      user_id,
      lock_reason,
      locked_until,
      metadata
    ) VALUES (
      p_user_id,
      'too_many_failed_logins',
      NOW() + INTERVAL '30 minutes',
      jsonb_build_object('failed_count', v_failed_count, 'ip_address', p_ip_address::text)
    );

    -- 记录安全事件
    INSERT INTO security_events (
      user_id,
      event_type,
      description,
      ip_address
    ) VALUES (
      p_user_id,
      'account_locked',
      '连续登录失败 ' || v_failed_count || ' 次，账号已锁定 30 分钟',
      p_ip_address
    );

    v_should_lock := true;
  END IF;

  RETURN v_should_lock;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION handle_failed_login IS '处理失败登录：记录并在必要时锁定账号';

-- ──────────────────────────────────────────
-- 11. 生成密码重置令牌
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION generate_password_reset_token(
  p_user_id UUID,
  p_ip_address INET DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  v_token TEXT;
BEGIN
  -- 生成随机令牌
  v_token := encode(gen_random_bytes(32), 'base64');

  -- 插入重置记录
  INSERT INTO password_resets (
    user_id,
    reset_token,
    expires_at,
    ip_address
  ) VALUES (
    p_user_id,
    v_token,
    NOW() + INTERVAL '1 hour',
    p_ip_address
  );

  RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION generate_password_reset_token IS '生成密码重置令牌（有效期 1 小时）';

-- ──────────────────────────────────────────
-- 12. 验证密码重置令牌
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION validate_password_reset_token(p_token TEXT)
RETURNS TABLE(
  valid BOOLEAN,
  user_id UUID,
  message TEXT
) AS $$
DECLARE
  v_reset RECORD;
BEGIN
  SELECT * INTO v_reset
  FROM password_resets
  WHERE reset_token = p_token
    AND used = false
    AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, '重置令牌无效或已过期';
    RETURN;
  END IF;

  RETURN QUERY SELECT true, v_reset.user_id, '令牌有效';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION validate_password_reset_token IS '验证密码重置令牌';

-- ──────────────────────────────────────────
-- 13. 清理过期数据的函数（需配合定时任务）
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION cleanup_expired_auth_data()
RETURNS void AS $$
BEGIN
  -- 删除过期的邮箱验证记录（保留 7 天）
  DELETE FROM email_verifications
  WHERE expires_at < NOW() - INTERVAL '7 days';

  -- 删除过期的密码重置记录（保留 7 天）
  DELETE FROM password_resets
  WHERE expires_at < NOW() - INTERVAL '7 days';

  -- 删除过期的会话（保留 30 天）
  DELETE FROM user_sessions
  WHERE expires_at < NOW() - INTERVAL '30 days';

  -- 删除旧的登录历史（保留 90 天）
  DELETE FROM login_history
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_expired_auth_data IS '清理过期的认证数据（建议每日执行）';

-- ──────────────────────────────────────────
-- 14. RLS 策略
-- ──────────────────────────────────────────
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Login History: 用户只能查看自己的登录历史
CREATE POLICY "login_history_select_own" ON login_history
  FOR SELECT USING (user_id = auth.uid());

-- Email Verifications: 用户只能查看自己的验证记录
CREATE POLICY "email_verifications_select_own" ON email_verifications
  FOR SELECT USING (user_id = auth.uid());

-- Password Resets: 不允许直接查询（通过函数验证）
CREATE POLICY "password_resets_no_select" ON password_resets
  FOR SELECT USING (false);

-- Security Events: 用户只能查看自己的安全事件
CREATE POLICY "security_events_select_own" ON security_events
  FOR SELECT USING (user_id = auth.uid());

-- Account Locks: 用户只能查看自己的锁定记录
CREATE POLICY "account_locks_select_own" ON account_locks
  FOR SELECT USING (user_id = auth.uid());

-- OAuth Connections: 用户只能查看和管理自己的 OAuth 连接
CREATE POLICY "oauth_connections_select_own" ON oauth_connections
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "oauth_connections_delete_own" ON oauth_connections
  FOR DELETE USING (user_id = auth.uid());

-- User Sessions: 用户只能查看和管理自己的会话
CREATE POLICY "user_sessions_select_own" ON user_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_sessions_delete_own" ON user_sessions
  FOR DELETE USING (user_id = auth.uid());

-- ──────────────────────────────────────────
-- 15. 管理员策略
-- ──────────────────────────────────────────
-- 管理员可以查看所有认证相关数据
CREATE POLICY "login_history_admin_all" ON login_history
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "security_events_admin_all" ON security_events
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "account_locks_admin_all" ON account_locks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
-- ============================================
-- 012: 防火墙与安全系统
-- ============================================

-- ──────────────────────────────────────────
-- 1. IP 黑名单表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ip_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  blocked_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  blocked_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_ip_blacklist_ip ON ip_blacklist(ip_address) WHERE is_active = true;
CREATE INDEX idx_ip_blacklist_expires ON ip_blacklist(expires_at) WHERE expires_at IS NOT NULL;

COMMENT ON TABLE ip_blacklist IS 'IP 黑名单：阻止恶意 IP 访问';
COMMENT ON COLUMN ip_blacklist.metadata IS '附加信息：攻击类型、触发次数等';

-- ──────────────────────────────────────────
-- 2. IP 白名单表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ip_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL UNIQUE,
  description TEXT,
  added_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_ip_whitelist_ip ON ip_whitelist(ip_address) WHERE is_active = true;

COMMENT ON TABLE ip_whitelist IS 'IP 白名单：信任的 IP 地址（如办公网络、API 服务器）';

-- ──────────────────────────────────────────
-- 3. 请求频率限制记录表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rate_limit_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- IP 或 user_id
  identifier_type TEXT NOT NULL CHECK (identifier_type IN ('ip', 'user', 'api_key')),
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  window_end TIMESTAMPTZ NOT NULL,
  blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rate_limit_identifier ON rate_limit_records(identifier, endpoint, window_end);
CREATE INDEX idx_rate_limit_window ON rate_limit_records(window_end);

COMMENT ON TABLE rate_limit_records IS '请求频率限制记录：防止 API 滥用';
COMMENT ON COLUMN rate_limit_records.identifier IS 'IP 地址、用户 ID 或 API Key';

-- ──────────────────────────────────────────
-- 4. 防火墙规则表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS firewall_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT UNIQUE NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('ip_block', 'rate_limit', 'geo_block', 'user_agent_block', 'custom')),
  priority INTEGER DEFAULT 100 CHECK (priority >= 0 AND priority <= 1000),
  condition JSONB NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('block', 'allow', 'throttle', 'captcha')),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_firewall_rules_priority ON firewall_rules(priority DESC, created_at) WHERE is_active = true;
CREATE INDEX idx_firewall_rules_type ON firewall_rules(rule_type) WHERE is_active = true;

COMMENT ON TABLE firewall_rules IS '防火墙规则：灵活配置的安全策略';
COMMENT ON COLUMN firewall_rules.priority IS '优先级：0-1000，数字越大优先级越高';
COMMENT ON COLUMN firewall_rules.condition IS '规则条件：JSON 格式，如 {"ip_range": "192.168.0.0/16", "countries": ["CN"]}';

-- 示例规则
INSERT INTO firewall_rules (rule_name, rule_type, priority, condition, action) VALUES
  ('阻止已知恶意 IP 段', 'ip_block', 900, '{"ip_ranges": ["185.220.0.0/16", "45.142.120.0/24"]}', 'block'),
  ('API 频率限制', 'rate_limit', 800, '{"endpoint": "/api/*", "max_requests": 100, "window_seconds": 60}', 'throttle'),
  ('阻止可疑 User-Agent', 'user_agent_block', 700, '{"patterns": ["bot", "crawler", "scraper"]}', 'block');

-- ──────────────────────────────────────────
-- 5. 防火墙日志表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS firewall_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES firewall_rules(id) ON DELETE SET NULL,
  ip_address INET NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  action_taken TEXT NOT NULL CHECK (action_taken IN ('blocked', 'allowed', 'throttled', 'captcha_required')),
  reason TEXT,
  user_agent TEXT,
  request_headers JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_firewall_logs_ip ON firewall_logs(ip_address, created_at DESC);
CREATE INDEX idx_firewall_logs_rule ON firewall_logs(rule_id, created_at DESC);
CREATE INDEX idx_firewall_logs_action ON firewall_logs(action_taken, created_at DESC);
CREATE INDEX idx_firewall_logs_time ON firewall_logs(created_at DESC);

COMMENT ON TABLE firewall_logs IS '防火墙日志：记录所有被拦截或限制的请求';

-- ──────────────────────────────────────────
-- 6. 异常行为检测表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS anomaly_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  detection_type TEXT NOT NULL CHECK (detection_type IN (
    'brute_force',
    'sql_injection',
    'xss_attempt',
    'unusual_traffic',
    'data_scraping',
    'account_takeover',
    'credential_stuffing'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  ip_address INET,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  evidence JSONB DEFAULT '{}',
  auto_blocked BOOLEAN DEFAULT false,
  reviewed BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_anomaly_detections_type ON anomaly_detections(detection_type, created_at DESC);
CREATE INDEX idx_anomaly_detections_severity ON anomaly_detections(severity, created_at DESC);
CREATE INDEX idx_anomaly_detections_reviewed ON anomaly_detections(reviewed, created_at DESC);
CREATE INDEX idx_anomaly_detections_ip ON anomaly_detections(ip_address);

COMMENT ON TABLE anomaly_detections IS '异常行为检测：AI/规则引擎检测到的可疑活动';
COMMENT ON COLUMN anomaly_detections.evidence IS '证据数据：请求日志、行为模式等';

-- ──────────────────────────────────────────
-- 7. CAPTCHA 验证记录表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS captcha_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  ip_address INET NOT NULL,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('image', 'audio', 'puzzle', 'recaptcha')),
  success BOOLEAN NOT NULL,
  attempts INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_captcha_verifications_session ON captcha_verifications(session_id);
CREATE INDEX idx_captcha_verifications_ip ON captcha_verifications(ip_address, created_at DESC);

COMMENT ON TABLE captcha_verifications IS 'CAPTCHA 验证记录：人机验证';

-- ──────────────────────────────────────────
-- 8. 检查 IP 是否被封禁的函数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION is_ip_blocked(p_ip_address INET)
RETURNS BOOLEAN AS $$
DECLARE
  v_blocked BOOLEAN;
BEGIN
  -- 检查白名单（优先级最高）
  IF EXISTS (
    SELECT 1 FROM ip_whitelist
    WHERE ip_address = p_ip_address AND is_active = true
  ) THEN
    RETURN false;
  END IF;

  -- 检查黑名单
  SELECT EXISTS (
    SELECT 1 FROM ip_blacklist
    WHERE ip_address = p_ip_address
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
  ) INTO v_blocked;

  RETURN v_blocked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_ip_blocked IS '检查 IP 是否被封禁';

-- ──────────────────────────────────────────
-- 9. 检查请求频率限制的函数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier TEXT,
  p_identifier_type TEXT,
  p_endpoint TEXT,
  p_max_requests INTEGER,
  p_window_seconds INTEGER
)
RETURNS TABLE(
  allowed BOOLEAN,
  current_count INTEGER,
  reset_at TIMESTAMPTZ
) AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_window_end TIMESTAMPTZ;
  v_current_count INTEGER;
BEGIN
  v_window_start := NOW() - (p_window_seconds || ' seconds')::INTERVAL;
  v_window_end := NOW();

  -- 统计当前窗口内的请求数
  SELECT COALESCE(SUM(request_count), 0) INTO v_current_count
  FROM rate_limit_records
  WHERE identifier = p_identifier
    AND identifier_type = p_identifier_type
    AND endpoint = p_endpoint
    AND window_end > v_window_start;

  -- 插入或更新记录
  INSERT INTO rate_limit_records (
    identifier,
    identifier_type,
    endpoint,
    request_count,
    window_start,
    window_end,
    blocked
  ) VALUES (
    p_identifier,
    p_identifier_type,
    p_endpoint,
    1,
    v_window_start,
    v_window_end,
    v_current_count >= p_max_requests
  );

  RETURN QUERY SELECT
    v_current_count < p_max_requests,
    v_current_count + 1,
    v_window_end + (p_window_seconds || ' seconds')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_rate_limit IS '检查请求频率限制';

-- ──────────────────────────────────────────
-- 10. 记录异常行为的函数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION log_anomaly(
  p_detection_type TEXT,
  p_severity TEXT,
  p_ip_address INET,
  p_user_id UUID,
  p_description TEXT,
  p_evidence JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_anomaly_id UUID;
  v_should_block BOOLEAN := false;
BEGIN
  -- 插入异常记录
  INSERT INTO anomaly_detections (
    detection_type,
    severity,
    ip_address,
    user_id,
    description,
    evidence,
    auto_blocked
  ) VALUES (
    p_detection_type,
    p_severity,
    p_ip_address,
    p_user_id,
    p_description,
    p_evidence,
    false
  ) RETURNING id INTO v_anomaly_id;

  -- 高危异常自动封禁
  IF p_severity IN ('high', 'critical') THEN
    -- 检查是否已在黑名单
    IF NOT EXISTS (
      SELECT 1 FROM ip_blacklist
      WHERE ip_address = p_ip_address AND is_active = true
    ) THEN
      -- 添加到黑名单（24小时）
      INSERT INTO ip_blacklist (
        ip_address,
        reason,
        expires_at,
        metadata
      ) VALUES (
        p_ip_address,
        '自动封禁：' || p_detection_type,
        NOW() + INTERVAL '24 hours',
        jsonb_build_object('anomaly_id', v_anomaly_id, 'auto_blocked', true)
      );

      v_should_block := true;
    END IF;

    -- 如果有用户 ID，锁定账号
    IF p_user_id IS NOT NULL THEN
      INSERT INTO account_locks (
        user_id,
        lock_reason,
        locked_until,
        metadata
      ) VALUES (
        p_user_id,
        'suspicious_activity',
        NOW() + INTERVAL '24 hours',
        jsonb_build_object('anomaly_id', v_anomaly_id, 'detection_type', p_detection_type)
      );
    END IF;
  END IF;

  -- 更新自动封禁状态
  UPDATE anomaly_detections
  SET auto_blocked = v_should_block
  WHERE id = v_anomaly_id;

  RETURN v_anomaly_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_anomaly IS '记录异常行为并自动处理高危情况';

-- ──────────────────────────────────────────
-- 11. 清理过期防火墙数据的函数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION cleanup_firewall_data()
RETURNS void AS $$
BEGIN
  -- 删除过期的 IP 黑名单记录
  UPDATE ip_blacklist
  SET is_active = false
  WHERE expires_at IS NOT NULL
    AND expires_at < NOW()
    AND is_active = true;

  -- 删除过期的频率限制记录（保留 7 天）
  DELETE FROM rate_limit_records
  WHERE window_end < NOW() - INTERVAL '7 days';

  -- 删除旧的防火墙日志（保留 90 天）
  DELETE FROM firewall_logs
  WHERE created_at < NOW() - INTERVAL '90 days';

  -- 删除旧的 CAPTCHA 记录（保留 30 天）
  DELETE FROM captcha_verifications
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_firewall_data IS '清理过期的防火墙数据（建议每日执行）';

-- ──────────────────────────────────────────
-- 12. RLS 策略
-- ──────────────────────────────────────────
ALTER TABLE ip_blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE firewall_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE firewall_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomaly_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE captcha_verifications ENABLE ROW LEVEL SECURITY;

-- 只有管理员可以访问防火墙相关表
CREATE POLICY "firewall_admin_only" ON ip_blacklist
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "whitelist_admin_only" ON ip_whitelist
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "rate_limit_admin_only" ON rate_limit_records
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "firewall_rules_admin_only" ON firewall_rules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "firewall_logs_admin_only" ON firewall_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "anomaly_admin_only" ON anomaly_detections
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "captcha_admin_only" ON captcha_verifications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
-- ============================================
-- 013: 数据管理系统
-- ============================================

-- ──────────────────────────────────────────
-- 1. 数据备份记录表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS data_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_type TEXT NOT NULL CHECK (backup_type IN ('full', 'incremental', 'differential')),
  backup_scope TEXT NOT NULL CHECK (backup_scope IN ('database', 'table', 'user_data')),
  target_tables TEXT[], -- 备份的表名列表
  file_path TEXT NOT NULL,
  file_size_bytes BIGINT,
  compression_type TEXT CHECK (compression_type IN ('gzip', 'bzip2', 'none')),
  encryption_enabled BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed')),
  error_message TEXT,
  started_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_data_backups_status ON data_backups(status, started_at DESC);
CREATE INDEX idx_data_backups_type ON data_backups(backup_type, started_at DESC);

COMMENT ON TABLE data_backups IS '数据备份记录：定期备份和手动备份';
COMMENT ON COLUMN data_backups.metadata IS '备份元数据：记录数、校验和等';

-- ──────────────────────────────────────────
-- 2. 数据恢复记录表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS data_restores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_id UUID REFERENCES data_backups(id) ON DELETE SET NULL,
  restore_scope TEXT NOT NULL CHECK (restore_scope IN ('full', 'partial', 'table', 'user_data')),
  target_tables TEXT[],
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed', 'rolled_back')),
  error_message TEXT,
  records_restored INTEGER DEFAULT 0,
  started_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_data_restores_status ON data_restores(status, started_at DESC);
CREATE INDEX idx_data_restores_backup ON data_restores(backup_id);

COMMENT ON TABLE data_restores IS '数据恢复记录：从备份恢复数据';

-- ──────────────────────────────────────────
-- 3. 数据导出记录表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS data_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  export_type TEXT NOT NULL CHECK (export_type IN ('user_data', 'analytics', 'compliance', 'custom')),
  format TEXT NOT NULL CHECK (format IN ('csv', 'json', 'xlsx', 'sql')),
  scope JSONB NOT NULL, -- 导出范围：表名、过滤条件等
  file_path TEXT,
  file_size_bytes BIGINT,
  record_count INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'expired')),
  error_message TEXT,
  requested_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ, -- 导出文件过期时间
  download_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_data_exports_user ON data_exports(requested_by, requested_at DESC);
CREATE INDEX idx_data_exports_status ON data_exports(status, requested_at DESC);
CREATE INDEX idx_data_exports_expires ON data_exports(expires_at) WHERE expires_at IS NOT NULL;

COMMENT ON TABLE data_exports IS '数据导出记录：用户数据导出、合规导出等';
COMMENT ON COLUMN data_exports.scope IS '导出范围：{"tables": ["orders"], "filters": {"date_from": "2024-01-01"}}';

-- ──────────────────────────────────────────
-- 4. 数据清理任务表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS data_cleanup_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_name TEXT NOT NULL,
  task_type TEXT NOT NULL CHECK (task_type IN ('delete_old_data', 'archive', 'anonymize', 'purge')),
  target_table TEXT NOT NULL,
  cleanup_rule JSONB NOT NULL, -- 清理规则：如删除 90 天前的数据
  schedule TEXT, -- Cron 表达式
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  records_affected INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_data_cleanup_tasks_schedule ON data_cleanup_tasks(next_run_at) WHERE status = 'active';
CREATE INDEX idx_data_cleanup_tasks_table ON data_cleanup_tasks(target_table);

COMMENT ON TABLE data_cleanup_tasks IS '数据清理任务：定期清理过期数据';
COMMENT ON COLUMN data_cleanup_tasks.cleanup_rule IS '清理规则：{"older_than_days": 90, "conditions": {...}}';

-- ──────────────────────────────────────────
-- 5. 数据清理日志表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS data_cleanup_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES data_cleanup_tasks(id) ON DELETE SET NULL,
  target_table TEXT NOT NULL,
  records_deleted INTEGER DEFAULT 0,
  records_archived INTEGER DEFAULT 0,
  records_anonymized INTEGER DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
  error_message TEXT,
  execution_time_ms INTEGER,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_data_cleanup_logs_task ON data_cleanup_logs(task_id, executed_at DESC);
CREATE INDEX idx_data_cleanup_logs_table ON data_cleanup_logs(target_table, executed_at DESC);

COMMENT ON TABLE data_cleanup_logs IS '数据清理日志：记录每次清理任务的执行结果';

-- ──────────────────────────────────────────
-- 6. 数据审计日志表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS data_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE', 'SELECT')),
  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[],
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  performed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_data_audit_logs_table ON data_audit_logs(table_name, performed_at DESC);
CREATE INDEX idx_data_audit_logs_record ON data_audit_logs(record_id, performed_at DESC);
CREATE INDEX idx_data_audit_logs_user ON data_audit_logs(user_id, performed_at DESC);
CREATE INDEX idx_data_audit_logs_operation ON data_audit_logs(operation, performed_at DESC);

COMMENT ON TABLE data_audit_logs IS '数据审计日志：记录敏感数据的所有操作';
COMMENT ON COLUMN data_audit_logs.changed_fields IS '变更字段列表（仅 UPDATE 操作）';

-- ──────────────────────────────────────────
-- 7. 数据质量检查表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS data_quality_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_name TEXT NOT NULL,
  check_type TEXT NOT NULL CHECK (check_type IN ('completeness', 'accuracy', 'consistency', 'validity', 'uniqueness')),
  target_table TEXT NOT NULL,
  check_rule JSONB NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  schedule TEXT, -- Cron 表达式
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_data_quality_checks_table ON data_quality_checks(target_table);
CREATE INDEX idx_data_quality_checks_schedule ON data_quality_checks(next_run_at) WHERE is_active = true;

COMMENT ON TABLE data_quality_checks IS '数据质量检查：定期检查数据完整性和准确性';
COMMENT ON COLUMN data_quality_checks.check_rule IS '检查规则：{"field": "email", "rule": "not_null", "threshold": 0.95}';

-- ──────────────────────────────────────────
-- 8. 数据质量检查结果表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS data_quality_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_id UUID REFERENCES data_quality_checks(id) ON DELETE CASCADE,
  passed BOOLEAN NOT NULL,
  records_checked INTEGER NOT NULL,
  records_failed INTEGER DEFAULT 0,
  failure_rate DECIMAL(5,2),
  details JSONB DEFAULT '{}',
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_data_quality_results_check ON data_quality_results(check_id, checked_at DESC);
CREATE INDEX idx_data_quality_results_passed ON data_quality_results(passed, checked_at DESC);

COMMENT ON TABLE data_quality_results IS '数据质量检查结果';
COMMENT ON COLUMN data_quality_results.details IS '详细信息：失败记录 ID、错误原因等';

-- ──────────────────────────────────────────
-- 9. 数据归档表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS data_archives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_table TEXT NOT NULL,
  archive_name TEXT NOT NULL,
  archive_path TEXT NOT NULL,
  record_count INTEGER NOT NULL,
  date_range JSONB, -- {"from": "2023-01-01", "to": "2023-12-31"}
  compression_type TEXT CHECK (compression_type IN ('gzip', 'bzip2', 'none')),
  file_size_bytes BIGINT,
  archived_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  archived_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_data_archives_table ON data_archives(source_table, archived_at DESC);

COMMENT ON TABLE data_archives IS '数据归档记录：长期存储的历史数据';

-- ──────────────────────────────────────────
-- 10. 触发器：自动记录审计日志（示例：profiles 表）
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION audit_profiles_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_changed_fields TEXT[];
  v_has_action BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'data_audit_logs' AND column_name = 'action'
  ) INTO v_has_action;

  IF TG_OP = 'UPDATE' THEN
    v_changed_fields := ARRAY[]::TEXT[];
    IF OLD.phone IS DISTINCT FROM NEW.phone THEN v_changed_fields := array_append(v_changed_fields, 'phone'); END IF;
    IF OLD.display_name IS DISTINCT FROM NEW.display_name THEN v_changed_fields := array_append(v_changed_fields, 'display_name'); END IF;
    IF OLD.role IS DISTINCT FROM NEW.role THEN v_changed_fields := array_append(v_changed_fields, 'role'); END IF;

    IF cardinality(v_changed_fields) = 0 THEN
      RETURN NEW;
    END IF;

    IF v_has_action THEN
      INSERT INTO data_audit_logs (
        table_name, record_id, operation, action, old_data, new_data, changed_fields, user_id
      ) VALUES (
        'profiles', NEW.id, 'UPDATE', 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), v_changed_fields, auth.uid()
      );
    ELSE
      INSERT INTO data_audit_logs (
        table_name, record_id, operation, old_data, new_data, changed_fields, user_id
      ) VALUES (
        'profiles', NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), v_changed_fields, auth.uid()
      );
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF v_has_action THEN
      INSERT INTO data_audit_logs (
        table_name, record_id, operation, action, old_data, user_id
      ) VALUES (
        'profiles', OLD.id, 'DELETE', 'DELETE', to_jsonb(OLD), auth.uid()
      );
    ELSE
      INSERT INTO data_audit_logs (
        table_name, record_id, operation, old_data, user_id
      ) VALUES (
        'profiles', OLD.id, 'DELETE', to_jsonb(OLD), auth.uid()
      );
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_profiles_trigger
  AFTER UPDATE OR DELETE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION audit_profiles_changes();

COMMENT ON FUNCTION audit_profiles_changes IS '审计 profiles 表的变更';

-- ──────────────────────────────────────────
-- 11. 执行数据导出的函数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION request_data_export(
  p_user_id UUID,
  p_export_type TEXT,
  p_format TEXT,
  p_scope JSONB
)
RETURNS UUID AS $$
DECLARE
  v_export_id UUID;
BEGIN
  INSERT INTO data_exports (
    export_type,
    format,
    scope,
    requested_by,
    expires_at,
    status
  ) VALUES (
    p_export_type,
    p_format,
    p_scope,
    p_user_id,
    NOW() + INTERVAL '7 days', -- 导出文件 7 天后过期
    'pending'
  ) RETURNING id INTO v_export_id;

  RETURN v_export_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION request_data_export IS '请求数据导出（异步处理）';

-- ──────────────────────────────────────────
-- 12. 清理过期数据的函数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION cleanup_expired_exports()
RETURNS void AS $$
BEGIN
  -- 删除过期的导出文件记录
  UPDATE data_exports
  SET status = 'expired'
  WHERE expires_at < NOW()
    AND status = 'completed';

  -- 删除旧的审计日志（保留 1 年）
  DELETE FROM data_audit_logs
  WHERE performed_at < NOW() - INTERVAL '1 year';

  -- 删除旧的数据质量检查结果（保留 90 天）
  DELETE FROM data_quality_results
  WHERE checked_at < NOW() - INTERVAL '90 days';

  -- 删除旧的清理日志（保留 180 天）
  DELETE FROM data_cleanup_logs
  WHERE executed_at < NOW() - INTERVAL '180 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_expired_exports IS '清理过期的导出文件和旧日志（建议每日执行）';

-- ──────────────────────────────────────────
-- 13. 数据统计视图
-- ──────────────────────────────────────────
CREATE OR REPLACE VIEW data_management_stats AS
SELECT
  (SELECT COUNT(*) FROM data_backups WHERE status = 'completed') AS total_backups,
  (SELECT COUNT(*) FROM data_backups WHERE status = 'completed' AND started_at > NOW() - INTERVAL '7 days') AS recent_backups,
  (SELECT SUM(file_size_bytes) FROM data_backups WHERE status = 'completed') AS total_backup_size,
  (SELECT COUNT(*) FROM data_exports WHERE status = 'completed') AS total_exports,
  (SELECT COUNT(*) FROM data_exports WHERE status = 'pending') AS pending_exports,
  (SELECT COUNT(*) FROM data_audit_logs WHERE performed_at > NOW() - INTERVAL '24 hours') AS audit_logs_24h,
  (SELECT COUNT(*) FROM data_quality_checks WHERE is_active = true) AS active_quality_checks,
  (SELECT COUNT(*) FROM data_quality_results WHERE NOT passed AND checked_at > NOW() - INTERVAL '7 days') AS recent_quality_failures;

COMMENT ON VIEW data_management_stats IS '数据管理统计概览';

-- ──────────────────────────────────────────
-- 14. RLS 策略
-- ──────────────────────────────────────────
ALTER TABLE data_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_restores ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_cleanup_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_cleanup_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_quality_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_quality_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_archives ENABLE ROW LEVEL SECURITY;

-- 备份和恢复：仅管理员
CREATE POLICY "backups_admin_only" ON data_backups
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "restores_admin_only" ON data_restores
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 数据导出：用户可查看自己的导出
CREATE POLICY "exports_select_own" ON data_exports
  FOR SELECT USING (requested_by = auth.uid());

CREATE POLICY "exports_insert_own" ON data_exports
  FOR INSERT WITH CHECK (requested_by = auth.uid());

CREATE POLICY "exports_admin_all" ON data_exports
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 清理任务：仅管理员
CREATE POLICY "cleanup_tasks_admin_only" ON data_cleanup_tasks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "cleanup_logs_admin_only" ON data_cleanup_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 审计日志：管理员可查看所有，用户可查看自己的
CREATE POLICY "audit_logs_select_own" ON data_audit_logs
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 数据质量：仅管理员
CREATE POLICY "quality_checks_admin_only" ON data_quality_checks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "quality_results_admin_only" ON data_quality_results
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 归档：仅管理员
CREATE POLICY "archives_admin_only" ON data_archives
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
-- ============================================
-- 014: 反爬虫系统
-- ============================================

-- ──────────────────────────────────────────
-- 1. 爬虫特征库表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bot_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signature_type TEXT NOT NULL CHECK (signature_type IN ('user_agent', 'ip_range', 'behavior_pattern', 'fingerprint')),
  signature_value TEXT NOT NULL,
  bot_name TEXT,
  bot_category TEXT CHECK (bot_category IN ('search_engine', 'malicious', 'scraper', 'monitoring', 'unknown')),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  action TEXT NOT NULL CHECK (action IN ('allow', 'monitor', 'challenge', 'block')),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bot_signatures_type ON bot_signatures(signature_type) WHERE is_active = true;
CREATE INDEX idx_bot_signatures_category ON bot_signatures(bot_category) WHERE is_active = true;

COMMENT ON TABLE bot_signatures IS '爬虫特征库：已知爬虫的识别特征';

-- 初始化常见爬虫特征
INSERT INTO bot_signatures (signature_type, signature_value, bot_name, bot_category, risk_level, action) VALUES
  -- 搜索引擎爬虫（允许）
  ('user_agent', 'Googlebot', 'Google Bot', 'search_engine', 'low', 'allow'),
  ('user_agent', 'Baiduspider', 'Baidu Spider', 'search_engine', 'low', 'allow'),
  ('user_agent', 'bingbot', 'Bing Bot', 'search_engine', 'low', 'allow'),

  -- 恶意爬虫（阻止）
  ('user_agent', 'scrapy', 'Scrapy Framework', 'scraper', 'high', 'block'),
  ('user_agent', 'python-requests', 'Python Requests', 'scraper', 'medium', 'challenge'),
  ('user_agent', 'curl', 'cURL', 'scraper', 'medium', 'challenge'),
  ('user_agent', 'wget', 'Wget', 'scraper', 'medium', 'challenge'),
  ('user_agent', 'selenium', 'Selenium', 'scraper', 'high', 'block'),
  ('user_agent', 'puppeteer', 'Puppeteer', 'scraper', 'high', 'block'),
  ('user_agent', 'headless', 'Headless Browser', 'scraper', 'high', 'block');

-- ──────────────────────────────────────────
-- 2. 爬虫检测记录表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bot_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL,
  user_agent TEXT,
  detection_method TEXT NOT NULL CHECK (detection_method IN (
    'user_agent_match',
    'behavior_analysis',
    'rate_limit_exceeded',
    'fingerprint_analysis',
    'honeypot_triggered',
    'javascript_challenge_failed',
    'captcha_failed'
  )),
  signature_id UUID REFERENCES bot_signatures(id) ON DELETE SET NULL,
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  action_taken TEXT NOT NULL CHECK (action_taken IN ('allowed', 'monitored', 'challenged', 'blocked')),
  evidence JSONB DEFAULT '{}',
  detected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bot_detections_ip ON bot_detections(ip_address, detected_at DESC);
CREATE INDEX idx_bot_detections_method ON bot_detections(detection_method, detected_at DESC);
CREATE INDEX idx_bot_detections_action ON bot_detections(action_taken, detected_at DESC);
CREATE INDEX idx_bot_detections_risk ON bot_detections(risk_score DESC, detected_at DESC);

COMMENT ON TABLE bot_detections IS '爬虫检测记录：实时检测到的爬虫行为';
COMMENT ON COLUMN bot_detections.risk_score IS '风险评分：0-100，越高越危险';
COMMENT ON COLUMN bot_detections.confidence IS '置信度：0-1，检测结果的可信程度';
COMMENT ON COLUMN bot_detections.evidence IS '证据数据：请求特征、行为模式等';

-- ──────────────────────────────────────────
-- 3. 访问行为分析表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS access_behavior_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- IP 或 session_id
  identifier_type TEXT NOT NULL CHECK (identifier_type IN ('ip', 'session', 'user')),
  time_window TIMESTAMPTZ NOT NULL,

  -- 行为指标
  total_requests INTEGER DEFAULT 0,
  unique_pages INTEGER DEFAULT 0,
  avg_request_interval_ms INTEGER,
  requests_per_minute DECIMAL(10,2),

  -- 异常指标
  suspicious_patterns TEXT[],
  bot_probability DECIMAL(3,2) CHECK (bot_probability >= 0 AND bot_probability <= 1),

  -- 访问特征
  user_agents TEXT[],
  referers TEXT[],
  accessed_endpoints TEXT[],

  -- JavaScript 执行
  javascript_enabled BOOLEAN,
  browser_fingerprint TEXT,

  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_access_behavior_identifier ON access_behavior_analysis(identifier, time_window DESC);
CREATE INDEX idx_access_behavior_probability ON access_behavior_analysis(bot_probability DESC, analyzed_at DESC);

COMMENT ON TABLE access_behavior_analysis IS '访问行为分析：基于行为模式识别爬虫';
COMMENT ON COLUMN access_behavior_analysis.suspicious_patterns IS '可疑模式：如 high_frequency, no_javascript, sequential_access';

-- ──────────────────────────────────────────
-- 4. 蜜罐陷阱表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS honeypot_traps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trap_type TEXT NOT NULL CHECK (trap_type IN ('hidden_link', 'fake_api', 'invisible_field', 'timing_trap')),
  trap_path TEXT UNIQUE NOT NULL,
  trap_content JSONB,
  is_active BOOLEAN DEFAULT true,
  trigger_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_honeypot_traps_path ON honeypot_traps(trap_path) WHERE is_active = true;

COMMENT ON TABLE honeypot_traps IS '蜜罐陷阱：诱导爬虫触发以识别';
COMMENT ON COLUMN honeypot_traps.trap_content IS '陷阱内容：隐藏链接、假数据等';

-- 初始化蜜罐陷阱
INSERT INTO honeypot_traps (trap_type, trap_path, trap_content) VALUES
  ('hidden_link', '/api/internal/admin-data', '{"description": "Hidden admin endpoint"}'),
  ('hidden_link', '/secret-agents-list', '{"description": "Fake agents list"}'),
  ('fake_api', '/api/v1/users/all', '{"description": "Fake user data endpoint"}');

-- ──────────────────────────────────────────
-- 5. 蜜罐触发记录表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS honeypot_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trap_id UUID NOT NULL REFERENCES honeypot_traps(id) ON DELETE CASCADE,
  ip_address INET NOT NULL,
  user_agent TEXT,
  referer TEXT,
  request_method TEXT,
  request_headers JSONB,
  auto_blocked BOOLEAN DEFAULT false,
  triggered_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_honeypot_triggers_trap ON honeypot_triggers(trap_id, triggered_at DESC);
CREATE INDEX idx_honeypot_triggers_ip ON honeypot_triggers(ip_address, triggered_at DESC);

COMMENT ON TABLE honeypot_triggers IS '蜜罐触发记录：爬虫访问陷阱的记录';

-- ──────────────────────────────────────────
-- 6. 数据访问控制表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS data_access_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type TEXT NOT NULL CHECK (resource_type IN ('agent', 'user_profile', 'post', 'job', 'api_endpoint')),
  resource_id TEXT,
  access_level TEXT NOT NULL CHECK (access_level IN ('public', 'authenticated', 'premium', 'private')),
  rate_limit_per_minute INTEGER,
  rate_limit_per_hour INTEGER,
  rate_limit_per_day INTEGER,
  require_captcha BOOLEAN DEFAULT false,
  require_javascript BOOLEAN DEFAULT false,
  allowed_user_agents TEXT[],
  blocked_user_agents TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_data_access_controls_resource ON data_access_controls(resource_type, resource_id) WHERE is_active = true;

COMMENT ON TABLE data_access_controls IS '数据访问控制：细粒度的资源访问限制';

-- 初始化默认访问控制（下调限制）
INSERT INTO data_access_controls (resource_type, access_level, rate_limit_per_minute, rate_limit_per_hour, rate_limit_per_day) VALUES
  ('agent', 'public', 10, 100, 500),
  ('user_profile', 'authenticated', 5, 50, 200),
  ('post', 'public', 10, 100, 500),
  ('api_endpoint', 'authenticated', 20, 200, 1000);

-- ──────────────────────────────────────────
-- 7. 敏感数据脱敏规则表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS data_masking_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  column_name TEXT NOT NULL,
  masking_type TEXT NOT NULL CHECK (masking_type IN ('full', 'partial', 'hash', 'tokenize', 'redact')),
  masking_pattern TEXT, -- 如 '***', 'xxx@xxx.com'
  apply_to_roles TEXT[], -- 对哪些角色应用脱敏
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(table_name, column_name)
);

CREATE INDEX idx_data_masking_rules_table ON data_masking_rules(table_name) WHERE is_active = true;

COMMENT ON TABLE data_masking_rules IS '敏感数据脱敏规则：保护用户隐私';

-- 初始化脱敏规则
INSERT INTO data_masking_rules (table_name, column_name, masking_type, masking_pattern, apply_to_roles) VALUES
  ('profiles', 'email', 'partial', 'xxx@xxx.com', ARRAY['public']),
  ('profiles', 'phone', 'partial', '***-****-1234', ARRAY['public']),
  ('lawyer_profiles', 'bar_number', 'hash', NULL, ARRAY['public', 'seeker']),
  ('orders', 'payment_id', 'redact', '***', ARRAY['public']);

-- ──────────────────────────────────────────
-- 8. JavaScript 挑战记录表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS javascript_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  ip_address INET NOT NULL,
  challenge_token TEXT UNIQUE NOT NULL,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('computation', 'dom_manipulation', 'timing', 'fingerprint')),
  expected_result TEXT NOT NULL,
  actual_result TEXT,
  passed BOOLEAN,
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_javascript_challenges_session ON javascript_challenges(session_id);
CREATE INDEX idx_javascript_challenges_token ON javascript_challenges(challenge_token);
CREATE INDEX idx_javascript_challenges_ip ON javascript_challenges(ip_address, created_at DESC);

COMMENT ON TABLE javascript_challenges IS 'JavaScript 挑战：验证客户端是否为真实浏览器';

-- ──────────────────────────────────────────
-- 9. 检测爬虫的函数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION detect_bot(
  p_ip_address INET,
  p_user_agent TEXT,
  p_endpoint TEXT
)
RETURNS TABLE(
  is_bot BOOLEAN,
  risk_score INTEGER,
  action TEXT,
  reason TEXT
) AS $$
DECLARE
  v_risk_score INTEGER := 0;
  v_action TEXT := 'allow';
  v_reason TEXT := '';
  v_signature RECORD;
BEGIN
  -- 1. 检查 User-Agent 特征
  FOR v_signature IN
    SELECT * FROM bot_signatures
    WHERE signature_type = 'user_agent'
      AND is_active = true
      AND p_user_agent ILIKE '%' || signature_value || '%'
    ORDER BY risk_level DESC
    LIMIT 1
  LOOP
    v_risk_score := v_risk_score + CASE v_signature.risk_level
      WHEN 'critical' THEN 80
      WHEN 'high' THEN 60
      WHEN 'medium' THEN 40
      WHEN 'low' THEN 20
    END;
    v_action := v_signature.action;
    v_reason := 'User-Agent matched: ' || v_signature.bot_name;
  END LOOP;

  -- 2. 检查是否触发过蜜罐
  IF EXISTS (
    SELECT 1 FROM honeypot_triggers
    WHERE ip_address = p_ip_address
      AND triggered_at > NOW() - INTERVAL '24 hours'
  ) THEN
    v_risk_score := v_risk_score + 70;
    v_action := 'block';
    v_reason := v_reason || '; Honeypot triggered';
  END IF;

  -- 3. 检查请求频率
  DECLARE
    v_recent_requests INTEGER;
  BEGIN
    SELECT COUNT(*) INTO v_recent_requests
    FROM rate_limit_records
    WHERE identifier = p_ip_address::text
      AND window_end > NOW() - INTERVAL '1 minute';

    IF v_recent_requests > 100 THEN
      v_risk_score := v_risk_score + 50;
      v_action := 'challenge';
      v_reason := v_reason || '; High request frequency';
    END IF;
  END;

  -- 4. 检查行为模式
  DECLARE
    v_bot_probability DECIMAL;
  BEGIN
    SELECT bot_probability INTO v_bot_probability
    FROM access_behavior_analysis
    WHERE identifier = p_ip_address::text
      AND time_window > NOW() - INTERVAL '1 hour'
    ORDER BY analyzed_at DESC
    LIMIT 1;

    IF v_bot_probability > 0.7 THEN
      v_risk_score := v_risk_score + 60;
      v_action := 'block';
      v_reason := v_reason || '; Suspicious behavior pattern';
    END IF;
  END;

  -- 记录检测结果
  INSERT INTO bot_detections (
    ip_address,
    user_agent,
    detection_method,
    risk_score,
    confidence,
    action_taken,
    evidence
  ) VALUES (
    p_ip_address,
    p_user_agent,
    'behavior_analysis',
    v_risk_score,
    LEAST(v_risk_score / 100.0, 1.0),
    v_action,
    jsonb_build_object('endpoint', p_endpoint, 'reason', v_reason)
  );

  RETURN QUERY SELECT
    v_risk_score > 50,
    v_risk_score,
    v_action,
    v_reason;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION detect_bot IS '综合检测爬虫：基于多种特征和行为模式';

-- ──────────────────────────────────────────
-- 10. 触发器：蜜罐触发自动封禁
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION auto_block_honeypot_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- 更新陷阱触发次数
  UPDATE honeypot_traps
  SET trigger_count = trigger_count + 1
  WHERE id = NEW.trap_id;

  -- 自动封禁 IP（24小时）
  INSERT INTO ip_blacklist (
    ip_address,
    reason,
    expires_at,
    metadata
  ) VALUES (
    NEW.ip_address,
    '触发蜜罐陷阱',
    NOW() + INTERVAL '24 hours',
    jsonb_build_object('trap_id', NEW.trap_id, 'auto_blocked', true)
  )
  ON CONFLICT (ip_address) DO UPDATE
  SET expires_at = NOW() + INTERVAL '24 hours',
      metadata = jsonb_set(
        ip_blacklist.metadata,
        '{trigger_count}',
        to_jsonb(COALESCE((ip_blacklist.metadata->>'trigger_count')::int, 0) + 1)
      );

  -- 记录异常
  INSERT INTO anomaly_detections (
    detection_type,
    severity,
    ip_address,
    description,
    evidence,
    auto_blocked
  ) VALUES (
    'data_scraping',
    'high',
    NEW.ip_address,
    '访问蜜罐陷阱',
    jsonb_build_object('trap_id', NEW.trap_id, 'user_agent', NEW.user_agent),
    true
  );

  NEW.auto_blocked := true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_honeypot_triggered
  BEFORE INSERT ON honeypot_triggers
  FOR EACH ROW
  EXECUTE FUNCTION auto_block_honeypot_trigger();

-- ──────────────────────────────────────────
-- 11. 分析访问行为的函数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION analyze_access_behavior(
  p_identifier TEXT,
  p_identifier_type TEXT,
  p_time_window_minutes INTEGER DEFAULT 60
)
RETURNS DECIMAL AS $$
DECLARE
  v_bot_probability DECIMAL := 0.0;
  v_total_requests INTEGER;
  v_unique_pages INTEGER;
  v_avg_interval_ms INTEGER;
  v_requests_per_minute DECIMAL;
  v_suspicious_patterns TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- 统计请求数据
  SELECT
    COUNT(*),
    COUNT(DISTINCT endpoint),
    AVG(EXTRACT(EPOCH FROM (window_end - window_start)) * 1000)::INTEGER
  INTO v_total_requests, v_unique_pages, v_avg_interval_ms
  FROM rate_limit_records
  WHERE identifier = p_identifier
    AND identifier_type = p_identifier_type
    AND window_end > NOW() - (p_time_window_minutes || ' minutes')::INTERVAL;

  v_requests_per_minute := v_total_requests::DECIMAL / p_time_window_minutes;

  -- 判断可疑模式
  IF v_requests_per_minute > 10 THEN
    v_suspicious_patterns := array_append(v_suspicious_patterns, 'high_frequency');
    v_bot_probability := v_bot_probability + 0.3;
  END IF;

  IF v_avg_interval_ms < 100 THEN
    v_suspicious_patterns := array_append(v_suspicious_patterns, 'too_fast');
    v_bot_probability := v_bot_probability + 0.2;
  END IF;

  IF v_unique_pages < 3 AND v_total_requests > 50 THEN
    v_suspicious_patterns := array_append(v_suspicious_patterns, 'repetitive_access');
    v_bot_probability := v_bot_probability + 0.3;
  END IF;

  -- 插入分析结果
  INSERT INTO access_behavior_analysis (
    identifier,
    identifier_type,
    time_window,
    total_requests,
    unique_pages,
    avg_request_interval_ms,
    requests_per_minute,
    suspicious_patterns,
    bot_probability
  ) VALUES (
    p_identifier,
    p_identifier_type,
    NOW(),
    v_total_requests,
    v_unique_pages,
    v_avg_interval_ms,
    v_requests_per_minute,
    v_suspicious_patterns,
    LEAST(v_bot_probability, 1.0)
  );

  RETURN LEAST(v_bot_probability, 1.0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION analyze_access_behavior IS '分析访问行为并计算爬虫概率';

-- ──────────────────────────────────────────
-- 12. 数据脱敏函数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION mask_sensitive_data(
  p_table_name TEXT,
  p_column_name TEXT,
  p_value TEXT,
  p_user_role TEXT
)
RETURNS TEXT AS $$
DECLARE
  v_rule RECORD;
  v_masked_value TEXT;
BEGIN
  -- 查询脱敏规则
  SELECT * INTO v_rule
  FROM data_masking_rules
  WHERE table_name = p_table_name
    AND column_name = p_column_name
    AND is_active = true
    AND (apply_to_roles IS NULL OR p_user_role = ANY(apply_to_roles));

  IF NOT FOUND THEN
    RETURN p_value;
  END IF;

  -- 应用脱敏
  CASE v_rule.masking_type
    WHEN 'full' THEN
      v_masked_value := '***';
    WHEN 'partial' THEN
      IF p_column_name = 'email' THEN
        v_masked_value := substring(p_value from 1 for 2) || '***@' || split_part(p_value, '@', 2);
      ELSIF p_column_name = 'phone' THEN
        v_masked_value := '***-****-' || right(p_value, 4);
      ELSE
        v_masked_value := left(p_value, 3) || '***';
      END IF;
    WHEN 'hash' THEN
      v_masked_value := encode(digest(p_value, 'sha256'), 'hex');
    WHEN 'redact' THEN
      v_masked_value := v_rule.masking_pattern;
    ELSE
      v_masked_value := p_value;
  END CASE;

  RETURN v_masked_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION mask_sensitive_data IS '敏感数据脱敏：根据规则保护用户隐私';

-- ──────────────────────────────────────────
-- 13. 清理反爬虫数据的函数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION cleanup_antibot_data()
RETURNS void AS $$
BEGIN
  -- 删除旧的爬虫检测记录（保留 30 天）
  DELETE FROM bot_detections
  WHERE detected_at < NOW() - INTERVAL '30 days';

  -- 删除旧的访问行为分析（保留 7 天）
  DELETE FROM access_behavior_analysis
  WHERE analyzed_at < NOW() - INTERVAL '7 days';

  -- 删除旧的蜜罐触发记录（保留 90 天）
  DELETE FROM honeypot_triggers
  WHERE triggered_at < NOW() - INTERVAL '90 days';

  -- 删除旧的 JavaScript 挑战记录（保留 7 天）
  DELETE FROM javascript_challenges
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_antibot_data IS '清理反爬虫数据（建议每日执行）';

-- ──────────────────────────────────────────
-- 14. 反爬虫统计视图
-- ──────────────────────────────────────────
CREATE OR REPLACE VIEW antibot_stats AS
SELECT
  (SELECT COUNT(*) FROM bot_detections WHERE detected_at > NOW() - INTERVAL '24 hours') AS detections_24h,
  (SELECT COUNT(*) FROM bot_detections WHERE action_taken = 'blocked' AND detected_at > NOW() - INTERVAL '24 hours') AS blocked_24h,
  (SELECT COUNT(*) FROM honeypot_triggers WHERE triggered_at > NOW() - INTERVAL '24 hours') AS honeypot_triggers_24h,
  (SELECT COUNT(DISTINCT ip_address) FROM bot_detections WHERE detected_at > NOW() - INTERVAL '24 hours') AS unique_bot_ips_24h,
  (SELECT AVG(risk_score) FROM bot_detections WHERE detected_at > NOW() - INTERVAL '24 hours') AS avg_risk_score_24h,
  (SELECT COUNT(*) FROM bot_signatures WHERE is_active = true) AS active_signatures,
  (SELECT COUNT(*) FROM honeypot_traps WHERE is_active = true) AS active_traps;

COMMENT ON VIEW antibot_stats IS '反爬虫统计概览';

-- ──────────────────────────────────────────
-- 15. RLS 策略
-- ──────────────────────────────────────────
ALTER TABLE bot_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_behavior_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE honeypot_traps ENABLE ROW LEVEL SECURITY;
ALTER TABLE honeypot_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_access_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_masking_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE javascript_challenges ENABLE ROW LEVEL SECURITY;

-- 所有反爬虫表仅管理员可访问
CREATE POLICY "bot_signatures_admin_only" ON bot_signatures
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "bot_detections_admin_only" ON bot_detections
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "access_behavior_admin_only" ON access_behavior_analysis
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "honeypot_traps_admin_only" ON honeypot_traps
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "honeypot_triggers_admin_only" ON honeypot_triggers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "data_access_controls_admin_only" ON data_access_controls
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "data_masking_rules_admin_only" ON data_masking_rules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "javascript_challenges_admin_only" ON javascript_challenges
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
-- ============================================
-- 015: 数据下载限制与文件上传安全
-- ============================================

-- ──────────────────────────────────────────
-- 1. 数据下载记录表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS data_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('agent', 'post', 'document', 'export', 'report')),
  resource_id UUID,
  file_name TEXT,
  file_size_bytes BIGINT,
  download_method TEXT CHECK (download_method IN ('direct', 'api', 'export')),
  ip_address INET,
  user_agent TEXT,
  downloaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_data_downloads_user ON data_downloads(user_id, downloaded_at DESC);
CREATE INDEX idx_data_downloads_resource ON data_downloads(resource_type, resource_id);
-- 按日期查询可以使用 downloaded_at 索引配合 WHERE 条件

COMMENT ON TABLE data_downloads IS '数据下载记录：追踪所有数据下载行为';

-- ──────────────────────────────────────────
-- 2. 用户下载配额表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_download_quotas (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  daily_limit INTEGER DEFAULT 10 CHECK (daily_limit >= 0),
  monthly_limit INTEGER DEFAULT 100 CHECK (monthly_limit >= 0),
  total_size_limit_mb INTEGER DEFAULT 500 CHECK (total_size_limit_mb >= 0),
  today_count INTEGER DEFAULT 0 CHECK (today_count >= 0),
  today_size_mb DECIMAL(10,2) DEFAULT 0 CHECK (today_size_mb >= 0),
  month_count INTEGER DEFAULT 0 CHECK (month_count >= 0),
  month_size_mb DECIMAL(10,2) DEFAULT 0 CHECK (month_size_mb >= 0),
  last_reset_date DATE DEFAULT CURRENT_DATE,
  last_download_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE user_download_quotas IS '用户下载配额：每日/每月下载次数和大小限制';

-- ──────────────────────────────────────────
-- 3. 触发器：自动创建下载配额
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION create_user_download_quota()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_download_quotas (user_id, daily_limit, monthly_limit, total_size_limit_mb)
  VALUES (
    NEW.id,
    CASE NEW.role
      WHEN 'admin' THEN 1000
      WHEN 'creator' THEN 50
      WHEN 'client' THEN 30
      ELSE 10
    END,
    CASE NEW.role
      WHEN 'admin' THEN 10000
      WHEN 'creator' THEN 500
      WHEN 'client' THEN 300
      ELSE 100
    END,
    CASE NEW.role
      WHEN 'admin' THEN 10000
      WHEN 'creator' THEN 2000
      WHEN 'client' THEN 1000
      ELSE 500
    END
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created_download_quota
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_user_download_quota();

-- ──────────────────────────────────────────
-- 4. 检查下载配额的函数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION check_download_quota(
  p_user_id UUID,
  p_file_size_bytes BIGINT
)
RETURNS TABLE(
  allowed BOOLEAN,
  reason TEXT,
  daily_remaining INTEGER,
  monthly_remaining INTEGER
) AS $$
DECLARE
  v_quota RECORD;
  v_file_size_mb DECIMAL;
BEGIN
  v_file_size_mb := p_file_size_bytes / 1024.0 / 1024.0;

  -- 获取配额信息
  SELECT * INTO v_quota
  FROM user_download_quotas
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, '未找到下载配额信息', 0, 0;
    RETURN;
  END IF;

  -- 检查是否需要重置每日计数
  IF v_quota.last_reset_date < CURRENT_DATE THEN
    UPDATE user_download_quotas
    SET today_count = 0,
        today_size_mb = 0,
        last_reset_date = CURRENT_DATE
    WHERE user_id = p_user_id;

    v_quota.today_count := 0;
    v_quota.today_size_mb := 0;
  END IF;

  -- 检查每日次数限制
  IF v_quota.today_count >= v_quota.daily_limit THEN
    RETURN QUERY SELECT
      false,
      '已达到每日下载次数限制（' || v_quota.daily_limit || '次）',
      0,
      v_quota.monthly_limit - v_quota.month_count;
    RETURN;
  END IF;

  -- 检查每日大小限制
  IF v_quota.today_size_mb + v_file_size_mb > v_quota.total_size_limit_mb THEN
    RETURN QUERY SELECT
      false,
      '已达到每日下载大小限制（' || v_quota.total_size_limit_mb || 'MB）',
      v_quota.daily_limit - v_quota.today_count,
      v_quota.monthly_limit - v_quota.month_count;
    RETURN;
  END IF;

  -- 检查每月次数限制
  IF v_quota.month_count >= v_quota.monthly_limit THEN
    RETURN QUERY SELECT
      false,
      '已达到每月下载次数限制（' || v_quota.monthly_limit || '次）',
      v_quota.daily_limit - v_quota.today_count,
      0;
    RETURN;
  END IF;

  RETURN QUERY SELECT
    true,
    '允许下载',
    v_quota.daily_limit - v_quota.today_count - 1,
    v_quota.monthly_limit - v_quota.month_count - 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_download_quota(UUID, BIGINT) IS '检查用户下载配额';

-- ──────────────────────────────────────────
-- 5. 记录下载并更新配额的函数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION record_download(
  p_user_id UUID,
  p_resource_type TEXT,
  p_resource_id UUID,
  p_file_name TEXT,
  p_file_size_bytes BIGINT,
  p_ip_address INET,
  p_user_agent TEXT
)
RETURNS UUID AS $$
DECLARE
  v_download_id UUID;
  v_file_size_mb DECIMAL;
BEGIN
  v_file_size_mb := p_file_size_bytes / 1024.0 / 1024.0;

  -- 记录下载
  INSERT INTO data_downloads (
    user_id,
    resource_type,
    resource_id,
    file_name,
    file_size_bytes,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    p_resource_type,
    p_resource_id,
    p_file_name,
    p_file_size_bytes,
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO v_download_id;

  -- 更新配额
  UPDATE user_download_quotas
  SET today_count = today_count + 1,
      today_size_mb = today_size_mb + v_file_size_mb,
      month_count = month_count + 1,
      month_size_mb = month_size_mb + v_file_size_mb,
      last_download_at = NOW(),
      updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN v_download_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION record_download(UUID, TEXT, UUID, TEXT, BIGINT, INET, TEXT) IS '记录下载并更新用户配额';

-- ──────────────────────────────────────────
-- 6. 文件上传记录表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS file_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0),
  mime_type TEXT,
  file_hash TEXT, -- SHA-256
  storage_path TEXT NOT NULL,
  upload_purpose TEXT CHECK (upload_purpose IN ('avatar', 'document', 'agent_demo', 'post_attachment', 'other')),
  scan_status TEXT DEFAULT 'pending' CHECK (scan_status IN ('pending', 'scanning', 'clean', 'suspicious', 'malicious')),
  scan_result JSONB,
  ip_address INET,
  user_agent TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_file_uploads_user ON file_uploads(user_id, uploaded_at DESC);
CREATE INDEX idx_file_uploads_hash ON file_uploads(file_hash);
CREATE INDEX idx_file_uploads_scan_status ON file_uploads(scan_status, uploaded_at DESC);

COMMENT ON TABLE file_uploads IS '文件上传记录：追踪所有文件上传';
COMMENT ON COLUMN file_uploads.file_hash IS 'SHA-256 哈希值，用于检测重复文件和恶意文件';

-- ──────────────────────────────────────────
-- 7. 文件安全扫描规则表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS file_scan_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT UNIQUE NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('file_type', 'file_size', 'file_name', 'content_pattern', 'hash_blacklist')),
  rule_condition JSONB NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  action TEXT NOT NULL CHECK (action IN ('allow', 'warn', 'quarantine', 'reject')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_file_scan_rules_type ON file_scan_rules(rule_type) WHERE is_active = true;

COMMENT ON TABLE file_scan_rules IS '文件安全扫描规则';

-- 初始化文件扫描规则
INSERT INTO file_scan_rules (rule_name, rule_type, rule_condition, severity, action) VALUES
  ('禁止可执行文件', 'file_type', '{"blocked_extensions": [".exe", ".bat", ".sh", ".cmd", ".com", ".scr", ".vbs", ".js", ".jar"]}', 'critical', 'reject'),
  ('禁止超大文件', 'file_size', '{"max_size_mb": 100}', 'error', 'reject'),
  ('可疑文件名', 'file_name', '{"patterns": ["virus", "malware", "hack", "crack", "keygen"]}', 'warning', 'quarantine'),
  ('允许的图片格式', 'file_type', '{"allowed_extensions": [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"]}', 'info', 'allow'),
  ('允许的文档格式', 'file_type', '{"allowed_extensions": [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt"]}', 'info', 'allow');

-- ──────────────────────────────────────────
-- 8. 文件异常检测记录表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS file_anomaly_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID NOT NULL REFERENCES file_uploads(id) ON DELETE CASCADE,
  anomaly_type TEXT NOT NULL CHECK (anomaly_type IN (
    'suspicious_file_type',
    'oversized_file',
    'malicious_content',
    'duplicate_upload',
    'rapid_uploads',
    'suspicious_file_name',
    'hash_blacklisted'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  evidence JSONB DEFAULT '{}',
  auto_action TEXT CHECK (auto_action IN ('none', 'quarantine', 'delete', 'block_user')),
  reviewed BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  detected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_file_anomaly_upload ON file_anomaly_detections(upload_id);
CREATE INDEX idx_file_anomaly_type ON file_anomaly_detections(anomaly_type, detected_at DESC);
CREATE INDEX idx_file_anomaly_severity ON file_anomaly_detections(severity, detected_at DESC);
CREATE INDEX idx_file_anomaly_reviewed ON file_anomaly_detections(reviewed, detected_at DESC);

COMMENT ON TABLE file_anomaly_detections IS '文件异常检测记录：识别可疑文件上传';

-- ──────────────────────────────────────────
-- 9. 文件上传行为分析表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS upload_behavior_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  time_window TIMESTAMPTZ NOT NULL,
  total_uploads INTEGER DEFAULT 0,
  total_size_mb DECIMAL(10,2) DEFAULT 0,
  unique_file_types TEXT[],
  avg_file_size_mb DECIMAL(10,2),
  suspicious_patterns TEXT[],
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
  analyzed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_upload_behavior_user ON upload_behavior_analysis(user_id, analyzed_at DESC);
CREATE INDEX idx_upload_behavior_risk ON upload_behavior_analysis(risk_score DESC, analyzed_at DESC);

COMMENT ON TABLE upload_behavior_analysis IS '文件上传行为分析：检测异常上传模式';

-- ──────────────────────────────────────────
-- 10. 文件扫描函数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION scan_uploaded_file(
  p_upload_id UUID,
  p_file_name TEXT,
  p_file_type TEXT,
  p_file_size_bytes BIGINT,
  p_file_hash TEXT
)
RETURNS TABLE(
  scan_passed BOOLEAN,
  scan_status TEXT,
  issues TEXT[]
) AS $$
DECLARE
  v_issues TEXT[] := ARRAY[]::TEXT[];
  v_scan_status TEXT := 'clean';
  v_rule RECORD;
  v_file_extension TEXT;
  v_file_size_mb DECIMAL;
BEGIN
  v_file_extension := lower(substring(p_file_name from '\.([^.]+)$'));
  v_file_size_mb := p_file_size_bytes / 1024.0 / 1024.0;

  -- 检查所有活跃规则
  FOR v_rule IN
    SELECT * FROM file_scan_rules
    WHERE is_active = true
    ORDER BY severity DESC
  LOOP
    CASE v_rule.rule_type
      WHEN 'file_type' THEN
        -- 检查禁止的文件类型
        IF v_rule.rule_condition ? 'blocked_extensions' THEN
          IF ('.' || v_file_extension) = ANY(
            SELECT jsonb_array_elements_text(v_rule.rule_condition->'blocked_extensions')
          ) THEN
            v_issues := array_append(v_issues, '禁止的文件类型: ' || v_file_extension);
            v_scan_status := 'malicious';
          END IF;
        END IF;

      WHEN 'file_size' THEN
        -- 检查文件大小
        IF v_rule.rule_condition ? 'max_size_mb' THEN
          IF v_file_size_mb > (v_rule.rule_condition->>'max_size_mb')::DECIMAL THEN
            v_issues := array_append(v_issues, '文件过大: ' || v_file_size_mb || 'MB');
            IF v_rule.severity IN ('error', 'critical') THEN
              v_scan_status := 'suspicious';
            END IF;
          END IF;
        END IF;

      WHEN 'file_name' THEN
        -- 检查可疑文件名
        IF v_rule.rule_condition ? 'patterns' THEN
          DECLARE
            v_pattern TEXT;
          BEGIN
            FOR v_pattern IN
              SELECT jsonb_array_elements_text(v_rule.rule_condition->'patterns')
            LOOP
              IF p_file_name ILIKE '%' || v_pattern || '%' THEN
                v_issues := array_append(v_issues, '可疑文件名包含: ' || v_pattern);
                v_scan_status := 'suspicious';
              END IF;
            END LOOP;
          END;
        END IF;

      WHEN 'hash_blacklist' THEN
        -- 检查文件哈希黑名单（需要预先维护黑名单）
        IF v_rule.rule_condition ? 'blacklisted_hashes' THEN
          IF p_file_hash = ANY(
            SELECT jsonb_array_elements_text(v_rule.rule_condition->'blacklisted_hashes')
          ) THEN
            v_issues := array_append(v_issues, '文件哈希在黑名单中');
            v_scan_status := 'malicious';
          END IF;
        END IF;
    END CASE;
  END LOOP;

  -- 更新上传记录的扫描状态
  UPDATE file_uploads
  SET scan_status = v_scan_status,
      scan_result = jsonb_build_object('issues', v_issues, 'scanned_at', NOW())
  WHERE id = p_upload_id;

  RETURN QUERY SELECT
    v_scan_status = 'clean',
    v_scan_status,
    v_issues;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION scan_uploaded_file IS '扫描上传的文件并检测安全问题';

-- ──────────────────────────────────────────
-- 11. 检测文件上传异常的函数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION detect_upload_anomaly(
  p_user_id UUID,
  p_upload_id UUID
)
RETURNS void AS $$
DECLARE
  v_recent_uploads INTEGER;
  v_duplicate_count INTEGER;
  v_upload RECORD;
  v_anomaly_detected BOOLEAN := false;
BEGIN
  -- 获取上传信息
  SELECT * INTO v_upload
  FROM file_uploads
  WHERE id = p_upload_id;

  -- 1. 检测快速连续上传（5分钟内超过10次）
  SELECT COUNT(*) INTO v_recent_uploads
  FROM file_uploads
  WHERE user_id = p_user_id
    AND uploaded_at > NOW() - INTERVAL '5 minutes';

  IF v_recent_uploads > 10 THEN
    INSERT INTO file_anomaly_detections (
      upload_id,
      anomaly_type,
      severity,
      description,
      evidence,
      auto_action
    ) VALUES (
      p_upload_id,
      'rapid_uploads',
      'medium',
      '5分钟内上传超过10个文件',
      jsonb_build_object('upload_count', v_recent_uploads),
      'none'
    );
    v_anomaly_detected := true;
  END IF;

  -- 2. 检测重复文件上传
  SELECT COUNT(*) INTO v_duplicate_count
  FROM file_uploads
  WHERE user_id = p_user_id
    AND file_hash = v_upload.file_hash
    AND id != p_upload_id;

  IF v_duplicate_count > 0 THEN
    INSERT INTO file_anomaly_detections (
      upload_id,
      anomaly_type,
      severity,
      description,
      evidence,
      auto_action
    ) VALUES (
      p_upload_id,
      'duplicate_upload',
      'low',
      '上传了重复的文件',
      jsonb_build_object('duplicate_count', v_duplicate_count, 'file_hash', v_upload.file_hash),
      'none'
    );
  END IF;

  -- 3. 检测扫描结果异常
  IF v_upload.scan_status IN ('suspicious', 'malicious') THEN
    INSERT INTO file_anomaly_detections (
      upload_id,
      anomaly_type,
      severity,
      description,
      evidence,
      auto_action
    ) VALUES (
      p_upload_id,
      CASE v_upload.scan_status
        WHEN 'malicious' THEN 'malicious_content'
        ELSE 'suspicious_file_type'
      END,
      CASE v_upload.scan_status
        WHEN 'malicious' THEN 'critical'
        ELSE 'high'
      END,
      '文件扫描发现问题',
      v_upload.scan_result,
      CASE v_upload.scan_status
        WHEN 'malicious' THEN 'quarantine'
        ELSE 'none'
      END
    );
    v_anomaly_detected := true;
  END IF;

  -- 4. 如果检测到严重异常，发送告警
  IF v_anomaly_detected THEN
    -- 这里可以集成告警系统（邮件、短信、Webhook等）
    -- 暂时记录到安全事件表
    INSERT INTO security_events (
      user_id,
      event_type,
      description,
      ip_address,
      metadata
    ) VALUES (
      p_user_id,
      'suspicious_login',
      '检测到可疑文件上传',
      v_upload.ip_address,
      jsonb_build_object('upload_id', p_upload_id, 'file_name', v_upload.file_name)
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION detect_upload_anomaly IS '检测文件上传异常并触发告警';

-- ──────────────────────────────────────────
-- 12. 触发器：上传后自动扫描和检测
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION auto_scan_upload()
RETURNS TRIGGER AS $$
BEGIN
  -- 自动扫描文件
  PERFORM scan_uploaded_file(
    NEW.id,
    NEW.file_name,
    NEW.file_type,
    NEW.file_size_bytes,
    NEW.file_hash
  );

  -- 检测异常
  PERFORM detect_upload_anomaly(NEW.user_id, NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_file_uploaded
  AFTER INSERT ON file_uploads
  FOR EACH ROW
  EXECUTE FUNCTION auto_scan_upload();

-- ──────────────────────────────────────────
-- 13. 分析用户上传行为的函数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION analyze_upload_behavior(
  p_user_id UUID,
  p_time_window_hours INTEGER DEFAULT 24
)
RETURNS INTEGER AS $$
DECLARE
  v_risk_score INTEGER := 0;
  v_total_uploads INTEGER;
  v_total_size_mb DECIMAL;
  v_suspicious_patterns TEXT[] := ARRAY[]::TEXT[];
  v_anomaly_count INTEGER;
BEGIN
  -- 统计上传数据
  SELECT
    COUNT(*),
    SUM(file_size_bytes) / 1024.0 / 1024.0
  INTO v_total_uploads, v_total_size_mb
  FROM file_uploads
  WHERE user_id = p_user_id
    AND uploaded_at > NOW() - (p_time_window_hours || ' hours')::INTERVAL;

  -- 检查异常模式
  IF v_total_uploads > 50 THEN
    v_suspicious_patterns := array_append(v_suspicious_patterns, 'high_upload_frequency');
    v_risk_score := v_risk_score + 30;
  END IF;

  IF v_total_size_mb > 1000 THEN
    v_suspicious_patterns := array_append(v_suspicious_patterns, 'large_total_size');
    v_risk_score := v_risk_score + 20;
  END IF;

  -- 统计异常检测次数
  SELECT COUNT(*) INTO v_anomaly_count
  FROM file_anomaly_detections fad
  JOIN file_uploads fu ON fu.id = fad.upload_id
  WHERE fu.user_id = p_user_id
    AND fad.detected_at > NOW() - (p_time_window_hours || ' hours')::INTERVAL;

  IF v_anomaly_count > 0 THEN
    v_suspicious_patterns := array_append(v_suspicious_patterns, 'anomalies_detected');
    v_risk_score := v_risk_score + (v_anomaly_count * 10);
  END IF;

  -- 插入分析结果
  INSERT INTO upload_behavior_analysis (
    user_id,
    time_window,
    total_uploads,
    total_size_mb,
    suspicious_patterns,
    risk_score
  ) VALUES (
    p_user_id,
    NOW(),
    v_total_uploads,
    v_total_size_mb,
    v_suspicious_patterns,
    LEAST(v_risk_score, 100)
  );

  RETURN LEAST(v_risk_score, 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION analyze_upload_behavior IS '分析用户上传行为并计算风险评分';

-- ──────────────────────────────────────────
-- 14. 下载和上传统计视图
-- ──────────────────────────────────────────
CREATE OR REPLACE VIEW download_upload_stats AS
SELECT
  (SELECT COUNT(*) FROM data_downloads WHERE downloaded_at > NOW() - INTERVAL '24 hours') AS downloads_24h,
  (SELECT COUNT(DISTINCT user_id) FROM data_downloads WHERE downloaded_at > NOW() - INTERVAL '24 hours') AS unique_downloaders_24h,
  (SELECT COUNT(*) FROM file_uploads WHERE uploaded_at > NOW() - INTERVAL '24 hours') AS uploads_24h,
  (SELECT COUNT(*) FROM file_uploads WHERE scan_status IN ('suspicious', 'malicious') AND uploaded_at > NOW() - INTERVAL '24 hours') AS suspicious_uploads_24h,
  (SELECT COUNT(*) FROM file_anomaly_detections WHERE detected_at > NOW() - INTERVAL '24 hours') AS anomalies_24h,
  (SELECT COUNT(*) FROM file_anomaly_detections WHERE severity IN ('high', 'critical') AND NOT reviewed) AS pending_critical_reviews;

COMMENT ON VIEW download_upload_stats IS '下载和上传统计概览';

-- ──────────────────────────────────────────
-- 15. RLS 策略
-- ──────────────────────────────────────────
ALTER TABLE data_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_download_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_scan_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_anomaly_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_behavior_analysis ENABLE ROW LEVEL SECURITY;

-- 下载记录：用户可查看自己的
CREATE POLICY "downloads_select_own" ON data_downloads
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "downloads_admin_all" ON data_downloads
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 下载配额：用户可查看自己的
CREATE POLICY "download_quotas_select_own" ON user_download_quotas
  FOR SELECT USING (user_id = auth.uid());

-- 文件上传：用户可查看自己的
CREATE POLICY "uploads_select_own" ON file_uploads
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "uploads_insert_own" ON file_uploads
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "uploads_admin_all" ON file_uploads
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 扫描规则：仅管理员
CREATE POLICY "scan_rules_admin_only" ON file_scan_rules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 异常检测：仅管理员
CREATE POLICY "file_anomaly_admin_only" ON file_anomaly_detections
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 上传行为分析：仅管理员
CREATE POLICY "upload_behavior_admin_only" ON upload_behavior_analysis
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- 016: 下载限制系统升级
-- 免费用户：终身累计 20 次上限
-- 付费用户：订阅期内不限次数
-- IP 限制：同一 IP 免费下载累计 30 次上限
-- ============================================

-- ──────────────────────────────────────────
-- 1. 升级 user_download_quotas 表
-- ──────────────────────────────────────────
ALTER TABLE user_download_quotas
  ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS total_lifetime_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS free_total_limit INTEGER DEFAULT 20;

COMMENT ON COLUMN user_download_quotas.is_paid IS '是否处于有效付费订阅期（由触发器维护）';
COMMENT ON COLUMN user_download_quotas.total_lifetime_count IS '终身累计下载次数（免费用户限额判断依据）';
COMMENT ON COLUMN user_download_quotas.free_total_limit IS '免费用户终身下载次数上限，默认 20';

-- ──────────────────────────────────────────
-- 2. IP 下载限制表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ip_download_limits (
  ip_address INET PRIMARY KEY,
  free_download_count INTEGER DEFAULT 0,
  free_download_limit INTEGER DEFAULT 30,
  last_download_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE ip_download_limits IS '同一 IP 免费下载次数限制，防止多账号绕过';
COMMENT ON COLUMN ip_download_limits.free_download_limit IS '同一 IP 免费下载累计上限，默认 30';

-- ──────────────────────────────────────────
-- 3. 订阅状态同步触发器
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION sync_subscription_paid_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' AND NEW.current_period_end > NOW() THEN
    UPDATE user_download_quotas
    SET is_paid = true,
        updated_at = NOW()
    WHERE user_id = NEW.user_id;
  ELSE
    IF NOT EXISTS (
      SELECT 1 FROM subscriptions
      WHERE user_id = NEW.user_id
        AND status = 'active'
        AND current_period_end > NOW()
        AND id != NEW.id
    ) THEN
      UPDATE user_download_quotas
      SET is_paid = false,
          updated_at = NOW()
      WHERE user_id = NEW.user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_subscription_changed_sync_paid ON subscriptions;
CREATE TRIGGER on_subscription_changed_sync_paid
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION sync_subscription_paid_status();

COMMENT ON FUNCTION sync_subscription_paid_status IS '订阅状态变更时自动同步 user_download_quotas.is_paid';

-- ──────────────────────────────────────────
-- 4. 升级 check_download_quota 函数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION check_download_quota(
  p_user_id UUID,
  p_file_size_bytes BIGINT,
  p_ip_address INET DEFAULT NULL
)
RETURNS TABLE(
  allowed BOOLEAN,
  reason TEXT,
  daily_remaining INTEGER,
  monthly_remaining INTEGER,
  lifetime_remaining INTEGER
) AS $$
DECLARE
  v_quota RECORD;
  v_ip_limit RECORD;
  v_has_active_sub BOOLEAN;
BEGIN
  SELECT * INTO v_quota
  FROM user_download_quotas
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, '未找到下载配额信息', 0, 0, 0;
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM subscriptions
    WHERE user_id = p_user_id
      AND status = 'active'
      AND current_period_end > NOW()
  ) INTO v_has_active_sub;

  IF v_has_active_sub != v_quota.is_paid THEN
    UPDATE user_download_quotas
    SET is_paid = v_has_active_sub, updated_at = NOW()
    WHERE user_id = p_user_id;
    v_quota.is_paid := v_has_active_sub;
  END IF;

  IF v_quota.is_paid THEN
    RETURN QUERY SELECT
      true,
      '付费用户，允许下载',
      v_quota.daily_limit - v_quota.today_count,
      v_quota.monthly_limit - v_quota.month_count,
      -1;
    RETURN;
  END IF;

  IF v_quota.total_lifetime_count >= v_quota.free_total_limit THEN
    RETURN QUERY SELECT
      false,
      '免费下载次数已用完（上限 ' || v_quota.free_total_limit || ' 次），请升级会员',
      0,
      0,
      0;
    RETURN;
  END IF;

  IF p_ip_address IS NOT NULL THEN
    SELECT * INTO v_ip_limit
    FROM ip_download_limits
    WHERE ip_address = p_ip_address;

    IF FOUND AND v_ip_limit.free_download_count >= v_ip_limit.free_download_limit THEN
      RETURN QUERY SELECT
        false,
        '该 IP 免费下载次数已达上限，请升级会员',
        0,
        0,
        v_quota.free_total_limit - v_quota.total_lifetime_count;
      RETURN;
    END IF;
  END IF;

  IF v_quota.last_reset_date < CURRENT_DATE THEN
    UPDATE user_download_quotas
    SET today_count = 0,
        today_size_mb = 0,
        last_reset_date = CURRENT_DATE
    WHERE user_id = p_user_id;
    v_quota.today_count := 0;
    v_quota.today_size_mb := 0;
  END IF;

  RETURN QUERY SELECT
    true,
    '允许下载',
    v_quota.daily_limit - v_quota.today_count - 1,
    v_quota.monthly_limit - v_quota.month_count - 1,
    v_quota.free_total_limit - v_quota.total_lifetime_count - 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_download_quota(UUID, BIGINT, INET) IS '检查用户下载配额（支持免费/付费区分及 IP 限制）';

-- ──────────────────────────────────────────
-- 5. 升级 record_download 函数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION record_download(
  p_user_id UUID,
  p_resource_type TEXT,
  p_resource_id UUID,
  p_file_name TEXT,
  p_file_size_bytes BIGINT,
  p_ip_address INET,
  p_user_agent TEXT
)
RETURNS UUID AS $$
DECLARE
  v_download_id UUID;
  v_file_size_mb DECIMAL;
  v_is_paid BOOLEAN;
BEGIN
  v_file_size_mb := p_file_size_bytes / 1024.0 / 1024.0;

  SELECT is_paid INTO v_is_paid
  FROM user_download_quotas
  WHERE user_id = p_user_id;

  INSERT INTO data_downloads (
    user_id,
    resource_type,
    resource_id,
    file_name,
    file_size_bytes,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    p_resource_type,
    p_resource_id,
    p_file_name,
    p_file_size_bytes,
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO v_download_id;

  UPDATE user_download_quotas
  SET today_count = today_count + 1,
      today_size_mb = today_size_mb + v_file_size_mb,
      month_count = month_count + 1,
      month_size_mb = month_size_mb + v_file_size_mb,
      total_lifetime_count = total_lifetime_count + 1,
      last_download_at = NOW(),
      updated_at = NOW()
  WHERE user_id = p_user_id;

  IF NOT COALESCE(v_is_paid, false) AND p_ip_address IS NOT NULL THEN
    INSERT INTO ip_download_limits (ip_address, free_download_count, last_download_at, updated_at)
    VALUES (p_ip_address, 1, NOW(), NOW())
    ON CONFLICT (ip_address) DO UPDATE
      SET free_download_count = ip_download_limits.free_download_count + 1,
          last_download_at = NOW(),
          updated_at = NOW();
  END IF;

  RETURN v_download_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION record_download(UUID, TEXT, UUID, TEXT, BIGINT, INET, TEXT) IS '记录下载并更新用户配额（含终身计数和 IP 计数）';

-- ──────────────────────────────────────────
-- 6. RLS 策略
-- ──────────────────────────────────────────
ALTER TABLE ip_download_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ip_download_limits_admin_only" ON ip_download_limits
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- 017: 在校生认证 + 免费智能体下载限额升级
-- ============================================

-- ──────────────────────────────────────────
-- 1. 在校生认证表
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  degree_type TEXT NOT NULL CHECK (degree_type IN ('undergraduate', 'master', 'phd')),
  school_name TEXT NOT NULL,
  major TEXT,
  enrollment_year INTEGER NOT NULL,
  expected_graduation_year INTEGER NOT NULL,
  student_id_number TEXT,
  edu_email TEXT,
  proof_document_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  reject_reason TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_student_verifications_status ON student_verifications(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_verifications_user ON student_verifications(user_id);

COMMENT ON TABLE student_verifications IS '在校生认证：本科生/硕士生/博士生，认证通过后免费下载上限提升至 40 次';
COMMENT ON COLUMN student_verifications.degree_type IS 'undergraduate=本科生, master=硕士生, phd=博士生';
COMMENT ON COLUMN student_verifications.expires_at IS '认证有效期，通常设为预计毕业年份的 9 月 1 日';

-- ──────────────────────────────────────────
-- 2. user_download_quotas 新增在校生字段
-- ──────────────────────────────────────────
ALTER TABLE user_download_quotas
  ADD COLUMN IF NOT EXISTS is_verified_student BOOLEAN DEFAULT false;

COMMENT ON COLUMN user_download_quotas.is_verified_student IS '是否为认证在校生，认证通过后免费下载上限为 40 次';

-- ──────────────────────────────────────────
-- 3. 在校生认证审核触发器
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION sync_student_verification_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND (NEW.expires_at IS NULL OR NEW.expires_at > NOW()) THEN
    UPDATE user_download_quotas
    SET is_verified_student = true,
        free_total_limit = 40,
        updated_at = NOW()
    WHERE user_id = NEW.user_id;
  ELSE
    UPDATE user_download_quotas
    SET is_verified_student = false,
        free_total_limit = 20,
        updated_at = NOW()
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_student_verification_changed ON student_verifications;
CREATE TRIGGER on_student_verification_changed
  AFTER INSERT OR UPDATE ON student_verifications
  FOR EACH ROW
  EXECUTE FUNCTION sync_student_verification_status();

COMMENT ON FUNCTION sync_student_verification_status IS '在校生认证状态变更时同步 user_download_quotas';

-- ──────────────────────────────────────────
-- 4. 管理员审核函数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION review_student_verification(
  p_verification_id UUID,
  p_reviewer_id UUID,
  p_approved BOOLEAN,
  p_reject_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_record RECORD;
  v_expires_at TIMESTAMPTZ;
BEGIN
  SELECT * INTO v_record
  FROM student_verifications
  WHERE id = p_verification_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION '认证记录不存在';
  END IF;

  IF p_approved THEN
    v_expires_at := make_timestamptz(v_record.expected_graduation_year, 9, 1, 0, 0, 0, 'Asia/Shanghai');
    UPDATE student_verifications
    SET status = 'approved',
        reviewed_by = p_reviewer_id,
        reviewed_at = NOW(),
        expires_at = v_expires_at,
        reject_reason = NULL,
        updated_at = NOW()
    WHERE id = p_verification_id;
  ELSE
    UPDATE student_verifications
    SET status = 'rejected',
        reviewed_by = p_reviewer_id,
        reviewed_at = NOW(),
        reject_reason = p_reject_reason,
        updated_at = NOW()
    WHERE id = p_verification_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION review_student_verification IS '管理员审核在校生认证申请';

-- ──────────────────────────────────────────
-- 5. 认证过期定时函数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION expire_student_verifications()
RETURNS void AS $$
BEGIN
  UPDATE student_verifications
  SET status = 'expired',
      updated_at = NOW()
  WHERE status = 'approved'
    AND expires_at IS NOT NULL
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION expire_student_verifications IS '定时任务：检查并过期已到期的在校生认证';

-- ──────────────────────────────────────────
-- 6. 升级 check_download_quota（含 p_agent_is_free）
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION check_download_quota(
  p_user_id UUID,
  p_file_size_bytes BIGINT,
  p_ip_address INET DEFAULT NULL,
  p_agent_is_free BOOLEAN DEFAULT true
)
RETURNS TABLE(
  allowed BOOLEAN,
  reason TEXT,
  daily_remaining INTEGER,
  monthly_remaining INTEGER,
  lifetime_remaining INTEGER
) AS $$
DECLARE
  v_quota RECORD;
  v_ip_limit RECORD;
  v_has_active_sub BOOLEAN;
BEGIN
  SELECT * INTO v_quota
  FROM user_download_quotas
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, '未找到下载配额信息', 0, 0, 0;
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM subscriptions
    WHERE user_id = p_user_id
      AND status = 'active'
      AND current_period_end > NOW()
  ) INTO v_has_active_sub;

  IF v_has_active_sub != v_quota.is_paid THEN
    UPDATE user_download_quotas
    SET is_paid = v_has_active_sub, updated_at = NOW()
    WHERE user_id = p_user_id;
    v_quota.is_paid := v_has_active_sub;
  END IF;

  IF v_quota.is_paid THEN
    RETURN QUERY SELECT
      true,
      '付费用户，允许下载',
      v_quota.daily_limit - v_quota.today_count,
      v_quota.monthly_limit - v_quota.month_count,
      -1;
    RETURN;
  END IF;

  IF NOT p_agent_is_free THEN
    RETURN QUERY SELECT
      false,
      '该智能体为付费内容，请购买或升级会员后下载',
      v_quota.daily_limit - v_quota.today_count,
      v_quota.monthly_limit - v_quota.month_count,
      v_quota.free_total_limit - v_quota.total_lifetime_count;
    RETURN;
  END IF;

  IF v_quota.total_lifetime_count >= v_quota.free_total_limit THEN
    RETURN QUERY SELECT
      false,
      '免费智能体下载次数已用完（上限 ' || v_quota.free_total_limit || ' 次），请升级会员',
      0,
      0,
      0;
    RETURN;
  END IF;

  IF p_ip_address IS NOT NULL THEN
    SELECT * INTO v_ip_limit
    FROM ip_download_limits
    WHERE ip_address = p_ip_address;

    IF FOUND AND v_ip_limit.free_download_count >= v_ip_limit.free_download_limit THEN
      RETURN QUERY SELECT
        false,
        '该 IP 免费下载次数已达上限，请升级会员',
        0,
        0,
        v_quota.free_total_limit - v_quota.total_lifetime_count;
      RETURN;
    END IF;
  END IF;

  IF v_quota.last_reset_date < CURRENT_DATE THEN
    UPDATE user_download_quotas
    SET today_count = 0,
        today_size_mb = 0,
        last_reset_date = CURRENT_DATE
    WHERE user_id = p_user_id;
    v_quota.today_count := 0;
    v_quota.today_size_mb := 0;
  END IF;

  RETURN QUERY SELECT
    true,
    '允许下载',
    v_quota.daily_limit - v_quota.today_count - 1,
    v_quota.monthly_limit - v_quota.month_count - 1,
    v_quota.free_total_limit - v_quota.total_lifetime_count - 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_download_quota(UUID, BIGINT, INET, BOOLEAN) IS '检查下载配额：免费限额仅针对免费智能体(price=0)，在校生上限40次，普通免费用户20次';

-- ──────────────────────────────────────────
-- 7. 升级 record_download（含 p_agent_is_free）
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION record_download(
  p_user_id UUID,
  p_resource_type TEXT,
  p_resource_id UUID,
  p_file_name TEXT,
  p_file_size_bytes BIGINT,
  p_ip_address INET,
  p_user_agent TEXT,
  p_agent_is_free BOOLEAN DEFAULT true
)
RETURNS UUID AS $$
DECLARE
  v_download_id UUID;
  v_file_size_mb DECIMAL;
  v_is_paid BOOLEAN;
BEGIN
  v_file_size_mb := p_file_size_bytes / 1024.0 / 1024.0;

  SELECT is_paid INTO v_is_paid
  FROM user_download_quotas
  WHERE user_id = p_user_id;

  INSERT INTO data_downloads (
    user_id, resource_type, resource_id, file_name,
    file_size_bytes, ip_address, user_agent
  ) VALUES (
    p_user_id, p_resource_type, p_resource_id, p_file_name,
    p_file_size_bytes, p_ip_address, p_user_agent
  ) RETURNING id INTO v_download_id;

  UPDATE user_download_quotas
  SET today_count = today_count + 1,
      today_size_mb = today_size_mb + v_file_size_mb,
      month_count = month_count + 1,
      month_size_mb = month_size_mb + v_file_size_mb,
      last_download_at = NOW(),
      updated_at = NOW()
  WHERE user_id = p_user_id;

  IF NOT COALESCE(v_is_paid, false) AND p_agent_is_free THEN
    UPDATE user_download_quotas
    SET total_lifetime_count = total_lifetime_count + 1,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    IF p_ip_address IS NOT NULL THEN
      INSERT INTO ip_download_limits (ip_address, free_download_count, last_download_at, updated_at)
      VALUES (p_ip_address, 1, NOW(), NOW())
      ON CONFLICT (ip_address) DO UPDATE
        SET free_download_count = ip_download_limits.free_download_count + 1,
            last_download_at = NOW(),
            updated_at = NOW();
    END IF;
  END IF;

  RETURN v_download_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION record_download(UUID, TEXT, UUID, TEXT, BIGINT, INET, TEXT, BOOLEAN) IS '记录下载并更新配额：免费限额计数仅针对免费智能体(price=0)的免费用户';

-- ──────────────────────────────────────────
-- 8. RLS 策略
-- ──────────────────────────────────────────
ALTER TABLE student_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_verifications_select_own" ON student_verifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "student_verifications_insert_own" ON student_verifications
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "student_verifications_update_own" ON student_verifications
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (status IN ('pending', 'rejected'));

CREATE POLICY "student_verifications_admin_all" ON student_verifications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
