"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { defaultHomePathForRole } from "@/lib/auth/default-home";
import { api, ApiError, clearSessionCache } from "@/lib/api/client";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { Logo } from "@/components/common/logo";

/**
 * 登录页 v3.0 — UI预演方案
 * 视觉方向：琥珀咖啡色系 + 思源宋体
 * 页面结构：左侧品牌区 + 右侧表单区
 */

const HERO_IMAGE = "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1920&q=80";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await api.auth.login(email, password);

      const redirectPath = defaultHomePathForRole(result.user?.role);

      clearSessionCache();
      setLoading(false);
      router.push(redirectPath);
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

  async function handleWechatLogin() {
    setError(null);
    setOauthLoading('wechat');
    try {
      const result = await api.auth.wechatAuthorize();
      sessionStorage.setItem('oauth_state', result.state);
      sessionStorage.setItem('oauth_provider', 'wechat');
      window.location.href = result.auth_url;
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("微信登录暂时不可用，请使用其他方式登录");
      }
      setOauthLoading(null);
    }
  }

  async function handleAlipayLogin() {
    setError(null);
    setOauthLoading('alipay');
    try {
      const result = await api.auth.alipayAuthorize();
      sessionStorage.setItem('oauth_state', result.state);
      sessionStorage.setItem('oauth_provider', 'alipay');
      window.location.href = result.auth_url;
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("支付宝登录暂时不可用，请使用其他方式登录");
      }
      setOauthLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0] flex">
      {/* ========== 左侧品牌区（登录页背景：图书馆书架） ========== */}
      <div className="brand-panel">
        {/* 背景图 */}
        <div className="brand-bg">
          <img
            src={HERO_IMAGE}
            alt="法律书架背景"
            className="animate-slow-zoom"
          />
          <div className="brand-overlay" />
        </div>

        {/* 内容 */}
        <div className="brand-content">
          {/* 顶部标识 */}
          <div className="brand-eyebrow">
            <span className="brand-eyebrow-dot" />
            面向法律行业的灵感与实践平台
          </div>

          <div className="brand-logo login-brand-panel-mark">
            <Logo size="hero" tone="hero" link={false} />
          </div>

          {/* 标题 */}
          <h1 className="brand-title">
            连接灵感、方法
            <br />
            与专业服务
          </h1>

          <p className="brand-slogan marketing-subtitle--kai">
            登律植，聚同道，拓专业新局
          </p>
        </div>
      </div>

      {/* ========== 右侧表单区 ========== */}
      <div className="form-panel">
        {/* 标题 */}
        <div className="form-header">
          <h2 className="form-title">欢迎回来</h2>
          <p className="form-subtitle">
            还没有账号？
            <Link href="/register">立即注册</Link>
          </p>
          <p className="mt-2 text-sm text-[#5D4E3A]">
            <Link href="/" className="font-semibold text-[#5C4033] hover:text-[#B8860B]">
              返回主页
            </Link>
          </p>
        </div>

        {/* 表单 */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* 邮箱 */}
          <div className="form-group">
            <label className="form-label">邮箱</label>
            <div className="input-wrapper">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9A8B78]" />
              <input
                type="text"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
                placeholder="your@email.com"
                className="form-input"
              />
            </div>
          </div>

          {/* 密码 */}
          <div className="form-group">
            <label className="form-label">密码</label>
            <div className="input-wrapper">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9A8B78]" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="请输入密码"
                className="form-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="input-action"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* 记住 & 忘记 */}
          <div className="form-row">
            <label className="remember-me">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-5 w-5 accent-[#D4A574]"
              />
              <span>记住我</span>
            </label>
            <Link href="/forgot-password" className="forgot-link">
              忘记密码？
            </Link>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="form-error-box">
              {error}
            </div>
          )}

          {/* 登录按钮 */}
          <button
            type="submit"
            disabled={loading}
            className="btn-slide primary"
          >
            {loading ? "登录中..." : "登录"}
          </button>
        </form>

        {/* 分隔线 */}
        <div className="divider">
          <div className="divider-line" />
          <span className="divider-text">其他登录方式</span>
          <div className="divider-line" />
        </div>

        {/* 第三方登录 */}
        <div className="social-login">
          <button
            onClick={handleWechatLogin}
            disabled={oauthLoading !== null}
            className="social-btn"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163-.13.295-.29.295a.326.326 0 01-.214-.084l-1.659-1.14a.864.864 0 01-.489-.771l-.065-.318c-.457.18-.957.286-1.48.286a2.894 2.894 0 000 5.788 2.894 2.894 0 005.788 0c1.658-.018 3.015-1.373 3.015-3.073 0-.956-.43-1.773-1.253-2.436a.592.592 0 01-.278-.524c0-.098.024-.189.065-.264.162-.285.243-.617.243-.959 0-.763-.36-1.473-.944-1.941a.584.584 0 01-.254-.473c0-.185.085-.358.231-.472.394-.307.64-.77.64-1.298 0-.396-.158-.783-.44-1.076a.584.584 0 01-.129-.304c0-.177.08-.34.208-.454zM5.346 7.241c-.457 0-.825.372-.825.828 0 .456.37.828.826.828.456 0 .824-.372.824-.828 0-.456-.368-.828-.824-.828zm5.193 2.19a.832.832 0 110 1.666.832.832 0 010-1.666z"/>
            </svg>
            微信登录
          </button>
          <button
            onClick={handleAlipayLogin}
            disabled={oauthLoading !== null}
            className="social-btn"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.555 4.943c-1.44.06-2.886.51-3.996 1.296-1.056.747-1.8 1.806-2.16 3.042-.288.99-.216 2.016.24 2.87.456.87 1.224 1.566 2.172 1.98.924.402 2.028.498 3.06.24.984-.246 1.854-.78 2.484-1.44.594-.63.954-1.398 1.056-2.196.096-.774-.006-1.56-.36-2.232-.36-.66-.96-1.188-1.704-1.512-.756-.324-1.62-.396-2.448-.24l-.672.162c-.33.078-.642.168-.96.276-.318.108-.666.276-.978.438l-.072-.036c.048-.402.138-.78.294-1.152.15-.36.372-.702.6-1.014.228-.312.504-.6.804-.852.312-.252.666-.462 1.032-.618.378-.162.774-.258 1.188-.306.426-.048.846-.024 1.266.054.42.078.816.228 1.176.414.36.186.684.42.96.69.276.27.492.57.654.9.15.312.24.66.264 1.02.024.36-.036.72-.174 1.056-.138.324-.366.618-.654.864-.3.234-.654.42-1.038.534a5.46 5.46 0 01-1.212.21c-.432.024-.858 0-1.278-.054l-.672-.114c-.258-.042-.504-.102-.744-.168-.24-.066-.48-.138-.714-.222a9.74 9.74 0 01-.708-.288l-.072-.036c.012.042.024.078.042.114.018.024.048.066.078.096l.024-.024z"/>
            </svg>
            手机号登录
          </button>
        </div>

        <p className="form-footer">
          登录即表示同意 <Link href="/terms">《服务条款》</Link> 和 <Link href="/privacy">《隐私政策》</Link>
        </p>
      </div>
    </div>
  );
}
