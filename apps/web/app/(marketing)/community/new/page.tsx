"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, getSession, type Session } from "@/lib/api/client";

const suggestedTags = [
  "智能体评测",
  "法律AI",
  "合同审查",
  "律师经验",
  "求职干货",
  "行业资讯",
  "工具推荐",
  "案例分析",
  "提问求助",
];

/** 发布页头图：安静会议室场景（低对比、暖色） */
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80";

const MIN_PUBLISH_DATE = "2026-04-16";
const MIN_POST_CONTENT_LENGTH = 20;

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function defaultPublishDate() {
  const t = todayIsoDate();
  return t < MIN_PUBLISH_DATE ? MIN_PUBLISH_DATE : t;
}

function clampPublishDate(d: string) {
  return d < MIN_PUBLISH_DATE ? MIN_PUBLISH_DATE : d;
}

function NewPostForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sp = useMemo(() => searchParams ?? new URLSearchParams(), [searchParams]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isPaid, setIsPaid] = useState(false);
  const [postPrice, setPostPrice] = useState("9.9");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [publishDate, setPublishDate] = useState(defaultPublishDate);

  useEffect(() => {
    getSession().then(setSession).catch(() => setSession(null));
  }, []);

  useEffect(() => {
    if (sp.get("intent") === "question") {
      setSelectedTags((prev) => (prev.includes("提问求助") ? prev : [...prev, "提问求助"]));
    }
  }, [sp]);

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("请填写帖子标题");
      return;
    }
    if (content.trim().length < MIN_POST_CONTENT_LENGTH) {
      setError(`内容有点短，至少写 ${MIN_POST_CONTENT_LENGTH} 个字再发布哦。`);
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const createdPost = await api.community.createPost({
        title: title.trim(),
        content: content.trim() || "",
        tags: selectedTags,
        ...(session
          ? {
              scheduled_publish_date: publishDate,
            }
          : {}),
      });

      setLoading(false);
      const createdPostId = String((createdPost as Record<string, unknown>)?.id ?? "").trim();
      setSuccessMessage("提交成功，正在跳转我的帖子");
      setTimeout(() => {
        if (createdPostId) {
          router.push(`/community/my-posts?highlight=${encodeURIComponent(createdPostId)}`);
          return;
        }
        router.push("/community/my-posts");
      }, 1200);
    } catch (err) {
      const raw = err instanceof Error ? err.message : "发布失败";
      if (/content\s*too\s*short|内容过短|内容太短/i.test(raw)) {
        setError(`内容有点短，至少写 ${MIN_POST_CONTENT_LENGTH} 个字再发布哦。`);
      } else {
        setError(raw);
      }
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen marketing-page-shell-tint">
      {successMessage && (
        <div className="pointer-events-none fixed right-6 top-6 z-[60] animate-[pulse_420ms_ease-out_1]">
          <div className="rounded-2xl border border-[rgba(212,165,116,0.35)] bg-gradient-to-r from-[#FFF4DD] via-[#FFEBC7] to-[#FFE2B3] px-4 py-3 text-sm font-medium text-[#7A4E15] shadow-lg">
            已提交审核
          </div>
        </div>
      )}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 z-0">
          <img
            src={HERO_IMAGE}
            alt=""
            className="h-full w-full object-cover opacity-[0.62]"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#F7EEE6]/56 via-[#EFE4D7]/42 to-[#E6D5C4]/34" />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-[#FFF8F0]/95" aria-hidden />
        </div>
        <div className="relative z-[2] mx-auto max-w-3xl space-y-2 px-6 pb-8 pt-24">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#D4A574]">社区讨论</p>
          <h1 className="text-2xl font-bold text-[#2C2416]">提交帖子审核</h1>
          <p className="text-sm leading-relaxed text-[#6B5B4D]">帖子提交后将进入审核流程，审核通过后展示在社区广场。</p>
        </div>
      </section>

      <div className="mx-auto max-w-2xl px-6 py-10">
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-3xl border border-[rgba(212,165,116,0.25)] bg-white p-8"
        >
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {session ? (
            <div className="space-y-2">
              <label htmlFor="publish-date" className="block text-sm font-semibold text-[#2C2416]">
                计划发布日期
              </label>
              <input
                id="publish-date"
                type="date"
                min={MIN_PUBLISH_DATE}
                value={publishDate}
                onChange={(e) => setPublishDate(clampPublishDate(e.target.value))}
                className="h-11 w-full max-w-xs rounded-xl border border-[rgba(212,165,116,0.25)] bg-white px-3 text-sm text-[#2C2416] outline-none focus:border-[#D4A574] focus:ring-2 focus:ring-[rgba(212,165,116,0.2)]"
              />
              <p className="text-xs text-[#9A8B78]">
                最早可选 {MIN_PUBLISH_DATE}；未登录发布时不展示此项。
              </p>
            </div>
          ) : null}

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-[#2C2416]">
              标题 <span className="text-red-500">*</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入帖子标题..."
              maxLength={200}
              className="h-11 w-full rounded-xl border border-[rgba(212,165,116,0.25)] bg-white px-4 text-sm text-[#2C2416] placeholder:text-[#9A8B78] focus:outline-none focus:border-[#D4A574] focus:ring-2 focus:ring-[rgba(212,165,116,0.2)]"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-[#2C2416]">内容</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="分享你的想法、经验或问题..."
              rows={8}
              className="w-full resize-none rounded-xl border border-[rgba(212,165,116,0.25)] bg-white px-4 py-3 text-sm leading-relaxed text-[#2C2416] placeholder:text-[#9A8B78] focus:outline-none focus:border-[#D4A574] focus:ring-2 focus:ring-[rgba(212,165,116,0.2)]"
            />
            <p className="text-xs text-[#9A8B78]">至少 {MIN_POST_CONTENT_LENGTH} 个字</p>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-semibold text-[#2C2416]">话题标签</label>
            <div className="flex flex-wrap gap-2">
              {suggestedTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    selectedTags.includes(tag)
                      ? "border-transparent bg-gradient-to-r from-[#D4A574] to-[#B8860B] text-white"
                      : "border-[rgba(212,165,116,0.25)] bg-white text-[#5D4E3A] hover:border-[#D4A574] hover:text-[#D4A574]"
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-[rgba(212,165,116,0.2)] bg-[rgba(212,165,116,0.08)] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#2C2416]">设为付费内容</p>
                <p className="mt-0.5 text-xs text-[#D4A574]">付费帖读者解锁后，你将获得分成收益</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPaid(!isPaid)}
                className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${isPaid ? "bg-[#D4A574]" : "bg-[#B8A88A]"}`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${isPaid ? "left-5" : "left-1"}`}
                />
              </button>
            </div>
            {isPaid && (
              <div className="flex items-center gap-3">
                <label className="shrink-0 text-sm text-[#D4A574]">定价（元）</label>
                <input
                  type="number"
                  min="1"
                  step="0.1"
                  value={postPrice}
                  onChange={(e) => setPostPrice(e.target.value)}
                  className="h-9 w-28 rounded-xl border border-[rgba(212,165,116,0.25)] bg-white px-3 text-sm text-[#2C2416] outline-none focus:border-[#D4A574]"
                />
                <p className="text-xs text-[#D4A574]">建议 ¥9.9 ~ ¥99</p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="h-11 rounded-xl bg-gradient-to-r from-[#D4A574] to-[#B8860B] px-8 text-sm font-semibold text-white transition-all hover:-translate-y-px hover:shadow-lg disabled:opacity-50"
            >
              {loading ? "提交中..." : "提交审核"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="h-11 rounded-xl border border-[rgba(212,165,116,0.25)] px-6 text-sm text-[#5D4E3A] transition-colors hover:border-[#D4A574] hover:text-[#D4A574]"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewPostPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[rgba(212,165,116,0.08)] text-sm text-[#5D4E3A]">
          加载中…
        </div>
      }
    >
      <NewPostForm />
    </Suspense>
  );
}
