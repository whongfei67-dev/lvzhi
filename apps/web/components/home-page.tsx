import Link from "next/link";
import { preferTradForKeShiLu } from "@/lib/keshilu-text";
import type { Session } from "@/lib/api/client";
import {
  Search,
  ArrowRight,
  Bot,
  GraduationCap,
  Users,
  Sparkles,
  Compass,
  Briefcase,
  Scale,
  Star,
  Zap,
  BookOpen,
} from "lucide-react";

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

const HOT_TAGS = [
  "合同审查",
  "劳动争议",
  "婚姻家事",
  "企业合规",
  "公司法务",
];

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
  const bottomSecondaryCta = homeBottomSecondaryCta(session ?? null);

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
                法承初心
                <br />
                {preferTradForKeShiLu("技启新程")}
              </h1>

              {/* 描述 */}
              <p className="hero-desc marketing-subtitle--kai">
                致敬每一位以专业为光的法律创作者
              </p>

              {/* 搜索框 */}
              <div className="hero-search-box">
                <Search className="text-[#9A8B78]" />
                <input
                  type="text"
                  placeholder={preferTradForKeShiLu("搜索 Skills、智能体、律师...")}
                  className="text-[#2C2416]"
                />
              </div>

              {/* 热门标签 */}
              <div className="hero-tags">
                <span className="text-sm text-[#5D4E3A]">热门：</span>
                {HOT_TAGS.map((tag) => (
                  <Link
                    key={tag}
                    href={`/inspiration?q=${encodeURIComponent(tag)}`}
                    className="tag-border"
                  >
                    {tag}
                  </Link>
                ))}
              </div>

              {/* CTA 按钮 */}
              <div className="hero-buttons">
                <Link href="/inspiration" className="btn-slide primary">
                  <Compass className="w-5 h-5" />
                  逛灵感广场
                </Link>
                <Link href="/lawyers" className="btn-slide outline">
                  <Users className="w-5 h-5" />
                  发现律师
                </Link>
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
                    <h4 className="font-semibold text-[#5C4033]">法律灵感库</h4>
                  </div>
                  <p className="text-sm text-[#5D4E3A]">10,000+ 精选灵感</p>
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
              <h2 className="section-title text-[#5C4033]">律植可以帮你做什么</h2>
              <p className="section-subtitle">
                {preferTradForKeShiLu(
                  "四条主线，覆盖灵感、使用、连接与创作，找到最适合你的起点。"
                )}
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
        <section className="py-9 bg-[#FFFCF7]">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="flex items-end justify-between mb-6">
              <div>
                <div className="section-label">Featured</div>
                <h2 className="section-title text-[#5C4033]">精选灵感与工具</h2>
                <p className="section-subtitle text-[#5D4E3A]">
                  {preferTradForKeShiLu(
                    "由执业律师和创作者打造，覆盖高频法律场景，即开即用。"
                  )}
                </p>
              </div>
              <Link
                href="/inspiration"
                className="hidden items-center gap-1 text-sm font-semibold text-[#5C4033] transition-all group-hover:gap-2 sm:flex"
              >
                查看更多 <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {FEATURED_ITEMS.map((item) => (
                <Link
                  key={item.name}
                  href={`/inspiration/${encodeURIComponent(item.name)}`}
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
                      <h3 className="font-semibold text-[#2C2416]">{item.name}</h3>
                      <p className="text-xs text-[#5D4E3A]">
                        {item.desc} · {item.creator}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-[rgba(212,165,116,0.25)] pt-4">
                    <div className="flex items-center gap-2">
                      <span className="tag">{item.category}</span>
                      <span className="text-sm text-[#9A8B78]">{item.stats}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm font-medium text-[#5C4033]">
                      <Star className="h-4 w-4 fill-[#D4A574] text-[#D4A574]" />
                      {item.rating}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── 精选律师 ── */}
        <section className="py-9 bg-[#FFFCF7]">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="flex items-end justify-between mb-6">
              <div>
                <div className="section-label">Lawyers</div>
                <h2 className="section-title text-[#5C4033]">发现律师</h2>
                <p className="mt-1 text-sm text-[#5D4E3A]">法智兼备，技业专精</p>
              </div>
              <span className="tag text-sm">
                执业律师 320+ 位
              </span>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {LAWYERS.map((lawyer) => (
                <Link
                  key={lawyer.name}
                  href={`/lawyers/${encodeURIComponent(lawyer.name)}`}
                  className="card flex items-center gap-4 p-4 group"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#5C4033] text-xl font-bold text-white">
                    {lawyer.name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[#2C2416]">{lawyer.name}</h3>
                      {lawyer.verified && (
                        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[rgba(212,165,116,0.15)]">
                          <Scale className="h-2.5 w-2.5 text-[#5C4033]" />
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-[#5D4E3A]">
                      {lawyer.region} · 执业 {lawyer.years} 年
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {lawyer.specialties.map((s) => (
                        <span key={s} className="tag text-xs">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/lawyers"
                className="inline-flex items-center gap-1 text-sm font-semibold text-[#5C4033] transition-all hover:gap-2"
              >
                前往发现律师 <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-9 bg-gradient-to-b from-[#FFFCF7] to-[#FFF8F0]">
          <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
            <h2 className="home-cta-brush-title text-3xl md:text-4xl font-normal text-[#5C4033] mb-4">
              {preferTradForKeShiLu("让法律灵感与实践，创造更大价值")}
            </h2>
            <p className="text-lg text-[#5D4E3A] mb-8">
              {session?.role === "creator" ? (
                <>
                  你已在创作者工作台。可在此申请
                  <span className="font-semibold text-[#5C4033]">优秀创作者</span>、
                  <span className="font-semibold text-[#5C4033]">大师创作者</span>
                  或
                  <span className="font-semibold text-[#5C4033]">认证执业律师</span>
                  ，提升标识与可信度。
                </>
              ) : (
                <>
                  无论你是想解决一个法律问题，还是想将专业经验做成 Skills，
                  <br />
                  律植都是你的起点。连接灵感，实践价值。
                </>
              )}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/inspiration" className="btn-slide primary">
                <Sparkles className="w-5 h-5" />
                立即探索
              </Link>
              <Link href={bottomSecondaryCta.href} className="btn-slide outline">
                <ArrowRight className="w-5 h-5" />
                {bottomSecondaryCta.label}
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
