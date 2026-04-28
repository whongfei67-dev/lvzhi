"use server";

import { createCompatClient } from "@/lib/supabase/compat-client";

export async function submitPatentRequest(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createCompatClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "未登录" };

  const { error } = await supabase.from("platform_inquiries").insert({
    user_id: user.id,
    type: "patent_request",
    status: "pending",
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}
