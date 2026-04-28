import Link from "next/link";
import { ArrowLeft, Star, MapPin, Shield } from "lucide-react";

const MOCK_LAWYERS = [
  { id: "1", name: "张明远", title: "高级合伙人", firm: "盈科律师事务所", practice: "公司法务", location: "北京", rating: 4.9, reviews: 328, avatar: "张", verified: true },
  { id: "2", name: "王建国", title: "资深律师", firm: "大成律师事务所", practice: "公司法务", location: "上海", rating: 4.7, reviews: 198, avatar: "王", verified: true },
];

interface PageProps {
  params: Promise<{ category: string }>;
}

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: PageProps) {
  const { category } = await params;
  const decodedCategory = decodeURIComponent(category);

  return (
    <div className="min-h-screen bg-[rgba(212,165,116,0.08)]">
      {/* Hero */}
      <section className="bg-white border-b border-[rgba(212,165,116,0.25)]">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <Link
            href="/lawyers"
            className="inline-flex items-center gap-2 text-sm text-[#9A8B78] hover:text-[#D4A574] mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            返回发现律师
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-[#2C2416] sm:text-4xl">
            {decodedCategory}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-[#5D4E3A]">
            浏览擅长 {decodedCategory} 的认证律师
          </p>
        </div>
      </section>

      {/* Lawyers */}
      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {MOCK_LAWYERS.map((lawyer) => (
            <Link
              key={lawyer.id}
              href={`/lawyers/${lawyer.id}`}
              className="group rounded-2xl border border-[rgba(212,165,116,0.25)] bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#D4A574] to-[#B8860B] flex items-center justify-center text-white text-xl font-bold">
                  {lawyer.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-[#2C2416] group-hover:text-[#D4A574]">
                      {lawyer.name}
                    </h3>
                    {lawyer.verified && (
                      <Shield className="h-4 w-4 text-[#D4A574]" />
                    )}
                  </div>
                  <p className="text-sm text-[#9A8B78]">{lawyer.title}</p>
                  <p className="text-sm text-[#9A8B78]">{lawyer.firm}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-[#9A8B78] mb-4">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {lawyer.location}
                </span>
              </div>

              <div className="flex items-center gap-1 text-sm">
                <Star className="h-4 w-4 text-amber-500 fill-current" />
                <span className="font-medium text-[#2C2416]">{lawyer.rating}</span>
                <span className="text-[#9A8B78]">({lawyer.reviews}评价)</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
