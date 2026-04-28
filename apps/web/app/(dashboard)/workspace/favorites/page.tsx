"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { SectionHeader } from "@/components/layout/page-header";
import { CardGrid } from "@/components/common/list-components";
import { Pagination } from "@/components/common/pagination";
import { EmptyState } from "@/components/common/empty-state";
import { Heart, Sparkles, Bot, Star, ArrowRight, Clock } from "lucide-react";

interface FavoriteItem {
  id: string;
  name: string;
  type: "skill" | "agent";
  description?: string;
  creator_name: string;
  rating?: number;
  price: number;
  added_at: string;
}

export default function FavoritesPage() {
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchFavorites();
  }, [page]);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const result = await api.workspace.getFavorites({ page, limit: 12 });
      setItems((result.items as unknown as FavoriteItem[]) || []);
      setTotalPages(Math.ceil(result.total / 12));
    } catch (error) {
      console.error("获取收藏失败:", error);
      // Mock 数据
      setItems([
        { id: "1", name: "婚姻法财产分割指南", type: "skill", creator_name: "赵律师", rating: 4.9, price: 29.9, added_at: "2024-01-15" },
        { id: "2", name: "知识产权申请入门", type: "skill", creator_name: "孙律师", rating: 4.5, price: 0, added_at: "2024-01-14" },
        { id: "3", name: "企业常年法律顾问模板", type: "skill", creator_name: "周律师", rating: 4.8, price: 49.9, added_at: "2024-01-13" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#2C2416]">我的收藏</h1>
        <p className="mt-2 text-[#5D4E3A]">
          你收藏的所有 Skills 和智能体
        </p>
      </div>

      {/* 内容列表 */}
      {loading ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-5">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-[rgba(212,165,116,0.15)]" />
                <div className="flex-1">
                  <div className="h-6 w-3/4 rounded bg-[rgba(212,165,116,0.15)]" />
                  <div className="mt-2 h-4 w-1/2 rounded bg-[rgba(212,165,116,0.15)]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Heart className="h-12 w-12" />}
          title="暂无收藏内容"
          description="在灵感广场发现感兴趣的内容，一键收藏"
          action={
            <Link
              href="/inspiration"
              className="inline-flex items-center gap-2 rounded-xl bg-[#D4A574] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#B8860B]"
            >
              探索灵感广场
              <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
      ) : (
        <>
          <CardGrid>
            {items.map((item) => (
              <FavoriteCard key={item.id} item={item} />
            ))}
          </CardGrid>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            className="mt-8"
          />
        </>
      )}
    </div>
  );
}

function FavoriteCard({ item }: { item: FavoriteItem }) {
  return (
    <Link
      href={`/inspiration/${item.id}`}
      className="group flex flex-col rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-5 transition-all hover:-translate-y-1 hover:border-[#D4A574] hover:shadow-md"
    >
      {/* 顶部图标和收藏图标 */}
      <div className="mb-4 flex items-start justify-between">
        <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${
          item.type === "agent" ? "bg-gradient-to-br from-[#D4A574] to-[#B8860B]" : "bg-[rgba(212,165,116,0.15)]"
        }`}>
          {item.type === "agent" ? (
            <Bot className="h-7 w-7 text-white" />
          ) : (
            <Sparkles className="h-7 w-7 text-[#D4A574]" />
          )}
        </div>
        <button className="rounded-lg p-2 text-[#9A8B78] transition-colors hover:bg-red-50 hover:text-red-500">
          <Heart className="h-5 w-5 fill-current" />
        </button>
      </div>

      {/* 类型标签 */}
      <div className="mb-2 flex items-center justify-between">
        <span className="rounded-full bg-[rgba(212,165,116,0.15)] px-3 py-1 text-xs font-medium text-[#5D4E3A]">
          {item.type === "agent" ? "智能体" : "Skills"}
        </span>
        {item.rating && (
          <span className="flex items-center gap-1 text-sm font-medium text-[#D4A574]">
            <Star className="h-4 w-4 fill-current" />
            {item.rating.toFixed(1)}
          </span>
        )}
      </div>

      {/* 标题 */}
      <h3 className="mb-2 font-medium text-[#2C2416] transition-colors group-hover:text-[#D4A574] line-clamp-2">
        {item.name}
      </h3>

      {/* 作者 */}
      <p className="mb-4 text-sm text-[#5D4E3A]">by {item.creator_name}</p>

      {/* 底部信息 */}
      <div className="mt-auto flex items-center justify-between border-t border-[rgba(212,165,116,0.25)] pt-3">
        <span className="flex items-center gap-1 text-xs text-[#9A8B78]">
          <Clock className="h-3 w-3" />
          {item.added_at}
        </span>
        <span className={item.price === 0 ? "text-sm font-medium text-[#D4A574]" : "text-sm text-[#5D4E3A]"}>
          {item.price === 0 ? "免费" : `¥${item.price}`}
        </span>
      </div>
    </Link>
  );
}
