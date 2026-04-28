import { cookies } from "next/headers";

type MePayload = {
  id: string;
  user_id?: string;
  role: string;
  display_name?: string;
  email?: string;
};

function apiBase() {
  return (process.env.ADMIN_API_PROXY_TARGET || process.env.API_PROXY_TARGET || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4000").replace(/\/$/, "");
}

export async function getAdminSessionServer(): Promise<MePayload | null> {
  const token = (await cookies()).get("lvzhi_access_token")?.value;
  if (!token) return null;

  const response = await fetch(`${apiBase()}/api/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Cookie: `lvzhi_access_token=${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) return null;
  const payload = (await response.json().catch(() => null)) as { code?: number; data?: MePayload } | null;
  if (!payload || payload.code !== 0 || !payload.data) return null;
  return payload.data;
}

export function isAdminRole(role: string | undefined): boolean {
  return role === "admin" || role === "superadmin";
}

export function isSuperAdminRole(role: string | undefined): boolean {
  return role === "superadmin";
}
