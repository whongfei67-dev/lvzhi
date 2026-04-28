"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  displayName?: string;
  email?: string;
  userId?: string;
  role?: string;
};

export function AdminAccountMenu({ displayName, email, userId, role }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accountLabel = displayName || email || userId || "管理员";

  async function onLogout() {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // ignore network errors, still force route jump
    } finally {
      setLoading(false);
      router.replace("/login?next=/review");
      router.refresh();
    }
  }

  return (
    <div style={{ display: "grid", justifyItems: "end", gap: 4 }}>
      <div style={{ fontSize: 13, color: "#7c6a56" }}>
        {accountLabel} ({role || "admin"})
      </div>
      <button
        type="button"
        onClick={() => void onLogout()}
        disabled={loading}
        style={{
          border: "1px solid rgba(212,165,116,0.35)",
          background: "#fff",
          color: "#6b5b4d",
          fontSize: 12,
          lineHeight: "18px",
          borderRadius: 8,
          padding: "4px 10px",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "退出中..." : "退出登录"}
      </button>
      {error ? <div style={{ color: "#b63f2e", fontSize: 11 }}>{error}</div> : null}
    </div>
  );
}
