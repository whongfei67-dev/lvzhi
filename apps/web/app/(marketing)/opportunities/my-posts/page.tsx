import Link from "next/link";
import { ArrowLeft, Briefcase, DollarSign, Users } from "lucide-react";

const MY_OPPORTUNITIES = [
  { id: "1", title: "招聘公司法务专员", type: "招聘", status: "已发布", views: 1256, applications: 12 },
  { id: "2", title: "合同审查项目外包", type: "项目", status: "已下线", views: 890, applications: 5 },
];

export const dynamic = "force-dynamic";

export default function MyOpportunitiesPage() {
  return (
    <div className="min-h-screen bg-[rgba(212,165,116,0.08)]">
      {/* Hero */}
      <section className="bg-white border-b border-[rgba(212,165,116,0.25)]">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <Link
            href="/opportunities"
            className="inline-flex items-center gap-2 text-sm text-[#9A8B78] hover:text-[#D4A574] mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            返回合作机会
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-[#2C2416] sm:text-4xl">
            我的发布
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-[#5D4E3A]">
            管理你发布的招聘和合作信息
          </p>
        </div>
      </section>

      {/* Items */}
      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/opportunities/create"
            className="rounded-xl bg-gradient-to-r from-[#D4A574] to-[#B8860B] px-6 py-2.5 font-medium text-white hover:shadow-md"
          >
            发布新机会
          </Link>
        </div>

        <div className="space-y-4">
          {MY_OPPORTUNITIES.map((opp) => (
            <div
              key={opp.id}
              className="rounded-2xl border border-[rgba(212,165,116,0.25)] bg-white p-6"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-[rgba(212,165,116,0.08)] flex items-center justify-center">
                    <Briefcase className="h-6 w-6 text-[#D4A574]" />
                  </div>
                  <div>
                    <Link
                      href={`/opportunities/${opp.id}`}
                      className="font-semibold text-[#2C2416] hover:text-[#D4A574]"
                    >
                      {opp.title}
                    </Link>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="rounded-full bg-[rgba(212,165,116,0.15)] px-2.5 py-0.5 text-xs text-[#5D4E3A]">
                        {opp.type}
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        opp.status === "已发布" ? "bg-[rgba(212,165,116,0.08)] text-[#D4A574]" : "bg-[rgba(212,165,116,0.15)] text-[#9A8B78]"
                      }`}>
                        {opp.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm text-[#9A8B78]">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {opp.applications} 投递
                  </span>
                  <span>{opp.views} 次浏览</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
