"use server";

import { createCompatClient } from "@/lib/supabase/compat-client";

/**
 * 知识产权保护相关 Server Actions
 */

// 获取知识产权申请列表
export async function getIPApplications(status?: string): Promise<{
  success: boolean;
  data?: unknown[];
  error?: string;
}> {
  const supabase = await createCompatClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "请先登录" };
  }

  let query = supabase.from("ip_protection_applications").select("*");

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

// 提交知识产权保护申请
export async function submitIPApplication(params: {
  product_id: string;
  product_type: 'skill' | 'agent';
  application_type: 'copyright' | 'trademark' | 'patent';
  description?: string;
  evidence_urls?: string[];
}): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const supabase = await createCompatClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "请先登录" };
  }

  if (user.role !== "creator" && user.role !== "superadmin") {
    return { success: false, error: "只有创作者可以申请知识产权保护" };
  }

  if (!params.product_id || !params.product_type || !params.application_type) {
    return { success: false, error: "缺少必要参数" };
  }

  // 验证产品是否属于当前创作者
  const tableName = params.product_type === 'skill' ? 'skills' : 'agents';
  const { data: product, error: productError } = await supabase
    .from(tableName)
    .select("id")
    .eq("id", params.product_id)
    .eq("creator_id", user.id)
    .single();

  if (productError || !product) {
    return { success: false, error: "产品不存在或您不是该产品的创作者" };
  }

  // 检查是否已有待审核的申请
  const { data: existing, error: existingError } = await supabase
    .from("ip_protection_applications")
    .select("id")
    .eq("product_id", params.product_id)
    .in("status", ["pending", "approved"])
    .single();

  if (existing) {
    return { success: false, error: "该产品已有待审核或已通过的知识产权申请" };
  }

  const { data, error } = await supabase
    .from("ip_protection_applications")
    .insert({
      user_id: user.id,
      product_id: params.product_id,
      product_type: params.product_type,
      application_type: params.application_type,
      description: params.description,
      evidence_urls: params.evidence_urls || [],
    });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

// 撤回知识产权申请
export async function withdrawIPApplication(applicationId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createCompatClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "请先登录" };
  }

  const { error } = await supabase
    .from("ip_protection_applications")
    .update({ status: "withdrawn" })
    .eq("id", applicationId)
    .eq("user_id", user.id)
    .eq("status", "pending");

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// 获取可申请知产保护的产品列表
export async function getIPProducts(): Promise<{
  success: boolean;
  data?: { skills: unknown[]; agents: unknown[] };
  error?: string;
}> {
  const supabase = await createCompatClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "请先登录" };
  }

  // 获取创作者的产品，排除已有待审核或已通过的申请
  const { data: skills, error: skillsError } = await supabase
    .from("skills")
    .select("id, name")
    .eq("creator_id", user.id)
    .eq("status", "active");

  const { data: agents, error: agentsError } = await supabase
    .from("agents")
    .select("id, name")
    .eq("creator_id", user.id)
    .eq("status", "active");

  if (skillsError || agentsError) {
    return { success: false, error: "获取产品列表失败" };
  }

  return {
    success: true,
    data: {
      skills: skills || [],
      agents: agents || [],
    },
  };
}
