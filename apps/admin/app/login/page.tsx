"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { preferTradForBrush } from "@/lib/brush-text";

const ADMIN_LOGIN_COAST_BG =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=2200&q=80";

export default function AdminLoginPage() {
  const router = useRouter();
  const brandText = useMemo(() => preferTradForBrush("律植"), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const nextPath = useMemo(() => {
    if (typeof window === "undefined") return "/review";
    return new URLSearchParams(window.location.search).get("next") || "/review";
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const payload = (await response.json().catch(() => null)) as { code?: number; message?: string } | null;
      if (!response.ok || !payload || payload.code !== 0) {
        throw new Error(payload?.message || "登录失败");
      }

      router.replace(nextPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-bg-shell">
      <div className="admin-login-bg-media" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ADMIN_LOGIN_COAST_BG} alt="" />
        <div className="admin-login-bg-overlay" />
      </div>
      <div className="admin-login-center">
        <h1
          className="admin-login-main-title"
          style={{ margin: 0 }}
          aria-label="律植品牌字标"
        >
          {brandText}
        </h1>
      <form className="admin-card" style={{ width: 420 }} onSubmit={onSubmit}>
        <h2 style={{ marginTop: 0, marginBottom: 8, fontSize: 20 }}>管理后台登录</h2>
        <p style={{ marginTop: 0, marginBottom: 16, color: "#7c6a56", fontSize: 13 }}>
          仅管理员与超管可进入后台。
        </p>
        <div className="admin-grid" style={{ gap: 10 }}>
          <input
            className="admin-input"
            type="email"
            placeholder="管理员邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="admin-input"
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error ? <div style={{ color: "#b63f2e", fontSize: 13 }}>{error}</div> : null}
          <button className="admin-btn primary" type="submit" disabled={loading}>
            {loading ? "登录中..." : "登录"}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}
