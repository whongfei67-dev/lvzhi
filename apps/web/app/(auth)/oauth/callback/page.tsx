"use client";

import { useEffect, useState, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { defaultHomePathForRole } from "@/lib/auth/default-home";
import { Logo } from "@/components/common/logo";
import { Loader2 } from "lucide-react";

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sp = useMemo(() => searchParams ?? new URLSearchParams(), [searchParams]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("正在处理登录...");

  useEffect(() => {
    // 从 URL 获取 OAuth 返回的参数
    const accessToken = sp.get('access_token');
    const refreshToken = sp.get('refresh_token');
    const userId = sp.get('user_id');
    const displayName = sp.get('display_name');
    const role = sp.get('role');
    const isNewUser = sp.get('is_new_user') === 'true';
    const errorParam = sp.get('error');
    const provider = sp.get('provider');

    // 检查错误
    if (errorParam) {
      const errorMessages: Record<string, string> = {
        'missing_code': '授权码缺失，请重试',
        'missing_state': '安全验证失败，请重试',
        'token_failed': '获取访问令牌失败，请重试',
        'userinfo_failed': '获取用户信息失败，请重试',
        'sdk_not_configured': '第三方登录暂不可用',
        'login_failed': '登录失败，请重试',
      };
      setError(errorMessages[errorParam] || '授权登录失败，请重试');
      return;
    }

    // 检查必要参数
    if (!accessToken || !userId) {
      setError("登录信息不完整，请重试");
      return;
    }

    setStatus(provider === 'wechat' ? "微信登录成功，正在跳转..." : "支付宝登录成功，正在跳转...");

    // 构建用户对象
    const user = {
      id: userId,
      display_name: displayName || "用户",
      role: role || "client",
      verified: true,
    };

    // Token 已通过 HttpOnly Cookie 设置，无需 localStorage

    // 清除临时存储的 OAuth 状态
    sessionStorage.removeItem("oauth_state");
    sessionStorage.removeItem("oauth_provider");

    const redirectUrl = isNewUser ? "/profile" : defaultHomePathForRole(user.role);

    // 短暂显示成功信息后跳转
    setTimeout(() => {
      router.push(redirectUrl);
      router.refresh();
    }, 500);

  }, [sp, router]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.10),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(99,102,241,0.10),_transparent_22%)] bg-[rgba(212,165,116,0.08)] text-[#2C2416] flex items-center justify-center">
      <div className="rounded-[32px] border border-[rgba(212,165,116,0.25)] bg-white p-8 shadow-sm max-w-md w-full mx-4">
        <div className="text-center">
          <div className="flex justify-center">
            <Logo size="form" tone="light" ariaLabel="律植 · 返回首页" />
          </div>

          {error ? (
            <>
              <div className="mb-4">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                  <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
              <button
                onClick={() => router.push("/login")}
                className="w-full rounded-2xl bg-gradient-to-r from-[#D4A574] to-[#B8860B] px-4 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              >
                返回登录页
              </button>
            </>
          ) : (
            <>
              <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-[#D4A574]" />
              <p className="text-[#5D4E3A] mb-2">{status}</p>
              {status.includes("跳转") && (
                <p className="text-sm text-[#9A8B78]">即将跳转到用户中心...</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[rgba(212,165,116,0.08)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#D4A574]" />
          <p className="text-[#5D4E3A]">加载中...</p>
        </div>
      </div>
    }>
      <OAuthCallbackContent />
    </Suspense>
  );
}
