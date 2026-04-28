"use server";

import { createCompatClient } from "@/lib/supabase/compat-client";

/**
 * 创作者认证相关 Server Actions
 */

// 获取当前用户的认证状态
export async function getVerificationStatus(): Promise<{
  success: boolean;
  data?: unknown;
  error?: string;
}> {
  const supabase = await createCompatClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "请先登录" };
  }

  // 获取用户信息，包括创作者等级
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError) {
    return { success: false, error: profileError.message };
  }

  // 获取统计数据
  const { data: stats } = await supabase.rpc("get_creator_stats", {
    user_id_param: user.id,
  });
  const statRow = (stats ?? {}) as Record<string, unknown>;
  const totalDownloads = Number(statRow.total_downloads ?? 0);
  const totalProducts = Number(statRow.total_products ?? 0);

  return {
    success: true,
    data: {
      ...profile,
      stats: stats || {
        total_downloads: 0,
        total_products: 0,
        total_revenue: 0,
      },
      auto_eligibility: {
        excellent: totalDownloads >= 50 || totalProducts >= 5,
        master: totalDownloads >= 200 || totalProducts >= 20,
      },
    },
  };
}

// 获取认证统计数据
export async function getVerificationStats(): Promise<{
  success: boolean;
  data?: unknown;
  error?: string;
}> {
  const supabase = await createCompatClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "请先登录" };
  }

  // 获取创作者的统计数据
  const { data: skills } = await supabase
    .from("skills")
    .select("download_count")
    .eq("creator_id", user.id)
    .eq("status", "active");

  const { data: agents } = await supabase
    .from("agents")
    .select("id")
    .eq("creator_id", user.id)
    .eq("status", "active");

  const totalDownloads = (skills || []).reduce((sum: number, s: any) => sum + (s.download_count || 0), 0);
  const totalProducts = ((skills || []).length) + ((agents || []).length);

  return {
    success: true,
    data: {
      total_downloads: totalDownloads,
      total_products: totalProducts,
      eligibility: {
        excellent: {
          required_downloads: 50,
          required_products: 5,
          current_downloads: totalDownloads,
          current_products: totalProducts,
          eligible: totalDownloads >= 50 || totalProducts >= 5,
        },
        master: {
          required_downloads: 200,
          required_products: 20,
          current_downloads: totalDownloads,
          current_products: totalProducts,
          eligible: totalDownloads >= 200 || totalProducts >= 20,
        },
      },
    },
  };
}

// 申请律师认证
export async function submitLawyerVerification(params: {
  bar_number: string;
  law_firm: string;
  specialty?: string[];
  certificate_url?: string;
  id_card_url?: string;
}): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const supabase = await createCompatClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "请先登录" };
  }

  if (user.role !== "creator" && user.role !== "superadmin") {
    return { success: false, error: "只有创作者可以申请律师认证" };
  }

  if (!params.bar_number || !params.law_firm) {
    return { success: false, error: "请填写执业证号和律所信息" };
  }

  // 检查是否已有待审核或已通过的律师认证
  const { data: existing } = await supabase
    .from("lawyer_verification_applications")
    .select("id")
    .eq("user_id", user.id)
    .in("status", ["pending", "approved"])
    .single();

  if (existing) {
    return { success: false, error: "您已有待审核或已通过的律师认证申请" };
  }

  const { data, error } = await supabase
    .from("lawyer_verification_applications")
    .insert({
      user_id: user.id,
      bar_number: params.bar_number,
      law_firm: params.law_firm,
      specialty: params.specialty || [],
      certificate_url: params.certificate_url,
      id_card_url: params.id_card_url,
    });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

// 获取律师认证申请状态
export async function getLawyerVerificationStatus(): Promise<{
  success: boolean;
  data?: unknown;
  error?: string;
}> {
  const supabase = await createCompatClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "请先登录" };
  }

  const { data, error } = await supabase
    .from("lawyer_verification_applications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    return { success: false, error: error.message };
  }

  return { success: true, data: data || null };
}

// 检查用户是否是创作者
export async function checkIsCreator(): Promise<boolean> {
  const supabase = await createCompatClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role === "creator" || profile?.role === "superadmin";
}
