"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, AlertTriangle, Eye, EyeOff, User, Wand2, Check, ArrowRight } from "lucide-react";
import { api, ApiError } from "@/lib/api/client";
import { Logo } from "@/components/common/logo";

/**
 * 注册页 v3.0 — UI预演方案
 * 视觉方向：琥珀咖啡色系 + 思源宋体
 * 页面结构：左侧品牌区 + 右侧表单区
 */

const HERO_IMAGE = "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1920&q=80";

// 注册角色选项
type RegisterRole = "client" | "creator";

const roleOptions: { id: RegisterRole; label: string; desc: string }[] = [
  {
    id: "client",
    label: "客户",
    desc: "发现灵感、使用 Skills、参与社区讨论、发出合作邀请",
  },
  {
    id: "creator",
    label: "创作者",
    desc: "发布 Skills、获得收益、学习创作方法、连接真实需求",
  },
];

const DISCLAIMER_ITEMS = [
  "律植平台不提供任何形式的法律服务，平台上的所有内容及服务均由创作者独立发布。",
  "平台不对内容质量及咨询内容的准确性、完整性或适用性作出保证，用户应自行判断并承担相应风险。",
  "通过平台产生的任何咨询类服务的法律责任，由提供咨询的创作者自行承担，与平台无关。",
  "如需处理重大法律事务，建议通过正规渠道委托具有执业资质的律师提供专业服务。",
];

const REGISTER_BENEFITS = [
  { title: "发现灵感", desc: "按场景、领域快速找到适合的法律灵感与实践方法" },
  { title: "发布作品", desc: "支持免费版、试用版与商用版，自主选择成长路径" },
  { title: "参与社区", desc: "讨论场景边界、实践优化与真实案例" },
  { title: "建立影响", desc: "沉淀你的创作记录，展示专业能力与影响力" },
];

function validateEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return { valid: true, message: "" };
  if (!emailRegex.test(email)) return { valid: false, message: "请输入有效的邮箱格式" };
  return { valid: true, message: "" };
}

function calculatePasswordStrength(password: string) {
  if (!password) return { score: 0, label: "", color: "", bgColor: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  const level = Math.min(3, Math.ceil(score * 0.75));
  if (level === 1) return { score: 1, label: "弱", color: "text-[#D94D4D]", bgColor: "bg-[#D94D4D]" };
  if (level === 2) return { score: 2, label: "中等", color: "text-[#D4A574]", bgColor: "bg-[#D4A574]" };
  return { score: 3, label: "强", color: "text-[#2FA863]", bgColor: "bg-[#2FA863]" };
}

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [selectedRole, setSelectedRole] = useState<RegisterRole>("client");
  const [agreed, setAgreed] = useState(false);
  const [disclaimerRead, setDisclaimerRead] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const passwordStrength = useMemo(() => calculatePasswordStrength(password), [password]);
  const emailValidation = useMemo(() => validateEmail(email), [email]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!disclaimerRead) { setError("请阅读并确认《风险告知与责任声明》"); return; }
    if (!agreed) { setError("请阅读并同意服务条款与隐私政策"); return; }
    setError(null);
    setLoading(true);

    try {
      await api.auth.register({
        email,
        password,
        display_name: displayName,
        role: selectedRole,
      });
      router.push('/login');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("注册失败，请稍后重试");
      }
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0] flex">
      {/* ========== 左侧品牌区（注册页背景：咖啡馆讨论） ========== */}
      <div className="brand-panel">
        {/* 背景图 */}
        <div className="brand-bg">
          <img
            src={HERO_IMAGE}
            alt="咖啡馆讨论背景"
            className="animate-slow-zoom"
          />
          <div className="brand-overlay" />
        </div>

        {/* 内容 */}
        <div className="brand-content">
          {/* 顶部标识 */}
          <div className="brand-eyebrow">
            <span className="brand-eyebrow-dot" />
            加入律植
          </div>

          <div className="brand-logo">
            <Logo size="hero" tone="hero" link={false} />
          </div>

          {/* 标题 */}
          <h1 className="brand-title">
            让灵感与方法
            <br />
            在实践中生长
          </h1>

          <p className="brand-slogan marketing-subtitle--kai">
            以法相聚，因智同行，期待你的加入
          </p>

          {/* 好处卡片 */}
          <div className="brand-cards">
            {REGISTER_BENEFITS.map((benefit) => (
              <div key={benefit.title} className="brand-card">
                <div className="brand-card-icon">
                  <ArrowRight className="w-4 h-4" />
                </div>
                <div>
                  <h4>{benefit.title}</h4>
                  <p>{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 统计数据 */}
          <div className="brand-stats">
            <div>
              <div className="brand-stat-value">10,000+</div>
              <div className="brand-stat-label">注册用户</div>
            </div>
            <div>
              <div className="brand-stat-value">500+</div>
              <div className="brand-stat-label">认证律师</div>
            </div>
            <div>
              <div className="brand-stat-value">2,000+</div>
              <div className="brand-stat-label">灵感作品</div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== 右侧表单区 ========== */}
      <div className="form-panel-register">
        {/* Logo */}
        <div className="form-logo">
          <span className="form-logo-dot" />
          <Logo size="form" tone="light" link={false} className="!py-0" />
        </div>

        {/* 标题 */}
        <div className="form-header">
          <h2 className="form-title">创建账号</h2>
          <p className="form-subtitle">
            已有账号？
            <Link href="/login">立即登录</Link>
          </p>
        </div>

        {/* 表单 */}
        <form onSubmit={handleRegister} className="space-y-4">
          {/* 角色选择 */}
          <div className="role-group">
            {roleOptions.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelectedRole(role.id)}
                className={`role-card ${selectedRole === role.id ? "active" : ""}`}
              >
                <div className="role-card-header">
                  <div className="role-icon">
                    {role.id === "client" ? (
                      <User className="h-5 w-5" />
                    ) : (
                      <Wand2 className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <div className="role-label">{role.label}</div>
                  </div>
                  <div className="role-check">
                    <Check className="h-3 w-3" />
                  </div>
                </div>
                <div className="role-desc">{role.desc}</div>
              </button>
            ))}
          </div>

          {/* 邮箱 */}
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
                className={`form-input ${
                  email && !emailValidation.valid ? "error" : ""
                }`}
              />
            </div>
            {email && !emailValidation.valid && (
              <p className="form-error-text">{emailValidation.message}</p>
            )}
          </div>

          {/* 姓名/昵称 */}
          <div className="form-group">
            <label className="form-label">姓名 / 昵称</label>
            <div className="input-wrapper">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9A8B78]" />
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                placeholder="请输入你的姓名或昵称"
                className="form-input"
              />
            </div>
          </div>

          {/* 密码 */}
          <div className="form-group">
            <label className="form-label">设置密码（至少 8 位）</label>
            <div className="input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="请输入密码"
                className="form-input pr-12"
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
            {password && (
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#5D4E3A]">密码强度</span>
                  <span className={`font-semibold ${passwordStrength.color}`}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`strength-bar ${
                        i <= passwordStrength.score ? passwordStrength.bgColor : ""
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 风险提示 */}
          <div className="disclaimer-card">
            <div className="disclaimer-header">
              <AlertTriangle className="h-5 w-5 text-[#B8860B]" />
              <span>风险告知与责任声明</span>
            </div>
            {showDisclaimer && (
              <ul className="disclaimer-content">
                {DISCLAIMER_ITEMS.map((item, i) => (
                  <li key={i}>
                    <span className="font-bold">{i + 1}.</span> {item}
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={() => setShowDisclaimer(!showDisclaimer)}
              className="disclaimer-toggle"
            >
              {showDisclaimer ? "收起内容" : "展开阅读完整声明"}
            </button>
            <label className="disclaimer-agree">
              <input
                type="checkbox"
                checked={disclaimerRead}
                onChange={(e) => setDisclaimerRead(e.target.checked)}
                className="h-4 w-4 accent-[#D4A574]"
              />
              我已阅读并理解上述风险声明
            </label>
          </div>

          {/* 协议 */}
          <label className="agreement-row">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="h-4 w-4 accent-[#D4A574]"
            />
            <span>
              已阅读并同意 <Link href="/terms">《服务条款》</Link> 和 <Link href="/privacy">《隐私政策》</Link>
            </span>
          </label>

          {/* 错误提示 */}
          {error && (
            <div className="form-error-box">
              {error}
            </div>
          )}

          {/* 注册按钮 */}
          <div className="flex items-center justify-between gap-3">
            <button
              type="submit"
              disabled={loading}
              className="btn-slide primary flex-1"
              style={{ width: "auto" }}
            >
              {loading ? "注册中..." : "立即注册"}
            </button>
            <Link
              href="/"
              className="shrink-0 text-sm font-semibold text-[#5C4033] hover:text-[#B8860B]"
            >
              返回主页
            </Link>
          </div>
        </form>

        <p className="form-footer">
          注册即表示同意律植的 <Link href="/terms">《服务条款》</Link> 和 <Link href="/privacy">《隐私政策》</Link>
        </p>
      </div>
    </div>
  );
}
