"use client";

import { useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api/client";
import { Logo } from "@/components/common/logo";
import { Mail, CheckCircle, AlertCircle } from "lucide-react";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1920&q=80";

export default function ForgotPasswordPage() {
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

  return (
    <div className="min-h-screen bg-[#FFF8F0] flex">
      <div className="brand-panel">
        <div className="brand-bg">
          <img src={HERO_IMAGE} alt="法律文书背景" className="animate-slow-zoom" />
          <div className="brand-overlay" />
        </div>
        <div className="brand-content">
          <div className="brand-eyebrow">
            <span className="brand-eyebrow-dot" />
            账号安全中心
          </div>
          <div className="brand-logo login-brand-panel-mark">
            <Logo size="hero" tone="hero" link={false} />
          </div>
          <h1 className="brand-title">
            安全重置密码
            <br />
            快速恢复登录
          </h1>
          <p className="brand-slogan marketing-subtitle--kai">
            输入注册邮箱，我们会发送密码重置链接
          </p>
        </div>
      </div>

      <div className="form-panel">
        <div className="form-header">
          <h2 className="form-title">找回密码</h2>
          <p className="form-subtitle">
            想起密码了？<Link href="/login">返回登录</Link>
          </p>
        </div>

        {!sent ? (
          <>
            <p className="mb-6 text-sm text-[#5D4E3A] leading-relaxed">
              输入你的注册邮箱，我们将发送重置密码链接到你的邮箱。
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-group">
                <label className="form-label">邮箱</label>
                <div className="input-wrapper">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9A8B78]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="your@email.com"
                    className="form-input"
                  />
                </div>
              </div>

              {error && (
                <div className="form-error-box">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-slide primary w-full">
                {loading ? "发送中..." : "发送重置链接"}
              </button>
            </form>
          </>
        ) : (
          <div className="space-y-5 rounded-2xl border border-[#D9E8E2] bg-[#F4FBF8] p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-[#E9FAF4] p-2">
                <CheckCircle className="h-6 w-6 text-[#2FA863]" />
              </div>
              <h3 className="text-lg font-semibold text-[#26363D]">邮件已发送</h3>
            </div>
            <p className="text-sm text-[#55656D] leading-7">
              若该邮箱已注册，我们已向{" "}
              <span className="font-medium text-[#26363D]">{email}</span>{" "}
              发送重置链接，请前往邮箱查收。
            </p>
            <div className="flex gap-3">
              <Link href="/login" className="btn-slide primary flex-1 text-center">
                返回登录
              </Link>
              <button
                onClick={() => {
                  setSent(false);
                  setEmail("");
                }}
                className="btn-slide secondary flex-1"
              >
                重新发送
              </button>
            </div>
          </div>
        )}

        <p className="form-footer">
          如仍无法找回，请联系平台客服或管理员协助处理账号安全问题。
        </p>
      </div>
    </div>
  );
}