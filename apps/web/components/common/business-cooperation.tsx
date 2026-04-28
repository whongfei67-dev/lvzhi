import * as React from "react";
import Link from "next/link";
import { Rocket, Building2, Handshake, Lightbulb } from "lucide-react";

export function BusinessCooperation() {
  return (
    <section className="border-t border-slate-200 bg-slate-50 py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Left: intro */}
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              商业合作
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-950">
              与律植共同成长
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              律植为法律智能体创作者、律所、企业与开发者提供多种合作方式，共同推动法律科技的创新与应用。
            </p>
          </div>

          {/* Right: cooperation types */}
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: <Rocket className="h-8 w-8 text-blue-600" />,
                title: "智能体推广",
                desc: "提升智能体曝光度，触达更多潜在用户",
                href: "/cooperation/promotion",
              },
              {
                icon: <Building2 className="h-8 w-8 text-indigo-600" />,
                title: "企业定制",
                desc: "为企业提供专属智能体开发与部署服务",
                href: "/cooperation/enterprise",
              },
              {
                icon: <Handshake className="h-8 w-8 text-emerald-600" />,
                title: "律所入驻",
                desc: "律所品牌展示与智能体集成解决方案",
                href: "/cooperation/law-firm",
              },
              {
                icon: <Lightbulb className="h-8 w-8 text-amber-600" />,
                title: "技术合作",
                desc: "API 接入、数据合作与联合研发",
                href: "/cooperation/tech",
              },
            ].map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group rounded-3xl border border-slate-200 bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div>{item.icon}</div>
                <h3 className="mt-3 font-semibold text-slate-950 group-hover:text-blue-600 transition-colors">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {item.desc}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Contact CTA */}
        <div className="mt-12 rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-8 text-center">
          <p className="text-lg font-semibold text-slate-950">
            有合作意向？欢迎联系我们
          </p>
          <p className="mt-2 text-sm text-slate-600">
            邮箱：cooperation@lvzhi.ai  ·  微信：lvzhi-biz
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="mailto:cooperation@lvzhi.ai"
              className="rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:shadow-md transition-shadow"
            >
              发送邮件
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
