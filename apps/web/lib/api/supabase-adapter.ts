/**
 * API 适配器 - 将 Supabase 调用转换为 API 调用
 * 
 * 提供与 Supabase 相似的接口，但数据来自 Fastify API
 * 这样可以最大程度减少前端代码的修改
 */

function apiBaseUrl(): string {
  if (typeof window !== "undefined") return "";
  const raw =
    process.env.API_PROXY_TARGET ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:4000";
  return raw.replace(/\/$/, "");
}

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

interface Profile {
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

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return document.cookie
    .split('; ')
    .find(row => row.startsWith('lvzhi_access_token='))
    ?.split('=')[1] || null;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const accessToken = getAccessToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${apiBaseUrl()}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: 'Request failed' }));
    // 创建一个类似 Supabase 错误的 Error 对象
    const error = new Error(errorBody.message || `HTTP ${response.status}`) as Error & { message: string; status?: number };
    error.status = response.status;
    throw error;
  }

  return response.json();
}

// ============================================
// Auth 类 - 替代 supabase.auth
// ============================================

class AuthClient {
  async getUser(): Promise<{ data: { user: User | null }; error: Error | null }> {
    try {
      const accessToken = getAccessToken();
      if (!accessToken) {
        return { data: { user: null }, error: null };
      }
      
      const res = await apiRequest<{
        success: boolean;
        data: User;
      }>('/api/auth/me');

      return { data: { user: res.data }, error: null };
    } catch (error) {
      return { data: { user: null }, error: error as Error };
    }
  }

  async signInWithPassword(credentials: {
    email: string;
    password: string;
  }): Promise<{ data: { user: User | null; session: null }; error: Error | null }> {
    try {
      const res = await apiRequest<{
        success: boolean;
        data: {
          user: User;
          access_token: string;
          refresh_token: string;
        };
      }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      return { data: { user: res.data.user, session: null }, error: null };
    } catch (error) {
      return { data: { user: null, session: null }, error: error as Error };
    }
  }

  async signUp(credentials: {
    email: string;
    password: string;
    options?: {
      data?: {
        role?: string;
        display_name?: string;
      };
    };
  }): Promise<{ data: { user: User | null; session: null }; error: Error | null }> {
    try {
      const res = await apiRequest<{
        success: boolean;
        data: {
          user: User;
          access_token: string;
          refresh_token: string;
        };
      }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
          display_name: credentials.options?.data?.display_name || credentials.email.split('@')[0],
        }),
      });

      return { data: { user: res.data.user, session: null }, error: null };
    } catch (error) {
      return { data: { user: null, session: null }, error: error as Error };
    }
  }

  async signOut(): Promise<{ error: Error | null }> {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async resetPasswordForEmail(
    email: string,
    _options?: { redirectTo?: string }
  ): Promise<{ error: Error | null }> {
    try {
      await apiRequest('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async exchangeCodeForSession(code: string): Promise<{ error: Error | null }> {
    try {
      await apiRequest('/api/auth/callback', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }
}

// ============================================
// Database Client 类 - 替代 supabase.from()
// ============================================

class DatabaseClient {
  private tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(columns: string = '*') {
    return new SelectBuilder(this.tableName, columns);
  }

  insert(data: Record<string, unknown>) {
    return new InsertBuilder(this.tableName, data);
  }

  update(data: Record<string, unknown>) {
    return new UpdateBuilder(this.tableName, data);
  }

  delete() {
    return new DeleteBuilder(this.tableName);
  }
}

// Select 查询构建器
class SelectBuilder {
  private tableName: string;
  private columns: string;
  private filters: { column: string; operator: string; value: unknown }[] = [];
  private orderBy?: { column: string; ascending: boolean };
  private limitValue?: number;
  private offsetValue?: number;
  private singleValue = false;
  private maybeSingleValue = false;

  constructor(tableName: string, columns: string) {
    this.tableName = tableName;
    this.columns = columns;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, operator: '=', value });
    return this;
  }

  order(column: string, { ascending = true }: { ascending?: boolean } = {}) {
    this.orderBy = { column, ascending };
    return this;
  }

  limit(limit: number) {
    this.limitValue = limit;
    return this;
  }

  offset(offset: number) {
    this.offsetValue = offset;
    return this;
  }

  single() {
    this.singleValue = true;
    return this;
  }

  maybeSingle() {
    this.maybeSingleValue = true;
    return this;
  }

  async then<TResult>(resolve: (value: unknown) => TResult): Promise<TResult> {
    try {
      const queryParams = new URLSearchParams();
      if (this.columns !== '*') queryParams.set('select', this.columns);
      if (this.limitValue) queryParams.set('limit', String(this.limitValue));
      if (this.offsetValue) queryParams.set('offset', String(this.offsetValue));
      if (this.orderBy) queryParams.set('order', `${this.orderBy.column}:${this.orderBy.ascending ? 'asc' : 'desc'}`);

      // 添加 filters
      this.filters.forEach(f => {
        queryParams.set(`filter_${f.column}`, String(f.value));
      });

      const res = await apiRequest<{
        success: boolean;
        data: unknown;
        count?: number;
      }>(`/api/data/${this.tableName}?${queryParams.toString()}`);

      let data = res.data;
      
      // 在客户端进行过滤和排序
      let result = Array.isArray(data) ? data : [data];
      
      this.filters.forEach(f => {
        result = result.filter((item: Record<string, unknown>) => item[f.column] === f.value);
      });

      if (this.orderBy) {
        result.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
          const aVal = a[this.orderBy!.column] as string | number | null | undefined;
          const bVal = b[this.orderBy!.column] as string | number | null | undefined;
          const left = aVal ?? "";
          const right = bVal ?? "";
          return this.orderBy!.ascending 
            ? (left < right ? -1 : left > right ? 1 : 0)
            : (left > right ? -1 : left < right ? 1 : 0);
        });
      }

      if (this.offsetValue) {
        result = result.slice(this.offsetValue);
      }

      if (this.singleValue) {
        return resolve({ data: result[0] || null, error: null, count: result.length });
      }

      if (this.maybeSingleValue) {
        return resolve({ data: result[0] || null, error: null, count: result.length });
      }

      return resolve({ data: result, error: null, count: res.count || result.length });
    } catch (error) {
      return resolve({ data: null, error: error as Error, count: 0 });
    }
  }
}

// Insert 构建器
class InsertBuilder {
  private tableName: string;
  private data: Record<string, unknown>;

  constructor(tableName: string, data: Record<string, unknown>) {
    this.tableName = tableName;
    this.data = data;
  }

  async then<TResult>(resolve: (value: unknown) => TResult): Promise<TResult> {
    try {
      const res = await apiRequest<{
        success: boolean;
        data: unknown;
      }>(`/api/data/${this.tableName}`, {
        method: 'POST',
        body: JSON.stringify(this.data),
      });

      return resolve({ data: res.data, error: null });
    } catch (error) {
      return resolve({ data: null, error: error as Error });
    }
  }
}

// Update 构建器
class UpdateBuilder {
  private tableName: string;
  private data: Record<string, unknown>;
  private filters: { column: string; value: unknown }[] = [];

  constructor(tableName: string, data: Record<string, unknown>) {
    this.tableName = tableName;
    this.data = data;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, value });
    return this;
  }

  async then<TResult>(resolve: (value: unknown) => TResult): Promise<TResult> {
    try {
      const queryParams = new URLSearchParams();
      this.filters.forEach(f => {
        queryParams.set(`filter_${f.column}`, String(f.value));
      });

      const res = await apiRequest<{
        success: boolean;
        data: unknown;
      }>(`/api/data/${this.tableName}?${queryParams.toString()}`, {
        method: 'PATCH',
        body: JSON.stringify(this.data),
      });

      return resolve({ data: res.data, error: null });
    } catch (error) {
      return resolve({ data: null, error: error as Error });
    }
  }
}

// Delete 构建器
class DeleteBuilder {
  private tableName: string;
  private filters: { column: string; value: unknown }[] = [];

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, value });
    return this;
  }

  async then<TResult>(resolve: (value: unknown) => TResult): Promise<TResult> {
    try {
      const queryParams = new URLSearchParams();
      this.filters.forEach(f => {
        queryParams.set(`filter_${f.column}`, String(f.value));
      });

      const res = await apiRequest<{
        success: boolean;
        data: unknown;
      }>(`/api/data/${this.tableName}?${queryParams.toString()}`, {
        method: 'DELETE',
      });

      return resolve({ data: res.data, error: null });
    } catch (error) {
      return resolve({ data: null, error: error as Error });
    }
  }
}

// ============================================
// Storage Client 类 - 替代 supabase.storage
// ============================================

class StorageClient {
  from(bucket: string) {
    return new StorageBucketClient(bucket);
  }
}

class StorageBucketClient {
  private bucket: string;

  constructor(bucket: string) {
    this.bucket = bucket;
  }

  async upload(path: string, file: File | Blob) {
    const accessToken = getAccessToken();
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', path);

    const response = await fetch(`${apiBaseUrl()}/api/storage/upload`, {
      method: 'POST',
      headers: {
        ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
      },
      credentials: 'include',
      body: formData,
    });

    const res = await response.json();
    
    if (!response.ok) {
      throw new Error(res.message || 'Upload failed');
    }

    return { data: { path: res.data.path }, error: null };
  }

  async remove(paths: string[]) {
    const accessToken = getAccessToken();

    const response = await fetch(`${apiBaseUrl()}/api/storage/remove`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify({ paths }),
    });

    const res = await response.json();
    
    if (!response.ok) {
      throw new Error(res.message || 'Remove failed');
    }

    return { data: res.data, error: null };
  }

  getPublicUrl(path: string) {
    return { data: { publicUrl: `${apiBaseUrl()}/storage/public/${path}` } };
  }
}

// ============================================
// 创建客户端
// ============================================

function createBrowserClient() {
  return {
    auth: new AuthClient(),
    from: (table: string) => new DatabaseClient(table),
    storage: new StorageClient(),
  };
}

export { createBrowserClient, AuthClient, DatabaseClient };
export type { User, Profile };
