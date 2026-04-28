import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";

export const metadata = {
  title: "隐私政策",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FFF8F0] font-serif text-[#2C2416]">
      <PageHeader
        title="隐私政策"
        description="内测预览版 · 我们如何对待你的数据"
        backHref="/"
      />
      <main className="mx-auto max-w-3xl px-6 py-10 lg:px-8">
        <article className="rounded-3xl border border-[rgba(212,165,116,0.25)] bg-white/90 p-8 shadow-sm space-y-6 leading-relaxed text-[#5D4E3A]">
          <p>
            律植重视你的隐私。本页为<strong className="text-[#2C2416]">内测阶段</strong>说明，正式发布前将更新为经审定的完整文本。
          </p>
          <ul className="list-disc space-y-3 pl-5">
            <li>为提供账号、登录与风控能力，我们会处理必要的账户信息（如邮箱、昵称、登录记录）。</li>
            <li>你在平台上主动发布的内容（帖子、商品描述等）将按产品功能向其他用户展示。</li>
            <li>支付与结算相关数据将用于完成交易及合规留存，具体以支付渠道与监管要求为准。</li>
            <li>在法律法规要求或征得你同意的情况下，我们可能与合作伙伴共享有限且去标识化后的数据。</li>
            <li>你可通过账号设置或联系支持，在规则范围内访问、更正或删除部分个人信息。</li>
          </ul>
          <p className="text-sm text-[#9A8B78]">
            问题与诉求请见
            <Link href="/contact" className="mx-1 text-[#D4A574] hover:underline">
              联系页面
            </Link>
            。
          </p>
        </article>
      </main>
    </div>
  );
}
