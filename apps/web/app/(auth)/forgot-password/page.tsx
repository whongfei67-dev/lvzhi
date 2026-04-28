"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api/client";
import { Logo } from "@/components/common/logo";
import { Mail, CheckCircle, AlertCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.auth.forgotPassword(email);
      setSent(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("发送失败，请稍后重试");
      }
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center px-6">
        <div className="w-full max-w-md text-center space-y-6 rounded-2xl border border-[#DFE9EE] bg-white p-10 shadow-sm">
          <div className="flex items-center justify-center">
            <div className="rounded-full bg-[#E9FAF4] p-4">
              <CheckCircle className="h-12 w-12 text-[#9FE4D1]" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-[#26363D]">发送成功</h1>
          <p className="text-[#55656D] leading-7">
            我们已向 <span className="font-medium text-[#26363D]">{email}</span> 发送了重置密码链接，请查收邮件并按照提示重置密码。
          </p>
          <Link
            href="/login"
            className="block w-full rounded-2xl bg-[#5C9EEB] py-3 text-sm font-semibold text-white text-center hover:bg-[#4F93E3] transition-colors"
          >
            返回登录
          </Link>
          <button
            onClick={() => { setSent(false); setEmail(""); }}
            className="text-sm text-[#55656D] hover:text-[#5C9EEB]"
          >
            没收到？重新发送
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-[#DFE9EE] bg-white p-8 shadow-sm lg:p-10">
          <div className="mb-8">
            <Logo size="form" tone="light" />
            <div className="mt-2 text-sm text-[#55656D]">重置你的密码</div>
          </div>

          <p className="mb-6 text-sm text-[#55656D] leading-relaxed">
            输入你的注册邮箱，我们将发送重置密码链接到你的邮箱。
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#26363D]">邮箱</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9BA6AF]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className="h-12 w-full rounded-2xl border border-[#DFE9EE] bg-[#FAFBFC] pl-12 pr-4 text-sm text-[#26363D] outline-none placeholder:text-[#55656D] transition-all focus:border-[#5C9EEB] focus:ring-2 focus:ring-[#5C9EEB]/10"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-500">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-[#5C9EEB] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50 hover:bg-[#4F93E3] transition-colors"
            >
              {loading ? "发送中..." : "发送重置链接"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[#55656D]">
            想起密码了？
            <Link href="/login" className="ml-1 font-medium text-[#5C9EEB]">
              返回登录
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}