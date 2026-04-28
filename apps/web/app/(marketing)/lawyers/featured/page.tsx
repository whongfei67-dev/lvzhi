import Link from "next/link";
import { ArrowLeft, Star, MapPin, Shield, Award } from "lucide-react";

const FEATURED_LAWYERS = [
  { id: "1", name: "张明远", title: "高级合伙人", firm: "盈科律师事务所", practice: "公司法务", location: "北京", rating: 4.9, reviews: 328, cases: 1200, avatar: "张", verified: true, featured: true },
  { id: "2", name: "李婉清", title: "合伙人", firm: "中伦律师事务所", practice: "婚姻家事", location: "上海", rating: 4.8, reviews: 256, cases: 890, avatar: "李", verified: true, featured: true },
  { id: "3", name: "王建国", title: "资深律师", firm: "大成律师事务所", practice: "劳动争议", location: "深圳", rating: 4.9, reviews: 198, cases: 756, avatar: "王", verified: true, featured: true },
  { id: "4", name: "刘雅婷", title: "律师", firm: "国浩律师事务所", practice: "知识产权", location: "杭州", rating: 4.7, reviews: 145, cases: 520, avatar: "刘", verified: true, featured: true },
  { id: "5", name: "陈志强", title: "高级律师", firm: "锦天城律师事务所", practice: "刑事辩护", location: "广州", rating: 4.8, reviews: 167, cases: 680, avatar: "陈", verified: true, featured: true },
  { id: "6", name: "赵敏", title: "合伙人", firm: "君合律师事务所", practice: "企业合规", location: "北京", rating: 4.9, reviews: 234, cases: 950, avatar: "赵", verified: true, featured: true },
];

export const dynamic = "force-dynamic";

export default function FeaturedLawyersPage() {
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
            推荐律师
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-[#5D4E3A]">
            平台精选的优质认证律师，覆盖各专业领域
          </p>
        </div>
      </section>

      {/* Featured Banner */}
      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 p-6 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Award className="h-5 w-5" />
            <span className="text-sm font-medium">本月之星</span>
          </div>
          <h2 className="text-xl font-bold">{FEATURED_LAWYERS[0].name} 律师</h2>
          <p className="mt-1 text-amber-100">{FEATURED_LAWYERS[0].title} · {FEATURED_LAWYERS[0].firm}</p>
        </div>
      </section>

      {/* Lawyers Grid */}
      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURED_LAWYERS.map((lawyer) => (
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
                <span className="rounded-full bg-[rgba(212,165,116,0.08)] px-3 py-1 text-xs font-medium text-[#B8860B]">
                  {lawyer.practice}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {lawyer.location}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-amber-500 fill-current" />
                  <span className="font-medium text-[#2C2416]">{lawyer.rating}</span>
                  <span className="text-[#9A8B78]">({lawyer.reviews})</span>
                </div>
                <span className="text-[#9A8B78]">{lawyer.cases} 案例</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
