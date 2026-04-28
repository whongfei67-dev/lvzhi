import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Mail } from "lucide-react";

export const metadata = {
  title: "联系我们",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#FFF8F0] font-serif text-[#2C2416]">
      <PageHeader
        title="联系我们"
        description="内测反馈、商务合作与媒体沟通"
        backHref="/creator-guide/faq"
      />
      <main className="mx-auto max-w-3xl px-6 py-10 lg:px-8">
        <div className="rounded-3xl border border-[rgba(212,165,116,0.25)] bg-white/90 p-8 shadow-sm space-y-6">
          <p className="leading-relaxed text-[#5D4E3A]">
            内测期间优先通过邮件收集问题与建议，便于归档与跟进。我们会在
            <strong className="text-[#2C2416]"> 2 个工作日内 </strong>
            尽量回复。
          </p>
          <a
            href="mailto:15395301253@163.com"
            className="flex items-center gap-3 rounded-2xl border border-[rgba(212,165,116,0.3)] bg-[rgba(212,165,116,0.06)] px-5 py-4 text-[#5C4033] transition-colors hover:border-[#D4A574]"
          >
            <Mail className="h-5 w-5 text-[#D4A574]" />
            <span className="font-medium">15395301253@163.com</span>
          </a>
          <p className="text-sm text-[#9A8B78]">
            若需紧急支持，请同时在
            <Link href="/community" className="mx-1 text-[#D4A574] hover:underline">
              社区
            </Link>
            留言，便于运营同事看到。
          </p>
        </div>
      </main>
    </div>
  );
}
