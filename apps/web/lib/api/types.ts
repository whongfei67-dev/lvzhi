/**
 * API 类型定义
 */

// ============================================
// 通用
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

// ============================================
// 用户 & 认证
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
  role: UserRole | string
  display_name: string
  avatar_url?: string
  bio?: string
  verified: boolean
  balance?: number
  // 创作者特有
  creator_level?: CreatorLevel
  creator_title?: string
  // 管理员特有
  is_superadmin?: boolean
  created_at: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  expires_in: number
}

// ============================================
// 智能体
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
  slug?: string
  creator_id: string
  creator_name: string
  creator_avatar?: string
  name: string
  description: string
  category: AgentCategory
  price: number
  is_free_trial: boolean
  trial_quota?: number
  status: AgentStatus
  avatar_url?: string
  view_count: number
  trial_count?: number
  usage_count?: number
  favorite_count: number
  rating: number
  rating_count: number
  tags: string[]
  config?: AgentConfig
  created_at: string
  updated_at?: string
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

// ============================================
// 社区
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
  has_liked?: boolean
  created_at: string
  updated_at?: string
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

// ============================================
// 余额与订单
// ============================================

export type OrderStatus = 'pending' | 'paid' | 'cancelled' | 'refunded'

export interface Product {
  id: string
  name: string
  description: string
  price: number
  credits: number
  bonus_credits: number
}

export interface Order {
  id: string
  product_id: string
  product_name: string
  amount: number
  status: OrderStatus
  payment_method?: 'alipay' | 'wechat' | 'balance'
  payment_id?: string
  credits?: number
  created_at: string
  paid_at?: string
}

export interface Balance {
  user_id?: string
  balance: number
  frozen?: number
  frozen_balance?: number
  total_recharged?: number
  total_consumed?: number
  updated_at?: string
}

// ============================================
// AI 对话
// ============================================

export type MessageRole = 'system' | 'user' | 'assistant'

export interface ChatMessage {
  role: MessageRole
  content: string
  name?: string
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

export interface AISession {
  id: string
  agent_id: string
  agent_name: string
  agent_avatar?: string
  message_count: number
  summary?: string
  created_at: string
  updated_at?: string
}

export interface AIStats {
  total_calls: number
  total_consume: number
  today_calls: number
  monthly_consume?: number
  top_agents?: {
    id: string
    name: string
    call_count: number | string
  }[]
}

// ============================================
// 文件
// ============================================

export interface UploadedFile {
  id: string
  url: string
  filename: string
  original_name: string
  size: number
  mime_type: string
  category: string
  created_at: string
}

// ============================================
// 合作机会 (Opportunities)
// ============================================

export type OpportunityType = 'job' | 'collaboration' | 'project' | 'service_offer'
export type OpportunityStatus = 'draft' | 'pending_review' | 'published' | 'closed' | 'archived'

export interface Opportunity {
  id: string
  publisher_id: string
  /** 列表/详情展示用发布方名称（接口可能返回） */
  publisher_name?: string
  publisher_role: 'client' | 'creator'
  title: string
  slug: string
  summary?: string
  description?: string
  cover_image?: string
  opportunity_type: OpportunityType
  category?: string
  industry?: string
  location?: string
  location_type?: 'onsite' | 'remote' | 'hybrid'
  budget?: number
  compensation_type?: string
  contact_email?: string
  contact_wechat?: string
  /** 合作投递需附文件/材料说明（多行文本） */
  application_file_requirements?: string
  deadline?: string
  status: OpportunityStatus
  view_count: number
  application_count: number
  is_featured: boolean
  created_at: string
  updated_at: string
}

// ============================================
// 邀请 (Invitations)
// ============================================

export type InvitationType = 'collaboration' | 'job'
export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'negotiating' | 'closed'

export interface Invitation {
  id: string
  sender_id?: string
  sender_role?: string
  receiver_id?: string
  receiver_role?: string
  // 兼容旧字段命名
  from_user?: string
  to_user?: string
  source_type?: 'skill' | 'agent' | 'opportunity' | 'creator_profile'
  source_id?: string
  invitation_type?: InvitationType
  message?: string
  status: InvitationStatus
  responded_at?: string
  created_at: string
}

// ============================================
// 试用 (Trials)
// ============================================

export type TrialStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'completed'

export interface Trial {
  id: string
  creator_id: string
  target_user_id: string
  source_type: 'skill' | 'agent'
  source_id: string
  message?: string
  status: TrialStatus
  expires_at?: string
  responded_at?: string
  created_at: string
}

// ============================================
// 律师 (Lawyers)
// ============================================

export type LawyerFeaturedStatus = 'normal' | 'featured' | 'top'

export interface LawyerProfile {
  id: string
  creator_id: string
  name: string
  slug: string
  avatar?: string
  city?: string
  firm?: string
  title?: string
  expertise: string[]
  bio?: string
  years_of_practice?: number
  review_count: number
  average_rating: number
  products_count: number
  product_downloads: number
  product_favorites: number
  featured_status: LawyerFeaturedStatus
  contact_email?: string
  contact_phone?: string
  created_at: string
}

export interface LawyerReview {
  id: string
  lawyer_profile_id: string
  reviewer_id: string
  reviewer_name: string
  reviewer_avatar?: string
  rating: number
  tags: string[]
  content: string
  status: 'published' | 'hidden'
  created_at: string
}

// ============================================
// 工作台 (Workspace)
// ============================================

export interface WorkspaceOverview {
  user: {
    id: string
    display_name: string
    avatar_url?: string
    role: string
  }
  stats: {
    purchased_count: number
    favorites_count: number
    invitations_count: number
    unread_notifications_count: number
    posts_count: number
    comments_count: number
  }
  recent_activity: Array<{
    type: string
    title: string
    created_at: string
  }>
}

// ============================================
// 创作者中心 (Creator Center)
// ============================================

export interface CreatorOverview {
  user: {
    id: string
    display_name: string
    avatar_url?: string
    creator_level?: string
    lawyer_verified?: boolean
  }
  stats: {
    skills_count: number
    agents_count: number
    total_earnings: number
    pending_earnings: number
    pending_invitations_count: number
    pending_trials_count: number
    unread_notifications_count: number
  }
  earnings_summary: {
    this_month: number
    last_month: number
    growth_rate: number
  }
  pending_items: Array<{
    type: string
    count: number
    title: string
  }>
}

// ============================================
// 通知 (Notifications)
// ============================================

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

export interface Notification {
  id: string
  notification_type: NotificationType
  title: string
  content?: string
  data?: Record<string, unknown>
  is_read: boolean
  created_at: string
}

// ============================================
// 查询参数类型
// ============================================

export interface LawyerListQuery {
  page?: string
  page_size?: string
  city?: string
  expertise?: string
  featured?: string
  verified?: string
  search?: string
  sort?: string
}

export interface NotificationListQuery {
  page?: string
  page_size?: string
  type?: string
  is_read?: string
}
