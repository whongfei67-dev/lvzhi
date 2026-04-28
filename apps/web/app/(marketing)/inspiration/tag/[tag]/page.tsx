import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const MOCK_ITEMS = [
  { id: "1", title: "AI合同审查助手", description: "智能识别合同风险点，提供修改建议", category: "合同法", creator: "张律师", mode: "免费" as const, useCount: 12830, tags: ["热门", "精选"] },
  { id: "2", title: "劳动争议仲裁助手", description: "快速生成劳动仲裁申请书", category: "劳动争议", creator: "王法务", mode: "免费试用" as const, useCount: 9420, tags: ["热门"] },
  { id: "3", title: "法律文书生成器", description: "一键生成起诉状、答辩状等法律文书", category: "文书生成", creator: "律植实验室", mode: "免费" as const, useCount: 8960, tags: ["精选", "新手推荐"] },
  { id: "4", title: "婚姻家事问答助手", description: "专业婚姻家事法律咨询", category: "婚姻家事", creator: "李律师", mode: "付费" as const, useCount: 6280, tags: ["专业"] },
  { id: "5", title: "企业合规风控助手", description: "企业合规风险全面筛查", category: "合规风控", creator: "陈顾问", mode: "付费" as const, useCount: 5940, tags: ["热门", "专业"] },
  { id: "6", title: "知识产权检索助手", description: "快速检索专利、商标信息", category: "知识产权", creator: "刘律师", mode: "免费" as const, useCount: 5120, tags: ["精选"] },
];

interface PageProps {
  params: Promise<{ tag: string }>;
}

export const dynamic = "force-dynamic";

export default async function TagPage({ params }: PageProps) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);

  const filteredItems = MOCK_ITEMS.filter((item) =>
    item.tags.includes(decodedTag)
  );

  return (
    <div className="min-h-screen bg-[rgba(212,165,116,0.08)]">
      {/* Hero */}
      <section className="inspiration-band-soft">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <Link
            href="/inspiration"
            className="inline-flex items-center gap-2 text-sm text-[#9A8B78] hover:text-[#D4A574] mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            返回灵感广场
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-[#2C2416] sm:text-4xl">
            #{decodedTag}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-[#5D4E3A]">
            标签下共有 {filteredItems.length} 个内容
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        {filteredItems.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => (
              <Link
                key={item.id}
                href={`/inspiration/${item.id}`}
                className="group rounded-2xl border border-[rgba(212,165,116,0.25)] bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-[#2C2416] group-hover:text-[#D4A574]">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm text-[#9A8B78]">
                      {item.category} · {item.creator}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      item.mode === "免费"
                        ? "bg-[rgba(212,165,116,0.08)] text-[#D4A574]"
                        : item.mode === "免费试用"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-[rgba(212,165,116,0.08)] text-[#B8860B]"
                    }`}
                  >
                    {item.mode}
                  </span>
                </div>
                <p className="mt-3 text-sm text-[#5D4E3A] line-clamp-2">
                  {item.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-1">
                  {item.tags.map((t) => (
                    <span key={t} className="rounded-full bg-[rgba(212,165,116,0.15)] px-2 py-0.5 text-xs text-[#9A8B78]">
                      {t}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-[#9A8B78]">
            <p>暂无相关内容</p>
            <Link href="/inspiration" className="mt-4 text-[#D4A574] hover:underline">
              返回灵感广场
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
