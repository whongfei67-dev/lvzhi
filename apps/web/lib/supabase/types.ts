/**
 * 用户角色
 * - visitor: 游客（未登录）
 * - client: 客户（普通注册用户）
 * - creator: 创作者（技能包/智能体开发者）
 * - admin: 一般管理员（运营人员）
 * - superadmin: 超管（系统最高权限）
 *
 * 注意: 一般管理员是纯管理角色，不具备客户或创作者的业务功能
 */
export type UserRole = "visitor" | "client" | "creator" | "admin" | "superadmin"

/**
 * 创作者认证等级
 * - basic: 普通创作者
 * - excellent: 优秀创作者
 * - master: 大师级创作者
 * - lawyer: 律师认证
 */
export type CreatorLevel = "basic" | "excellent" | "master" | "lawyer"
export type JobType = "full_time" | "intern" | "part_time";
export type JobStatus = "active" | "closed" | "draft";
export type ApplicationStatus =
  | "pending"
  | "viewed"
  | "interviewing"
  | "rejected"
  | "offered";
export type AgentCategory =
  | "contract"
  | "litigation"
  | "consultation"
  | "compliance"
  | "other";
export type AgentStatus = "pending_review" | "active" | "rejected";
export type OrgType = "law_firm" | "enterprise";
export type PromoPlansType = "basic" | "featured" | "premium";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          phone: string | null;
          verified: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          role: UserRole;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          phone?: string | null;
          verified?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          role?: UserRole;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          phone?: string | null;
          verified?: boolean;
          created_at?: string;
        };
      };
      seeker_profiles: {
        Row: {
          user_id: string;
          education_level: string | null;
          school: string | null;
          graduation_year: number | null;
          skill_tags: string[] | null;
          resume_url: string | null;
          ai_skill_portrait: Record<string, unknown> | null;
        };
        Insert: {
          user_id: string;
          education_level?: string | null;
          school?: string | null;
          graduation_year?: number | null;
          skill_tags?: string[] | null;
          resume_url?: string | null;
          ai_skill_portrait?: Record<string, unknown> | null;
        };
        Update: {
          user_id?: string;
          education_level?: string | null;
          school?: string | null;
          graduation_year?: number | null;
          skill_tags?: string[] | null;
          resume_url?: string | null;
          ai_skill_portrait?: Record<string, unknown> | null;
        };
      };
      lawyer_profiles: {
        Row: {
          user_id: string;
          bar_number: string | null;
          law_firm: string | null;
          specialty: string[] | null;
          years_experience: number | null;
          verified_at: string | null;
        };
        Insert: {
          user_id: string;
          bar_number?: string | null;
          law_firm?: string | null;
          specialty?: string[] | null;
          years_experience?: number | null;
          verified_at?: string | null;
        };
        Update: {
          user_id?: string;
          bar_number?: string | null;
          law_firm?: string | null;
          specialty?: string[] | null;
          years_experience?: number | null;
          verified_at?: string | null;
        };
      };
      recruiter_profiles: {
        Row: {
          user_id: string;
          org_name: string | null;
          org_type: OrgType | null;
          business_license_url: string | null;
          verified_at: string | null;
        };
        Insert: {
          user_id: string;
          org_name?: string | null;
          org_type?: OrgType | null;
          business_license_url?: string | null;
          verified_at?: string | null;
        };
        Update: {
          user_id?: string;
          org_name?: string | null;
          org_type?: OrgType | null;
          business_license_url?: string | null;
          verified_at?: string | null;
        };
      };
      jobs: {
        Row: {
          id: string;
          recruiter_id: string;
          title: string;
          description: string | null;
          requirements: string | null;
          location: string | null;
          salary_range: string | null;
          job_type: JobType | null;
          specialty: string[] | null;
          status: JobStatus;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          recruiter_id: string;
          title: string;
          description?: string | null;
          requirements?: string | null;
          location?: string | null;
          salary_range?: string | null;
          job_type?: JobType | null;
          specialty?: string[] | null;
          status?: JobStatus;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          recruiter_id?: string;
          title?: string;
          description?: string | null;
          requirements?: string | null;
          location?: string | null;
          salary_range?: string | null;
          job_type?: JobType | null;
          specialty?: string[] | null;
          status?: JobStatus;
          expires_at?: string | null;
          created_at?: string;
        };
      };
      applications: {
        Row: {
          id: string;
          job_id: string;
          seeker_id: string;
          status: ApplicationStatus;
          cover_letter: string | null;
          applied_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          seeker_id: string;
          status?: ApplicationStatus;
          cover_letter?: string | null;
          applied_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          seeker_id?: string;
          status?: ApplicationStatus;
          cover_letter?: string | null;
          applied_at?: string;
        };
      };
      agents: {
        Row: {
          id: string;
          creator_id: string;
          name: string;
          description: string | null;
          category: AgentCategory | null;
          price: number;
          is_free_trial: boolean;
          status: AgentStatus;
          demo_content: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          name: string;
          description?: string | null;
          category?: AgentCategory | null;
          price?: number;
          is_free_trial?: boolean;
          status?: AgentStatus;
          demo_content?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          name?: string;
          description?: string | null;
          category?: AgentCategory | null;
          price?: number;
          is_free_trial?: boolean;
          status?: AgentStatus;
          demo_content?: Record<string, unknown> | null;
          created_at?: string;
        };
      };
      agent_demos: {
        Row: {
          id: string;
          agent_id: string;
          viewer_id: string | null;
          started_at: string;
          completed_at: string | null;
          converted: boolean;
        };
        Insert: {
          id?: string;
          agent_id: string;
          viewer_id?: string | null;
          started_at?: string;
          completed_at?: string | null;
          converted?: boolean;
        };
        Update: {
          id?: string;
          agent_id?: string;
          viewer_id?: string | null;
          started_at?: string;
          completed_at?: string | null;
          converted?: boolean;
        };
      };
      promo_orders: {
        Row: {
          id: string;
          lawyer_id: string;
          plan_type: PromoPlansType | null;
          status: string;
          started_at: string | null;
          expires_at: string | null;
          amount: number | null;
        };
        Insert: {
          id?: string;
          lawyer_id: string;
          plan_type?: PromoPlansType | null;
          status?: string;
          started_at?: string | null;
          expires_at?: string | null;
          amount?: number | null;
        };
        Update: {
          id?: string;
          lawyer_id?: string;
          plan_type?: PromoPlansType | null;
          status?: string;
          started_at?: string | null;
          expires_at?: string | null;
          amount?: number | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
