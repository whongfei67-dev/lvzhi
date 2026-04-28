// ============================================
// 角色定义 (Role Definitions)
// ============================================
//
// | 角色 | 标识 | 描述 |
// |------|------|------|
// | 游客 | visitor | 未登录访客 |
// | 客户 | client | 已登录注册用户 |
// | 创作者 | creator | 技能包/智能体开发者 |
// | 一般管理员 | admin | 运营人员 |
// | 超管 | superadmin | 系统最高权限 |
//
// 角色层级关系:
// - 超管 > 一般管理员 (独立于业务角色)
// - 创作者 > 客户 > 游客
//
// 注意: 一般管理员是纯管理角色，不具备客户或创作者的业务功能

export type UserRole = 'visitor' | 'client' | 'creator' | 'admin' | 'superadmin'

// ============================================
// 创作者认证等级 (Creator Verification Level)
// ============================================
export type CreatorLevel = 'basic' | 'excellent' | 'master' | 'lawyer'

// ============================================
// API 通用响应类型
// ============================================
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

// ============================================
// 用户相关
// ============================================
export interface UserProfile {
  id: string
  role: UserRole
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  verified: boolean
  // 创作者特有字段
  creator_level?: CreatorLevel
  creator_title?: string | null
  // 管理员特有字段
  is_superadmin?: boolean
  created_at: string
}

// 智能体相关
export interface Agent {
  id: string
  creator_id: string
  name: string
  description: string | null
  category: 'contract' | 'litigation' | 'consultation' | 'compliance' | 'other'
  price: number
  is_free_trial: boolean
  status: 'pending_review' | 'active' | 'rejected'
  created_at: string
}

// 下载配额
export interface DownloadQuota {
  user_id: string
  is_paid: boolean
  is_verified_student: boolean
  total_lifetime_count: number
  free_total_limit: number
  daily_limit: number
  today_count: number
}

// 在校生认证
export interface StudentVerification {
  id: string
  user_id: string
  degree_type: 'undergraduate' | 'master' | 'phd'
  school_name: string
  major: string | null
  enrollment_year: number
  expected_graduation_year: number
  status: 'pending' | 'approved' | 'rejected' | 'expired'
  expires_at: string | null
  created_at: string
}

// 订阅
export interface Subscription {
  id: string
  user_id: string
  plan_type: 'monthly' | 'quarterly' | 'yearly'
  status: 'active' | 'cancelled' | 'expired' | 'paused'
  current_period_start: string
  current_period_end: string
}
