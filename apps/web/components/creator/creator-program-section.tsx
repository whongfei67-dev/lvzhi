import Link from "next/link"

export function CreatorProgramSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-blue-50 to-white">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-950">创作者扶持计划</h2>
          <p className="mt-4 text-lg text-slate-600">
            加入律植创作者计划，获得技术支持、流量扶持和收益分成
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              title: "技术赋能",
              desc: "提供专业的智能体开发工具和API支持",
            },
            {
              title: "流量扶持",
              desc: "平台首页推荐位，提升曝光度",
            },
            {
              title: "收益分成",
              desc: "高达70%的收益分成比例",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 text-center"
            >
              <h3 className="text-lg font-semibold text-slate-950">{item.title}</h3>
              <p className="mt-2 text-slate-600">{item.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link
            href="/creators/join"
            className="inline-flex items-center justify-center rounded-full bg-blue-600 px-8 py-3 text-sm font-semibold text-white"
          >
            立即申请加入
          </Link>
        </div>
      </div>
    </section>
  )
}
