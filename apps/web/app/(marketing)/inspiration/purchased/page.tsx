import Link from "next/link";
import { ArrowLeft, FileText, Download, Clock } from "lucide-react";

const PURCHASED = [
  { id: "1", title: "AI合同审查助手", type: "智能体", purchaseTime: "2024-01-15", price: 99 },
  { id: "2", title: "劳动争议仲裁模板", type: "模板", purchaseTime: "2024-01-10", price: 29 },
];

export const dynamic = "force-dynamic";

export default function PurchasedPage() {
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
            已购买
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-[#5D4E3A]">
            你购买的所有内容
          </p>
        </div>
      </section>

      {/* Items */}
      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="space-y-4">
          {PURCHASED.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-[rgba(212,165,116,0.25)] bg-white p-6"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-[rgba(212,165,116,0.08)] flex items-center justify-center">
                    <FileText className="h-6 w-6 text-[#D4A574]" />
                  </div>
                  <div>
                    <Link
                      href={`/inspiration/${item.id}`}
                      className="font-semibold text-[#2C2416] hover:text-[#D4A574]"
                    >
                      {item.title}
                    </Link>
                    <div className="flex items-center gap-3 mt-1 text-sm text-[#9A8B78]">
                      <span className="rounded-full bg-[rgba(212,165,116,0.15)] px-2.5 py-0.5 text-xs">
                        {item.type}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {item.purchaseTime}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-medium text-[#D4A574]">¥{item.price}</span>
                  <button className="flex items-center gap-2 rounded-xl border border-[rgba(212,165,116,0.25)] px-4 py-2 text-sm text-[#5D4E3A] hover:bg-[rgba(212,165,116,0.08)]">
                    <Download className="h-4 w-4" />
                    下载
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
