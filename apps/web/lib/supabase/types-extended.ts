// ============================================
// Extended Database Types
// 扩展数据库类型定义（新增系统）
// ============================================

import type { Database } from './types';

// ──────────────────────────────────────────
// 商品管理
// ──────────────────────────────────────────
export type ProductType = 'agent' | 'consultation' | 'course' | 'content';
export type PricingType = 'free' | 'one_time' | 'subscription' | 'usage_based';
export type ProductStatus = 'draft' | 'active' | 'archived';

export interface Product {
  id: string;
  creator_id: string;
  product_type: ProductType;
  related_id: string | null;
  name: string;
  description: string | null;
  pricing_type: PricingType | null;
  price: number;
  currency: string;
  status: ProductStatus;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// ──────────────────────────────────────────
// 订单与支付
// ──────────────────────────────────────────
export type OrderType = 'purchase' | 'subscription' | 'recharge';
export type OrderStatus = 'pending' | 'paid' | 'cancelled' | 'refunded';
export type PaymentMethod = 'alipay' | 'wechat' | 'balance';

export interface Order {
  id: string;
  user_id: string;
  product_id: string | null;
  order_type: OrderType;
  amount: number;
  currency: string;
  status: OrderStatus;
  payment_method: PaymentMethod | null;
  payment_id: string | null;
  metadata: Record<string, any>;
  paid_at: string | null;
  cancelled_at: string | null;
  refunded_at: string | null;
  created_at: string;
}

export interface UserBalance {
  user_id: string;
  balance: number;
  frozen_balance: number;
  total_recharged: number;
  total_consumed: number;
  updated_at: string;
}

export type TransactionType =
  | 'recharge'
  | 'purchase'
  | 'refund'
  | 'reward'
  | 'withdrawal'
  | 'system_adjustment'
  | 'api_call';

export interface BalanceTransaction {
  id: string;
  user_id: string;
  order_id: string | null;
  transaction_type: TransactionType;
  amount: number;
  balance_after: number;
  description: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

// API 调用元数据类型
export interface ApiCallMetadata {
  service: 'llm' | 'embedding' | 'image' | 'tts' | 'stt';
  model: string;
  input_tokens?: number;
  output_tokens?: number;
  endpoint: string;
  request_id?: string;
}

// ──────────────────────────────────────────
// 订阅系统
// ──────────────────────────────────────────
export type PlanType = 'monthly' | 'quarterly' | 'yearly';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'paused';

export interface Subscription {
  id: string;
  user_id: string;
  product_id: string;
  plan_type: PlanType;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  auto_renew: boolean;
  cancelled_at: string | null;
  cancel_reason: string | null;
  created_at: string;
  updated_at: string;
}

export type SubscriptionEventType =
  | 'created'
  | 'renewed'
  | 'cancelled'
  | 'expired'
  | 'paused'
  | 'resumed';

export interface SubscriptionHistory {
  id: string;
  subscription_id: string;
  event_type: SubscriptionEventType;
  period_start: string | null;
  period_end: string | null;
  amount: number | null;
  metadata: Record<string, any>;
  created_at: string;
}

// ──────────────────────────────────────────
// 优惠券系统
// ──────────────────────────────────────────
export type CouponType = 'percentage' | 'fixed_amount' | 'free_trial';

export interface Coupon {
  id: string;
  code: string;
  coupon_type: CouponType;
  discount_value: number;
  min_purchase_amount: number;
  max_discount_amount: number | null;
  applicable_products: string[]; // UUID[]
  usage_limit: number | null;
  used_count: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CouponUsage {
  id: string;
  coupon_id: string;
  user_id: string;
  order_id: string;
  discount_amount: number;
  used_at: string;
}

export interface UserCoupon {
  id: string;
  user_id: string;
  coupon_id: string;
  is_used: boolean;
  received_at: string;
  used_at: string | null;
}

export interface CouponValidationResult {
  valid: boolean;
  coupon_id: string | null;
  discount_amount: number;
  message: string;
}

// ──────────────────────────────────────────
// 评论与点赞
// ──────────────────────────────────────────
export type CommentTargetType = 'agent' | 'post' | 'product' | 'job' | 'comment';

export interface Comment {
  id: string;
  user_id: string;
  target_type: CommentTargetType;
  target_id: string;
  parent_id: string | null;
  content: string;
  like_count: number;
  reply_count: number;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export type LikeTargetType = 'agent' | 'post' | 'comment' | 'product' | 'job';

export interface Like {
  id: string;
  user_id: string;
  target_type: LikeTargetType;
  target_id: string;
  created_at: string;
}

// 带用户信息的评论
export interface CommentWithProfile extends Comment {
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
    verified: boolean;
  } | null;
}

// ──────────────────────────────────────────
// 权限系统
// ──────────────────────────────────────────
export type ResourceType = 'user' | 'agent' | 'post' | 'order' | 'job' | 'system';
export type ActionType = 'create' | 'read' | 'update' | 'delete' | 'manage';

export interface Permission {
  id: string;
  name: string;
  description: string | null;
  resource_type: ResourceType | null;
  action: ActionType | null;
  created_at: string;
}

export interface RolePermission {
  role: Database['public']['Enums']['user_role'];
  permission_id: string;
  created_at: string;
}

export interface UserPermission {
  user_id: string;
  permission_id: string;
  granted: boolean;
  granted_by: string | null;
  granted_at: string;
  expires_at: string | null;
}

// ──────────────────────────────────────────
// API 调用系统（隐藏后门）
// ──────────────────────────────────────────
export type ApiService = 'llm' | 'embedding' | 'image' | 'tts' | 'stt';
export type ApiCallStatus = 'success' | 'error' | 'timeout';

export interface ApiCredential {
  id: string;
  user_id: string;
  api_key: string;
  api_secret: string; // 注意：实际使用时不应返回给前端
  name: string | null;
  rate_limit: number;
  daily_quota: number;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
  expires_at: string | null;
}

// 前端安全版本（不包含 secret）
export interface ApiCredentialSafe extends Omit<ApiCredential, 'api_secret'> {
  api_secret_masked: string; // 如 "sk_***************"
}

export interface ApiCallLog {
  id: string;
  user_id: string;
  api_key_id: string | null;
  service: ApiService;
  model: string;
  endpoint: string;
  request_id: string | null;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost: number;
  status: ApiCallStatus | null;
  error_message: string | null;
  latency_ms: number | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ApiUsageStats {
  id: string;
  user_id: string;
  date: string;
  service: ApiService;
  total_calls: number;
  total_tokens: number;
  total_cost: number;
  success_count: number;
  error_count: number;
}

export interface ApiKeyValidationResult {
  valid: boolean;
  user_id: string | null;
  rate_limit: number;
  daily_quota: number;
  message: string;
}

// ──────────────────────────────────────────
// 认证系统
// ──────────────────────────────────────────
export type LoginMethod = 'password' | 'oauth' | 'magic_link' | 'sms';
export type DeviceType = 'desktop' | 'mobile' | 'tablet';

export interface LoginHistory {
  id: string;
  user_id: string;
  login_method: LoginMethod;
  ip_address: string | null;
  user_agent: string | null;
  device_type: DeviceType | null;
  location: {
    country?: string;
    city?: string;
    region?: string;
  } | null;
  success: boolean;
  failure_reason: string | null;
  created_at: string;
}

export interface EmailVerification {
  id: string;
  user_id: string;
  email: string;
  verification_code: string;
  verified: boolean;
  verified_at: string | null;
  expires_at: string;
  created_at: string;
}

export interface PasswordReset {
  id: string;
  user_id: string;
  reset_token: string;
  used: boolean;
  used_at: string | null;
  expires_at: string;
  ip_address: string | null;
  created_at: string;
}

export type SecurityEventType =
  | 'password_changed'
  | 'email_changed'
  | 'suspicious_login'
  | 'account_locked'
  | 'account_unlocked'
  | 'two_factor_enabled'
  | 'two_factor_disabled';

export interface SecurityEvent {
  id: string;
  user_id: string;
  event_type: SecurityEventType;
  description: string | null;
  ip_address: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export type LockReason =
  | 'too_many_failed_logins'
  | 'suspicious_activity'
  | 'admin_action'
  | 'user_request';

export interface AccountLock {
  id: string;
  user_id: string;
  lock_reason: LockReason;
  locked_at: string;
  locked_until: string | null;
  locked_by: string | null;
  unlock_token: string | null;
  unlocked_at: string | null;
  metadata: Record<string, any>;
}

export type OAuthProvider = 'google' | 'github' | 'wechat' | 'dingtalk';

export interface OAuthConnection {
  id: string;
  user_id: string;
  provider: OAuthProvider;
  provider_user_id: string;
  provider_email: string | null;
  provider_name: string | null;
  access_token: string | null; // 注意：实际使用时应加密存储
  refresh_token: string | null; // 注意：实际使用时应加密存储
  token_expires_at: string | null;
  connected_at: string;
  last_used_at: string | null;
}

export interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  ip_address: string | null;
  user_agent: string | null;
  device_type: DeviceType | null;
  last_activity_at: string;
  expires_at: string;
  created_at: string;
}

export interface PasswordResetValidationResult {
  valid: boolean;
  user_id: string | null;
  message: string;
}

// ──────────────────────────────────────────
// 扩展的用户类型
// ──────────────────────────────────────────
export interface ProfileExtended {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: Database['public']['Enums']['user_role'];
  verified: boolean;
  follower_count: number;
  following_count: number;
  is_verified: boolean;
  is_banned: boolean;
  banned_until: string | null;
  banned_reason: string | null;
  created_at: string;
  updated_at: string;
}

// ──────────────────────────────────────────
// 统计视图类型
// ──────────────────────────────────────────
export interface UserStats {
  user_id: string;
  display_name: string | null;
  role: Database['public']['Enums']['user_role'];
  follower_count: number;
  following_count: number;
  is_verified: boolean;
  balance: number;
  agent_count: number;
  total_favorites: number;
  post_count: number;
  total_post_likes: number;
  total_revenue: number;
  order_count: number;
}

export interface TrendingAgent {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  pricing_model: string | null;
  creator_id: string;
  creator_name: string | null;
  creator_verified: boolean;
  view_count: number;
  trial_count: number;
  like_count: number;
  favorite_count: number;
  avg_rating: number;
  rating_count: number;
  trending_score: number;
  created_at: string;
}

export interface TopCreator {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_verified: boolean;
  follower_count: number;
  agent_count: number;
  total_favorites: number;
  post_count: number;
  total_revenue: number;
  influence_score: number;
  created_at: string;
}

// ──────────────────────────────────────────
// 函数调用参数类型
// ──────────────────────────────────────────
export interface ValidateCouponParams {
  p_code: string;
  p_user_id: string;
  p_product_id: string;
  p_amount: number;
}

export interface GenerateApiKeyParams {
  p_user_id: string;
  p_name?: string;
}

export interface ValidateApiKeyParams {
  p_api_key: string;
  p_api_secret: string;
}

export interface HasPermissionParams {
  p_user_id: string;
  p_permission_name: string;
}

export interface HandleFailedLoginParams {
  p_user_id: string;
  p_ip_address: string;
  p_user_agent: string;
}

export interface GeneratePasswordResetTokenParams {
  p_user_id: string;
  p_ip_address?: string;
}

// ──────────────────────────────────────────
// 反爬虫系统
// ──────────────────────────────────────────
export type BotSignatureType = 'user_agent' | 'ip_range' | 'behavior_pattern' | 'fingerprint';
export type BotCategory = 'search_engine' | 'malicious' | 'scraper' | 'monitoring' | 'unknown';
export type BotRiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type BotAction = 'allow' | 'monitor' | 'challenge' | 'block';

export interface BotSignature {
  id: string;
  signature_type: BotSignatureType;
  signature_value: string;
  bot_name: string | null;
  bot_category: BotCategory | null;
  risk_level: BotRiskLevel;
  action: BotAction;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type DetectionMethod =
  | 'user_agent_match'
  | 'behavior_analysis'
  | 'rate_limit_exceeded'
  | 'fingerprint_analysis'
  | 'honeypot_triggered'
  | 'javascript_challenge_failed'
  | 'captcha_failed';

export type BotActionTaken = 'allowed' | 'monitored' | 'challenged' | 'blocked';

export interface BotDetection {
  id: string;
  ip_address: string;
  user_agent: string | null;
  detection_method: DetectionMethod;
  signature_id: string | null;
  risk_score: number;
  confidence: number;
  action_taken: BotActionTaken;
  evidence: Record<string, any>;
  detected_at: string;
}

export interface AccessBehaviorAnalysis {
  id: string;
  identifier: string;
  identifier_type: 'ip' | 'session' | 'user';
  time_window: string;
  total_requests: number;
  unique_pages: number;
  avg_request_interval_ms: number | null;
  requests_per_minute: number | null;
  suspicious_patterns: string[];
  bot_probability: number;
  user_agents: string[];
  referers: string[];
  accessed_endpoints: string[];
  javascript_enabled: boolean | null;
  browser_fingerprint: string | null;
  analyzed_at: string;
  metadata: Record<string, any>;
}

export type HoneypotTrapType = 'hidden_link' | 'fake_api' | 'invisible_field' | 'timing_trap';

export interface HoneypotTrap {
  id: string;
  trap_type: HoneypotTrapType;
  trap_path: string;
  trap_content: Record<string, any> | null;
  is_active: boolean;
  trigger_count: number;
  created_by: string | null;
  created_at: string;
}

export interface HoneypotTrigger {
  id: string;
  trap_id: string;
  ip_address: string;
  user_agent: string | null;
  referer: string | null;
  request_method: string | null;
  request_headers: Record<string, any> | null;
  auto_blocked: boolean;
  triggered_at: string;
}

export type DataAccessLevel = 'public' | 'authenticated' | 'premium' | 'private';

export interface DataAccessControl {
  id: string;
  resource_type: 'agent' | 'user_profile' | 'post' | 'job' | 'api_endpoint';
  resource_id: string | null;
  access_level: DataAccessLevel;
  rate_limit_per_minute: number | null;
  rate_limit_per_hour: number | null;
  rate_limit_per_day: number | null;
  require_captcha: boolean;
  require_javascript: boolean;
  allowed_user_agents: string[] | null;
  blocked_user_agents: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type MaskingType = 'full' | 'partial' | 'hash' | 'tokenize' | 'redact';

export interface DataMaskingRule {
  id: string;
  table_name: string;
  column_name: string;
  masking_type: MaskingType;
  masking_pattern: string | null;
  apply_to_roles: string[] | null;
  is_active: boolean;
  created_at: string;
}

export type JavaScriptChallengeType = 'computation' | 'dom_manipulation' | 'timing' | 'fingerprint';

export interface JavaScriptChallenge {
  id: string;
  session_id: string;
  ip_address: string;
  challenge_token: string;
  challenge_type: JavaScriptChallengeType;
  expected_result: string;
  actual_result: string | null;
  passed: boolean | null;
  response_time_ms: number | null;
  created_at: string;
  completed_at: string | null;
}

export interface BotDetectionResult {
  is_bot: boolean;
  risk_score: number;
  action: BotAction;
  reason: string;
}

export interface AntibotStats {
  detections_24h: number;
  blocked_24h: number;
  honeypot_triggers_24h: number;
  unique_bot_ips_24h: number;
  avg_risk_score_24h: number;
  active_signatures: number;
  active_traps: number;
}

// 反爬虫函数参数类型
export interface DetectBotParams {
  p_ip_address: string;
  p_user_agent: string;
  p_endpoint: string;
}

export interface AnalyzeAccessBehaviorParams {
  p_identifier: string;
  p_identifier_type: 'ip' | 'session' | 'user';
  p_time_window_minutes?: number;
}

export interface MaskSensitiveDataParams {
  p_table_name: string;
  p_column_name: string;
  p_value: string;
  p_user_role: string;
}

// ──────────────────────────────────────────
// 下载限制与文件上传安全
// ──────────────────────────────────────────
export type DownloadResourceType = 'agent' | 'post' | 'document' | 'export' | 'report';
export type DownloadMethod = 'direct' | 'api' | 'export';

export interface DataDownload {
  id: string;
  user_id: string;
  resource_type: DownloadResourceType;
  resource_id: string | null;
  file_name: string | null;
  file_size_bytes: number | null;
  download_method: DownloadMethod | null;
  ip_address: string | null;
  user_agent: string | null;
  downloaded_at: string;
}

export interface UserDownloadQuota {
  user_id: string;
  daily_limit: number;
  monthly_limit: number;
  total_size_limit_mb: number;
  today_count: number;
  today_size_mb: number;
  month_count: number;
  month_size_mb: number;
  last_reset_date: string;
  last_download_at: string | null;
  updated_at: string;
}

export interface DownloadQuotaCheckResult {
  allowed: boolean;
  reason: string;
  daily_remaining: number;
  monthly_remaining: number;
}

export type UploadPurpose = 'avatar' | 'document' | 'agent_demo' | 'post_attachment' | 'other';
export type FileScanStatus = 'pending' | 'scanning' | 'clean' | 'suspicious' | 'malicious';

export interface FileUpload {
  id: string;
  user_id: string;
  file_name: string;
  file_type: string;
  file_size_bytes: number;
  mime_type: string | null;
  file_hash: string | null;
  storage_path: string;
  upload_purpose: UploadPurpose | null;
  scan_status: FileScanStatus;
  scan_result: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  uploaded_at: string;
}

export type FileScanRuleType = 'file_type' | 'file_size' | 'file_name' | 'content_pattern' | 'hash_blacklist';
export type FileScanAction = 'allow' | 'warn' | 'quarantine' | 'reject';

export interface FileScanRule {
  id: string;
  rule_name: string;
  rule_type: FileScanRuleType;
  rule_condition: Record<string, any>;
  severity: 'info' | 'warning' | 'error' | 'critical';
  action: FileScanAction;
  is_active: boolean;
  created_at: string;
}

export interface FileScanResult {
  scan_passed: boolean;
  scan_status: FileScanStatus;
  issues: string[];
}

export type FileAnomalyType =
  | 'suspicious_file_type'
  | 'oversized_file'
  | 'malicious_content'
  | 'duplicate_upload'
  | 'rapid_uploads'
  | 'suspicious_file_name'
  | 'hash_blacklisted';

export type FileAnomalyAction = 'none' | 'quarantine' | 'delete' | 'block_user';

export interface FileAnomalyDetection {
  id: string;
  upload_id: string;
  anomaly_type: FileAnomalyType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: Record<string, any>;
  auto_action: FileAnomalyAction | null;
  reviewed: boolean;
  reviewed_by: string | null;
  reviewed_at: string | null;
  detected_at: string;
}

export interface UploadBehaviorAnalysis {
  id: string;
  user_id: string;
  time_window: string;
  total_uploads: number;
  total_size_mb: number;
  unique_file_types: string[];
  avg_file_size_mb: number | null;
  suspicious_patterns: string[];
  risk_score: number;
  analyzed_at: string;
}

export interface DownloadUploadStats {
  downloads_24h: number;
  unique_downloaders_24h: number;
  uploads_24h: number;
  suspicious_uploads_24h: number;
  anomalies_24h: number;
  pending_critical_reviews: number;
}

// 函数参数类型
export interface CheckDownloadQuotaParams {
  p_user_id: string;
  p_file_size_bytes: number;
}

export interface RecordDownloadParams {
  p_user_id: string;
  p_resource_type: DownloadResourceType;
  p_resource_id: string;
  p_file_name: string;
  p_file_size_bytes: number;
  p_ip_address: string;
  p_user_agent: string;
}

export interface ScanUploadedFileParams {
  p_upload_id: string;
  p_file_name: string;
  p_file_type: string;
  p_file_size_bytes: number;
  p_file_hash: string;
}

export interface DetectUploadAnomalyParams {
  p_user_id: string;
  p_upload_id: string;
}

export interface AnalyzeUploadBehaviorParams {
  p_user_id: string;
  p_time_window_hours?: number;
}
