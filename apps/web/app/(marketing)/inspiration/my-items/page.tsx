import Link from "next/link";
import { ArrowLeft, FileText, Plus, Star, Edit, BarChart } from "lucide-react";

const MY_ITEMS = [
  { id: "1", title: "AI合同审查助手", type: "智能体", status: "已上线", likes: 128, uses: 2560, income: 1280 },
  { id: "2", title: "劳动争议问答模板", type: "模板", status: "审核中", likes: 45, uses: 890, income: 0 },
];

export const dynamic = "force-dynamic";

export default function MyItemsPage() {
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
            我的发布
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-[#5D4E3A]">
            管理你在灵感广场发布的所有内容
          </p>
        </div>
      </section>

      {/* Items */}
      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/inspiration/create"
            className="rounded-xl bg-gradient-to-r from-[#D4A574] to-[#B8860B] px-6 py-2.5 font-medium text-white hover:shadow-md"
          >
            创建新内容
          </Link>
        </div>

        <div className="space-y-4">
          {MY_ITEMS.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-[rgba(212,165,116,0.25)] bg-white p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-[rgba(212,165,116,0.08)] flex items-center justify-center">
                    <FileText className="h-6 w-6 text-[#D4A574]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#2C2416]">{item.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="rounded-full bg-[rgba(212,165,116,0.15)] px-2.5 py-0.5 text-xs text-[#5D4E3A]">
                        {item.type}
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        item.status === "已上线" ? "bg-[rgba(212,165,116,0.08)] text-[#D4A574]" : "bg-amber-50 text-amber-700"
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm text-[#9A8B78]">
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4" />
                    {item.likes}
                  </span>
                  <span>{item.uses} 次使用</span>
                  <span className="font-medium text-[#D4A574]">¥{item.income}</span>
                </div>
              </div>
              <div className="mx-0 mt-4 h-px bg-gradient-to-r from-transparent via-[rgba(212,165,116,0.22)] to-transparent" />
              <div className="flex items-center gap-3 pt-4">
                <Link
                  href={`/inspiration/${item.id}`}
                  className="flex items-center gap-2 text-sm text-[#5D4E3A] hover:text-[#D4A574]"
                >
                  <BarChart className="h-4 w-4" />
                  数据统计
                </Link>
                <Link
                  href={`/creator/agents/${item.id}/edit`}
                  className="flex items-center gap-2 text-sm text-[#5D4E3A] hover:text-[#D4A574]"
                >
                  <Edit className="h-4 w-4" />
                  编辑
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
