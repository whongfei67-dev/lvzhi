"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Lock,
  ImagePlus,
  Smile,
  Reply,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { getSession, type Session, community } from "@/lib/api/client";
import { ProductDetailCreatorPanel } from "@/components/creator/product-detail-creator-panel";
import { PracticeLawyerBadge } from "@/components/common/practice-lawyer-badge";
import { ReportCornerButton } from "@/components/common/report-corner-button";
import { formatPostPublishedAtDisplay, postPublishedAtIsoAttribute } from "@/lib/community-post-time";
import { COMMUNITY_HOT_TAGS, COMMUNITY_QUICK_LINKS } from "@/lib/community-sidebar-links";
import { getCreatorById } from "@/lib/platform-demo-data";

const EMOJI_QUICK = ["😀", "🙂", "👍", "👎", "💡", "🙏", "⚖️", "✅", "❤️", "🔥", "🎉", "📎"];

/** 帖子详情顶区：清新柔和（浅紫绿花田 + 明亮漫射感，叠浅色渐变） */
const POST_DETAIL_HERO_BG =
  "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1920&q=80";

type CommentNode = {
  id: string;
  author: string;
  /** 平台执业律师认证，与昵称并排展示 */
  authorVerified?: boolean;
  avatar: string;
  content: string;
  createdAt: string;
  likes: number;
  dislikes: number;
  images: string[];
  replies: CommentNode[];
};

const MOCK_POST = {
  title: "如何设计一个好的法律智能体边界",
  author: "张律师",
  /** 与演示数据 `platform-demo-data` 中创作者 id 对齐，用于创作者信息卡片 */
  authorCreatorId: "2",
  /** 与 `lawyer-detail-view` 预设及灵感广场 `/lawyers/[slug]` 一致 */
  authorLawyerSlug: "张律师",
  authorVerified: false,
  authorLawyerVerified: false,
  authorAvatar: "张",
  publishTimeIso: "2026-04-21T09:30:00.000Z",
  content: `在设计法律智能体时，边界设置是一个非常重要的环节。一个好的边界设计可以：\n\n1. 明确适用范围\n每个智能体都有其擅长的领域和不适用的场景。在设计时，应该明确告知用户这个智能体适用于哪些情况，哪些情况下不应该使用。\n\n2. 设置免责声明\n法律领域存在很高的专业性和风险性。智能体的输出只能作为参考，不能替代专业律师的法律意见。因此，必要的免责声明是必须的。\n\n3. 关键场景提示\n对于一些关键的、涉及重大权益的场景（如婚姻财产分割、刑事案件等），应该设置额外的提示，引导用户寻求专业帮助。\n\n4. 持续迭代优化\n边界设置不是一次性的工作，需要根据用户反馈和实际使用情况不断调整优化。`,
  tags: ["智能体设计", "法律AI", "产品设计"],
  likes: 128,
  dislikes: 3,
  comments: 45,
  views: 2560,
};

function initialComments(): CommentNode[] {
  return [
    {
      id: "c1",
      author: "李法务",
      authorVerified: false,
      avatar: "李",
      content: "说得很好！我在设计智能体时就忽略了边界设置，导致用户反馈不太好用。",
      createdAt: "2026-04-22T08:30:00.000Z",
      likes: 12,
      dislikes: 0,
      images: [],
      replies: [
        {
          id: "c1-r1",
          author: "张律师",
          authorVerified: false,
          avatar: "张",
          content: "可以从「提示词 + 场景清单」双轨入手，先小范围灰度。",
          createdAt: "2026-04-22T09:00:00.000Z",
          likes: 5,
          dislikes: 0,
          images: [],
          replies: [
            {
              id: "c1-r1-n1",
              author: "李法务",
              authorVerified: false,
              avatar: "李",
              content: "收到，我试试灰度方案 👍",
              createdAt: "2026-04-22T09:15:00.000Z",
              likes: 2,
              dislikes: 0,
              images: [],
              replies: [],
            },
          ],
        },
      ],
    },
    {
      id: "c2",
      author: "王律师",
      authorVerified: false,
      avatar: "王",
      content: "关键是要在用户使用前就给出提示，而不是事后补救。",
      createdAt: "2026-04-22T07:45:00.000Z",
      likes: 8,
      dislikes: 1,
      images: [],
      replies: [],
    },
  ];
}

/** 本条评论下全部子回复条数（不含自身） */
function totalNestedReplyCount(replies: CommentNode[]): number {
  return replies.reduce((acc, r) => acc + 1 + totalNestedReplyCount(r.replies), 0);
}

function CommentBlock({
  node,
  depth,
  onReply,
  onLike,
  onDislike,
}: {
  node: CommentNode;
  depth: number;
  onReply: (parentId: string, author: string) => void;
  onLike: (id: string) => void;
  onDislike: (id: string) => void;
}) {
  const [repliesOpen, setRepliesOpen] = useState(false);
  const pad = depth > 0 ? "pl-4 sm:pl-8 border-l border-[rgba(212,165,116,0.25)]" : "";
  const replyCount = node.replies.length ? totalNestedReplyCount(node.replies) : 0;

  return (
    <div className={`space-y-3 ${pad}`}>
      <div className="rounded-xl border border-[rgba(212,165,116,0.15)] bg-[rgba(255,252,248,0.65)] p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[rgba(212,165,116,0.15)] text-sm font-medium text-[#D4A574]">
              {node.avatar}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-medium text-[#2C2416]">{node.author}</span>
                <time
                  dateTime={postPublishedAtIsoAttribute(node.createdAt)}
                  className="text-xs tabular-nums text-[#9A8B78]"
                >
                  {formatPostPublishedAtDisplay(node.createdAt)}
                </time>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => onLike(node.id)}
              className="inline-flex items-center gap-1 rounded-lg border border-transparent px-2 py-1 text-xs text-[#5D4E3A] hover:border-[rgba(212,165,116,0.35)] hover:bg-white"
            >
              <ThumbsUp className="h-3.5 w-3.5 text-[#D4A574]" />
              {node.likes}
            </button>
            <button
              type="button"
              onClick={() => onDislike(node.id)}
              className="inline-flex items-center gap-1 rounded-lg border border-transparent px-2 py-1 text-xs text-[#5D4E3A] hover:border-[rgba(212,165,116,0.35)] hover:bg-white"
            >
              <ThumbsDown className="h-3.5 w-3.5 text-[#9A8B78]" />
              {node.dislikes}
            </button>
            <button
              type="button"
              onClick={() => onReply(node.id, node.author)}
              className="inline-flex items-center gap-1 rounded-lg border border-transparent px-2 py-1 text-xs text-[#D4A574] hover:bg-white"
            >
              <Reply className="h-3.5 w-3.5" />
              回复
            </button>
            {replyCount > 0 ? (
              <button
                type="button"
                aria-expanded={repliesOpen}
                onClick={() => setRepliesOpen((o) => !o)}
                className="inline-flex items-center gap-1 rounded-lg border border-transparent px-2 py-1 text-xs text-[#9A8B78] hover:bg-white hover:text-[#D4A574]"
              >
                {repliesOpen ? (
                  <ChevronUp className="h-3.5 w-3.5 shrink-0" aria-hidden />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
                )}
                {repliesOpen ? "收起回复" : `查看回复（${replyCount}）`}
              </button>
            ) : null}
          </div>
        </div>
        <p className="mt-3 whitespace-pre-wrap pl-0 text-[0.9375rem] leading-relaxed text-[#5D4E3A] sm:pl-12">
          {node.content}
        </p>
        {node.images.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2 sm:pl-12">
            {node.images.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={src}
                alt=""
                className="max-h-48 max-w-full rounded-lg border border-[rgba(212,165,116,0.2)] object-contain"
              />
            ))}
          </div>
        ) : null}
      </div>
      {replyCount > 0 && repliesOpen ? (
        <div className="space-y-3">
          {node.replies.map((r) => (
            <CommentBlock
              key={r.id}
              node={r}
              depth={depth + 1}
              onReply={onReply}
              onLike={onLike}
              onDislike={onDislike}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function updateCommentTree(
  list: CommentNode[],
  id: string,
  fn: (n: CommentNode) => CommentNode
): CommentNode[] {
  return list.map((n) => {
    if (n.id === id) return fn(n);
    if (n.replies.length) {
      return { ...n, replies: updateCommentTree(n.replies, id, fn) };
    }
    return n;
  });
}

function findMaxDepthReply(list: CommentNode[], parentId: string, newReply: CommentNode): CommentNode[] {
  return list.map((n) => {
    if (n.id === parentId) {
      return { ...n, replies: [...n.replies, newReply] };
    }
    if (n.replies.length) {
      return { ...n, replies: findMaxDepthReply(n.replies, parentId, newReply) };
    }
    return n;
  });
}

export function PostDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const [session, setSession] = useState<Session | null>(null);
  const [post, setPost] = useState(MOCK_POST);
  const [postId, setPostId] = useState("");
  const [postLiked, setPostLiked] = useState(false);
  const [postDisliked, setPostDisliked] = useState(false);
  const [postActionLoading, setPostActionLoading] = useState(false);
  const [comments, setComments] = useState<CommentNode[]>(() => initialComments());
  const [draft, setDraft] = useState("");
  const [draftImages, setDraftImages] = useState<string[]>([]);
  const [replyTo, setReplyTo] = useState<{ id: string; author: string } | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [replyImages, setReplyImages] = useState<string[]>([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showReplyEmoji, setShowReplyEmoji] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const replyFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getSession().then(setSession).catch(() => setSession(null));
  }, []);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    community
      .getPost(slug)
      .then((raw) => {
        if (cancelled) return;
        const authorName = String(raw.author_name ?? "匿名用户");
        const tagsRaw = Array.isArray(raw.tags) ? (raw.tags as unknown[]).map(String) : [];
        setPost({
          title: String(raw.title ?? "未命名帖子"),
          author: authorName,
          authorCreatorId: String(raw.author_id ?? ""),
          authorLawyerSlug:
            typeof raw.author_lawyer_slug === "string" && raw.author_lawyer_slug.trim()
              ? raw.author_lawyer_slug.trim()
              : "",
          authorVerified: false,
          authorLawyerVerified: Boolean(raw.author_lawyer_verified),
          authorAvatar: (authorName.trim()[0] || "匿").slice(0, 1),
          publishTimeIso: String(raw.created_at ?? new Date().toISOString()),
          content: String(raw.content ?? ""),
          tags: tagsRaw,
          likes: Number(raw.like_count ?? 0),
          dislikes: Number(raw.dislike_count ?? 0),
          comments: Number(raw.comment_count ?? 0),
          views: Number(raw.view_count ?? 0),
        });
        setPostId(String(raw.id ?? slug));
      })
      .catch((error) => {
        console.error("Failed to fetch post detail:", error);
        setPostId(slug);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const publishedLabel = useMemo(() => formatPostPublishedAtDisplay(post.publishTimeIso), [post.publishTimeIso]);
  const authorProfile = useMemo(() => getCreatorById(post.authorCreatorId), [post.authorCreatorId]);

  function appendEmoji(ch: string, toReply: boolean) {
    if (toReply) setReplyDraft((s) => s + ch);
    else setDraft((s) => s + ch);
  }

  function onPickFiles(files: FileList | null, toReply: boolean) {
    if (!files?.length) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/") && file.type !== "image/gif") return;
      const reader = new FileReader();
      reader.onload = () => {
        const url = String(reader.result || "");
        if (!url) return;
        if (toReply) setReplyImages((prev) => [...prev, url]);
        else setDraftImages((prev) => [...prev, url]);
      };
      reader.readAsDataURL(file);
    });
  }

  function submitTopComment() {
    const text = draft.trim();
    if (!text && draftImages.length === 0) return;
    const node: CommentNode = {
      id: `c-${Date.now()}`,
      author: session?.display_name || "我",
      authorVerified: false,
      avatar: (session?.display_name?.[0] || "我").slice(0, 1),
      content: text || "（图片）",
      createdAt: new Date().toISOString(),
      likes: 0,
      dislikes: 0,
      images: [...draftImages],
      replies: [],
    };
    setComments((c) => [node, ...c]);
    setDraft("");
    setDraftImages([]);
  }

  function submitReply() {
    if (!replyTo) return;
    const text = replyDraft.trim();
    if (!text && replyImages.length === 0) return;
    const node: CommentNode = {
      id: `r-${Date.now()}`,
      author: session?.display_name || "我",
      authorVerified: false,
      avatar: (session?.display_name?.[0] || "我").slice(0, 1),
      content: text || "（图片）",
      createdAt: new Date().toISOString(),
      likes: 0,
      dislikes: 0,
      images: [...replyImages],
      replies: [],
    };
    setComments((c) => findMaxDepthReply(c, replyTo.id, node));
    setReplyTo(null);
    setReplyDraft("");
    setReplyImages([]);
  }

  function bumpLike(id: string) {
    setComments((c) =>
      updateCommentTree(c, id, (n) => ({
        ...n,
        likes: n.likes + 1,
      }))
    );
  }

  function bumpDislike(id: string) {
    setComments((c) =>
      updateCommentTree(c, id, (n) => ({
        ...n,
        dislikes: n.dislikes + 1,
      }))
    );
  }

  async function togglePostLike() {
    if (!slug || postActionLoading) return;
    if (!session) {
      router.push(`/login?next=${encodeURIComponent(`/community/post/${slug}`)}`);
      return;
    }
    setPostActionLoading(true);
    try {
      if (postLiked) {
        await community.unlike(slug);
      } else {
        await community.like(slug);
      }
      setPost((prev) => ({
        ...prev,
        likes: Math.max(0, prev.likes + (postLiked ? -1 : 1)),
        dislikes: !postLiked && postDisliked ? Math.max(0, prev.dislikes - 1) : prev.dislikes,
      }));
      setPostLiked((v) => !v);
      if (!postLiked && postDisliked) setPostDisliked(false);
    } catch (error) {
      console.error("Failed to toggle post like:", error);
    } finally {
      setPostActionLoading(false);
    }
  }

  function togglePostDislike() {
    setPost((prev) => ({
      ...prev,
      likes: postLiked ? Math.max(0, prev.likes - 1) : prev.likes,
      // 仅前端态点踩（后端暂无点踩接口）
      dislikes: Math.max(0, prev.dislikes + (postDisliked ? -1 : 1)),
    }));
    if (postLiked) setPostLiked(false);
    setPostDisliked((v) => !v);
  }

  const commentForm = (opts: { reply?: boolean }) => {
    const toReply = !!opts.reply;
    const value = toReply ? replyDraft : draft;
    const setValue = toReply ? setReplyDraft : setDraft;
    const imgs = toReply ? replyImages : draftImages;
    const setImgs = toReply ? setReplyImages : setDraftImages;
    const inputRef = toReply ? replyFileRef : fileRef;
    const emojiOpen = toReply ? showReplyEmoji : showEmoji;
    const setEmojiOpen = toReply ? setShowReplyEmoji : setShowEmoji;

    return (
      <div className="space-y-3">
        <textarea
          rows={toReply ? 2 : 4}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={toReply ? `回复 @${replyTo?.author}…` : "写下你的评论，支持粘贴表情…"}
          className="w-full resize-none rounded-xl border border-[rgba(212,165,116,0.25)] bg-white px-4 py-3 text-[#2C2416] placeholder:text-[#9A8B78] focus:border-[#D4A574] focus:outline-none focus:ring-2 focus:ring-[#D4A574]/10"
        />
        {imgs.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {imgs.map((src, i) => (
              <div key={i} className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-20 w-20 rounded-lg border object-cover" />
                <button
                  type="button"
                  onClick={() => setImgs((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute -right-1 -top-1 rounded-full bg-[#2C2416] p-0.5 text-white shadow"
                  aria-label="移除图片"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*,.gif"
            multiple
            className="hidden"
            onChange={(e) => onPickFiles(e.target.files, toReply)}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1 rounded-lg border border-[rgba(212,165,116,0.35)] bg-white px-3 py-2 text-xs font-medium text-[#5D4E3A] hover:border-[#D4A574]"
          >
            <ImagePlus className="h-4 w-4 text-[#D4A574]" />
            图片 / GIF
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setEmojiOpen((o) => !o)}
              className="inline-flex items-center gap-1 rounded-lg border border-[rgba(212,165,116,0.35)] bg-white px-3 py-2 text-xs font-medium text-[#5D4E3A] hover:border-[#D4A574]"
            >
              <Smile className="h-4 w-4 text-[#D4A574]" />
              表情
            </button>
            {emojiOpen ? (
              <div className="absolute left-0 top-full z-20 mt-1 flex max-w-[280px] flex-wrap gap-1 rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-2 shadow-lg">
                {EMOJI_QUICK.map((e) => (
                  <button
                    key={e}
                    type="button"
                    className="rounded px-1.5 py-1 text-lg hover:bg-[rgba(212,165,116,0.12)]"
                    onClick={() => {
                      appendEmoji(e, toReply);
                      setEmojiOpen(false);
                    }}
                  >
                    {e}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={toReply ? submitReply : submitTopComment}
            className="ml-auto rounded-xl bg-[#D4A574] px-5 py-2 text-sm font-medium text-white hover:bg-[#B8860B]"
          >
            {toReply ? "发表回复" : "发布评论"}
          </button>
          {toReply ? (
            <button
              type="button"
              onClick={() => {
                setReplyTo(null);
                setReplyDraft("");
                setReplyImages([]);
              }}
              className="text-xs text-[#9A8B78] hover:text-[#D4A574]"
            >
              取消回复
            </button>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <div className="relative">
        {/* 最底层：仅作装饰的背景条（帖子内容上移后叠在其上） */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[11.5rem] overflow-hidden sm:h-[13rem] lg:h-[14.5rem]"
          aria-hidden
        >
          <div
            className="absolute inset-0 bg-cover bg-center opacity-[0.88] saturate-[0.88] contrast-[0.96]"
            style={{ backgroundImage: `url(${POST_DETAIL_HERO_BG})` }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(255,255,255,0.84) 0%, rgba(245,243,252,0.36) 40%, rgba(255,248,240,0) 70%)",
            }}
          />
          <div className="absolute inset-x-0 bottom-0 h-12 sm:h-14" aria-hidden>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#FFF8F0]/55 to-[#FFF8F0]" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#FFF8F0]/28 to-[#FFF8F0] backdrop-blur-sm sm:backdrop-blur-md" />
          </div>
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-6 pb-8 pt-28 sm:pt-32 lg:px-8 lg:pb-10 lg:pt-36">
          <div className="grid gap-8 lg:grid-cols-3 lg:items-start">
            <div className="min-w-0 space-y-8 lg:col-span-2">
              <article className="relative rounded-2xl border border-[rgba(212,165,116,0.25)] bg-white p-8 shadow-md shadow-black/[0.04]">
              <Link
                href="/community"
                className="absolute right-4 top-4 z-20 inline-flex items-center gap-1.5 rounded-full border border-violet-100/90 bg-white/95 px-3 py-1.5 text-xs font-medium text-[#5c5668] shadow-sm shadow-violet-900/5 backdrop-blur-sm transition-colors hover:border-violet-200/90 hover:bg-white hover:text-[#4a4458] sm:right-6 sm:top-6 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
              >
                <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                返回社区
              </Link>
              <header className="mb-8 min-w-0 border-b border-[rgba(212,165,116,0.2)] pb-8 pr-24 sm:pr-40">
                <div className="mb-4 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Link key={tag} href={`/community/tag/${encodeURIComponent(tag)}`} className="tag">
                      {tag}
                    </Link>
                  ))}
                </div>
                <div className="min-w-0 max-w-full">
                  <h1
                    className="truncate text-xl font-bold leading-snug tracking-tight text-[#2C2416] sm:text-2xl lg:text-2xl"
                    title={post.title}
                  >
                    {post.title}
                  </h1>
                </div>
                <p className="mt-3 text-xs text-[#9A8B78]">帖子 ID：{slug || post.title}</p>
                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#5D4E3A]">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[rgba(212,165,116,0.15)] text-sm font-bold text-[#D4A574]">
                      {post.authorAvatar}
                    </div>
                    <span className="inline-flex items-center gap-1.5 font-medium text-[#2C2416]">
                      <span>{post.author}</span>
                      {post.authorLawyerVerified ? <PracticeLawyerBadge className="!text-[10px]" /> : null}
                    </span>
                  </div>
                  <time
                    dateTime={postPublishedAtIsoAttribute(post.publishTimeIso)}
                    className="tabular-nums text-[#9A8B78]"
                  >
                    发布于 {publishedLabel}
                  </time>
                  <span className="inline-flex items-center gap-1 text-[#9A8B78]">
                    <Eye className="h-4 w-4 shrink-0 text-[#D4A574]" />
                    {post.views.toLocaleString()} 次浏览
                  </span>
                </div>
              </header>
              <div className="prose prose-slate max-w-none">
                {post.content.split("\n\n").map((paragraph, idx) => (
                  <div key={idx}>
                    <p className="leading-relaxed text-[#5D4E3A]">{paragraph}</p>
                    {idx < post.content.split("\n\n").length - 1 ? <br /> : null}
                  </div>
                ))}
              </div>
              </article>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={togglePostLike}
                disabled={postActionLoading}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-[#5D4E3A] ${
                  postLiked
                    ? "border-[#D4A574] bg-[rgba(212,165,116,0.12)] text-[#B8860B]"
                    : "border-[rgba(212,165,116,0.25)] bg-white hover:border-[#D4A574]"
                } disabled:opacity-60`}
              >
                <ThumbsUp className="h-4 w-4" />
                {post.likes} 点赞
              </button>
              <button
                type="button"
                onClick={togglePostDislike}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-[#5D4E3A] ${
                  postDisliked
                    ? "border-[#B8A88A] bg-[rgba(184,168,138,0.16)] text-[#5C4033]"
                    : "border-[rgba(212,165,116,0.25)] bg-white hover:border-[#B8A88A]"
                }`}
              >
                <ThumbsDown className="h-4 w-4" />
                {post.dislikes} 点踩
              </button>
              <button
                type="button"
                className="flex items-center gap-2 rounded-xl border border-[rgba(212,165,116,0.25)] bg-white px-4 py-2 text-[#5D4E3A] hover:border-[#D4A574]"
              >
                <MessageSquare className="h-4 w-4" />
                {post.comments} 评论
              </button>
            </div>

            <section className="relative overflow-hidden rounded-2xl border border-[rgba(212,165,116,0.25)] bg-white p-8 shadow-sm">
              <div
                className={
                  session
                    ? ""
                    : "pointer-events-none select-none opacity-[0.42] saturate-[0.85]"
                }
              >
                <h2 className="mb-6 text-xl font-bold text-[#2C2416]">评论</h2>

                {session ? (
                  <div className="mb-8 space-y-6 border-b border-[rgba(212,165,116,0.15)] pb-8">
                    <div>
                      <p className="mb-2 text-sm font-medium text-[#5C4033]">发表评论</p>
                      {commentForm({ reply: false })}
                    </div>
                    {replyTo ? (
                      <div className="rounded-xl border border-[rgba(212,165,116,0.3)] bg-[rgba(255,252,248,0.9)] p-4">
                        <p className="mb-3 text-sm text-[#5D4E3A]">
                          回复 <span className="font-medium text-[#D4A574]">@{replyTo.author}</span>
                        </p>
                        {commentForm({ reply: true })}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="space-y-6">
                  {comments.map((c) => (
                    <CommentBlock
                      key={c.id}
                      node={c}
                      depth={0}
                      onReply={(id, author) => {
                        if (!session) return;
                        setReplyTo({ id, author });
                        setReplyDraft("");
                        setReplyImages([]);
                      }}
                      onLike={bumpLike}
                      onDislike={bumpDislike}
                    />
                  ))}
                </div>
              </div>

              {!session ? (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl bg-[rgba(255,252,248,0.52)] px-6 py-10 backdrop-blur-[3px]">
                  <Lock className="h-6 w-6 text-[#B8860B]" aria-hidden />
                  <p className="text-center text-sm font-medium text-[#5C4033]">登录后解锁更多精彩互动</p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Link
                      href="/login"
                      className="rounded-xl border border-[rgba(212,165,116,0.45)] bg-white/90 px-5 py-2 text-sm font-medium text-[#D4A574] shadow-sm hover:border-[#D4A574]"
                    >
                      登录
                    </Link>
                    <Link
                      href="/register"
                      className="rounded-xl bg-[#D4A574] px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#B8860B]"
                    >
                      注册
                    </Link>
                  </div>
                </div>
              ) : null}
            </section>

            <section className="rounded-2xl border border-[rgba(212,165,116,0.25)] bg-white p-8 shadow-sm">
              <h2 className="mb-6 text-xl font-bold text-[#2C2416]">相关帖子</h2>
              <div className="space-y-4">
                {[
                  { title: "青年律师如何开始创作智能体", author: "李律师" },
                  { title: "Skills 边界如何设计", author: "王律师" },
                ].map((related, idx) => (
                  <Link
                    key={idx}
                    href="/community"
                    className="block rounded-xl border border-[rgba(212,165,116,0.2)] p-4 hover:border-[rgba(212,165,116,0.35)] hover:bg-[rgba(212,165,116,0.06)]"
                  >
                    <h3 className="font-medium text-[#2C2416]">{related.title}</h3>
                    <p className="mt-1 text-xs text-[#9A8B78]">{related.author}</p>
                  </Link>
                ))}
              </div>
            </section>

            <div className="flex justify-end">
              <ReportCornerButton
                targetType="community_post"
                targetId={postId || slug}
                cornerLabel="举报此帖子"
              />
            </div>
          </div>

          <aside className="space-y-6 lg:col-span-1">
            <ProductDetailCreatorPanel
              creatorId={post.authorCreatorId}
              displayName={post.author}
              bio={authorProfile?.sanitizedBio ?? authorProfile?.bio}
              lawyerProfileSlug={post.authorLawyerSlug}
              lawyerVerified={post.authorLawyerVerified}
            />

            <div className="rounded-2xl border border-[rgba(212,165,116,0.25)] bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-[#2C2416]">热门标签</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {COMMUNITY_HOT_TAGS.map((tag) => (
                  <Link
                    key={tag}
                    href={`/community/tag/${encodeURIComponent(tag)}`}
                    className="tag transition-all hover:bg-[rgba(212,165,116,0.2)]"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[rgba(212,165,116,0.25)] bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-[#2C2416]">快捷入口</h3>
              <div className="mt-4 space-y-2">
                {COMMUNITY_QUICK_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center justify-between rounded-xl bg-[rgba(212,165,116,0.06)] p-3 text-sm text-[#5D4E3A] hover:bg-[rgba(212,165,116,0.12)] hover:text-[#D4A574]"
                  >
                    <span>{link.label}</span>
                    <span aria-hidden>→</span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
      </div>
    </div>
  );
}
