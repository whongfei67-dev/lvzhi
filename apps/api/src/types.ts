/**
 * 律植 (Lvzhi) API 类型定义
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'

// ============================================
// Fastify 类型扩展
// ============================================

declare module 'fastify' {
  interface FastifyInstance {
    authenticate(
      request: FastifyRequest,
      reply: FastifyReply
    ): Promise<void>
    authenticateRequired(
      request: FastifyRequest,
      reply: FastifyReply
    ): Promise<void>
    authenticateAdmin(
      request: FastifyRequest,
      reply: FastifyReply
    ): Promise<void>
    authenticateSuperAdmin(
      request: FastifyRequest,
      reply: FastifyReply
    ): Promise<void>
    authorize(roles?: string[]): (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>
  }
}

// ============================================
// 通用响应类型
// ============================================

export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data?: T
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * 分页查询参数
 */
export interface PaginationQuery {
  page?: string
  page_size?: string
}

// ============================================
// 用户 & 认证类型
// ============================================

/**
 * 用户角色
 * - visitor: 游客（未登录）
 * - client: 客户（普通注册用户）
 * - creator: 创作者（技能包/智能体开发者）
 * - admin: 一般管理员（运营人员）
 * - superadmin: 超管（系统最高权限）
 *
 * 注意: 一般管理员是纯管理角色，不具备客户或创作者的业务功能
 */
export type UserRole = 'visitor' | 'client' | 'creator' | 'admin' | 'superadmin'

/**
 * 创作者认证等级
 * - basic: 普通创作者
 * - excellent: 优秀创作者（单品下载量 > 50 或 上传产品 > 5）
 * - master: 大师级创作者（单品下载量 > 200 或 上传产品 > 20）
 * - lawyer: 律师认证
 */
export type CreatorLevel = 'basic' | 'excellent' | 'master' | 'lawyer'

export interface User {
  id: string
  email: string
  phone?: string
  role: UserRole
  display_name: string
  avatar_url?: string
  bio?: string
  verified: boolean
  created_at: string
  updated_at: string
}

export interface UserProfile extends User {
  balance: number
  total_spent: number
}

export interface RegisterInput {
  email: string
  password: string
  display_name: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface SmsLoginInput {
  phone: string
  code: string
}

export interface WechatLoginInput {
  code: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  expires_in: number
}

export interface JwtPayload {
  id: string
  user_id: string
  email: string
  role: UserRole
  nickname?: string
  display_name?: string
  iat?: number
  exp?: number
}

export interface LoginHistory {
  id: string
  user_id: string
  ip_address: string
  user_agent: string
  login_method: 'email' | 'sms' | 'wechat' | 'alipay'
  success: boolean
  created_at: string
}

// ============================================
// 智能体 (Agent) 类型
// ============================================

export type AgentStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'offline'

export type AgentCategory =
  | 'contract'
  | 'litigation'
  | 'consultation'
  | 'ip'
  | 'labor'
  | 'family'
  | 'criminal'
  | 'other'

export interface Agent {
  id: string
  creator_id: string
  name: string
  description: string
  category: AgentCategory
  price: number
  is_free_trial: boolean
  trial_quota: number
  status: AgentStatus
  avatar_url?: string
  config: AgentConfig
  view_count: number
  trial_count: number
  favorite_count: number
  rating: number
  rating_count: number
  tags: string[]
  created_at: string
  updated_at: string
}

export interface AgentConfig {
  model?: string
  temperature?: number
  max_tokens?: number
  system_prompt?: string
  tools?: AgentTool[]
}

export interface AgentTool {
  name: string
  description: string
  enabled: boolean
}

export interface AgentListItem {
  id: string
  creator_id: string
  creator_name: string
  creator_avatar?: string
  name: string
  description: string
  category: AgentCategory
  price: number
  is_free_trial: boolean
  status: AgentStatus
  avatar_url?: string
  view_count: number
  trial_count: number
  favorite_count: number
  rating: number
  rating_count: number
  tags: string[]
  created_at: string
}

export interface AgentStats {
  view_count: number
  trial_count: number
  favorite_count: number
  rating: number
  rating_count: number
}

export interface CreateAgentInput {
  name: string
  description: string
  category: AgentCategory
  price: number
  is_free_trial: boolean
  trial_quota?: number
  avatar_url?: string
  config?: AgentConfig
  tags?: string[]
}

export interface UpdateAgentInput extends Partial<CreateAgentInput> {
  status?: AgentStatus
}

// ============================================
// 订单 & 支付类型
// ============================================

export type OrderStatus = 'pending' | 'paid' | 'cancelled' | 'refunded'
export type PaymentMethod = 'alipay' | 'wechat' | 'balance'

export interface Product {
  id: string
  name: string
  description: string
  price: number
  credits: number
  bonus_credits: number
  is_active: boolean
  created_at: string
}

export interface Order {
  id: string
  user_id: string
  product_id: string
  amount: number
  status: OrderStatus
  payment_method?: PaymentMethod
  payment_id?: string
  created_at: string
  paid_at?: string
}

export interface PaymentRequest {
  order_id: string
  payment_method: PaymentMethod
}

export interface PaymentResult {
  payment_url?: string
  qr_code?: string
  status: 'pending' | 'success' | 'failed'
}

// ============================================
// 余额 & 提现类型
// ============================================

export type TransactionType = 'charge' | 'consume' | 'refund' | 'withdraw' | 'bonus'
export type TransactionStatus = 'pending' | 'completed' | 'failed'

export interface Balance {
  user_id: string
  balance: number
  frozen: number
  updated_at: string
}

export interface Transaction {
  id: string
  user_id: string
  type: TransactionType
  amount: number
  balance_before: number
  balance_after: number
  status: TransactionStatus
  description?: string
  order_id?: string
  created_at: string
}

export interface WithdrawRequest {
  amount: number
  bank_account?: string
  alipay_account?: string
}

export interface WithdrawRecord {
  id: string
  user_id: string
  amount: number
  fee: number
  actual_amount: number
  bank_account?: string
  alipay_account?: string
  status: 'pending' | 'processing' | 'completed' | 'rejected'
  rejection_reason?: string
  created_at: string
  processed_at?: string
}

// ============================================
// 社区类型
// ============================================

export interface CommunityPost {
  id: string
  author_id: string
  author_name: string
  author_avatar?: string
  title: string
  content: string
  tags: string[]
  like_count: number
  comment_count: number
  is_pinned: boolean
  created_at: string
  updated_at: string
}

export interface CreatePostInput {
  title: string
  content: string
  tags?: string[]
}

export interface UpdatePostInput {
  title?: string
  content?: string
  tags?: string[]
}

export interface CommunityComment {
  id: string
  post_id: string
  author_id: string
  author_name: string
  author_avatar?: string
  content: string
  like_count: number
  created_at: string
}

export interface CreateCommentInput {
  post_id: string
  content: string
}

// ============================================
// 文件上传类型
// ============================================

export type FileCategory = 'avatar' | 'agent_avatar' | 'document' | 'attachment' | 'other'

export interface UploadPolicy {
  upload_url: string
  file_path: string
  expires_at: string
}

export interface UploadedFile {
  id: string
  user_id: string
  filename: string
  original_name: string
  size: number
  mime_type: string
  url: string
  category: FileCategory
  created_at: string
}

// ============================================
// AI 对话类型
// ============================================

export type MessageRole = 'system' | 'user' | 'assistant'

export interface ChatMessage {
  role: MessageRole
  content: string
  name?: string
}

export interface ChatRequest {
  agent_id: string
  messages: ChatMessage[]
  stream?: boolean
}

export interface ChatResponse {
  session_id: string
  message: {
    role: 'assistant'
    content: string
  }
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  balance_before?: number
  balance_after?: number
}

export interface ChatSession {
  id: string
  user_id: string
  agent_id: string
  messages: ChatMessage[]
  created_at: string
  updated_at: string
}

// ============================================
// Request 类型扩展
// ============================================

export interface AuthenticatedRequest extends FastifyRequest {
  user: JwtPayload
}

// ============================================
// API 路由参数类型
// ============================================

// ============================================
// 邀请系统类型
// ============================================

/**
 * 邀请类型
 */
export type InvitationType = 'collaboration' | 'job' | 'partnership'

/**
 * 邀请状态
 */
export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'negotiating' | 'closed'

/**
 * 来源类型
 */
export type InvitationSourceType = 'skill' | 'agent' | 'opportunity' | 'creator_profile'

/**
 * 邀请
 */
export interface Invitation {
  id: string
  sender_id: string
  sender_role: UserRole
  receiver_id: string
  receiver_role: UserRole
  source_type: InvitationSourceType
  source_id: string
  invitation_type: InvitationType
  message: string
  status: InvitationStatus
  responded_at: string | null
  created_at: string
  updated_at: string
}

/**
 * 创建邀请输入
 */
export interface CreateInvitationInput {
  receiver_id: string
  receiver_role: UserRole
  source_type: InvitationSourceType
  source_id: string
  invitation_type: InvitationType
  message?: string
}

/**
 * 响应邀请输入
 */
export interface RespondInvitationInput {
  status: 'accepted' | 'rejected' | 'negotiating'
  message?: string
}

// ============================================
// 试用系统类型
// ============================================

/**
 * 试用状态
 */
export type TrialStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'completed'

/**
 * 试用邀请
 */
export interface Trial {
  id: string
  creator_id: string
  target_user_id: string
  source_type: 'skill' | 'agent'
  source_id: string
  message: string
  status: TrialStatus
  expires_at: string | null
  responded_at: string | null
  created_at: string
  updated_at: string
}

/**
 * 创建试用输入
 */
export interface CreateTrialInput {
  target_user_id: string
  source_type: 'skill' | 'agent'
  source_id: string
  message?: string
  expires_in_days?: number
}

/**
 * 响应试用输入
 */
export interface RespondTrialInput {
  status: 'accepted' | 'rejected'
}

// ============================================
// 合作机会类型
// ============================================

/**
 * 机会类型
 */
export type OpportunityType = 'job' | 'collaboration' | 'project' | 'service_offer'

/**
 * 机会状态
 */
export type OpportunityStatus = 'draft' | 'pending_review' | 'published' | 'closed' | 'archived'

/**
 * 工作地点类型
 */
export type LocationType = 'onsite' | 'remote' | 'hybrid'

/**
 * 合作机会
 */
export interface Opportunity {
  id: string
  publisher_id: string
  publisher_role: UserRole
  title: string
  slug: string
  summary: string | null
  description: string | null
  cover_image: string | null
  opportunity_type: OpportunityType
  category: string | null
  industry: string | null
  location: string | null
  location_type: LocationType
  budget: number | null
  compensation_type: string | null
  contact_email: string | null
  contact_wechat: string | null
  application_file_requirements: string | null
  deadline: string | null
  status: OpportunityStatus
  view_count: number
  application_count: number
  is_featured: boolean
  created_at: string
  updated_at: string
}

/**
 * 创建机会输入
 */
export interface CreateOpportunityInput {
  title: string
  summary?: string
  description?: string
  cover_image?: string
  opportunity_type: OpportunityType
  category?: string
  industry?: string
  location?: string
  location_type?: LocationType
  budget?: number
  compensation_type?: string
  contact_email?: string
  contact_wechat?: string
  application_file_requirements?: string
  deadline?: string
}

/**
 * 更新机会输入
 */
export interface UpdateOpportunityInput extends Partial<CreateOpportunityInput> {
  status?: OpportunityStatus
  is_featured?: boolean
}

// ============================================
// 律师发现类型
// ============================================

/**
 * 认证状态
 */
export type VerifiedStatus = 'pending' | 'verified' | 'rejected'

/**
 * 推荐状态
 */
export type FeaturedStatus = 'normal' | 'featured' | 'top'

/**
 * 榜单类型
 */
export type RankingType = 'overall' | 'city' | 'expertise' | 'rising'

/**
 * 律师扩展资料
 */
export interface LawyerProfile {
  id: string
  creator_id: string
  name: string
  slug: string
  avatar: string | null
  city: string | null
  firm: string | null
  title: string | null
  expertise: string[]
  practice_areas: string | null
  bio: string | null
  achievements: string | null
  years_of_practice: number | null
  review_count: number
  average_rating: number
  products_count: number
  product_downloads: number
  product_favorites: number
  featured_status: FeaturedStatus
  featured_order: number
  created_at: string
  updated_at: string
}

/**
 * 带用户信息的律师资料
 */
export interface LawyerProfileWithUser extends LawyerProfile {
  creator: {
    id: string
    display_name: string | null
    avatar_url: string | null
    bio: string | null
    is_verified: boolean
    follower_count: number
  }
  verification?: {
    status: VerifiedStatus
    verified_at: string | null
  }
}

/**
 * 律师评论
 */
export interface LawyerReview {
  id: string
  lawyer_profile_id: string
  reviewer_id: string
  rating: number
  tags: string[]
  content: string
  status: 'published' | 'hidden'
  created_at: string
  updated_at: string
}

/**
 * 律师评论（带评论者信息）
 */
export interface LawyerReviewWithReviewer extends LawyerReview {
  reviewer: {
    display_name: string | null
    avatar_url: string | null
  }
}

/**
 * 创建评论输入
 */
export interface CreateLawyerReviewInput {
  rating: number
  tags?: string[]
  content: string
}

/**
 * 律师榜单条目
 */
export interface LawyerRankingItem {
  lawyer: LawyerProfileWithUser
  ranking_type: RankingType
  ranking_position: number
  scores: {
    professional_credibility: number  // 专业可信度 35%
    user_feedback: number             // 用户反馈 30%
    platform_activity: number         // 平台活跃度 20%
    creator_influence: number         // 创作影响力 15%
  }
  overall_score: number
}

// ============================================
// 创作指南类型
// ============================================

/**
 * 指南分类
 */
export type GuideSection = 'getting-started' | 'rules' | 'tutorials' | 'faq'

/**
 * 指南类型
 */
export type GuideType = 'article' | 'video' | 'faq'

/**
 * 指南状态
 */
export type GuideStatus = 'draft' | 'published' | 'archived'

/**
 * 创作指南
 */
export interface CreatorGuide {
  id: string
  title: string
  slug: string
  summary: string | null
  content: string | null
  section: GuideSection
  category: string | null
  order_index: number
  guide_type: GuideType
  video_url: string | null
  status: GuideStatus
  view_count: number
  created_at: string
  updated_at: string
}

// ============================================
// 认证系统类型
// ============================================

/**
 * 认证类型
 */
export type VerificationType = 'excellent_creator' | 'master_creator' | 'lawyer_verified'

/**
 * 认证状态
 */
export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'revoked'

/**
 * 认证申请
 */
export interface CreatorVerification {
  id: string
  creator_id: string
  verification_type: VerificationType
  status: VerificationStatus
  materials: Record<string, unknown>
  review_note: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

/**
 * 用户认证状态
 */
export interface UserVerificationStatus {
  is_creator: boolean
  creator_level: CreatorLevel | null
  lawyer_verified: boolean
  lawyer_profile_id: string | null
  verifications: CreatorVerification[]
}

// ============================================
// 通知系统类型
// ============================================

/**
 * 通知类型
 */
export type NotificationType =
  | 'post_replied'
  | 'comment_replied'
  | 'post_liked'
  | 'invitation_responded'
  | 'trial_responded'
  | 'system_notice'
  | 'verification_result'
  | 'new_follower'
  | 'new_purchase'
  | 'new_review'

/**
 * 通知
 */
export interface Notification {
  id: string
  user_id: string
  notification_type: NotificationType
  title: string
  content: string
  data: Record<string, unknown>
  is_read: boolean
  created_at: string
}

/**
 * 通知列表查询
 */
export interface NotificationListQuery extends PaginationQuery {
  type?: NotificationType
  is_read?: string
}

// ============================================
// 统一收藏类型
// ============================================

/**
 * 收藏类型
 */
export type FavoriteType = 'skill' | 'agent' | 'creator' | 'post' | 'lawyer'

/**
 * 收藏
 */
export interface Favorite {
  id: string
  user_id: string
  favoritable_type: FavoriteType
  favoritable_id: string
  created_at: string
}

/**
 * 收藏项（带详细信息）
 */
export interface FavoriteItem {
  id: string
  favoritable_type: FavoriteType
  favoritable_id: string
  created_at: string
  // 根据类型不同的详细信息
  skill?: Skill
  agent?: Agent
  post?: CommunityPost
  lawyer?: LawyerProfileWithUser
  creator?: {
    id: string
    display_name: string | null
    avatar_url: string | null
    bio: string | null
    is_verified: boolean
  }
}

// ============================================
// Skills 类型（与 agents 分离）
// ============================================

/**
 * Skills 分类
 */
export type SkillCategory = 'template' | 'workflow' | 'tool' | 'resource' | 'document'

/**
 * Skills 定价类型
 */
export type SkillPriceType = 'free' | 'paid'

/**
 * Skills 状态
 */
export type SkillStatus = 'draft' | 'pending_review' | 'published' | 'rejected' | 'archived'

/**
 * Skills
 */
export interface Skill {
  id: string
  creator_id: string
  title: string
  slug: string
  summary: string | null
  description: string | null
  cover_image: string | null
  category: SkillCategory
  tags: string[]
  price_type: SkillPriceType
  price: number
  content: Record<string, unknown> | null
  files: SkillFile[]
  status: SkillStatus
  view_count: number
  download_count: number
  favorite_count: number
  purchase_count: number
  rating: number
  review_count: number
  is_featured: boolean
  created_at: string
  updated_at: string
}

/**
 * Skills 文件
 */
export interface SkillFile {
  name: string
  url: string
  size: number
  mime_type: string
}

/**
 * Skills 列表项
 */
export interface SkillListItem extends Omit<Skill, 'content' | 'files'> {
  creator_name: string
  creator_avatar: string | null
  creator_verified: boolean
}

/**
 * 创建 Skills 输入
 */
export interface CreateSkillInput {
  title: string
  summary?: string
  description?: string
  cover_image?: string
  category: SkillCategory
  tags?: string[]
  price_type: SkillPriceType
  price?: number
  content?: Record<string, unknown>
  files?: SkillFile[]
}

/**
 * 更新 Skills 输入
 */
export interface UpdateSkillInput extends Partial<CreateSkillInput> {
  status?: SkillStatus
  is_featured?: boolean
}

/**
 * Skills 列表查询
 */
export interface SkillListQuery extends PaginationQuery {
  category?: SkillCategory
  price_type?: SkillPriceType
  search?: string
  sort?: 'latest' | 'popular' | 'rating' | 'downloads'
  featured?: string
}

// ============================================
// 工作台类型
// ============================================

/**
 * 工作台概览
 */
export interface WorkspaceOverview {
  // 用户信息
  user: {
    id: string
    display_name: string
    avatar_url: string | null
    role: UserRole
  }
  // 统计数据
  stats: {
    purchased_count: number
    favorites_count: number
    invitations_count: number
    unread_notifications_count: number
    posts_count: number
  }
  // 最近活动
  recent_activity: {
    type: 'purchase' | 'favorite' | 'invitation' | 'post' | 'comment'
    title: string
    created_at: string
  }[]
}

/**
 * 创作者中心概览
 */
export interface CreatorOverview {
  // 用户信息
  user: {
    id: string
    display_name: string
    avatar_url: string | null
    creator_level: CreatorLevel
    lawyer_verified: boolean
  }
  // 统计数据
  stats: {
    skills_count: number
    agents_count: number
    total_earnings: number
    pending_earnings: number
    pending_invitations_count: number
    pending_trials_count: number
    unread_notifications_count: number
  }
  // 收益概览
  earnings_summary: {
    this_month: number
    last_month: number
    growth_rate: number
  }
  // 待处理事项
  pending_items: {
    type: 'invitation' | 'trial' | 'verification' | 'ip'
    count: number
    title: string
  }[]
}

// ============================================
// 创作者收益类型
// ============================================

/**
 * 收益来源类型
 */
export type EarningSourceType = 'skill' | 'agent' | 'subscription'

/**
 * 收益状态
 */
export type EarningStatus = 'pending' | 'settled' | 'withdrawn'

/**
 * 收益记录
 */
export interface CreatorEarning {
  id: string
  creator_id: string
  source_type: EarningSourceType
  source_id: string
  order_id: string | null
  gross_amount: number
  platform_fee: number
  net_amount: number
  status: EarningStatus
  settled_at: string | null
  created_at: string
}

/**
 * 收益汇总
 */
export interface EarningsSummary {
  total_earnings: number
  pending_earnings: number
  withdrawn_earnings: number
  this_month: number
  last_month: number
  growth_rate: number
}

// ============================================
// IP 保护类型
// ============================================

/**
 * IP 申请状态
 */
export type IpApplicationStatus = 'pending' | 'approved' | 'rejected'

/**
 * IP 申请
 */
export interface IpApplication {
  id: string
  creator_id: string
  source_type: 'skill' | 'agent'
  source_id: string
  status: IpApplicationStatus
  materials: Record<string, unknown>
  review_note: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

// ============================================
// 关注类型
// ============================================

/**
 * 关注
 */
export interface Follow {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}

/**
 * 关注者信息
 */
export interface FollowerInfo {
  id: string
  follower_id: string
  follower: {
    id: string
    display_name: string | null
    avatar_url: string | null
    bio: string | null
    is_verified: boolean
  }
  created_at: string
}

// ============================================
// 社区话题类型
// ============================================

/**
 * 社区话题
 */
export interface CommunityTopic {
  id: string
  name: string
  slug: string
  description: string | null
  post_count: number
  created_at: string
  updated_at: string
}

// ============================================
// 通用查询参数类型
// ============================================

/**
 * 社区帖子列表查询
 */
export interface PostListQuery extends PaginationQuery {
  topic_id?: string
  tag?: string
  search?: string
  author_id?: string
  sort?: 'latest' | 'popular' | 'rating'
}

/**
 * 律师列表查询
 */
export interface LawyerListQuery extends PaginationQuery {
  city?: string
  expertise?: string
  featured?: string
  verified?: string
  search?: string
  sort?: 'rating' | 'reviews' | 'activity' | 'influence'
}

/**
 * 机会列表查询
 */
export interface OpportunityListQuery extends PaginationQuery {
  type?: OpportunityType
  city?: string
  industry?: string
  keyword?: string
  featured?: string
  status?: OpportunityStatus
  sort?: 'latest' | 'popular' | 'deadline'
}

/**
 * 指南列表查询
 */
export interface GuideListQuery extends PaginationQuery {
  section?: GuideSection
  guide_type?: GuideType
  status?: GuideStatus
}

// ============================================
// API 响应类型
// ============================================

/**
 * 带分页的响应
 */
export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

/**
 * 列表查询参数
 */
export interface ListQuery {
  page?: number
  page_size?: number
  sort?: string
  order?: 'asc' | 'desc'
}

// ============================================
// 权限检查结果
// ============================================

/**
 * 权限检查结果
 */
export interface PermissionCheckResult {
  allowed: boolean
  reason?: string
}

/**
 * 资源所有权信息
 */
export interface OwnershipInfo {
  is_owner: boolean
  owner_id: string
  resource_type: string
  resource_id: string
}

