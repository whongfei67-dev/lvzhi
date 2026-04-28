/**
 * Admin API 客户端 - 使用服务端认证
 * 已迁移到 PolarDB
 */

import { cookies } from 'next/headers';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface AdminUser {
  id: string;
  email?: string;
  phone?: string;
  role: string;
  display_name?: string;
  avatar_url?: string;
  verified?: boolean;
  [key: string]: unknown;
}

interface AdminProfile {
  id: string;
  email?: string;
  phone?: string;
  role: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  verified: boolean;
  balance?: number;
  created_at: string;
  [key: string]: unknown;
}

async function fetchFromAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll()
    .map(c => `${c.name}=${c.value}`)
    .join('; ');

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      'Cookie': cookieHeader,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * 创建管理员客户端
 * 用于服务端管理操作
 */
export async function createAdminClient() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('lvzhi_access_token')?.value;

  // 获取当前用户信息
  let currentUser: AdminUser | null = null;
  if (accessToken) {
    try {
      const res = await fetchFromAPI<{
        success: boolean;
        data: AdminUser;
      }>('/api/auth/me');
      currentUser = res.data;
    } catch {
      currentUser = null;
    }
  }

  return {
    // 获取当前认证用户
    getUser: async () => ({ data: { user: currentUser }, error: null }),
    
    // 获取所有用户（管理员功能）
    getAllUsers: async () => {
      const res = await fetchFromAPI<{
        success: boolean;
        data: AdminProfile[];
      }>('/api/admin/users');
      return { data: { users: res.data }, error: null };
    },
    
    // 获取用户详情
    getUserById: async (id: string) => {
      const res = await fetchFromAPI<{
        success: boolean;
        data: AdminProfile;
      }>(`/api/admin/users/${id}`);
      return { data: { user: res.data }, error: null };
    },
    
    // 更新用户
    updateUser: async (id: string, data: Partial<AdminProfile>) => {
      const res = await fetchFromAPI<{
        success: boolean;
        data: AdminProfile;
      }>(`/api/admin/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return { data: { user: res.data }, error: null };
    },
    
    // 删除用户
    deleteUser: async (id: string) => {
      await fetchFromAPI(`/api/admin/users/${id}`, {
        method: 'DELETE',
      });
      return { error: null };
    },
    
    // 查询任何表（管理员权限）
    from: (table: string) => ({
      select: (columns: string = '*') => ({
        eq: (column: string, value: unknown) => ({
          single: async () => {
            try {
              const res = await fetchFromAPI<{
                success: boolean;
                data: Record<string, unknown>;
              }>(`/api/admin/data/${table}?filter_${column}=${value}&select=${columns}`);
              return { data: res.data, error: null };
            } catch (error) {
              return { data: null, error: error as Error };
            }
          },
          then: async (resolve: (value: unknown) => unknown) => {
            try {
              const res = await fetchFromAPI<{
                success: boolean;
                data: Record<string, unknown>[];
              }>(`/api/admin/data/${table}?filter_${column}=${value}&select=${columns}`);
              return resolve({ data: res.data, error: null });
            } catch (error) {
              return resolve({ data: null, error: error as Error });
            }
          }
        }),
        then: async (resolve: (value: unknown) => unknown) => {
          try {
            const res = await fetchFromAPI<{
              success: boolean;
              data: Record<string, unknown>[];
            }>(`/api/admin/data/${table}?select=${columns}`);
            return resolve({ data: res.data, error: null });
          } catch (error) {
            return resolve({ data: null, error: error as Error });
          }
        }
      })
    }),
  };
}
