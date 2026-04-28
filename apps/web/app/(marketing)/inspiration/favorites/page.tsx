import Link from "next/link";
import { ArrowLeft, Heart, FileText } from "lucide-react";

const FAVORITES = [
  { id: "1", title: "AI合同审查助手", type: "智能体", creator: "张律师", liked: "2024-01-20" },
  { id: "2", title: "劳动争议仲裁助手", type: "智能体", creator: "王法务", liked: "2024-01-18" },
];

export const dynamic = "force-dynamic";

export default function FavoritesPage() {
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
            我的收藏
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-[#5D4E3A]">
            你收藏的所有内容
          </p>
        </div>
      </section>

      {/* Items */}
      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FAVORITES.map((item) => (
            <Link
              key={item.id}
              href={`/inspiration/${item.id}`}
              className="group rounded-2xl border border-[rgba(212,165,116,0.25)] bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-[rgba(212,165,116,0.08)] flex items-center justify-center">
                  <FileText className="h-6 w-6 text-[#D4A574]" />
                </div>
                <button className="h-8 w-8 rounded-full bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100">
                  <Heart className="h-4 w-4 fill-current" />
                </button>
              </div>
              <h3 className="font-semibold text-[#2C2416] group-hover:text-[#D4A574] mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-[#9A8B78] mb-4">
                {item.type} · {item.creator}
              </p>
              <p className="text-xs text-[#9A8B78]">
                收藏于 {item.liked}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
