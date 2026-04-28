/**
 * 验证工具 (基于 Zod)
 */

import { z } from 'zod'

// ============================================
// 认证相关 Schema
// ============================================

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long'),
  display_name: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name too long'),
  /** 内测阶段允许直接注册为创作者；默认客户 */
  role: z.enum(['client', 'creator']).optional().default('client'),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

export const smsLoginSchema = z.object({
  phone: z.string().regex(/^1[3-9]\d{9}$/, 'Invalid phone number'),
  code: z.string().length(6, 'Verification code must be 6 digits'),
})

export const sendSmsSchema = z.object({
  phone: z.string().regex(/^1[3-9]\d{9}$/, 'Invalid phone number'),
})

export const changePasswordSchema = z.object({
  old_password: z.string().min(1, 'Old password is required'),
  new_password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long'),
})

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
  code: z.string().length(6, 'Verification code must be 6 digits'),
  new_password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long'),
})

// ============================================
// 智能体相关 Schema
// ============================================

export const createAgentSchema = z.object({
  name: z.string().min(2, 'Name too short').max(100, 'Name too long'),
  description: z.string().min(10, 'Description too short').max(2000, 'Description too long'),
  category: z.enum(['contract', 'litigation', 'consultation', 'ip', 'labor', 'family', 'criminal', 'other']),
  price: z.number().min(0, 'Price cannot be negative'),
  is_free_trial: z.boolean(),
  trial_quota: z.number().int().min(0).max(100).optional().default(3),
  avatar_url: z.string().url().optional(),
  config: z.object({
    model: z.string().optional(),
    temperature: z.number().min(0).max(2).optional(),
    max_tokens: z.number().int().positive().optional(),
    system_prompt: z.string().max(4000).optional(),
    tools: z.array(z.object({
      name: z.string(),
      description: z.string(),
      enabled: z.boolean(),
    })).optional(),
  }).optional(),
  tags: z.array(z.string().max(20)).max(10).optional().default([]),
})

export const updateAgentSchema = createAgentSchema.partial().extend({
  status: z.enum(['draft', 'pending', 'approved', 'rejected', 'offline']).optional(),
})

// ============================================
// 社区相关 Schema
// ============================================

export const createPostSchema = z.object({
  title: z.string().min(5, 'Title too short').max(200, 'Title too long'),
  content: z.string().min(20, 'Content too short').max(50000, 'Content too long'),
  tags: z.array(z.string().max(20)).max(5).optional().default([]),
})

export const updatePostSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  content: z.string().min(20).max(50000).optional(),
  tags: z.array(z.string().max(20)).max(5).optional(),
})

export const createCommentSchema = z.object({
  post_id: z.string().uuid('Invalid post ID'),
  content: z.string().min(1, 'Comment cannot be empty').max(2000, 'Comment too long'),
  /** 回复某条一级评论时传入被回复评论的 id */
  parent_id: z.string().uuid('Invalid parent comment ID').optional(),
})

// ============================================
// 订单相关 Schema
// ============================================

export const createOrderSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  payment_method: z.enum(['alipay', 'wechat', 'balance']),
})

export const paymentCallbackSchema = z.object({
  out_trade_no: z.string(),
  trade_no: z.string().optional(),
  trade_status: z.string(),
  total_amount: z.string().optional(),
})

// ============================================
// 提现相关 Schema
// ============================================

export const withdrawSchema = z.object({
  amount: z.number().min(10, 'Minimum withdrawal is 10 credits'),
  type: z.enum(['bank', 'alipay']),
  account: z.string().min(1, 'Account is required'),
  account_name: z.string().min(1, 'Account name is required'),
})

// ============================================
// AI 对话 Schema
// ============================================

export const chatSchema = z.object({
  agent_id: z.string().uuid('Invalid agent ID'),
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string().min(1).max(10000),
    name: z.string().optional(),
  })).min(1, 'At least one message required'),
  stream: z.boolean().optional().default(false),
})

// ============================================
// 通用 Schema
// ============================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
})

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
})

export const searchQuerySchema = z.object({
  ...paginationSchema.shape,
  search: z.string().max(100).optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  sort: z.enum(['latest', 'popular', 'rating']).optional().default('latest'),
})
