"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Session } from "@/lib/api/client";
import {
  buildRecommendationProfile,
  buildQuestionFlow,
  clearRecommendationProfile,
  loadRecommendationProfile,
  saveRecommendationProfile,
  type RecommendationItem,
  type RecommendationProfile,
} from "@/lib/recommendation/recommendation-engine";
import {
  Search,
  ArrowRight,
  Bot,
  GraduationCap,
  Users,
  Sparkles,
  Briefcase,
  Scale,
  Star,
  Zap,
  BookOpen,
} from "lucide-react";
import {
  preferSimplForKaiTi,
  preferSimplForSourceHanSerif,
  preferTradForKeShiLu,
} from "@/lib/keshilu-text";

/**
 * 首页 — 对齐《律植项目蓝图 v6.4》§1.0 品牌标识、§17.1 布局
 *
 * 视觉方向：琥珀咖啡色系 + 思源宋体（繁）+ 丝绒质感
 * 颜色：amber #D4A574 / coffee #5C4033 / cream #FFF8F0
 * 字体：Noto Serif TC / Source Han Serif TC
 */

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1920&q=80";

const HERO_CARD_IMAGE =
  "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80";

const FEATURED_ITEMS = [
  {
    name: "劳动争议处理全流程",
    creator: "陈晓敏",
    desc: "执业律师创作",
    stats: "1.2k 收藏",
    rating: 4.9,
    category: "劳动法",
    type: "Skills",
  },
  {
    name: "AI 合同风险排查助手",
    creator: "张律师",
    desc: "批量扫描合同",
    stats: "5.6k 使用",
    rating: 4.8,
    category: "合同法",
    type: "智能体",
  },
  {
    name: "企业合规自查清单",
    creator: "王律师",
    desc: "合规自查工具",
    stats: "980 收藏",
    rating: 4.7,
    category: "公司法",
    type: "Skills",
  },
];

const PLATFORM_FEATURES = [
  {
    title: "灵感广场",
    desc: "发现法律 Skills、智能体、模板与工具，覆盖合同、劳动、婚家等高频场景，即开即用。",
    cta: "进入广场",
    href: "/inspiration",
    icon: Sparkles,
    backTitle: "探索更多",
    backDesc: "浏览精选模板、智能体和实用工具",
  },
  {
    title: "社区",
    desc: "交流经验、提问互动、分享实践，与法律从业者和创作者连接。",
    cta: "进入社区",
    href: "/community",
    icon: Users,
    backTitle: "加入讨论",
    backDesc: "与同行交流经验，共同成长",
  },
  {
    title: "合作机会",
    desc: "法律行业招聘、法律需求、商务合作，找到适合的合作机会。",
    cta: "查看机会",
    href: "/opportunities",
    icon: Briefcase,
    backTitle: "寻找合作",
    backDesc: "发现优质法律服务合作机会",
  },
  {
    title: "创作指南",
    desc: "新手指南、平台规则、教程与常见问题，帮助你成为优秀创作者。",
    cta: "开始创作",
    href: "/creator-guide",
    icon: GraduationCap,
    backTitle: "成为创作者",
    backDesc: "分享专业知识，获得收益",
  },
];

const LAWYERS = [
  {
    name: "陈晓敏",
    title: "劳动法专家",
    region: "北京",
    years: 9,
    verified: true,
    specialties: ["劳动争议", "劳动合同"],
  },
  {
    name: "王建国",
    title: "企业合规专家",
    region: "上海",
    years: 12,
    verified: true,
    specialties: ["企业合规", "合同纠纷"],
  },
  {
    name: "林雨欣",
    title: "婚姻家事专家",
    region: "深圳",
    years: 7,
    verified: true,
    specialties: ["婚姻家事", "遗产继承"],
  },
];

const COMMUNITY_RECOMMEND_DEFAULT: RecommendationItem[] = [
  {
    id: "home-post-1",
    title: "公司口头辞退，如何留证最稳妥？",
    subtitle: "作者：劳动法方向律师",
    tags: ["被辞退", "证据", "仲裁"],
    reason: "帮助你先判断场景风险，再决定下一步。",
    href: "/community",
  },
  {
    id: "home-post-2",
    title: "法学生如何切入知识产权实习",
    subtitle: "作者：知产团队主理人",
    tags: ["法学生", "实习", "知识产权"],
    reason: "适合求职方向用户快速梳理行动路径。",
    href: "/community",
  },
  {
    id: "home-post-3",
    title: "企业数据合规项目如何与律师协作",
    subtitle: "作者：企业法务负责人",
    tags: ["企业合规", "数据治理", "协作流程"],
    reason: "可快速理解需求方和服务方协同方式。",
    href: "/community",
  },
];

const OPPORTUNITY_RECOMMEND_DEFAULT: RecommendationItem[] = [
  {
    id: "home-opp-1",
    title: "知识产权方向实习生招募",
    subtitle: "类型：实习机会",
    tags: ["法学生", "知识产权", "实习"],
    reason: "面向成长型用户的高匹配入口。",
    href: "/opportunities",
  },
  {
    id: "home-opp-2",
    title: "企业劳动用工顾问合作",
    subtitle: "类型：顾问合作",
    tags: ["劳动法", "顾问单位", "企业服务"],
    reason: "适配律师与企业双方的合作型诉求。",
    href: "/opportunities",
  },
  {
    id: "home-opp-3",
    title: "数据合规律师专项采购",
    subtitle: "类型：法律服务",
    tags: ["数据合规", "采购", "隐私政策"],
    reason: "适合企业端快速发起专业服务对接。",
    href: "/opportunities",
  },
];

/** 「创作指南」卡片链接：未登录走创作指南；客户走申请成为创作者；已登录创作者进工作台认证申请区 */
function createGuideCardHref(session: Session | null): string {
  if (!session) return "/creator-guide";
  const role = String(session.role).toLowerCase();
  if (role === "creator") return "/creator/workbench/cre-verify";
  if (role === "client") return "/workspace/become-creator";
  return "/workspace";
}

function platformFeatureHref(feature: (typeof PLATFORM_FEATURES)[number], session: Session | null): string {
  if (feature.title === "创作指南") return createGuideCardHref(session);
  return feature.href;
}

/** 卡片背面 CTA：已登录客户显示「成为创作者」，已登录创作者显示「申请认证」，其余仍为「开始创作」 */
function platformFeatureBackCta(
  feature: (typeof PLATFORM_FEATURES)[number],
  session: Session | null,
): string {
  if (feature.title === "创作指南" && session?.role === "client") return "成为创作者";
  if (feature.title === "创作指南" && session?.role === "creator") return "申请认证";
  return feature.cta;
}

/** 首页底部第二 CTA：创作者进工作台认证区；其余用户走注册成为创作者 */
function homeBottomSecondaryCta(session: Session | null): { href: string; label: string } {
  if (session?.role === "creator") {
    return { href: "/creator/workbench/cre-verify", label: "申请认证" };
  }
  return { href: "/register", label: "成为创作者" };
}

export function HomePage({ session = null }: { session?: Session | null }) {
  const toTrad = preferSimplForSourceHanSerif;
  const toBrushTrad = preferTradForKeShiLu;
  const toKaiSimpl = preferSimplForKaiTi;
  const bottomSecondaryCta = homeBottomSecondaryCta(session ?? null);
  const [answerInput, setAnswerInput] = useState("");
  const [profile, setProfile] = useState<RecommendationProfile | null>(null);
  const [seedDemand, setSeedDemand] = useState("");
  const [questions, setQuestions] = useState<Array<{ id: string; prompt: string; placeholder: string }>>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);

  useEffect(() => {
    setProfile(loadRecommendationProfile());
  }, []);

  const inQuestionFlow = Boolean(seedDemand) && questionIndex < questions.length;
  const flowReadyToGenerate = Boolean(seedDemand) && questions.length > 0 && questionIndex >= questions.length;
  const inRecommendationState = Boolean(profile && flowReadyToGenerate);
  const lastPrompt = questions.length > 0 ? questions[questions.length - 1]?.prompt : "";
  const activePrompt = inQuestionFlow
    ? toTrad(questions[questionIndex]?.prompt ?? "")
    : flowReadyToGenerate
      ? toTrad(`${lastPrompt}（已完成，点击生成推荐）`)
    : toTrad("告诉律植您的问题、目标或需求");
  const activePlaceholder = inQuestionFlow
    ? toTrad(questions[questionIndex]?.placeholder ?? "")
    : flowReadyToGenerate
      ? toTrad("三轮追问已完成，请点击“生成推荐”")
    : toTrad("例如：我被公司辞退了，想知道能不能要赔偿");

  const featuredCards = useMemo<
    Array<{
      name: string;
      creator: string;
      desc: string;
      stats: string;
      rating: number;
      category: string;
      type: string;
      reason?: string;
      href?: string;
    }>
  >(() => {
    if (!inRecommendationState || !profile) {
      return FEATURED_ITEMS.map((item) => ({ ...item, href: "/inspiration" }));
    }
    return profile.modules.skills.slice(0, 3).map((item) => ({
      name: item.title,
      creator: item.subtitle,
      desc: "关键词匹配",
      stats: item.tags.slice(0, 2).join(" · "),
      rating: 4.8,
      category: item.tags[0] || "通用",
      type: "Skills",
      reason: item.reason,
      href: item.href,
    }));
  }, [inRecommendationState, profile]);

  const lawyerCards = useMemo<
    Array<{
      name: string;
      title: string;
      region: string;
      years: number;
      verified: boolean;
      specialties: string[];
      reason?: string;
      href?: string;
    }>
  >(() => {
    if (!inRecommendationState || !profile) {
      return LAWYERS.map((item) => ({ ...item, href: "/lawyers" }));
    }
    return profile.modules.lawyers.slice(0, 3).map((item) => ({
      name: item.title.split(" · ")[0] || item.title,
      title: item.subtitle,
      region: item.tags[0] || "全国",
      years: 8,
      verified: true,
      specialties: item.tags,
      reason: item.reason,
      href: item.href,
    }));
  }, [inRecommendationState, profile]);

  const communityCards = useMemo(() => {
    if (!inRecommendationState || !profile) return COMMUNITY_RECOMMEND_DEFAULT;
    return profile.modules.posts.slice(0, 3);
  }, [inRecommendationState, profile]);

  const opportunityCards = useMemo(() => {
    if (!inRecommendationState || !profile) return OPPORTUNITY_RECOMMEND_DEFAULT;
    if (profile.path !== "cooperation_path") return [];
    return profile.modules.opportunities.slice(0, 3);
  }, [inRecommendationState, profile]);

  const showFeaturedSection = featuredCards.length > 0;
  const showCommunitySection = communityCards.length > 0;
  const showOpportunitySection = opportunityCards.length > 0;
  const showLawyerSection = lawyerCards.length > 0;

  const beginQuestionFlow = () => {
    const source = answerInput.trim();
    if (!source) return;
    const nextQuestions = buildQuestionFlow(source);
    const primary = source
      .replace(/[，。！？、,.!?]/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .join("、");
    setSeedDemand(source);
    setQuestions(nextQuestions);
    setQuestionIndex(0);
    setAnswers(primary ? [primary] : []);
    setAnswerInput("");
    setProfile(null);
  };

  const pushAnswerAndNext = () => {
    const value = answerInput.trim();
    if (!value || !inQuestionFlow) return;
    setAnswers((prev) => [...prev, value]);
    setQuestionIndex((prev) => prev + 1);
    setAnswerInput("");
  };

  const generateByAllKeywords = () => {
    if (!seedDemand) return;
    const next = buildRecommendationProfile(seedDemand, answers);
    setProfile(next);
    saveRecommendationProfile(next);
  };

  const resetDemand = () => {
    setProfile(null);
    setSeedDemand("");
    setQuestions([]);
    setQuestionIndex(0);
    setAnswers([]);
    setAnswerInput("");
    clearRecommendationProfile();
  };

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <main>
        {/* ── Hero ── */}
        <section className="relative flex min-h-[80vh] items-center py-12 lg:py-16">
          {/* 背景图片：与营销 layout 叠放后顶到视口顶，透明顶栏透出画面 */}
          <div className="hero-bg">
            <img
              src={HERO_IMAGE}
              alt="会议室背景"
              className="w-full h-full object-cover animate-slow-zoom"
            />
            <div className="hero-overlay" />
          </div>

          {/* 内容 - 双栏 Grid（底边羽化见 globals .hero-bg::after） */}
          <div className="hero-container pt-20">
            {/* 左侧内容 */}
            <div className="hero-content animate-fade-in-up">
              {/* 标题（蓝图 §1.0 主副标题） */}
              <h1 className="hero-title">
                {toBrushTrad("法承初心")}
                <br />
                {toBrushTrad("技启新程")}
              </h1>

              {/* 描述 */}
              <p className="hero-desc marketing-subtitle--kai">
                {toKaiSimpl("致敬每一位以专业为光的法律创作者")}
              </p>

              {/* 搜索框 */}
              <div className="w-full max-w-3xl rounded-lg border border-[rgba(212,165,116,0.4)] bg-[rgba(255,255,255,0.86)] p-4 shadow-[0_18px_48px_-24px_rgba(44,36,22,0.3)]">
                <div className="flex items-start gap-3">
                  <Search className="mt-1 h-5 w-5 shrink-0 text-[#9A8B78]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#5C4033]">{activePrompt}</p>
                    <textarea
                      rows={2}
                      value={answerInput}
                      onChange={(event) => setAnswerInput(event.target.value)}
                      disabled={flowReadyToGenerate}
                      placeholder={activePlaceholder}
                      className="mt-2 w-full resize-none rounded-md border border-[rgba(212,165,116,0.28)] bg-white px-3 py-2 text-sm text-[#2C2416] outline-none focus:border-[#D4A574] focus:ring-2 focus:ring-[#D4A574]/20 disabled:cursor-not-allowed disabled:bg-[#F4EEE5] disabled:text-[#8A7D69]"
                    />
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {!seedDemand ? (
                    <button
                      type="button"
                      onClick={beginQuestionFlow}
                      className="inline-flex h-10 items-center justify-center rounded-md bg-[#5C4033] px-4 text-sm font-semibold text-white transition hover:bg-[#705141]"
                    >
                      {toTrad("开始推荐")}
                    </button>
                  ) : inQuestionFlow ? (
                    <button
                      type="button"
                      onClick={pushAnswerAndNext}
                      className="inline-flex h-10 items-center justify-center rounded-md bg-[#5C4033] px-4 text-sm font-semibold text-white transition hover:bg-[#705141]"
                    >
                      {toTrad("下一问")}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={generateByAllKeywords}
                      className="inline-flex h-10 items-center justify-center rounded-md bg-[#5C4033] px-4 text-sm font-semibold text-white transition hover:bg-[#705141]"
                    >
                      {toTrad("生成推荐")}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={resetDemand}
                    className="inline-flex h-10 items-center justify-center rounded-md border border-[rgba(212,165,116,0.35)] bg-white px-4 text-sm font-semibold text-[#5C4033] transition hover:border-[#D4A574]"
                  >
                    {toTrad("清除推荐")}
                  </button>
                </div>
                {inRecommendationState && profile?.globalReason ? (
                  <p className="mt-3 rounded-md border border-[rgba(212,165,116,0.25)] bg-[rgba(255,255,255,0.92)] px-3 py-2 text-xs leading-relaxed text-[#5D4E3A]">
                    {toTrad(profile.globalReason)}
                  </p>
                ) : null}
              </div>
            </div>

            {/* 右侧视觉 - 浮动卡片 */}
            <div className="hero-visual animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              <div className="hero-card">
                {/* 主卡片 */}
                <div className="hero-card-main">
                  <img
                    src={HERO_CARD_IMAGE}
                    alt="法律灵感库"
                    className="w-full h-full object-cover rounded-3xl"
                  />
                </div>
                {/* 浮动信息卡 */}
                <div className="hero-card-float">
                  <div className="flex items-center gap-3 mb-3">
                    <BookOpen className="w-5 h-5 text-[#D4A574]" />
                    <h4 className="font-semibold text-[#5C4033]">{toTrad("法律灵感库")}</h4>
                  </div>
                  <p className="text-sm text-[#5D4E3A]">{toTrad("10,000+ 精选灵感")}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 平台能力 ── */}
        <section className="py-10 bg-[#FFFCF7]">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="section-header mb-8">
              <div className="section-label">Platform</div>
              <h2 className="section-title text-[#5C4033]">{toTrad("律植可以帮你做什么")}</h2>
              <p className="section-subtitle">
                {toTrad("四条主线，覆盖灵感、使用、连接与创作，找到最适合你的起点。")}
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {PLATFORM_FEATURES.map((feature, index) => {
                const isCreatorGuide = feature.title === "创作指南";
                const isCreator = session?.role === "creator";
                const backTitle =
                  isCreatorGuide && isCreator ? "申请认证" : feature.backTitle;
                const backDesc =
                  isCreatorGuide && isCreator
                    ? "优秀创作者、大师创作者或认证执业律师"
                    : feature.backDesc;
                return (
                <div
                  key={feature.title}
                  className="rounded-2xl shadow-[0_12px_40px_-12px_rgba(92,64,51,0.12),0_4px_18px_rgba(212,165,116,0.18)]"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <Link
                    href={platformFeatureHref(feature, session ?? null)}
                    className="card-swap group block"
                  >
                    {/* 正面 */}
                    <div className="card-front">
                      <div className="icon-swap">
                        <feature.icon className="w-7 h-7 text-[#5C4033]" />
                      </div>
                      <h3 className="text-[#2C2416]">{feature.title}</h3>
                      <p className="text-[#5D4E3A]">{feature.desc}</p>
                    </div>
                    {/* 背面 - translateX滑入效果 */}
                    <div className="card-back">
                      <h3>{backTitle}</h3>
                      <p>{backDesc}</p>
                      <span className="arrow">
                        <ArrowRight className="w-4 h-4" />
                        {platformFeatureBackCta(feature, session ?? null)}
                      </span>
                    </div>
                  </Link>
                </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── 精选推荐 ── */}
        {showFeaturedSection ? (
        <section className="py-9 bg-[#FFFCF7]">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="flex items-end justify-between mb-6">
              <div>
                <div className="section-label">Featured</div>
                <h2 className="section-title text-[#5C4033]">{toTrad("灵感广场 / 精选技能")}</h2>
                <p
                  className="section-subtitle text-[#5D4E3A]"
                  style={{ fontFamily: '"Source Han Serif SC", "Noto Serif SC", serif' }}
                >
                  {inRecommendationState
                    ? "已按关键词匹配展示相关度更高的技能。"
                    : "由执业律师和创作者打造，覆盖高频法律场景，即开即用。"}
                </p>
              </div>
              <Link
                href="/inspiration"
                className="hidden items-center gap-1 text-sm font-semibold text-[#5C4033] transition-all group-hover:gap-2 sm:flex"
              >
                {toTrad("查看更多")} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {featuredCards.map((item) => (
                <Link
                  key={item.name}
                  href={item.href ?? `/inspiration/${encodeURIComponent(item.name)}`}
                  className="card featured-skill-card group min-h-[220px] p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(212,165,116,0.15)]">
                      {item.type === "智能体" ? (
                        <Bot className="h-6 w-6 text-[#5C4033]" />
                      ) : (
                        <Zap className="h-6 w-6 text-[#5C4033]" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#2C2416]">{toTrad(item.name)}</h3>
                      <p className="text-xs text-[#5D4E3A]">
                        {toTrad(item.desc)} · {toTrad(item.creator)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-[rgba(212,165,116,0.25)] pt-4">
                    <div className="flex items-center gap-2">
                      <span className="tag">{toTrad(item.category)}</span>
                      <span className="text-sm text-[#9A8B78]">{toTrad(item.stats)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm font-medium text-[#5C4033]">
                      <Star className="h-4 w-4 fill-[#D4A574] text-[#D4A574]" />
                      {item.rating}
                    </div>
                  </div>
                  {"reason" in item && item.reason ? (
                    <p className="mt-3 rounded-xl border border-[rgba(212,165,116,0.25)] bg-[rgba(255,248,240,0.6)] px-3 py-2 text-xs text-[#5D4E3A]">
                      {toTrad("推荐原因：")}{toTrad(item.reason)}
                    </p>
                  ) : null}
                </Link>
              ))}
            </div>
          </div>
        </section>
        ) : null}

        {/* ── 社区 / 经验帖推荐 ── */}
        {showCommunitySection ? (
        <section className="py-9 bg-[#FFFCF7]">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <div className="section-label">Community</div>
                <h2 className="section-title text-[#5C4033]">{toTrad("社区 / 经验帖")}</h2>
                <p className="mt-1 text-sm text-[#5D4E3A]">
                  {inRecommendationState && profile?.path === "lawyer_path"
                    ? toTrad("已按关键词匹配展示相关度最高的经验帖。")
                    : toTrad("看看相似问题、律师观点和真实经验，先理解问题，再决定下一步。")}
                </p>
              </div>
              <Link href="/community" className="hidden items-center gap-1 text-sm font-semibold text-[#5C4033] sm:inline-flex">
                {toTrad("查看经验")} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {communityCards.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="card featured-skill-card group min-h-[220px] p-6 transition hover:-translate-y-0.5"
                >
                  <div className="flex h-full flex-col">
                    <h3 className="text-base font-semibold text-[#2C2416]">{toTrad(item.title)}</h3>
                    <p className="mt-1 text-xs text-[#8A6C4D]">{toTrad(item.subtitle)}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {item.tags.slice(0, 3).map((tag) => (
                        <span key={`${item.id}-${tag}`} className="tag text-xs">
                          {toTrad(tag)}
                        </span>
                      ))}
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-[#5D4E3A]">{toTrad("推荐原因：")}{toTrad(item.reason)}</p>
                    <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-[#5C4033]">
                      {toTrad("查看经验")} <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
        ) : null}

        {/* ── 合作机会推荐 ── */}
        {showOpportunitySection ? (
        <section className="py-9 bg-[#FFFCF7]">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <div className="section-label">Opportunity</div>
                <h2 className="section-title text-[#5C4033]">{toTrad("合作机会")}</h2>
                <p className="mt-1 text-sm text-[#5D4E3A]">
                  {inRecommendationState && profile?.path === "cooperation_path"
                    ? toTrad("已按关键词匹配展示相关度最高的合作机会。")
                    : toTrad("发现实习、合作、顾问单位、法律服务采购和创作者共创机会。")}
                </p>
              </div>
              <Link href="/opportunities" className="hidden items-center gap-1 text-sm font-semibold text-[#5C4033] sm:inline-flex">
                {toTrad("查看机会")} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {opportunityCards.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="card featured-skill-card group min-h-[220px] p-6 transition hover:-translate-y-0.5"
                >
                  <div className="flex h-full flex-col">
                    <h3 className="text-base font-semibold text-[#2C2416]">{toTrad(item.title)}</h3>
                    <p className="mt-1 text-xs text-[#8A6C4D]">{toTrad(item.subtitle)}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {item.tags.slice(0, 3).map((tag) => (
                        <span key={`${item.id}-${tag}`} className="tag text-xs">
                          {toTrad(tag)}
                        </span>
                      ))}
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-[#5D4E3A]">{toTrad("推荐原因：")}{toTrad(item.reason)}</p>
                    <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-[#5C4033]">
                      {toTrad("发起合作")} <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
        ) : null}

        {/* ── 精选律师 ── */}
        {showLawyerSection ? (
        <section className="py-9 bg-[#FFFCF7]">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="flex items-end justify-between mb-6">
              <div>
                <div className="section-label">Lawyers</div>
                <h2 className="section-title text-[#5C4033]">{toTrad("发现律师")}</h2>
                <p className="mt-1 text-sm text-[#5D4E3A]">
                  {inRecommendationState ? toTrad("根据你的需求推荐可能匹配的律师") : toTrad("法智兼备，技业专精")}
                </p>
              </div>
              <span className="tag text-sm">
                {toTrad("执业律师 320+ 位")}
              </span>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {lawyerCards.map((lawyer) => (
                <Link
                  key={lawyer.name}
                  href={lawyer.href ?? `/lawyers/${encodeURIComponent(lawyer.name)}`}
                  className="card flex items-center gap-4 p-4 group"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#5C4033] text-xl font-bold text-white">
                    {lawyer.name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[#2C2416]">{toTrad(lawyer.name)}</h3>
                      {lawyer.verified && (
                        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[rgba(212,165,116,0.15)]">
                          <Scale className="h-2.5 w-2.5 text-[#5C4033]" />
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-[#5D4E3A]">
                      {toTrad(lawyer.region)} · {toTrad("执业")} {lawyer.years} {toTrad("年")}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {lawyer.specialties.map((s) => (
                        <span key={s} className="tag text-xs">
                          {toTrad(s)}
                        </span>
                      ))}
                    </div>
                    {"reason" in lawyer && lawyer.reason ? (
                      <p className="mt-2 text-xs text-[#5D4E3A]">{toTrad("推荐原因：")}{toTrad(lawyer.reason)}</p>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/lawyers"
                className="inline-flex items-center gap-1 text-sm font-semibold text-[#5C4033] transition-all hover:gap-2"
              >
                {toTrad("前往发现律师")} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
        ) : null}

        {/* ── CTA ── */}
        <section className="py-9 bg-gradient-to-b from-[#FFFCF7] to-[#FFF8F0]">
          <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
            <h2 className="home-cta-brush-title text-3xl md:text-4xl font-normal text-[#5C4033] mb-4">
              {toBrushTrad("让法律灵感与实践，创造更大价值")}
            </h2>
            <p className="text-lg text-[#5D4E3A] mb-8">
              {session?.role === "creator" ? (
                <>
                  {toTrad("你已在创作者工作台。可在此申请")}
                  <span className="font-semibold text-[#5C4033]">{toTrad("优秀创作者")}</span>、
                  <span className="font-semibold text-[#5C4033]">{toTrad("大师创作者")}</span>
                  {toTrad("或")}
                  <span className="font-semibold text-[#5C4033]">{toTrad("认证执业律师")}</span>
                  {toTrad("，提升标识与可信度。")}
                </>
              ) : (
                <>
                  {toTrad("无论你是想解决一个法律问题，还是想将专业经验做成 Skills，")}
                  <br />
                  {toTrad("律植都是你的起点。连接灵感，实践价值。")}
                </>
              )}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/inspiration" className="btn-slide primary">
                <Sparkles className="w-5 h-5" />
                {toTrad("立即探索")}
              </Link>
              <Link href={bottomSecondaryCta.href} className="btn-slide outline">
                <ArrowRight className="w-5 h-5" />
                {toTrad(bottomSecondaryCta.label)}
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
