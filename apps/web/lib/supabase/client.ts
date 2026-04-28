/**
 * Supabase 兼容客户端 - 已迁移到 PolarDB API
 * 
 * 此文件保持与原有 Supabase 相同的接口，
 * 但底层数据操作通过 Fastify API 进行
 */

import { createBrowserClient } from '../api/supabase-adapter';

export function createClient() {
  return createBrowserClient();
}
