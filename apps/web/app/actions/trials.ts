"use server";

import { createCompatClient } from "@/lib/supabase/compat-client";

/**
 * 试用邀请相关 Server Actions
 */

// 获取试用邀请列表
export async function getTrialInvitations(type: 'sent' | 'received' = 'sent'): Promise<{
  success: boolean;
  data?: unknown[];
  error?: string;
}> {
  const supabase = await createCompatClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "请先登录" };
  }

  const { data, error } = await supabase.from("trial_invitations").select("*");

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

// 创建试用邀请
export async function createTrialInvitation(params: {
  to_user_id: string;
  product_id: string;
  product_type: 'skill' | 'agent';
  message?: string;
  expires_days?: number;
}): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const supabase = await createCompatClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "请先登录" };
  }

  if (user.role !== "creator" && user.role !== "superadmin") {
    return { success: false, error: "只有创作者可以发送试用邀请" };
  }

  if (!params.to_user_id || !params.product_id || !params.product_type) {
    return { success: false, error: "缺少必要参数" };
  }

  const { data, error } = await supabase.from("trial_invitations").insert({
    from_user_id: user.id,
    to_user_id: params.to_user_id,
    product_id: params.product_id,
    product_type: params.product_type,
    message: params.message,
    expires_at: new Date(Date.now() + (params.expires_days || 7) * 24 * 60 * 60 * 1000),
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

// 响应试用邀请
export async function respondToTrialInvitation(
  invitationId: string,
  status: 'accepted' | 'rejected',
  responseMessage?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createCompatClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "请先登录" };
  }

  const { error } = await supabase
    .from("trial_invitations")
    .update({
      status,
      response_message: responseMessage,
      responded_at: new Date().toISOString(),
    })
    .eq("id", invitationId)
    .eq("to_user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// 取消试用邀请
export async function cancelTrialInvitation(
  invitationId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createCompatClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "请先登录" };
  }

  const { error } = await supabase
    .from("trial_invitations")
    .delete()
    .eq("id", invitationId)
    .eq("from_user_id", user.id)
    .eq("status", "pending");

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// 获取可发起试用的产品列表
export async function getTrialProducts(): Promise<{
  success: boolean;
  data?: { skills: unknown[]; agents: unknown[] };
  error?: string;
}> {
  const supabase = await createCompatClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "请先登录" };
  }

  // 获取创作者的 Skills
  const { data: skills, error: skillsError } = await supabase
    .from("skills")
    .select("id, name")
    .eq("creator_id", user.id)
    .eq("status", "active");

  // 获取创作者的智能体
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
