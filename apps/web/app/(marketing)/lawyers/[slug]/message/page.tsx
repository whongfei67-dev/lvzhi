"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Send } from "lucide-react";
import {
  buildLawyerDetailView,
  type LawyerDetailView,
} from "@/lib/lawyer-detail-view";

function segmentSlug(raw: string | string[] | undefined): string {
  if (raw == null) return "";
  return Array.isArray(raw) ? (raw[0] ?? "") : raw;
}

export default function LawyerMessageIntakePage() {
  const routeParams = useParams<{ slug?: string | string[] }>();
  const slug = segmentSlug(routeParams?.slug);
  const router = useRouter();
  const searchParams = useSearchParams();
  const sp = useMemo(() => searchParams ?? new URLSearchParams(), [searchParams]);
  const intent = sp.get("intent");
  const from = sp.get("from");
  const productId = sp.get("productId");
  const productTitle = sp.get("productTitle") ?? "";
  const isCollaborationInvite = intent === "collaboration";
  const queryString = sp.toString();

  const [session, setSession] = useState<{ id: string } | null | undefined>(undefined);
  const [view, setView] = useState<LawyerDetailView | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [phone, setPhone] = useState("");
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [topicPrefilled, setTopicPrefilled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { getSession } = await import("@/lib/api/client");
        const s = await getSession();
        if (!cancelled) setSession(s ? { id: s.id } : null);
      } catch {
        if (!cancelled) setSession(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      let apiRow: Record<string, unknown> | null = null;
      try {
        const { api } = await import("@/lib/api/client");
        apiRow = (await api.lawyers.get(slug)) as Record<string, unknown>;
      } catch {
        apiRow = null;
      }
      if (!cancelled) setView(buildLawyerDetailView(slug, apiRow));
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (topicPrefilled || !isCollaborationInvite) return;
    if (productTitle.trim()) {
      setTopic((t) => (t.trim() ? t : `合作邀请：${productTitle.trim()}`));
    }
    setTopicPrefilled(true);
  }, [isCollaborationInvite, productTitle, topicPrefilled]);

  useEffect(() => {
    if (session !== null || !slug) return;
    const path = `/lawyers/${encodeURIComponent(slug)}/message${queryString ? `?${queryString}` : ""}`;
    router.replace(`/login?returnUrl=${encodeURIComponent(path)}`);
  }, [session, router, slug, queryString]);

  if (session === undefined || session === null) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] px-6 py-16">
        <div className="mx-auto max-w-lg text-center text-sm text-[#9A8B78]">
          {session === undefined ? "正在校验登录状态…" : "正在跳转登录…"}
        </div>
      </div>
    );
  }

  if (!view) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] px-6 py-16">
        <div className="mx-auto max-w-lg animate-pulse text-center text-sm text-[#9A8B78]">加载中…</div>
      </div>
    );
  }

  const backHref =
    from === "inspiration" && productId
      ? `/inspiration/${encodeURIComponent(productId)}`
      : `/lawyers/${encodeURIComponent(slug)}`;

  return (
    <div className="min-h-screen bg-[#FFF8F0] pb-16 pt-20">
      <div className="mx-auto max-w-lg px-6 lg:px-8">
        <Link
          href={backHref}
          className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-[#5C4033] hover:text-[#D4A574]"
        >
          <ChevronLeft className="h-4 w-4" />
          {from === "inspiration" && productId ? "返回作品详情" : "返回律师主页"}
        </Link>

        <div className="rounded-2xl border border-[rgba(212,165,116,0.25)] bg-white p-8 shadow-sm">
          <h1 className="font-serif text-xl font-bold text-[#5C4033]">
            {isCollaborationInvite ? "合作邀请 · 留言" : "留言登记"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#5D4E3A]">
            {isCollaborationInvite ? (
              <>
                向创作者 <span className="font-semibold text-[#2C2416]">{view.name}</span>{" "}
                发起合作邀请留言。提交后，创作者将尽快与您联系（当前为前端演示流程，以实际上线为准）。
              </>
            ) : (
              <>
                向 <span className="font-semibold text-[#2C2416]">{view.name}</span>{" "}
                律师留言。提交后，系统将把留言推送给该律师（当前为前端演示，未接推送接口）。
              </>
            )}
          </p>

          {submitted ? (
            <div className="mt-8 rounded-xl bg-[rgba(212,165,116,0.12)] px-4 py-6 text-center text-sm text-[#5C4033]">
              {isCollaborationInvite ? (
                <>已记录你的合作邀请留言（演示）。创作者将尽快与您联系。</>
              ) : (
                <>已记录您的留言（演示）。律师将通过平台查看并与您联系。</>
              )}
              <div className="mt-4">
                <Link href={backHref} className="text-sm font-medium text-[#B8860B] underline">
                  {from === "inspiration" && productId ? "返回作品详情" : "返回律师主页"}
                </Link>
              </div>
            </div>
          ) : (
            <form
              className="mt-8 space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
              }}
            >
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#9A8B78]">联系电话</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-[rgba(212,165,116,0.35)] bg-[#FFFCF7] px-4 py-3 text-sm text-[#2C2416] outline-none ring-[#D4A574]/40 focus:ring-2"
                  placeholder="便于律师回复"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#9A8B78]">留言主题</label>
                <input
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full rounded-xl border border-[rgba(212,165,116,0.35)] bg-[#FFFCF7] px-4 py-3 text-sm text-[#2C2416] outline-none ring-[#D4A574]/40 focus:ring-2"
                  placeholder="简要说明"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#9A8B78]">留言内容</label>
                <textarea
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full resize-y rounded-xl border border-[rgba(212,165,116,0.35)] bg-[#FFFCF7] px-4 py-3 text-sm text-[#2C2416] outline-none ring-[#D4A574]/40 focus:ring-2"
                  placeholder="您想说的话"
                />
              </div>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5C4033] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#8B7355]"
              >
                <Send className="h-[18px] w-[18px]" />
                提交留言
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
