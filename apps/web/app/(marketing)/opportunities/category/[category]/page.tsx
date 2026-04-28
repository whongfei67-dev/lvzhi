import Link from "next/link";

const CATEGORIES = ["全部", "招聘", "项目", "合作", "实习", "兼职"];

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
            href="/opportunities"
            className="inline-flex items-center gap-2 text-sm text-[#9A8B78] hover:text-[#D4A574] mb-4"
          >
            ← 返回合作机会
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-[#2C2416] sm:text-4xl">
            {decodedCategory}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-[#5D4E3A]">
            浏览所有 {decodedCategory} 类型的机会
          </p>
        </div>
      </section>

      {/* Quick Links */}
      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="flex flex-wrap gap-3">
          {CATEGORIES.filter(c => c !== decodedCategory).map((cat) => (
            <Link
              key={cat}
              href={cat === "全部" ? "/opportunities" : `/opportunities/category/${cat}`}
              className="rounded-full border border-[rgba(212,165,116,0.25)] bg-white px-4 py-2 text-sm text-[#5D4E3A] hover:bg-[rgba(212,165,116,0.08)] hover:border-[#B8860B] hover:text-[#D4A574]"
            >
              {cat}
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <div className="rounded-2xl bg-gradient-to-r from-[#D4A574] to-[#B8860B] p-6 text-white">
          <h2 className="text-xl font-bold">发布 {decodedCategory} 机会</h2>
          <p className="mt-1 text-[#D4A574]">让更多人才看到你的需求</p>
          <Link
            href="/opportunities/create"
            className="mt-4 inline-block rounded-xl bg-white px-6 py-2.5 font-semibold text-[#D4A574] hover:bg-[rgba(212,165,116,0.08)]"
          >
            立即发布
          </Link>
        </div>
      </section>

      {/* Content Placeholder */}
      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="text-center py-12 text-[#9A8B78]">
          <p>正在加载 {decodedCategory} 类型的机会...</p>
          <Link href="/opportunities" className="mt-4 text-[#D4A574] hover:underline">
            查看全部机会
          </Link>
        </div>
      </section>
    </div>
  );
}
