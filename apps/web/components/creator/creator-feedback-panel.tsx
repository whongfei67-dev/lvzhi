"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageSquare, Reply, ThumbsDown, ThumbsUp } from "lucide-react";
import { getSession, type Session } from "@/lib/api/client";

type ReviewTarget = {
  id: string;
  label: string;
  type: "creator" | "product";
};

type FeedbackItem = {
  id: string;
  target_id: string;
  target_type: "creator" | "product";
  author: string;
  content: string;
  created_at: string;
  likes: number;
  dislikes: number;
  reply_to?: string;
};

type Props = {
  creatorId: string;
  creatorName: string;
  products: Array<{ id: string; title: string }>;
};

function storageKey(creatorId: string) {
  return `lvzhi_creator_feedback:${creatorId}`;
}

function readLocalFeedback(creatorId: string): FeedbackItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(creatorId));
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((x) => x && typeof x === "object")
      .map((x) => {
        const i = x as Record<string, unknown>;
        return {
          id: String(i.id || ""),
          target_id: String(i.target_id || ""),
          target_type: i.target_type === "product" ? "product" : "creator",
          author: String(i.author || "匿名用户"),
          content: String(i.content || ""),
          created_at: String(i.created_at || new Date().toISOString()),
          likes: Number(i.likes || 0),
          dislikes: Number(i.dislikes || 0),
          reply_to: i.reply_to ? String(i.reply_to) : undefined,
        } as FeedbackItem;
      })
      .filter((x) => x.id && x.target_id && x.content);
  } catch {
    return [];
  }
}

function saveLocalFeedback(creatorId: string, items: FeedbackItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(creatorId), JSON.stringify(items));
}

export function CreatorFeedbackPanel({ creatorId, creatorName, products }: Props) {
  const [session, setSession] = useState<Session | null>(null);
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [activeTargetId, setActiveTargetId] = useState<string>(`creator:${creatorId}`);

  useEffect(() => {
    getSession().then(setSession).catch(() => setSession(null));
  }, []);

  useEffect(() => {
    setItems(readLocalFeedback(creatorId));
  }, [creatorId]);

  const targets = useMemo<ReviewTarget[]>(() => {
    const creatorTarget: ReviewTarget = { id: `creator:${creatorId}`, label: `${creatorName}（创作者）`, type: "creator" };
    const productTargets: ReviewTarget[] = products.map((p) => ({
      id: `product:${p.id}`,
      label: p.title,
      type: "product",
    }));
    return [creatorTarget, ...productTargets];
  }, [creatorId, creatorName, products]);

  useEffect(() => {
    if (!targets.some((t) => t.id === activeTargetId)) {
      setActiveTargetId(targets[0]?.id || "");
    }
  }, [targets, activeTargetId]);

  const visibleItems = useMemo(() => {
    const [targetType, targetId] = activeTargetId.split(":");
    if (!targetType || !targetId) return [];
    return items
      .filter((i) => i.target_type === (targetType === "product" ? "product" : "creator") && i.target_id === targetId)
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  }, [activeTargetId, items]);

  function updateItems(next: FeedbackItem[]) {
    setItems(next);
    saveLocalFeedback(creatorId, next);
  }

  function submit() {
    const text = draft.trim();
    if (!text) {
      setError("评论内容不能为空");
      return;
    }
    if (!session || session.role === "visitor") {
      setError("请先登录后再评论");
      return;
    }
    const [targetType, targetId] = activeTargetId.split(":");
    if (!targetType || !targetId) return;
    const nextItem: FeedbackItem = {
      id: `fb_${Date.now()}`,
      target_id: targetId,
      target_type: targetType === "product" ? "product" : "creator",
      author: session.display_name || "用户",
      content: text,
      created_at: new Date().toISOString(),
      likes: 0,
      dislikes: 0,
      reply_to: replyTo || undefined,
    };
    updateItems([nextItem, ...items]);
    setDraft("");
    setReplyTo(null);
    setError(null);
  }

  function bump(id: string, key: "likes" | "dislikes") {
    updateItems(items.map((i) => (i.id === id ? { ...i, [key]: i[key] + 1 } : i)));
  }

  return (
    <section className="card space-y-4 p-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-[var(--ink)]">
          <MessageSquare className="h-4 w-4 text-[#D4A574]" />
          用户评价
        </h2>
        <span className="text-xs text-[var(--muted)]">共 {visibleItems.length} 条</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {targets.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setActiveTargetId(t.id);
              setReplyTo(null);
              setError(null);
            }}
            className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
              activeTargetId === t.id
                ? "border-[#D4A574] bg-[rgba(212,165,116,0.15)] text-[#5C4033]"
                : "border-[var(--line)] text-[var(--muted)] hover:border-[#D4A574]/40"
            }`}
          >
            {t.type === "creator" ? "创作者评价" : "产品评价"} · {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-2 rounded-2xl border border-[var(--line)] bg-white p-3">
        {replyTo ? (
          <p className="text-xs text-[var(--muted)]">
            正在回复：<span className="font-medium text-[var(--ink)]">{replyTo}</span>
          </p>
        ) : null}
        <textarea
          rows={3}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="写下你的评价，帮助更多用户做决策..."
          className="w-full resize-none rounded-xl border border-[var(--line)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[#D4A574]"
        />
        {error ? <p className="text-xs text-[#b63f2e]">{error}</p> : null}
        <div className="flex items-center justify-end gap-2">
          {replyTo ? (
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-xs text-[var(--muted)]"
            >
              取消回复
            </button>
          ) : null}
          <button
            type="button"
            onClick={submit}
            className="rounded-lg bg-[#D4A574] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#B8860B]"
          >
            发布评论
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {visibleItems.map((item) => (
          <article key={item.id} className="rounded-2xl border border-[var(--line)] bg-[rgba(255,248,240,0.5)] p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold text-[var(--ink)]">{item.author}</div>
              <time className="text-xs text-[var(--muted)]">{new Date(item.created_at).toLocaleString()}</time>
            </div>
            {item.reply_to ? (
              <p className="mt-1 text-xs text-[var(--muted)]">回复 @{item.reply_to}</p>
            ) : null}
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--ink)]">{item.content}</p>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => bump(item.id, "likes")}
                className="inline-flex items-center gap-1 rounded-md border border-[var(--line)] px-2 py-1 text-xs text-[var(--muted)]"
              >
                <ThumbsUp className="h-3.5 w-3.5" />
                {item.likes}
              </button>
              <button
                type="button"
                onClick={() => bump(item.id, "dislikes")}
                className="inline-flex items-center gap-1 rounded-md border border-[var(--line)] px-2 py-1 text-xs text-[var(--muted)]"
              >
                <ThumbsDown className="h-3.5 w-3.5" />
                {item.dislikes}
              </button>
              <button
                type="button"
                onClick={() => setReplyTo(item.author)}
                className="inline-flex items-center gap-1 rounded-md border border-[var(--line)] px-2 py-1 text-xs text-[var(--muted)]"
              >
                <Reply className="h-3.5 w-3.5" />
                回复
              </button>
            </div>
          </article>
        ))}
        {!visibleItems.length ? (
          <div className="rounded-2xl border border-dashed border-[var(--line)] p-5 text-center text-sm text-[var(--muted)]">
            暂无评价，欢迎发表第一条评论。
          </div>
        ) : null}
      </div>
    </section>
  );
}
