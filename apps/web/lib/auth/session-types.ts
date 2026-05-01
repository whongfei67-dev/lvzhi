/** 与 `lib/api/client` 中会话结构保持一致，供 RSC 轻量模块引用，避免循环依赖 */
export interface Session {
  id: string;
  email: string;
  phone?: string;
  role: "visitor" | "client" | "creator" | "admin" | "superadmin";
  display_name: string;
  avatar_url?: string;
  bio?: string;
  verified: boolean;
  balance: number;
  creator_level?: "basic" | "excellent" | "master" | "lawyer";
  lawyer_verified?: boolean;
  is_superadmin?: boolean;
  created_at: string;
}
