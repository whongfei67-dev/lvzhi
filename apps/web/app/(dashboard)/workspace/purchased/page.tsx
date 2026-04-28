"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api, Skill, Agent } from "@/lib/api/client";
import { SectionHeader } from "@/components/layout/page-header";
import { CardGrid } from "@/components/common/list-components";
import { Pagination } from "@/components/common/pagination";
import { EmptyState } from "@/components/common/empty-state";
import { Sparkles, Bot, Star, ArrowRight, Clock } from "lucide-react";

interface PurchasedItem {
  id: string;
  name: string;
  type: "skill" | "agent";
  description?: string;
  creator_name: string;
  rating?: number;
  purchased_at: string;
  price: number;
}

export default function PurchasedPage() {
  const [items, setItems] = useState<PurchasedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchPurchased();
  }, [page]);

  const fetchPurchased = async () => {
    setLoading(true);
    try {
      const result = await api.workspace.getPurchased({ page, limit: 12 });
      setItems((result.items as unknown as PurchasedItem[]) || []);
      setTotalPages(Math.ceil(result.total / 12));
    } catch (error) {
      console.error("获取已购内容失败:", error);
      // Mock 数据
      setItems([
        { id: "1", name: "劳动争议处理全流程模板", type: "skill", creator_name: "陈律师", rating: 4.9, purchased_at: "2024-01-15", price: 0 },
        { id: "2", name: "AI 合同风险排查助手", type: "agent", creator_name: "张律师", rating: 4.8, purchased_at: "2024-01-14", price: 9.9 },
        { id: "3", name: "企业合规自查清单", type: "skill", creator_name: "王律师", rating: 4.7, purchased_at: "2024-01-13", price: 19.9 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#2C2416]">已购内容</h1>
        <p className="mt-2 text-[#5D4E3A]">
          你购买的所有 Skills 和智能体
        </p>
      </div>

      {/* 内容列表 */}
      {loading ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-5">
              <div className="h-12 w-12 rounded-xl bg-[rgba(212,165,116,0.15)]" />
              <div className="mt-4 h-6 w-3/4 rounded bg-[rgba(212,165,116,0.15)]" />
              <div className="mt-2 h-4 w-1/2 rounded bg-[rgba(212,165,116,0.15)]" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="h-12 w-12" />}
          title="暂无已购内容"
          description="快去灵感广场逛逛，发现优质 Skills 和智能体"
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
              <PurchasedCard key={item.id} item={item} />
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

function PurchasedCard({ item }: { item: PurchasedItem }) {
  return (
    <Link
      href={`/inspiration/${item.id}`}
      className="group flex flex-col rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-5 transition-all hover:-translate-y-1 hover:border-[#D4A574] hover:shadow-md"
    >
      {/* 图标 */}
      <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl ${
        item.type === "agent" ? "bg-gradient-to-br from-[#D4A574] to-[#B8860B]" : "bg-[rgba(212,165,116,0.15)]"
      }`}>
        {item.type === "agent" ? (
          <Bot className="h-7 w-7 text-white" />
        ) : (
          <Sparkles className="h-7 w-7 text-[#D4A574]" />
        )}
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
          {item.purchased_at}
        </span>
        <span className="text-sm font-medium text-[#D4A574]">
          {item.price === 0 ? "免费" : `¥${item.price}`}
        </span>
      </div>
    </Link>
  );
}
