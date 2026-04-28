import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * 可选 Supabase 客户端（仅迁移/兼容期使用）。
 *
 * 项目约束：运行时以 **PolarDB + pg** 为准；未配置 Supabase 环境变量时
 * 本模块不抛错，`supabase` 为 `null`，便于 PolarDB-only 部署。
 */
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false },
      })
    : null

export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Supabase 未配置。PolarDB-only 模式：仅迁移脚本需要时请设置 SUPABASE_URL 与 SUPABASE_SERVICE_ROLE_KEY（或 SUPABASE_SERVICE_KEY）。'
    )
  }
  return supabase
}
