/**
 * Supabase 兼容服务端客户端 - 已迁移到 PolarDB API
 */

import { cookies } from 'next/headers';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface User {
  id: string;
  email?: string;
  phone?: string;
  role: string;
  display_name?: string;
  avatar_url?: string;
  verified?: boolean;
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
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function createClient() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('lvzhi_access_token')?.value;

  // 获取用户信息
  let user: User | null = null;
  if (accessToken) {
    try {
      const res = await fetchFromAPI<{
        success: boolean;
        data: User;
      }>('/api/auth/me');
      user = res.data;
    } catch {
      user = null;
    }
  }

  return {
    auth: {
      getUser: async () => ({ data: { user }, error: null }),
    },
    from: (table: string) => createDatabaseClient(table),
  };
}

function createDatabaseClient(table: string) {
  return {
    select: (columns: string = '*') => ({
      eq: (column: string, value: unknown) => ({
        single: () => ({
          then: async (resolve: (value: unknown) => unknown) => {
            try {
              const res = await fetchFromAPI<{
                success: boolean;
                data: Record<string, unknown>;
              }>(`/api/data/${table}?filter_${column}=${value}&select=${columns}`);
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
            }>(`/api/data/${table}?filter_${column}=${value}&select=${columns}`);
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
          }>(`/api/data/${table}?select=${columns}`);
          return resolve({ data: res.data, error: null });
        } catch (error) {
          return resolve({ data: null, error: error as Error });
        }
      }
    }),
    insert: (data: Record<string, unknown>) => ({
      then: async (resolve: (value: unknown) => unknown) => {
        try {
          const res = await fetchFromAPI<{
            success: boolean;
            data: Record<string, unknown>;
          }>(`/api/data/${table}`, {
            method: 'POST',
            body: JSON.stringify(data),
          });
          return resolve({ data: res.data, error: null });
        } catch (error) {
          return resolve({ data: null, error: error as Error });
        }
      }
    }),
    update: (data: Record<string, unknown>) => ({
      eq: (column: string, value: unknown) => ({
        then: async (resolve: (value: unknown) => unknown) => {
          try {
            const res = await fetchFromAPI<{
              success: boolean;
              data: Record<string, unknown>;
            }>(`/api/data/${table}?filter_${column}=${value}`, {
              method: 'PATCH',
              body: JSON.stringify(data),
            });
            return resolve({ data: res.data, error: null });
          } catch (error) {
            return resolve({ data: null, error: error as Error });
          }
        }
      })
    }),
  };
}
