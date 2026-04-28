"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Briefcase, Calendar, FileText, MapPin, Sparkles } from "lucide-react";
import { ApiError, api, getSession, type Session } from "@/lib/api/client";
import type { OpportunityType } from "@/lib/api/types";
import { guestUnlockCardSurfaceClassName } from "@/components/common/guest-gate";

/** 与机会详情页顶区一致：城市天际线 + 暖色渐变罩 */
const OPPORTUNITY_DETAIL_HERO_BG =
  "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1920&q=80";

const TYPE_OPTIONS: { value: OpportunityType; label: string }[] = [
  { value: "job", label: "招聘" },
  { value: "project", label: "项目" },
  { value: "collaboration", label: "合作" },
  { value: "service_offer", label: "服务" },
];

function typeTagClass(type: OpportunityType): string {
  const colors: Record<OpportunityType, string> = {
    job: "bg-[rgba(212,165,116,0.12)] text-[#B8860B]",
    project: "bg-violet-50 text-violet-800",
    collaboration: "bg-[rgba(212,165,116,0.12)] text-[#D4A574]",
    service_offer: "bg-teal-50 text-teal-800",
  };
  return colors[type];
}

const inputClass =
  "w-full rounded-xl border border-[rgba(212,165,116,0.25)] bg-white/80 px-4 py-3 text-sm text-[#2C2416] placeholder:text-[#9A8B78] focus:border-[#D4A574] focus:outline-none focus:ring-2 focus:ring-[#D4A574]/15";

const labelClass = "mb-2 block text-sm font-medium text-[#2C2416]";

const primaryCtaClass =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-[#D4A574] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#B8860B] disabled:cursor-not-allowed disabled:opacity-60";

export default function CreateOpportunityPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [opportunityType, setOpportunityType] = useState<OpportunityType>("collaboration");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [locationType, setLocationType] = useState<"onsite" | "remote" | "hybrid">("hybrid");
  const [budget, setBudget] = useState("");
  const [compensationType, setCompensationType] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactWechat, setContactWechat] = useState("");
  const [applicationFileRequirements, setApplicationFileRequirements] = useState("");
  const [deadline, setDeadline] = useState("");
  const [category, setCategory] = useState("");
  const [industry, setIndustry] = useState("");

  useEffect(() => {
    getSession()
      .then((s) => setSession(s))
      .catch(() => setSession(null));
  }, []);

  useEffect(() => {
    if (session?.email) {
      setContactEmail((prev) => prev || session.email || "");
    }
  }, [session?.email]);

  const canSubmit =
    session &&
    (session.role === "client" || session.role === "creator") &&
    title.trim().length > 0 &&
    description.trim().length > 0;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    const budgetNum = budget.trim() === "" ? undefined : Number(budget.replace(/,/g, ""));
    const body: Record<string, unknown> = {
      title: title.trim(),
      opportunity_type: opportunityType,
      summary: summary.trim() || undefined,
      description: description.trim(),
      location: location.trim() || undefined,
      location_type: locationType,
      compensation_type: compensationType.trim() || undefined,
      contact_email: contactEmail.trim() || undefined,
      contact_wechat: contactWechat.trim() || undefined,
      application_file_requirements: applicationFileRequirements.trim() || undefined,
      category: category.trim() || undefined,
      industry: industry.trim() || undefined,
    };
    if (budgetNum !== undefined && !Number.isNaN(budgetNum)) {
      body.budget = budgetNum;
    }
    if (deadline.trim()) {
      const end = new Date(`${deadline.trim()}T23:59:59`);
      if (!Number.isNaN(end.getTime())) {
        body.deadline = end.toISOString();
      }
    }
    try {
      const data = await api.opportunities.create(body);
      const slug = typeof data?.slug === "string" ? data.slug : null;
      const id = typeof data?.id === "string" ? data.id : null;
      if (slug) {
        router.push(`/opportunities/${encodeURIComponent(slug)}`);
      } else if (id) {
        router.push(`/opportunities/${encodeURIComponent(id)}`);
      } else {
        router.push("/opportunities/my-posts");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "发布失败，请稍后重试");
    } finally {
      setBusy(false);
    }
  };

  const sessionReady = session !== undefined;
  const loggedIn = Boolean(session);
  const roleOk = session && (session.role === "client" || session.role === "creator");

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <div className="relative">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[11.5rem] overflow-hidden sm:h-[13rem] lg:h-[14.5rem]"
          aria-hidden
        >
          <div
            className="absolute inset-0 bg-cover bg-center opacity-[0.82] saturate-[0.9] contrast-[0.96]"
            style={{ backgroundImage: `url(${OPPORTUNITY_DETAIL_HERO_BG})` }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(255,252,247,0.88) 0%, rgba(255,248,240,0.42) 45%, rgba(255,248,240,0) 72%)",
            }}
          />
          <div className="absolute inset-x-0 bottom-0 h-16 sm:h-20 lg:h-24" aria-hidden>
            <div
              className="absolute inset-0 shadow-[inset_0_-2rem_2.5rem_-0.5rem_rgba(255,248,240,0.5)]"
              style={{
                background:
                  "linear-gradient(to bottom, transparent 0%, rgba(255,248,240,0.18) 22%, rgba(255,248,240,0.5) 48%, #FFF8F0 82%, #FFF8F0 100%)",
              }}
            />
          </div>
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-6 pb-16 pt-28 sm:pt-32 lg:px-8 lg:pb-20 lg:pt-36">
          <div className="grid gap-8 lg:grid-cols-3 lg:items-start">
            <div className="min-w-0 space-y-8 lg:col-span-2">
              <article
                className={`relative rounded-2xl border border-[rgba(212,165,116,0.25)] marketing-cream-card-surface p-8 transition-all hover:border-[#D4A574] hover:shadow-md ${guestUnlockCardSurfaceClassName}`}
              >
                <Link
                  href="/opportunities"
                  className="absolute right-4 top-4 z-20 inline-flex items-center gap-1.5 rounded-full border border-[rgba(212,165,116,0.35)] bg-white/95 px-3 py-1.5 text-xs font-medium text-[#5D4E3A] shadow-sm backdrop-blur-sm transition-colors hover:border-[#D4A574] hover:text-[#5C4033] sm:right-6 sm:top-6 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
                >
                  <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
                  返回机会列表
                </Link>

                <header className="mb-8 min-w-0 border-b border-[rgba(212,165,116,0.2)] pb-8 pr-24 sm:pr-44">
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <span className="tag text-xs font-medium bg-[rgba(212,165,116,0.12)] text-[#B8860B]">发布</span>
                    <span className="tag text-xs font-medium border-[rgba(212,165,116,0.35)] bg-[rgba(212,165,116,0.08)] text-[#5D4E3A]">
                      提交后直接发布
                    </span>
                  </div>
                  <h1 className="text-xl font-bold leading-snug tracking-tight text-[#2C2416] sm:text-2xl lg:text-[1.65rem]">
                    发布合作机会
                  </h1>
                  <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#5D4E3A]">
                    字段结构与机会详情页一致：主题、类型、合作需求、地点与截止、投递文件要求等；保存后直接发布到列表，合作投递将同步至你的「工作台 →
                    机会投递」。
                  </p>
                </header>

                {!sessionReady ? (
                  <div className="animate-pulse space-y-4 py-4">
                    <div className="h-10 rounded-xl bg-[rgba(212,165,116,0.12)]" />
                    <div className="h-32 rounded-xl bg-[rgba(212,165,116,0.08)]" />
                  </div>
                ) : !loggedIn ? (
                  <div className="rounded-xl border border-[rgba(212,165,116,0.28)] bg-[rgba(255,255,255,0.45)] px-6 py-10 text-center backdrop-blur-sm">
                    <Briefcase className="mx-auto h-10 w-10 text-[#D4A574]" aria-hidden />
                    <p className="mt-4 text-sm font-medium text-[#2C2416]">发布前请先登录</p>
                    <p className="mt-2 text-sm text-[#9A8B78]">登录后可填写并提交，与详情页合作投递链路打通。</p>
                    <Link
                      href={`/login?next=${encodeURIComponent("/opportunities/create")}`}
                      className={`${primaryCtaClass} mt-6`}
                    >
                      去登录
                    </Link>
                  </div>
                ) : !roleOk ? (
                  <div className="rounded-xl border border-[rgba(212,165,116,0.28)] bg-[rgba(255,255,255,0.45)] px-6 py-8 text-sm text-[#5D4E3A] backdrop-blur-sm">
                    <p>当前账号角色无法直接发布机会（需客户或创作者账号）。如有疑问请联系平台支持。</p>
                    <Link href="/opportunities" className="mt-4 inline-flex text-sm font-medium text-[#D4A574] hover:text-[#B8860B]">
                      返回机会列表 →
                    </Link>
                  </div>
                ) : (
                  <form className="space-y-10" onSubmit={onSubmit}>
                    {error ? (
                      <p className="rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-700" role="alert">
                        {error}
                      </p>
                    ) : null}

                    <section className="space-y-4">
                      <h2 className="text-lg font-semibold text-[#2C2416]">主题与类型</h2>
                      <div>
                        <label className={labelClass}>
                          机会主题 <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="对应详情页标题行，例如：某所招聘驻场法务 / 合规系统联合开发"
                          className={inputClass}
                          maxLength={200}
                          required
                        />
                      </div>
                      <div>
                        <span className={labelClass}>
                          机会类型 <span className="text-red-600">*</span>
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {TYPE_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setOpportunityType(opt.value)}
                              className={`tag-border rounded-full px-4 py-2 text-sm font-medium transition-all ${
                                opportunityType === opt.value
                                  ? `border-[#D4A574] bg-[rgba(212,165,116,0.15)] ${typeTagClass(opt.value)}`
                                  : "text-[#5D4E3A]"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </section>

                    <section className="space-y-4 border-t border-[rgba(212,165,116,0.15)] pt-10">
                      <h2 className="text-lg font-semibold text-[#2C2416]">合作需求</h2>
                      <p className="text-xs text-[#9A8B78]">与详情页「合作需求」区块对应：摘要可一句话概括，正文支持职责、要求、协作方式等。</p>
                      <div>
                        <label className={labelClass}>合作需求摘要（选填）</label>
                        <input
                          type="text"
                          value={summary}
                          onChange={(e) => setSummary(e.target.value)}
                          placeholder="一句话说明合作或岗位核心"
                          className={inputClass}
                          maxLength={500}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>
                          合作需求详情 <span className="text-red-600">*</span>
                        </label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={8}
                          placeholder="可写清背景、交付物、周期、对接方式、资质要求等，便于浏览者发起合作投递。"
                          className={`${inputClass} resize-none`}
                          required
                        />
                      </div>
                    </section>

                    <section className="space-y-4 border-t border-[rgba(212,165,116,0.15)] pt-10">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 shrink-0 text-[#D4A574]" aria-hidden />
                        <h2 className="text-lg font-semibold text-[#2C2416]">地点与协作方式</h2>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className={labelClass}>城市 / 地区</label>
                          <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="例如：北京、上海、远程"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>到岗形式</label>
                          <select
                            value={locationType}
                            onChange={(e) => setLocationType(e.target.value as typeof locationType)}
                            className={inputClass}
                          >
                            <option value="onsite">现场</option>
                            <option value="remote">远程</option>
                            <option value="hybrid">混合</option>
                          </select>
                        </div>
                      </div>
                    </section>

                    <section className="space-y-4 border-t border-[rgba(212,165,116,0.15)] pt-10">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 shrink-0 text-[#D4A574]" aria-hidden />
                        <h2 className="text-lg font-semibold text-[#2C2416]">截止与预算</h2>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className={labelClass}>合作投递截止日期（选填）</label>
                          <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={inputClass} />
                          <p className="mt-1.5 text-xs text-[#9A8B78]">不填则长期开放，与详情页「投递时间」说明一致。</p>
                        </div>
                        <div>
                          <label className={labelClass}>预算金额（选填，数字）</label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={budget}
                            onChange={(e) => setBudget(e.target.value)}
                            placeholder="例如：80000（人民币）"
                            className={inputClass}
                          />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>报酬说明（选填）</label>
                        <input
                          type="text"
                          value={compensationType}
                          onChange={(e) => setCompensationType(e.target.value)}
                          placeholder="例如：15–25K/月、按里程碑、面议"
                          className={inputClass}
                        />
                      </div>
                    </section>

                    <section className="space-y-4 border-t border-[rgba(212,165,116,0.15)] pt-10">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 shrink-0 text-[#D4A574]" aria-hidden />
                        <h2 className="text-lg font-semibold text-[#2C2416]">投递文件要求</h2>
                      </div>
                      <p className="text-xs text-[#9A8B78]">
                        对应详情页「投递文件要求」：每行一条，投递方将按此准备材料（如作品集 PDF、脱敏案例、资质扫描件等）。
                      </p>
                      <textarea
                        value={applicationFileRequirements}
                        onChange={(e) => setApplicationFileRequirements(e.target.value)}
                        rows={5}
                        placeholder={`- 个人简历 PDF\n- 近一年代表案例 1–2 件（可脱敏）\n- 可投入时间说明`}
                        className={`${inputClass} resize-none font-mono text-xs leading-relaxed sm:text-sm`}
                      />
                    </section>

                    <section className="space-y-4 border-t border-[rgba(212,165,116,0.15)] pt-10">
                      <h2 className="text-lg font-semibold text-[#2C2416]">对接方式（选填）</h2>
                      <p className="text-xs text-[#9A8B78]">发布后仅对登录用户展示；游客不会在详情页看到联系方式。</p>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className={labelClass}>联系邮箱</label>
                          <input
                            type="email"
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            placeholder="用于投递方联系"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>微信 / 其他</label>
                          <input
                            type="text"
                            value={contactWechat}
                            onChange={(e) => setContactWechat(e.target.value)}
                            placeholder="微信号或备注"
                            className={inputClass}
                          />
                        </div>
                      </div>
                    </section>

                    <section className="space-y-4 border-t border-[rgba(212,165,116,0.15)] pt-10">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 shrink-0 text-[#D4A574]" aria-hidden />
                        <h2 className="text-lg font-semibold text-[#2C2416]">补充标签（选填）</h2>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className={labelClass}>领域 / 分类</label>
                          <input
                            type="text"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="例如：争议解决、常法、知产"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>行业</label>
                          <input
                            type="text"
                            value={industry}
                            onChange={(e) => setIndustry(e.target.value)}
                            placeholder="例如：互联网、制造业"
                            className={inputClass}
                          />
                        </div>
                      </div>
                    </section>

                    <div className="flex flex-col gap-3 border-t border-[rgba(212,165,116,0.15)] pt-8 sm:flex-row sm:items-center">
                      <button type="submit" disabled={!canSubmit || busy} className={`${primaryCtaClass} sm:min-w-[10rem]`}>
                        {busy ? "提交中…" : "提交发布"}
                      </button>
                      <Link
                        href="/opportunities"
                        className="inline-flex items-center justify-center rounded-xl border border-[rgba(212,165,116,0.35)] px-6 py-3.5 text-sm font-medium text-[#5D4E3A] transition-colors hover:bg-[rgba(212,165,116,0.08)]"
                      >
                        取消
                      </Link>
                    </div>
                  </form>
                )}
              </article>
            </div>

            <aside className="lg:col-span-1">
              <div
                className={`rounded-2xl border border-[rgba(212,165,116,0.25)] marketing-cream-card-surface p-6 transition-all hover:border-[#D4A574] hover:shadow-md ${guestUnlockCardSurfaceClassName}`}
              >
                <h3 className="text-sm font-semibold text-[#2C2416]">与详情页的对应关系</h3>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-[#5D4E3A]">
                  <li>
                    <span className="font-medium text-[#2C2416]">主题</span> → 详情页标题「主题：…」
                  </li>
                  <li>
                    <span className="font-medium text-[#2C2416]">合作需求</span> → 摘要 + 正文区块
                  </li>
                  <li>
                    <span className="font-medium text-[#2C2416]">投递文件要求</span> → 详情页材料清单（每行一条）
                  </li>
                  <li>
                    <span className="font-medium text-[#2C2416]">截止与预算</span> → 投递时间与预算参考展示
                  </li>
                </ul>
                <div className="mt-6 rounded-xl border border-[rgba(212,165,116,0.22)] bg-[rgba(255,255,255,0.38)] px-4 py-3 text-xs leading-relaxed text-[#9A8B78] backdrop-blur-[2px]">
                  提交后状态为「发布中」，会立即公开到机会列表；合作投递文件进入「工作台 → 机会投递」，并会向你推送通知。若平台判定违规，后台可下架并通知发布者。
                </div>
                <Link href="/opportunities" className="mt-6 inline-flex text-sm font-medium text-[#D4A574] hover:text-[#B8860B]">
                  浏览全部机会 →
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
