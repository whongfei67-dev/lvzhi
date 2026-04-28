/**
 * 数据库适配器 - 支持从 Supabase 切换到阿里云 PolarDB
 * 
 * 提供与 Supabase SDK 兼容的接口，最小化前端代码改动
 * 
 * 使用方式：
 * import { createAdapter } from '@/lib/database-adapter';
 * const db = createAdapter();
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================
// 类型定义
// ============================================

export interface AdapterConfig {
  // API 基础 URL（用于 REST 请求）
  baseUrl: string;
  // 匿名密钥（用于客户端请求）
  anonKey: string;
  // 认证 Token（登录后设置）
  authToken?: string;
}

export interface QueryResult<T> {
  data: T | null;
  error: Error | null;
}

export interface QueryResponse<T> {
  data: T[];
  error: Error | null;
  count?: number;
}

// ============================================
// 数据库适配器类
// ============================================

export class DatabaseAdapter {
  private config: AdapterConfig;
  private authToken?: string;

  constructor(config: AdapterConfig) {
    this.config = config;
    this.authToken = config.authToken;
  }

  // 设置认证 Token
  setAuth(token: string | null) {
    this.authToken = token || undefined;
  }

  // 获取认证头
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'apikey': this.config.anonKey,
    };
    
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    
    return headers;
  }

  // 通用请求方法
  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown
  ): Promise<QueryResult<T>> {
    try {
      const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
        method,
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error(String(error)) 
      };
    }
  }

  // ============================================
  // 表操作 (Table Operations)
  // ============================================

  from<T = unknown>(table: string): TableQueryBuilder<T> {
    return new TableQueryBuilder<T>(this, table);
  }

  // ============================================
  // 认证操作 (Auth Operations)
  // ============================================

  async signInWithPassword(email: string, password: string) {
    return this.request<{
      user: User;
      session: Session;
    }>('POST', '/api/auth/login', { email, password });
  }

  async signUp(email: string, password: string, metadata?: Record<string, unknown>) {
    return this.request<{
      user: User;
      session: Session;
    }>('POST', '/api/auth/register', { email, password, ...metadata });
  }

  async signOut() {
    return this.request<{ success: boolean }>('POST', '/api/auth/logout', {});
  }

  async getUser() {
    return this.request<User>('GET', '/api/auth/me');
  }

  async refreshToken(refreshToken: string) {
    return this.request<{
      user: User;
      session: Session;
    }>('POST', '/api/auth/refresh', { refreshToken });
  }

  // ============================================
  // 存储操作 (Storage Operations)
  // ============================================

  storage(bucket: string): StorageBuilder {
    return new StorageBuilder(this, bucket);
  }

  // ============================================
  // 实时订阅 (Realtime - 降级为轮询)
  // ============================================

  channel(name: string): ChannelBuilder {
    return new ChannelBuilder(this, name);
  }
}

// ============================================
// 表查询构建器
// ============================================

class TableQueryBuilder<T> {
  private adapter: DatabaseAdapter;
  private table: string;
  private queryParams: Record<string, string> = {};
  private body?: unknown;
  private method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET';

  constructor(adapter: DatabaseAdapter, table: string) {
    this.adapter = adapter;
    this.table = table;
  }

  // SELECT 查询
  select(columns: string = '*'): this {
    this.queryParams['select'] = columns;
    return this;
  }

  // INSERT
  insert(data: Partial<T> | Partial<T>[]): this {
    this.method = 'POST';
    this.body = Array.isArray(data) ? data : [data];
    return this;
  }

  // UPDATE
  update(data: Partial<T>): this {
    this.method = 'PATCH';
    this.body = data;
    return this;
  }

  // DELETE
  delete(): this {
    this.method = 'DELETE';
    return this;
  }

  // WHERE 条件
  eq(column: string, value: unknown): this {
    this.queryParams[`eq_${column}`] = String(value);
    return this;
  }

  neq(column: string, value: unknown): this {
    this.queryParams[`neq_${column}`] = String(value);
    return this;
  }

  gt(column: string, value: unknown): this {
    this.queryParams[`gt_${column}`] = String(value);
    return this;
  }

  gte(column: string, value: unknown): this {
    this.queryParams[`gte_${column}`] = String(value);
    return this;
  }

  lt(column: string, value: unknown): this {
    this.queryParams[`lt_${column}`] = String(value);
    return this;
  }

  lte(column: string, value: unknown): this {
    this.queryParams[`lte_${column}`] = String(value);
    return this;
  }

  // LIKE 查询
  like(column: string, pattern: string): this {
    this.queryParams[`like_${column}`] = pattern;
    return this;
  }

  // ILIKE 查询（不区分大小写）
  ilike(column: string, pattern: string): this {
    this.queryParams[`ilike_${column}`] = pattern;
    return this;
  }

  // IN 查询
  in(column: string, values: unknown[]): this {
    this.queryParams[`in_${column}`] = JSON.stringify(values);
    return this;
  }

  // IS NULL
  is(column: string, value: null | true | false): this {
    this.queryParams[`is_${column}`] = String(value);
    return this;
  }

  // OR 条件
  or(filters: string): this {
    this.queryParams['or'] = filters;
    return this;
  }

  // ORDER BY
  order(column: string, options?: { ascending?: boolean; nulls?: 'first' | 'last' }): this {
    let orderValue = column;
    if (options?.ascending === false) orderValue += '.desc';
    if (options?.nulls) orderValue += `.nulls${options.nulls === 'first' ? 'first' : 'last'}`;
    this.queryParams['order'] = orderValue;
    return this;
  }

  // LIMIT
  limit(count: number): this {
    this.queryParams['limit'] = String(count);
    return this;
  }

  // OFFSET
  offset(count: number): this {
    this.queryParams['offset'] = String(count);
    return this;
  }

  // 分页
  range(from: number, to: number): this {
    this.queryParams['offset'] = String(from);
    this.queryParams['limit'] = String(to - from + 1);
    return this;
  }

  // 单行查询
  async single(): Promise<{ data: T | null; error: Error | null; count?: number }> {
    this.queryParams['single'] = 'true';
    return this.execute() as Promise<{ data: T | null; error: Error | null; count?: number }>;
  }

  // 也许单行
  async maybeSingle(): Promise<{ data: T | null; error: Error | null }> {
    this.queryParams['maybe_single'] = 'true';
    return this.execute() as Promise<{ data: T | null; error: Error | null }>;
  }

  // 执行查询
  async execute(): Promise<QueryResponse<T>> {
    try {
      // 构建查询字符串
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(this.queryParams)) {
        // 处理特殊参数
        if (key.startsWith('eq_')) {
          params.append('filter', `${key.slice(3)}.eq.${value}`);
        } else if (key.startsWith('neq_')) {
          params.append('filter', `${key.slice(4)}.neq.${value}`);
        } else if (key.startsWith('gt_')) {
          params.append('filter', `${key.slice(3)}.gt.${value}`);
        } else if (key.startsWith('gte_')) {
          params.append('filter', `${key.slice(4)}.gte.${value}`);
        } else if (key.startsWith('lt_')) {
          params.append('filter', `${key.slice(3)}.lt.${value}`);
        } else if (key.startsWith('lte_')) {
          params.append('filter', `${key.slice(4)}.lte.${value}`);
        } else if (key.startsWith('like_')) {
          params.append('filter', `${key.slice(5)}.like.${value}`);
        } else if (key.startsWith('ilike_')) {
          params.append('filter', `${key.slice(6)}.ilike.${value}`);
        } else if (key.startsWith('in_')) {
          const values = JSON.parse(value as string);
          params.append('filter', `${key.slice(3)}.in.(${values.join(',')})`);
        } else if (key.startsWith('is_')) {
          params.append('filter', `${key.slice(3)}.is.${value}`);
        } else {
          params.append(key, value);
        }
      }

      // 确定端点和方法
      let endpoint = `/api/${this.table}`;
      let method = this.method;

      if (this.method === 'GET') {
        const queryString = params.toString();
        if (queryString) endpoint += `?${queryString}`;
      } else if (this.method === 'DELETE') {
        const queryString = params.toString();
        if (queryString) endpoint += `?${queryString}`;
      }

      // 发送请求
      const response = await fetch(`${this.getBaseUrl()}${endpoint}`, {
        method,
        headers: this.getHeaders(),
        body: this.body ? JSON.stringify(this.body) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      return { 
        data: Array.isArray(data) ? data : [data], 
        error: null,
        count: data.length,
      };
    } catch (error) {
      return { 
        data: [], 
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  private getBaseUrl(): string {
    // 从 adapter 获取配置
    return '';
  }

  private getHeaders(): Record<string, string> {
    return {};
  }
}

// ============================================
// 存储构建器
// ============================================

class StorageBuilder {
  private adapter: DatabaseAdapter;
  private bucket: string;

  constructor(adapter: DatabaseAdapter, bucket: string) {
    this.adapter = adapter;
    this.bucket = bucket;
  }

  // 上传文件（需要预签名 URL）
  async upload(path: string, file: File | Blob) {
    // 1. 获取预签名 URL
    const presignResult = await fetch(`${this.getBaseUrl()}/api/storage/presign-upload`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ bucket: this.bucket, path }),
    });

    if (!presignResult.ok) {
      return { data: null, error: new Error('Failed to get presigned URL') };
    }

    const { url } = await presignResult.json();

    // 2. 直接上传到 OSS
    const uploadResult = await fetch(url, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!uploadResult.ok) {
      return { data: null, error: new Error('Upload failed') };
    }

    return { data: { path }, error: null };
  }

  // 下载文件
  async download(path: string) {
    const response = await fetch(`${this.getBaseUrl()}/api/storage/download?bucket=${this.bucket}&path=${path}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      return { data: null, error: new Error('Download failed') };
    }

    const blob = await response.blob();
    return { data: blob, error: null };
  }

  // 获取公开 URL
  getPublicUrl(path: string): string {
    return `${this.getBaseUrl()}/storage/${this.bucket}/${path}`;
  }

  // 删除文件
  async remove(paths: string[]) {
    const response = await fetch(`${this.getBaseUrl()}/api/storage/remove`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      body: JSON.stringify({ bucket: this.bucket, paths }),
    });

    if (!response.ok) {
      return { data: null, error: new Error('Delete failed') };
    }

    return { data: { paths }, error: null };
  }

  private getBaseUrl(): string {
    return '';
  }

  private getHeaders(): Record<string, string> {
    return {};
  }
}

// ============================================
// 频道构建器（实时订阅 - 降级为轮询）
// ============================================

class ChannelBuilder {
  private adapter: DatabaseAdapter;
  private channelName: string;
  private handlers: Map<string, (payload: unknown) => void> = new Map();
  private pollInterval?: ReturnType<typeof setInterval>;

  constructor(adapter: DatabaseAdapter, channelName: string) {
    this.adapter = adapter;
    this.channelName = channelName;
  }

  on(event: string, handler: (payload: unknown) => void): this {
    this.handlers.set(event, handler);
    return this;
  }

  subscribe(callback?: (status: string) => void): { unsubscribe: () => void } {
    callback?.('SUBSCRIBED');

    // 降级：使用轮询模拟实时
    this.pollInterval = setInterval(async () => {
      const response = await fetch(
        `${this.getBaseUrl()}/api/realtime/poll?channel=${this.channelName}`,
        { headers: this.getHeaders() }
      );
      
      if (response.ok) {
        const events = await response.json();
        for (const event of events) {
          const handler = this.handlers.get(event.type);
          handler?.(event.payload);
        }
      }
    }, 5000);

    return {
      unsubscribe: () => {
        if (this.pollInterval) {
          clearInterval(this.pollInterval);
        }
      },
    };
  }

  private getBaseUrl(): string {
    return '';
  }

  private getHeaders(): Record<string, string> {
    return {};
  }
}

// ============================================
// 用户和会话类型
// ============================================

export interface User {
  id: string;
  email?: string;
  phone?: string;
  role: string;
  created_at: string;
  updated_at: string;
  user_metadata?: Record<string, unknown>;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
  user: User;
}

// ============================================
// 工厂函数
// ============================================

export function createAdapter(config?: Partial<AdapterConfig>): DatabaseAdapter {
  return new DatabaseAdapter({
    baseUrl: config?.baseUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    anonKey: config?.anonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'anonymous',
    authToken: config?.authToken,
  });
}

// ============================================
// 向后兼容：导出与原 Supabase 类似的接口
// ============================================

export function createClient(config?: Partial<AdapterConfig>): DatabaseAdapter {
  return createAdapter(config);
}

export type { DatabaseAdapter as SupabaseClient };
