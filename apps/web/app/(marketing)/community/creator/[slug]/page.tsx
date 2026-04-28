"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, ArrowRight, Bot, MessageSquare, Star, ExternalLink } from "lucide-react";

interface CreatorData {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  specialty: string[];
  location?: string;
  skills_count: number;
  agents_count: number;
  posts_count: number;
  total_likes: number;
  rating: number;
  is_verified: boolean;
  joined_at: string;
  recent_posts: {
    id: string;
    title: string;
    topic: string;
    likes: number;
    comments: number;
    created_at: string;
  }[];
  skills: {
    id: string;
    name: string;
    price: number;
    rating: number;
  }[];
  agents: {
    id: string;
    name: string;
    rating: number;
    usage_count: number;
  }[];
}

interface CreatorPageProps {
  params: Promise<{ slug: string }>;
}

export default function CreatorProfilePage({ params }: CreatorPageProps) {
  const [creator, setCreator] = useState<CreatorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"posts" | "skills" | "agents">("posts");

  useEffect(() => {
    const fetchCreator = async () => {
      const { slug } = await params;
      // 模拟获取创作者数据
      // 实际应通过 API 获取
      setCreator({
        id: slug,
        name: "陈律师",
        bio: "专注劳动法领域10年，擅长企业合规与员工关系处理。已帮助超过500家企业完善劳动制度。",
        specialty: ["劳动法", "企业合规", "劳动争议"],
        location: "北京",
        skills_count: 12,
        agents_count: 5,
        posts_count: 45,
        total_likes: 1234,
        rating: 4.8,
        is_verified: true,
        joined_at: "2024-01-01",
        recent_posts: [
          { id: "1", title: "企业劳动合规自查清单分享", topic: "资源分享", likes: 234, comments: 45, created_at: "2024-01-15" },
          { id: "2", title: "入职流程设计的关键注意事项", topic: "经验分享", likes: 156, comments: 32, created_at: "2024-01-14" },
          { id: "3", title: "劳动合同解除的常见误区", topic: "案例分析", likes: 89, comments: 23, created_at: "2024-01-13" },
        ],
        skills: [
          { id: "1", name: "劳动争议处理全流程模板", price: 0, rating: 4.9 },
          { id: "2", name: "企业合规自查清单", price: 29.9, rating: 4.8 },
          { id: "3", name: "劳动合同模板合集", price: 19.9, rating: 4.7 },
        ],
        agents: [
          { id: "1", name: "劳动法咨询助手", rating: 4.9, usage_count: 5678 },
          { id: "2", name: "合同风险排查助手", rating: 4.8, usage_count: 3456 },
        ],
      });
      setLoading(false);
    };

    fetchCreator();
  }, [params]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[rgba(212,165,116,0.08)] flex items-center justify-center">
        <div className="animate-pulse text-[#5D4E3A]">加载中...</div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-[rgba(212,165,116,0.08)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#5D4E3A]">创作者不存在</p>
          <Link href="/community" className="mt-4 text-sm text-[#D4A574] hover:underline">返回社区</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[rgba(212,165,116,0.08)]">
      {/* 页面头部 */}
      <div className="bg-gradient-to-b from-[rgba(212,165,116,0.15)] to-[rgba(212,165,116,0.08)] px-6 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center gap-3 text-sm text-[#5D4E3A]">
            <Link href="/community" className="hover:text-[#D4A574]">社区</Link>
            <span>/</span>
            <span className="text-[#2C2416]">创作者主页</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* 创作者信息卡片 */}
        <div className="mb-8 rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-6">
          <div className="flex items-start gap-6">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D4A574] to-[#B8860B] text-2xl font-bold text-white">
              {creator.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-[#2C2416]">{creator.name}</h1>
                {creator.is_verified && (
                  <span className="flex items-center gap-1 rounded-full bg-[rgba(212,165,116,0.08)] px-2.5 py-0.5 text-xs font-medium text-[#D4A574]">
                    <CheckCircle2 className="h-3 w-3" />
                    认证律师
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-[#5D4E3A]">{creator.location}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {creator.specialty.map((s) => (
                  <span key={s} className="rounded-full bg-[rgba(212,165,116,0.15)] px-3 py-1 text-xs text-[#5D4E3A]">{s}</span>
                ))}
              </div>
              {creator.bio && <p className="mt-3 text-sm text-[#5D4E3A] line-clamp-2">{creator.bio}</p>}
            </div>
          </div>

          {/* 统计数据 */}
          <div className="mt-6 grid grid-cols-4 gap-4 rounded-xl border border-[rgba(212,165,116,0.25)] bg-[rgba(212,165,116,0.08)] p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-[#D4A574]">{creator.skills_count}</p>
              <p className="text-xs text-[#5D4E3A]">Skills</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#D4A574]">{creator.agents_count}</p>
              <p className="text-xs text-[#5D4E3A]">智能体</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#D4A574]">{creator.posts_count}</p>
              <p className="text-xs text-[#5D4E3A]">帖子</p>
            </div>
            <div className="text-center">
              <p className="flex items-center justify-center gap-1 text-2xl font-bold text-[#D4A574]">
                {creator.rating}
                <Star className="h-4 w-4 fill-current text-amber-500" />
              </p>
              <p className="text-xs text-[#5D4E3A]">评分</p>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="mt-6 flex gap-3">
            <button className="flex-1 rounded-xl bg-[#D4A574] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#B8860B]">
              关注
            </button>
            <button className="flex-1 rounded-xl border border-[rgba(212,165,116,0.25)] py-3 text-sm font-medium text-[#5D4E3A] transition-colors hover:border-[#D4A574] hover:text-[#D4A574]">
              发私信
            </button>
          </div>
        </div>

        {/* Tab 切换 */}
        <div className="mb-6 flex gap-1 rounded-xl bg-[rgba(212,165,116,0.15)] p-1">
          {[
            { id: "posts" as const, label: "社区帖子" },
            { id: "skills" as const, label: "Skills" },
            { id: "agents" as const, label: "智能体" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                activeTab === tab.id ? "bg-white text-[#D4A574] shadow-sm" : "text-[#5D4E3A] hover:text-[#2C2416]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 内容 */}
        <div className="space-y-4">
          {activeTab === "posts" && (
            <>
              {creator.recent_posts.length === 0 ? (
                <div className="rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-8 text-center">
                  <MessageSquare className="mx-auto h-12 w-12 text-[#9A8B78]" />
                  <p className="mt-4 text-[#5D4E3A]">暂无帖子</p>
                </div>
              ) : (
                creator.recent_posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/community/post/${encodeURIComponent(post.id)}`}
                    className="group block rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-[#D4A574]"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-[#2C2416] transition-colors group-hover:text-[#D4A574]">
                          {post.title}
                        </h3>
                        <div className="mt-2 flex items-center gap-4 text-sm text-[#9A8B78]">
                          <span className="rounded-full bg-[rgba(212,165,116,0.15)] px-2.5 py-0.5 text-xs">{post.topic}</span>
                          <span>{post.likes} 赞</span>
                          <span>{post.comments} 评论</span>
                          <span>{post.created_at}</span>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-[#9A8B78] transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                ))
              )}
            </>
          )}

          {activeTab === "skills" && (
            <>
              {creator.skills.length === 0 ? (
                <div className="rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-8 text-center">
                  <p className="text-[#5D4E3A]">暂无 Skills</p>
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-3">
                  {creator.skills.map((skill) => (
                    <Link
                      key={skill.id}
                      href={`/inspiration/skills/${skill.id}`}
                      className="group rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-4 transition-all hover:-translate-y-1 hover:shadow-md hover:border-[#D4A574]"
                    >
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(212,165,116,0.15)]">
                        <svg className="h-6 w-6 text-[#D4A574]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <h3 className="font-medium text-[#2C2416] line-clamp-1 transition-colors group-hover:text-[#D4A574]">
                        {skill.name}
                      </h3>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm font-medium text-[#D4A574]">
                          {skill.price === 0 ? "免费" : `¥${skill.price}`}
                        </span>
                        <span className="flex items-center gap-1 text-sm text-[#D4A574]">
                          <Star className="h-4 w-4 fill-current text-amber-500" />
                          {skill.rating}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === "agents" && (
            <>
              {creator.agents.length === 0 ? (
                <div className="rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-8 text-center">
                  <p className="text-[#5D4E3A]">暂无智能体</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {creator.agents.map((agent) => (
                    <Link
                      key={agent.id}
                      href={`/inspiration/agents/${agent.id}`}
                      className="group flex items-center gap-4 rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-[#D4A574]"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#D4A574] to-[#B8860B]">
                        <Bot className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-[#2C2416] transition-colors group-hover:text-[#D4A574]">
                          {agent.name}
                        </h3>
                        <div className="mt-1 flex items-center gap-4 text-sm text-[#9A8B78]">
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-current text-amber-500" />
                            {agent.rating}
                          </span>
                          <span>{agent.usage_count.toLocaleString()} 使用</span>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-[#9A8B78] transition-transform group-hover:translate-x-1" />
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}