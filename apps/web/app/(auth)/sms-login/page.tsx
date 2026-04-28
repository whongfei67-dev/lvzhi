"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { defaultHomePathForRole } from "@/lib/auth/default-home";
import { api, ApiError, clearSessionCache, storage } from "@/lib/api/client";
import { Logo } from "@/components/common/logo";
import { Phone, MessageSquare, Loader2 } from "lucide-react";

export default function SmsLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 倒计时
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 发送验证码
  async function handleSendCode() {
    if (!phone || phone.length !== 11) {
      setError("请输入正确的手机号");
      return;
    }

    setSending(true);
    setError(null);

    try {
      await api.auth.sendSmsCode(phone);
      setCodeSent(true);
      setCountdown(60);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("发送失败，请稍后重试");
      }
    } finally {
      setSending(false);
    }
  }

  // 登录
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    if (!code || code.length !== 6) {
      setError("请输入6位验证码");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await api.auth.smsLogin(phone, code);
      clearSessionCache();
      router.push(defaultHomePathForRole(result.user?.role));
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("登录失败，请稍后重试");
      }
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[rgba(212,165,116,0.08)]">
      <div className="mx-auto grid min-h-screen max-w-7xl items-center px-6 py-10 lg:grid-cols-2 lg:px-8">

        {/* Left: branding */}
        <div className="hidden pr-10 lg:block">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(212,165,116,0.15)] bg-[rgba(212,165,116,0.15)] px-4 py-1.5 text-sm font-medium text-[#B8860B]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D4A574]" />
              律植 · 面向法律行业的灵感与实践平台
            </div>
            <h1 className="mt-6 text-5xl font-bold tracking-tight text-[#18261F]">
              手机号快捷登录
              <span className="block text-[#D4A574]">
                安全便捷无需密码
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-[#5D4E3A]">
              一键获取验证码，即可快速登录律植。无需记忆密码，轻松开启灵感与实践之旅。
            </p>
            <div className="mt-10 space-y-4">
              {[
                { icon: Phone, title: "中国大陆手机号", desc: "支持 +86 大陆手机号" },
                { icon: MessageSquare, title: "短信验证码", desc: "实时接收6位验证码" },
                { icon: Loader2, title: "快速登录", desc: "一步完成身份验证" },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-4 rounded-3xl border border-[rgba(212,165,116,0.15)] bg-white p-5 shadow-sm">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[rgba(212,165,116,0.15)]">
                    <Icon className="h-5 w-5 text-[#D4A574]" />
                  </div>
                  <div>
                    <div className="font-semibold text-[#18261F]">{title}</div>
                    <div className="mt-1 text-sm text-[#5D4E3A]">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: form */}
        <div className="mx-auto w-full max-w-md">
          <div className="rounded-[32px] border border-[rgba(212,165,116,0.15)] bg-white p-8 shadow-sm lg:p-10">
            <div className="mb-8">
              <Logo size="form" tone="light" />
              <div className="mt-2 text-sm text-[#5D4E3A]">手机号快捷登录</div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {/* 手机号 */}
              <div>
                <label className="mb-2 block text-sm font-medium text-[#18261F]">手机号</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#9A8B78]">+86</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    required
                    placeholder="请输入手机号"
                    className="h-12 w-full rounded-2xl border border-[rgba(212,165,116,0.15)] bg-[rgba(212,165,116,0.08)] pl-12 pr-4 text-sm text-[#18261F] outline-none placeholder:text-[#9A8B78] transition-all focus:border-[#D4A574] focus:ring-2 focus:ring-[#D4A574]/10"
                  />
                </div>
              </div>

              {/* 验证码 */}
              <div>
                <label className="mb-2 block text-sm font-medium text-[#18261F]">验证码</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    placeholder="请输入6位验证码"
                    className="h-12 flex-1 rounded-2xl border border-[rgba(212,165,116,0.15)] bg-[rgba(212,165,116,0.08)] px-4 text-sm text-[#18261F] outline-none placeholder:text-[#9A8B78] transition-all focus:border-[#D4A574] focus:ring-2 focus:ring-[#D4A574]/10"
                  />
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={sending || countdown > 0}
                    className="h-12 shrink-0 rounded-2xl border border-[#D4A574] bg-[#D4A574] px-4 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#B8860B] transition-colors"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : countdown > 0 ? (
                      `${countdown}s`
                    ) : (
                      '获取验证码'
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !codeSent || code.length !== 6}
                className="mt-2 w-full rounded-2xl bg-[#D4A574] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#B8860B] disabled:opacity-50"
              >
                {loading ? "登录中..." : "登录"}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-between text-sm text-[#5D4E3A]">
              <Link href="/login" className="hover:text-[#D4A574]">
                密码登录
              </Link>
              <Link href="/register" className="hover:text-[#D4A574]">
                注册账号
              </Link>
            </div>

            {/* 提示 */}
            <div className="mt-6 rounded-2xl bg-[rgba(212,165,116,0.15)] p-4">
              <p className="text-xs text-[#5D4E3A] leading-relaxed">
                未注册账号将自动创建新账号。登录即表示同意
                <Link href="/terms" className="text-[#D4A574] hover:underline">《服务条款》</Link>
                和
                <Link href="/privacy" className="text-[#D4A574] hover:underline">《隐私政策》</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
