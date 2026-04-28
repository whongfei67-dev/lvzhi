"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Logo } from "@/components/common/logo";
import { api } from "@/lib/api/client";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [exchanging, setExchanging] = useState(true);

  useEffect(() => {
    const code = searchParams?.get("code");
    if (!code) {
      setError("重置链接无效，请重新获取");
      setExchanging(false);
      return;
    }

    // 验证重置码
    api.auth.resetPassword("", code, "").then(() => {
      setReady(true);
      setExchanging(false);
    }).catch((err) => {
      setError("重置链接已过期，请重新获取");
      setExchanging(false);
    });
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("两次输入的密码不一致");
      return;
    }
    if (password.length < 8) {
      setError("密码长度至少 8 位");
      return;
    }
    setError(null);
    setLoading(true);

    const code = searchParams?.get("code") || "";
    const email = searchParams?.get("email") || "";

    try {
      await api.auth.resetPassword(email, code, password);
      router.push("/login?reset=success");
    } catch (err) {
      setError("密码重置失败，请重新获取重置链接");
      setLoading(false);
    }
  }

  if (exchanging) {
    return (
      <div className="text-center space-y-3 py-4">
        <div className="text-4xl">🔗</div>
        <p className="text-sm font-medium text-[#2C2416]">正在验证重置链接…</p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="text-center space-y-3 py-4">
        <div className="text-4xl">❌</div>
        <p className="text-sm font-medium text-[#2C2416]">{error}</p>
        <a href="/forgot-password" className="inline-block text-sm font-medium text-[#D4A574]">
          重新获取重置邮件
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
      <input type="hidden" autoComplete="username" />
      <div>
        <label className="mb-2 block text-sm font-medium text-[#D4A574]">新密码</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          placeholder="至少 8 位"
          className="h-12 w-full rounded-2xl border border-[rgba(212,165,116,0.25)] bg-[rgba(212,165,116,0.08)] px-4 text-sm outline-none placeholder:text-[#9A8B78] focus:border-blue-400"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-[#D4A574]">确认新密码</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          autoComplete="new-password"
          placeholder="再次输入新密码"
          className="h-12 w-full rounded-2xl border border-[rgba(212,165,116,0.25)] bg-[rgba(212,165,116,0.08)] px-4 text-sm outline-none placeholder:text-[#9A8B78] focus:border-blue-400"
        />
      </div>
      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="mt-2 w-full rounded-2xl bg-gradient-to-r from-[#D4A574] to-[#B8860B] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {loading ? "保存中..." : "保存新密码"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[rgba(212,165,116,0.08)] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="rounded-[32px] border border-[rgba(212,165,116,0.25)] bg-white p-6 shadow-sm lg:p-10">
          <div className="mb-8">
            <Logo size="form" tone="light" />
            <div className="mt-2 text-sm text-[#9A8B78]">设置新密码</div>
          </div>
          <Suspense>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
