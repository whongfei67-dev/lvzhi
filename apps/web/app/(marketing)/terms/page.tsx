import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";

export const metadata = {
  title: "服务条款",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FFF8F0] font-serif text-[#2C2416]">
      <PageHeader
        title="服务条款"
        description="内测预览版 · 正式稿上线前可能更新"
        backHref="/"
      />
      <main className="mx-auto max-w-3xl px-6 py-10 lg:px-8">
        <article className="rounded-3xl border border-[rgba(212,165,116,0.25)] bg-white/90 p-8 shadow-sm space-y-6 leading-relaxed text-[#5D4E3A]">
          <p>
            欢迎使用律植。本页面为<strong className="text-[#2C2416]">内测阶段</strong>的服务条款摘要，用于说明平台定位与基本使用规则；正式发布前将以法务审定版本为准。
          </p>
          <ol className="list-decimal space-y-3 pl-5">
            <li>
              律植是面向法律从业者的灵感、工具与社区平台，<strong className="text-[#2C2416]">不提供律师—客户关系下的法律服务</strong>，具体能力以各创作者发布的内容为准。
            </li>
            <li>您应保证注册信息真实，妥善保管账号与密码，对账号下的行为负责。</li>
            <li>您发布的内容须合法合规，不得侵害他人权益或含有违法信息；平台有权依规则审核、下架或限制传播。</li>
            <li>付费、试用、提现等规则以对应页面及订单说明为准。</li>
            <li>如继续使用律植，即表示您已阅读并理解上述要点；完整条款与隐私细则请参阅《隐私政策》。</li>
          </ol>
          <p className="text-sm text-[#9A8B78]">
            如需纸质或盖章版本，请通过
            <Link href="/contact" className="mx-1 text-[#D4A574] hover:underline">
              联系我们
            </Link>
            说明用途。
          </p>
        </article>
      </main>
    </div>
  );
}
