/**
 * API 客户端 - 替代 Supabase
 * 所有前端数据操作通过此模块进行
 */

import { getUpstreamApiBaseUrl } from "@/lib/upstream-api-base";
import type { Session } from "@/lib/auth/session-types";
import { clearAnalyticsBoardCache } from "@/lib/workbench/analytics-board-cache";

export type { Session } from "@/lib/auth/session-types";
export { hasRole, isAdmin, isSuperadmin, isCreator } from "@/lib/auth/roles";
export type { Agent, Opportunity, User, Balance, AIStats } from "./types";

export interface Skill {
  id: string;
  creator_id?: string;
  name?: string;
  slug?: string;
  creator_name?: string;
  title: string;
  description?: string;
  category?: string;
  status?: string;
  price?: number;
  rating?: number;
  download_count?: number;
  usage_count?: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * 浏览器端走同源 `/api`，配合 next.config rewrites 与显式 Route Handler 转发 Cookie。
 * 服务端请求（极少）直连 API_PROXY_TARGET 或 NEXT_PUBLIC_API_URL。
 */
function apiBaseUrl(): string {
  if (typeof window !== "undefined") return "";
  return getUpstreamApiBaseUrl();
}

// 获取 access token
function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return document.cookie
    .split('; ')
    .find(row => row.startsWith('lvzhi_access_token='))
    ?.split('=')[1] || null;
}

// 自定义 API 错误类型
export class ApiError extends Error {
  constructor(
    message: string,
    public code?: number,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// 标准化后端响应格式
interface BackendResponse<T> {
  code: number;
  message: string;
  data?: T;
}

// 通用请求函数
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const accessToken = getAccessToken();
  const hasBody = options.body !== undefined && options.body !== null;
  const isFormData =
    typeof FormData !== "undefined" && hasBody && options.body instanceof FormData;

  const headers: HeadersInit = {
    ...options.headers,
  };
  const normalizedHeaders = headers as Record<string, string>;

  // 仅在有请求体且非 FormData 时标记 JSON，避免空 body + JSON 触发后端解析错误
  if (hasBody && !isFormData && !normalizedHeaders["Content-Type"] && !normalizedHeaders["content-type"]) {
    normalizedHeaders["Content-Type"] = "application/json";
  }

  if (accessToken) {
    normalizedHeaders["Authorization"] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${apiBaseUrl()}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new ApiError(error.message || `HTTP ${response.status}`, error.code, response.status);
  }

  // 后端返回格式: { code: 0, message: string, data?: T }
  // 需要标准化为前端期望的格式
  const backendResponse = await response.json() as BackendResponse<T>;

  if (backendResponse.code !== 0) {
    throw new ApiError(backendResponse.message || 'Request failed', backendResponse.code);
  }

  return backendResponse.data as T;
}

/** 通用文件上传（multipart，不走 JSON Content-Type） */
export async function uploadFormFile(file: File): Promise<{
  id: string;
  url: string;
  original_name: string;
}> {
  const accessToken = getAccessToken();
  const form = new FormData();
  form.append("file", file);
  const headers: HeadersInit = {};
  if (accessToken) {
    (headers as Record<string, string>).Authorization = `Bearer ${accessToken}`;
  }
  const response = await fetch(`${apiBaseUrl()}/api/upload`, {
    method: "POST",
    body: form,
    headers,
    credentials: "include",
  });
  const backendResponse = (await response.json().catch(() => ({}))) as BackendResponse<Record<string, unknown>>;
  if (!response.ok || backendResponse.code !== 0) {
    throw new ApiError(
      backendResponse.message || `HTTP ${response.status}`,
      backendResponse.code,
      response.status
    );
  }
  const d = backendResponse.data as Record<string, unknown> | undefined;
  const url = String(d?.url ?? "");
  if (!url) {
    throw new ApiError("上传成功但未返回文件地址");
  }
  return {
    id: String(d?.id ?? ""),
    url,
    original_name: String(d?.original_name ?? file.name),
  };
}

/** 用户头像上传（写入 profiles.avatar_url） */
export async function uploadAvatarFile(file: File): Promise<{ url: string }> {
  const accessToken = getAccessToken();
  const form = new FormData();
  form.append("file", file);
  const headers: HeadersInit = {};
  if (accessToken) {
    (headers as Record<string, string>).Authorization = `Bearer ${accessToken}`;
  }
  const response = await fetch(`${apiBaseUrl()}/api/upload/avatar`, {
    method: "POST",
    body: form,
    headers,
    credentials: "include",
  });
  const backendResponse = (await response.json().catch(() => ({}))) as BackendResponse<Record<string, unknown>>;
  if (!response.ok || backendResponse.code !== 0) {
    throw new ApiError(
      backendResponse.message || `HTTP ${response.status}`,
      backendResponse.code,
      response.status
    );
  }
  const d = backendResponse.data as Record<string, unknown> | undefined;
  const url = String(d?.url ?? "");
  if (!url) throw new ApiError("头像上传成功但未返回地址");
  return { url };
}

// ============================================
// 认证相关 API
// ============================================

async function fetchMe() {
  return request<{
    id: string;
    email: string;
    phone?: string;
    role: string;
    display_name: string;
    avatar_url?: string;
    bio?: string;
    verified: boolean;
    balance: number;
    created_at: string;
  }>("/api/auth/me");
}

export const auth = {
  async login(email: string, password: string) {
    return request<{
      user: { id: string; email: string; display_name: string; role: string; verified: boolean };
      access_token: string;
      refresh_token: string;
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async register(
    emailOrPayload:
      | string
      | { email: string; password: string; display_name: string; role?: "client" | "creator" },
    password?: string,
    display_name?: string
  ) {
    const body =
      typeof emailOrPayload === "string"
        ? {
            email: emailOrPayload,
            password: password!,
            display_name: display_name!,
          }
        : {
            email: emailOrPayload.email,
            password: emailOrPayload.password,
            display_name: emailOrPayload.display_name,
            ...(emailOrPayload.role ? { role: emailOrPayload.role } : {}),
          };
    return request<{
      user: { id: string; email: string; display_name: string; role: string };
      access_token: string;
      refresh_token: string;
    }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  async smsLogin(phone: string, code: string) {
    return request<{
      user: { id: string; phone: string; display_name: string; role: string; verified: boolean; is_new_user: boolean };
      access_token: string;
      refresh_token: string;
    }>('/api/auth/sms/login', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    });
  },

  async sendSmsCode(phone: string) {
    return request<{ expires_in: number }>('/api/auth/sms/send', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  },

  async logout() {
    return request('/api/auth/logout', { method: 'POST' });
  },

  getMe: fetchMe,
  /** 与历史代码 `api.auth.me()` 兼容 */
  me: fetchMe,

  async changePassword(old_password: string, new_password: string) {
    return request('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ old_password, new_password }),
    });
  },

  async forgotPassword(email: string) {
    return request('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(email: string, code: string, new_password: string) {
    return request('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, code, new_password }),
    });
  },

  async wechatAuthorize(redirect_uri?: string) {
    return request<{ auth_url: string; state: string }>('/api/auth/wechat/authorize?' + new URLSearchParams({ redirect_uri: redirect_uri || '' }));
  },

  async alipayAuthorize(redirect_uri?: string) {
    return request<{ auth_url: string; state: string }>('/api/auth/alipay/authorize?' + new URLSearchParams({ redirect_uri: redirect_uri || '' }));
  },

  async refreshToken(refresh_token: string) {
    return request<{ access_token: string; refresh_token: string }>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token }),
    });
  },
};

// ============================================
// 用户相关 API
// ============================================

export const users = {
  async getProfile(userId: string) {
    return request<Record<string, unknown>>(`/api/users/${userId}`);
  },

  async updateProfile(userId: string, data: Record<string, unknown>) {
    return request<Record<string, unknown>>(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async toggleFollow(userId: string) {
    return request<{ is_following: boolean }>(`/api/users/${userId}/follow`, {
      method: "POST",
    });
  },

  async getFollowStatus(userId: string) {
    return request<{ is_following: boolean }>(`/api/users/${userId}/follow-status`);
  },

  async getFollowers(userId: string, params?: { page?: number; pageSize?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));
    const qs = searchParams.toString();
    return request<{
      page: number;
      pageSize: number;
      total: number;
      items: Array<Record<string, unknown>>;
    }>(`/api/users/${userId}/followers${qs ? `?${qs}` : ""}`);
  },

  async getFollowing(userId: string, params?: { page?: number; pageSize?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));
    const qs = searchParams.toString();
    return request<{
      page: number;
      pageSize: number;
      total: number;
      items: Array<Record<string, unknown>>;
    }>(`/api/users/${userId}/following${qs ? `?${qs}` : ""}`);
  },
};

// ============================================
// 智能体相关 API
// ============================================

export const agents = {
  async list(params?: { category?: string; status?: string; page?: number; limit?: number; pageSize?: number; search?: string; tag?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set('category', params.category);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.pageSize) searchParams.set('limit', String(params.pageSize));
    if (params?.search) searchParams.set('search', params.search);
    if (params?.tag) searchParams.set('tag', params.tag);

    return request<{ items: Record<string, unknown>[]; total: number }>(`/api/agents?${searchParams.toString()}`);
  },

  async getById(id: string) {
    return request<Record<string, unknown>>(`/api/agents/${id}`);
  },
  async myAgents(params?: { page?: number; limit?: number; status?: string }) {
    return creator.getAgents(params);
  },
  /** 兼容旧调用 */
  async get(id: string) {
    return request<Record<string, unknown>>(`/api/agents/${id}`);
  },

  async create(data: Record<string, unknown>) {
    return request<Record<string, unknown>>('/api/agents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: Record<string, unknown>) {
    return request<Record<string, unknown>>(`/api/agents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string) {
    return request(`/api/agents/${id}`, { method: 'DELETE' });
  },

  async getDemos(agentId: string) {
    return request<Record<string, unknown>[]>(`/api/agents/${agentId}/demos`);
  },

  async addDemo(agentId: string, data: Record<string, unknown>) {
    return request<Record<string, unknown>>(`/api/agents/${agentId}/demos`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async favorite(agentId: string) {
    return request(`/api/agents/${agentId}/favorite`, { method: 'POST' });
  },

  async unfavorite(agentId: string) {
    return request(`/api/agents/${agentId}/favorite`, { method: 'DELETE' });
  },

  async rate(agentId: string, rating: number, comment?: string) {
    return request(`/api/agents/${agentId}/rate`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment }),
    });
  },
};

export const skills = {
  async list(params?: { category?: string; status?: string; page?: number; limit?: number; search?: string; tag?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set("category", params.category);
    if (params?.status) searchParams.set("status", params.status);
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("page_size", String(params.limit));
    if (params?.search) searchParams.set("search", params.search);
    if (params?.tag) searchParams.set("tag", params.tag);
    return request<{ items: Record<string, unknown>[]; total: number }>(`/api/skills?${searchParams.toString()}`);
  },
  async get(idOrSlug: string) {
    return request<Record<string, unknown>>(`/api/skills/${encodeURIComponent(idOrSlug)}`);
  },
};

// ============================================
// 职位相关 API（已迁移到 opportunities）
// ============================================

export const opportunities = {
  async list(params?: { 
    page?: number; 
    limit?: number; 
    type?: string;
    city?: string;
    industry?: string;
    featured?: boolean;
    search?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('page_size', String(params.limit));
    if (params?.type) searchParams.set('type', params.type);
    if (params?.city) searchParams.set('city', params.city);
    if (params?.industry) searchParams.set('industry', params.industry);
    if (params?.featured) searchParams.set('featured', 'true');
    if (params?.search) searchParams.set('search', params.search);

    return request<{ items: Record<string, unknown>[]; total: number }>(`/api/opportunities?${searchParams.toString()}`);
  },

  async getById(id: string) {
    return request<Record<string, unknown>>(`/api/opportunities/${id}`);
  },

  async getBySlug(slug: string) {
    return request<Record<string, unknown>>(`/api/opportunities/slug/${slug}`);
  },

  /** 先按 slug 查，失败再按 id（兼容列表链接） */
  async get(slugOrId: string) {
    try {
      return await request<Record<string, unknown>>(`/api/opportunities/slug/${encodeURIComponent(slugOrId)}`);
    } catch {
      return request<Record<string, unknown>>(`/api/opportunities/${encodeURIComponent(slugOrId)}`);
    }
  },

  async create(data: Record<string, unknown>) {
    return request<Record<string, unknown>>('/api/opportunities', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: Record<string, unknown>) {
    return request<Record<string, unknown>>(`/api/opportunities/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string) {
    return request(`/api/opportunities/${id}`, { method: 'DELETE' });
  },

  async getMyOpportunities(params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('page_size', String(params.limit));

    return request<{ items: Record<string, unknown>[]; total: number }>(`/api/opportunities/my?${searchParams.toString()}`);
  },

  async submitApplication(
    opportunityIdOrSlug: string,
    body: {
      file_url: string;
      original_name?: string;
      message?: string;
      uploaded_file_id?: string;
    }
  ) {
    return request<{ application_id: string; is_new: boolean }>(
      `/api/opportunities/${encodeURIComponent(opportunityIdOrSlug)}/applications`,
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    );
  },
};

// ============================================
// 邀请相关 API
// ============================================

export const invitations = {
  async create(data: {
    receiver_id: string;
    receiver_role: string;
    source_type: 'skill' | 'agent' | 'opportunity' | 'creator_profile';
    source_id: string;
    invitation_type: 'collaboration' | 'job';
    message?: string;
  }) {
    return request<Record<string, unknown>>('/api/invitations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getSent(params?: { page?: number; limit?: number; status?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('page_size', String(params.limit));
    if (params?.status) searchParams.set('status', params.status);

    return request<{ items: Record<string, unknown>[]; total: number }>(`/api/invitations/sent?${searchParams.toString()}`);
  },

  async getReceived(params?: { page?: number; limit?: number; status?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('page_size', String(params.limit));
    if (params?.status) searchParams.set('status', params.status);

    return request<{ items: Record<string, unknown>[]; total: number }>(`/api/invitations/received?${searchParams.toString()}`);
  },

  async respond(id: string, status: 'accepted' | 'rejected' | 'negotiating', message?: string) {
    return request<Record<string, unknown>>(`/api/invitations/${id}/respond`, {
      method: 'PATCH',
      body: JSON.stringify({ status, message }),
    });
  },

  async getById(id: string) {
    return request<Record<string, unknown>>(`/api/invitations/${id}`);
  },

  async delete(id: string) {
    return request(`/api/invitations/${id}`, { method: 'DELETE' });
  },
};

// ============================================
// 试用邀请相关 API
// ============================================

export const trials = {
  async create(data: {
    target_user_id: string;
    source_type: 'skill' | 'agent';
    source_id: string;
    message?: string;
    expires_in_days?: number;
  }) {
    return request<Record<string, unknown>>('/api/trials', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getSent(params?: { page?: number; limit?: number; status?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('page_size', String(params.limit));
    if (params?.status) searchParams.set('status', params.status);

    return request<{ items: Record<string, unknown>[]; total: number }>(`/api/trials/sent?${searchParams.toString()}`);
  },

  async getReceived(params?: { page?: number; limit?: number; status?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('page_size', String(params.limit));
    if (params?.status) searchParams.set('status', params.status);

    return request<{ items: Record<string, unknown>[]; total: number }>(`/api/trials/received?${searchParams.toString()}`);
  },

  async respond(id: string, status: 'accepted' | 'rejected') {
    return request<Record<string, unknown>>(`/api/trials/${id}/respond`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async getById(id: string) {
    return request<Record<string, unknown>>(`/api/trials/${id}`);
  },

  async delete(id: string) {
    return request(`/api/trials/${id}`, { method: 'DELETE' });
  },
};

// ============================================
// 工作台相关 API
// ============================================

export const workspace = {
  async getOverview() {
    return request<Record<string, unknown>>('/api/workspace/overview');
  },

  async getPurchased(params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('page_size', String(params.limit));

    return request<{ items: Record<string, unknown>[]; total: number }>(`/api/workspace/purchased?${searchParams.toString()}`);
  },

  /** 工作画布：技能运行记录（上传 → 执行 → 产出） */
  async getSkillRuns(params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('page_size', String(params.limit));
    return request<{ items: Record<string, unknown>[]; total: number }>(
      `/api/workspace/skill-runs?${searchParams.toString()}`
    );
  },

  async startSkillRun(body: {
    skill_id: string;
    input_file_ids: string[];
    token_policy?: {
      mode?: "off" | "partner";
      provider?: string;
    };
  }) {
    return request<Record<string, unknown>>("/api/workspace/skill-runs", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  async getFavorites(params?: { page?: number; limit?: number; type?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('page_size', String(params.limit));
    if (params?.type) searchParams.set('type', params.type);

    return request<{ items: Record<string, unknown>[]; total: number }>(`/api/workspace/favorites?${searchParams.toString()}`);
  },

  async removeFavorite(id: string) {
    return request(`/api/workspace/favorites/${id}`, { method: 'DELETE' });
  },

  async getInvitations(params?: { page?: number; limit?: number; status?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('page_size', String(params.limit));
    if (params?.status) searchParams.set('status', params.status);

    return request<{ items: Record<string, unknown>[]; total: number }>(`/api/workspace/invitations?${searchParams.toString()}`);
  },

  async getOpportunityApplications(params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("page_size", String(params.limit));

    return request<{ items: Record<string, unknown>[]; total: number }>(
      `/api/workspace/opportunity-applications?${searchParams.toString()}`
    );
  },

  async getCommunity(params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('page_size', String(params.limit));

    return request<{ items: Record<string, unknown>[]; total: number }>(`/api/workspace/community?${searchParams.toString()}`);
  },
  /** 兼容旧页面命名 */
  async getPosts(params?: { page?: number; limit?: number }) {
    return this.getCommunity(params);
  },

  async getPostAnalytics() {
    return request<{
      post_count: number;
      total_views: number;
      total_comments: number;
      total_likes: number;
      total_dislikes: number;
      total_skill_downloads: number;
      top_posts: Record<string, unknown>[];
    }>('/api/workspace/post-analytics');
  },

  async replyToOpportunityApplication(applicationId: string, message: string) {
    return request<Record<string, unknown>>(`/api/workspace/opportunity-applications/${applicationId}/reply`, {
      method: 'PATCH',
      body: JSON.stringify({ message }),
    });
  },

  /** 当前用户发出的岗位投递（求职者侧工作台） */
  async getMyOpportunitySubmissions(params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('page_size', String(params.limit));

    return request<{ items: Record<string, unknown>[]; total: number }>(
      `/api/workspace/my-opportunity-submissions?${searchParams.toString()}`
    );
  },

  /** 撤回本人对某岗位的投递 */
  async deleteMyOpportunitySubmission(applicationId: string) {
    return request(`/api/workspace/my-opportunity-submissions/${encodeURIComponent(applicationId)}`, {
      method: 'DELETE',
    });
  },

  async getNotifications(params?: { page?: number; limit?: number; is_read?: boolean; type?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('page_size', String(params.limit));
    if (params?.is_read !== undefined) searchParams.set('is_read', String(params.is_read));
    if (params?.type) searchParams.set('type', params.type);

    return request<{ items: Record<string, unknown>[]; total: number }>(`/api/workspace/notifications?${searchParams.toString()}`);
  },

  async markNotificationRead(id: string) {
    return request(`/api/workspace/notifications/${id}/read`, { method: 'PATCH' });
  },

  async markAllNotificationsRead() {
    return request('/api/workspace/notifications/read-all', { method: 'POST' });
  },

  async deleteNotification(id: string) {
    return request(`/api/workspace/notifications/${id}`, { method: 'DELETE' });
  },
};

// ============================================
// 创作者中心相关 API
// ============================================

export const creator = {
  async getOverview() {
    return request<Record<string, unknown>>('/api/creator/overview');
  },

  async getSkills(params?: { page?: number; limit?: number; status?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('page_size', String(params.limit));
    if (params?.status) searchParams.set('status', params.status);

    return request<{ items: Record<string, unknown>[]; total: number }>(`/api/creator/skills?${searchParams.toString()}`);
  },

  async getSkill(id: string) {
    return request<Record<string, unknown>>(`/api/creator/skills/${encodeURIComponent(id)}`);
  },

  async createSkill(body?: Record<string, unknown>) {
    return request<Record<string, unknown>>('/api/creator/skills', {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    });
  },

  async updateSkill(id: string, body: Record<string, unknown>) {
    return request<Record<string, unknown>>(`/api/creator/skills/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  async getAgents(params?: { page?: number; limit?: number; status?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('page_size', String(params.limit));
    if (params?.status) searchParams.set('status', params.status);

    return request<{ items: Record<string, unknown>[]; total: number }>(`/api/creator/agents?${searchParams.toString()}`);
  },

  async getEarnings(params?: { page?: number; limit?: number; status?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('page_size', String(params.limit));
    if (params?.status) searchParams.set('status', params.status);

    return request<{ items: Record<string, unknown>[]; total: number }>(`/api/creator/earnings?${searchParams.toString()}`);
  },
  /** 兼容旧页面命名 */
  async getWithdrawals(params?: { page?: number; limit?: number; status?: string }) {
    return this.getEarnings(params);
  },

  async getInvitations(params?: { page?: number; limit?: number; status?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('page_size', String(params.limit));
    if (params?.status) searchParams.set('status', params.status);

    return request<{ items: Record<string, unknown>[]; total: number }>(`/api/creator/invitations?${searchParams.toString()}`);
  },

  async getTrials(params?: { page?: number; limit?: number; status?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('page_size', String(params.limit));
    if (params?.status) searchParams.set('status', params.status);

    return request<{ items: Record<string, unknown>[]; total: number }>(`/api/creator/trials?${searchParams.toString()}`);
  },

  async getVerification() {
    return request<Record<string, unknown>[]>('/api/creator/verification');
  },

  async getIp(params?: { page?: number; limit?: number; status?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('page_size', String(params.limit));
    if (params?.status) searchParams.set('status', params.status);

    return request<{ items: Record<string, unknown>[]; total: number }>(`/api/creator/ip?${searchParams.toString()}`);
  },

  async applyIp(body: {
    source_type: "skill" | "agent";
    source_id: string;
    materials?: Record<string, unknown>;
  }) {
    return request<Record<string, unknown>>("/api/creator/ip/apply", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  async getStats() {
    return request<Record<string, unknown>>('/api/creator/stats');
  },
};

// ============================================
// 认证律师相关 API
// ============================================

export const lawyers = {
  async list(params?: {
    page?: number;
    limit?: number;
    city?: string;
    expertise?: string;
    featured?: boolean;
    search?: string;
    sort?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('page_size', String(params.limit));
    if (params?.city) searchParams.set('city', params.city);
    if (params?.expertise) searchParams.set('expertise', params.expertise);
    if (params?.featured) searchParams.set('featured', 'true');
    if (params?.search) searchParams.set('search', params.search);
    if (params?.sort) searchParams.set('sort', params.sort);

    return request<{ items: Record<string, unknown>[]; total: number }>(`/api/lawyers?${searchParams.toString()}`);
  },

  async get(slug: string) {
    return request<Record<string, unknown>>(`/api/lawyers/${encodeURIComponent(slug)}`);
  },

  async getBySlug(slug: string) {
    return request<Record<string, unknown>>(`/api/lawyers/${encodeURIComponent(slug)}`);
  },

  async getFeatured() {
    return request<Record<string, unknown>[]>('/api/lawyers/featured');
  },

  async getRankings(params?: { type?: string; city?: string; expertise?: string; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.set('type', params.type);
    if (params?.city) searchParams.set('city', params.city);
    if (params?.expertise) searchParams.set('expertise', params.expertise);
    if (params?.limit) searchParams.set('limit', String(params.limit));

    return request<Record<string, unknown>[]>(`/api/lawyers/rankings?${searchParams.toString()}`);
  },

  async getProducts(lawyerId: string, params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('page_size', String(params.limit));

    return request<{ items: Record<string, unknown>[]; total: number }>(`/api/lawyers/${lawyerId}/products?${searchParams.toString()}`);
  },

  async getReviews(lawyerId: string, params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('page_size', String(params.limit));

    return request<{ items: Record<string, unknown>[]; total: number }>(`/api/lawyers/${lawyerId}/reviews?${searchParams.toString()}`);
  },

  async createReview(lawyerId: string, data: { rating: number; tags?: string[]; content: string }) {
    return request<Record<string, unknown>>(`/api/lawyers/${lawyerId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getCities() {
    return request<{ city: string; count: string }[]>('/api/lawyers/cities');
  },

  async getExpertise() {
    return request<{ expertise: string; count: string }[]>('/api/lawyers/expertise');
  },
};

// ============================================
// 通知相关 API
// ============================================

export const notifications = {
  async list(params?: { page?: number; limit?: number; type?: string; is_read?: boolean }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('page_size', String(params.limit));
    if (params?.type) searchParams.set('type', params.type);
    if (params?.is_read !== undefined) searchParams.set('is_read', String(params.is_read));

    return request<{ items: Record<string, unknown>[]; total: number }>(`/api/notifications?${searchParams.toString()}`);
  },

  async getCount() {
    return request<{ unread_count: number }>('/api/notifications/count');
  },

  async markRead(id: string) {
    return request(`/api/notifications/${id}/read`, { method: 'PATCH' });
  },

  async markAllRead() {
    return request('/api/notifications/read-all', { method: 'POST' });
  },

  async delete(id: string) {
    return request(`/api/notifications/${id}`, { method: 'DELETE' });
  },

  async clear() {
    return request('/api/notifications/clear', { method: 'DELETE' });
  },

  async getTypes() {
    return request<{ value: string; label: string }[]>('/api/notifications/types');
  },
};

// ============================================
// 社区相关 API
// ============================================

export const uploads = {
  async listMine(params?: { page?: number; pageSize?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
    return request<{
      items: Record<string, unknown>[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    }>(`/api/upload/user/files?${searchParams.toString()}`);
  },
};

export const community = {
  async listPosts(params?: { page?: number; limit?: number; tag?: string; search?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('pageSize', String(params.limit));
    if (params?.tag) searchParams.set('tag', params.tag);
    if (params?.search) searchParams.set('search', params.search);

    return request<{ items: Record<string, unknown>[]; total: number }>(`/api/community/posts?${searchParams.toString()}`);
  },

  async getPost(id: string) {
    return request<Record<string, unknown>>(`/api/community/posts/${id}`);
  },

  async createPost(data: {
    title: string;
    content: string;
    tags?: string[];
    /** 计划发布日期 YYYY-MM-DD，最早 2026-04-16（前端校验） */
    scheduled_publish_date?: string;
  }) {
    return request<Record<string, unknown>>('/api/community/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async listComments(postId: string, params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('pageSize', String(params.limit));
    return request<{ items: Record<string, unknown>[]; total: number }>(
      `/api/community/posts/${postId}/comments?${searchParams.toString()}`
    );
  },

  async comment(postId: string, content: string, parentId?: string) {
    return request<Record<string, unknown>>('/api/community/comments', {
      method: 'POST',
      body: JSON.stringify({
        post_id: postId,
        content,
        ...(parentId ? { parent_id: parentId } : {}),
      }),
    });
  },

  async like(postId: string) {
    return request(`/api/community/posts/${postId}/like`, { method: 'POST' });
  },

  async unlike(postId: string) {
    return request(`/api/community/posts/${postId}/like`, { method: 'DELETE' });
  },

  async report(data: {
    target_type: 'community_post' | 'community_comment' | 'skill' | 'agent' | 'creator_profile';
    target_id: string;
    reason: string;
    detail?: string;
  }) {
    return request<Record<string, unknown>>('/api/community/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// ============================================
// 余额相关 API
// ============================================

async function fetchBalance() {
  return request<{ balance: number; frozen_balance: number; total_recharged: number; total_consumed: number }>('/api/balance');
}

export const balance = {
  getBalance: fetchBalance,
  /** 与部分页面使用的 `api.balance.get()` 兼容 */
  get: fetchBalance,

  async recharge(amount: number, method: 'alipay' | 'wechat') {
    return request<{ order_id: string; payment_url?: string }>('/api/balance/recharge', {
      method: 'POST',
      body: JSON.stringify({ amount, method }),
    });
  },

  async getTransactions(params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));

    return request<{ items: Record<string, unknown>[]; total: number }>(`/api/balance/transactions?${searchParams.toString()}`);
  },
};

// ============================================
// AI 对话相关 API
// ============================================

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

async function fetchAiStats() {
  return request<{
    total_calls: number;
    total_consume: number;
    today_calls: number;
    monthly_consume?: number;
    top_agents?: { id: string; name: string; call_count: number }[];
  }>('/api/ai/stats');
}

export const ai = {
  async chat(data: { agent_id: string; messages: ChatMessage[] }) {
    return request<{
      message: ChatMessage;
      balance_after?: number;
    }>('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getSessions(params?: { page?: number; pageSize?: number; agent_id?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
    if (params?.agent_id) searchParams.set('agent_id', params.agent_id);

    return request<{ items: Record<string, unknown>[]; total: number }>(`/api/ai/sessions?${searchParams.toString()}`);
  },

  async getSession(sessionId: string) {
    return request<Record<string, unknown>>(`/api/ai/sessions/${sessionId}`);
  },

  async deleteSession(sessionId: string) {
    return request(`/api/ai/sessions/${sessionId}`, { method: 'DELETE' });
  },

  getStats: fetchAiStats,
  /** 与部分页面使用的 `api.ai.stats()` 兼容 */
  stats: fetchAiStats,

  async listModels() {
    return request<Record<string, unknown>>('/api/ai/models');
  },

  async health() {
    return request<{ providers: string[]; stats: Record<string, unknown> }>('/api/ai/health');
  },

  // 流式对话（返回 fetch Response）
  chatStream(data: { agent_id: string; messages: ChatMessage[] }) {
    const accessToken = getAccessToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
    }

    return fetch(`${apiBaseUrl()}/api/ai/chat/stream`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(data),
    });
  },
};

// ============================================
// 会话管理
// ============================================

let sessionCache: Session | null = null;
let sessionCacheTime = 0;
const SESSION_CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

/**
 * 浏览器端拉取会话（短内存缓存）。服务端 RSC 请使用 `@/lib/auth/server-session` 的 `getServerSession`。
 */
async function fetchSessionUncached(): Promise<Session | null> {
  if (typeof window === "undefined") {
    return null;
  }

  const now = Date.now();
  if (sessionCache && now - sessionCacheTime < SESSION_CACHE_TTL) {
    return sessionCache;
  }

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const url = "/api/auth/me";

    const response = await fetch(url, {
      headers,
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      sessionCache = null;
      return null;
    }

    const text = await response.text();
    let result: BackendResponse<Session>;
    try {
      result = text ? (JSON.parse(text) as BackendResponse<Session>) : { code: -1, message: "" };
    } catch {
      sessionCache = null;
      return null;
    }

    if (result.code === 0 && result.data) {
      sessionCache = result.data;
      sessionCacheTime = now;
      return result.data;
    }

    sessionCache = null;
    return null;
  } catch {
    sessionCache = null;
    return null;
  }
}

/**
 * 获取当前用户会话（浏览器端带缓存；服务端委托 `getServerSession`）。
 */
export async function getSession(): Promise<Session | null> {
  return fetchSessionUncached();
}

/**
 * 清除会话缓存（登录/登出时调用）
 */
export function clearSessionCache(): void {
  sessionCache = null;
  sessionCacheTime = 0;
  clearAnalyticsBoardCache();
}

// ============================================
// 存储相关（前端 Cookie 操作）
// ============================================

export const storage = {
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return getAccessToken();
  },
  /** 清除可读 Cookie；httpOnly 会话需配合 `api.auth.logout()` */
  clear(): void {
    if (typeof window === "undefined") return;
    const expire = "Max-Age=0; path=/";
    document.cookie = `lvzhi_access_token=; ${expire}`;
    document.cookie = `lvzhi_refresh_token=; ${expire}`;
    document.cookie = `lvzhi_user_role=; ${expire}`;
  },
};

// ============================================
// 订单相关 API
// ============================================

export const orders = {
  async create(data: { product_id: string; payment_method?: string }) {
    return request<{ id: string }>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async list(params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));

    return request<{ items: Record<string, unknown>[]; total: number }>(`/api/orders?${searchParams.toString()}`);
  },

  async getById(id: string) {
    return request<Record<string, unknown>>(`/api/orders/${id}`);
  },

  async payAlipay(orderId: string) {
    return request<{ order_id: string; payment_url?: string }>(`/api/payments/alipay`, {
      method: 'POST',
      body: JSON.stringify({ order_id: orderId }),
    });
  },

  async payWechat(orderId: string) {
    return request<{ order_id: string; code_url?: string }>(`/api/payments/wechat`, {
      method: 'POST',
      body: JSON.stringify({ order_id: orderId }),
    });
  },
};

// ============================================
// 管理后台 API
// ============================================

export interface AdminUser {
  id: string;
  display_name: string | null;
  email: string | null;
  role: string;
  status: string | null;
  created_at: string;
}

export interface AdminAgent {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  status: string;
  is_free_trial: boolean;
  pricing_model: string;
  created_at: string;
  creator?: {
    id: string;
    display_name: string | null;
    verified: boolean;
  };
}

export interface AdminPost {
  id: string;
  title: string | null;
  content: string | null;
  user_id: string | null;
  status: string | null;
  created_at: string;
  author?: {
    display_name: string | null;
  };
}

export interface AdminInquiry {
  id: string;
  type: string;
  status: string;
  note: string | null;
  created_at: string;
  user_id: string | null;
  applicant?: {
    display_name: string | null;
  };
}

export interface AdminOpportunity {
  id: string;
  title: string;
  type: string;
  location: string | null;
  publisher_name: string | null;
  status: "active" | "pending" | "closed" | string;
  view_count: number;
  application_count: number;
  created_at: string;
}

export const admin = {
  // 用户管理
  async getUsers(params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));

    return request<{ items: AdminUser[]; total: number }>(`/api/admin/users?${searchParams.toString()}`);
  },

  async banUser(userId: string) {
    return request('/api/admin/users/' + userId, {
      method: 'PUT',
      body: JSON.stringify({ status: 'banned' }),
    });
  },

  async unbanUser(userId: string) {
    return request('/api/admin/users/' + userId, {
      method: 'PUT',
      body: JSON.stringify({ status: 'active' }),
    });
  },

  async muteUser(userId: string) {
    return request('/api/admin/users/' + userId, {
      method: 'PUT',
      body: JSON.stringify({ status: 'muted' }),
    });
  },

  // 智能体管理
  async getAgents(params?: { status?: string; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));

    return request<{ items: AdminAgent[]; total: number }>(`/api/admin/agents?${searchParams.toString()}`);
  },

  async approveAgent(agentId: string) {
    return request('/api/admin/agents/' + agentId, {
      method: 'PUT',
      body: JSON.stringify({ status: 'active' }),
    });
  },

  async rejectAgent(agentId: string) {
    return request('/api/admin/agents/' + agentId, {
      method: 'PUT',
      body: JSON.stringify({ status: 'rejected' }),
    });
  },

  // 岗位审核管理
  async getOpportunities(params?: { status?: string; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));

    return request<{ items: AdminOpportunity[]; total: number }>(`/api/admin/opportunities?${searchParams.toString()}`);
  },

  async approveOpportunity(opportunityId: string) {
    return request(`/api/admin/opportunities/${opportunityId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'active' }),
    });
  },

  async rejectOpportunity(opportunityId: string) {
    return request(`/api/admin/opportunities/${opportunityId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'closed' }),
    });
  },

  // 订单管理
  async getOrders(params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));

    return request<{ items: Record<string, unknown>[]; total: number }>(`/api/admin/orders?${searchParams.toString()}`);
  },

  async getOrderStats() {
    return request<{
      today_orders: number;
      today_gmv: number;
      pending_refunds: number;
      pending_invoices: number;
    }>('/api/admin/orders/stats');
  },

  // 社区管理
  async getPosts(params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));

    return request<{ items: AdminPost[]; total: number }>(`/api/community/posts?${searchParams.toString()}`);
  },

  async deletePost(postId: string) {
    return request(`/api/community/posts/${postId}`, {
      method: 'DELETE',
    });
  },

  // 咨询管理
  async getInquiries(params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));

    return request<{ items: AdminInquiry[]; total: number }>(`/api/admin/inquiries?${searchParams.toString()}`);
  },

  async markInquiryProcessed(inquiryId: string) {
    return request('/api/admin/inquiries/' + inquiryId, {
      method: 'PUT',
      body: JSON.stringify({ status: 'processed' }),
    });
  },

  // 仪表盘统计
  async getDashboardStats() {
    return request<{
      total_users: number;
      total_agents: number;
      total_orders: number;
      total_revenue: number;
      pending_agents: number;
      pending_posts: number;
    }>('/api/admin/stats');
  },

  // 兼容旧页面调用
  async getAdmins(params?: { page?: number; limit?: number }) {
    return this.getUsers(params);
  },
  async getBlockedUsers(params?: { page?: number; limit?: number; status?: string }) {
    const base = await this.getUsers(params);
    return {
      ...base,
      items: (base.items || []).filter((x) => String(x.status || "") === "banned"),
    };
  },
  async getDataStats(_params?: Record<string, unknown>) {
    return this.getDashboardStats();
  },
  async getVerifications(params?: { page?: number; limit?: number; status?: string; verification_type?: string; type?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("pageSize", String(params.limit));
    if (params?.status) searchParams.set("status", params.status);
    if (params?.verification_type) searchParams.set("verification_type", params.verification_type);
    if (params?.type) searchParams.set("verification_type", params.type);
    return request<{ items: Record<string, unknown>[]; total: number }>(
      `/api/admin/verification/applications?${searchParams.toString()}`
    );
  },
  async getWithdrawals(params?: { page?: number; limit?: number; status?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("pageSize", String(params.limit));
    if (params?.status) searchParams.set("status", params.status);
    return request<{ items: Record<string, unknown>[]; total: number }>(
      `/api/admin/withdrawals?${searchParams.toString()}`
    );
  },
};

// ============================================
// 导出 API 客户端
// ============================================

export const api = {
  auth,
  users,
  agents,
  skills,
  opportunities,
  invitations,
  trials,
  workspace,
  uploads,
  creator,
  lawyers,
  notifications,
  community,
  balance,
  orders,
  ai,
  admin,
  health: {
    async check() {
      return request<Record<string, unknown>>("/api/health");
    },
  },
};

/** 应用启动时探测登录态（依赖 httpOnly Cookie + 同源 /api） */
export async function initAuth() {
  try {
    return await api.auth.me();
  } catch {
    return null;
  }
}

/** 登出并清理可读 Cookie */
export async function logout() {
  try {
    await api.auth.logout();
  } catch {
    // ignore
  } finally {
    storage.clear();
  }
}

export default api;
