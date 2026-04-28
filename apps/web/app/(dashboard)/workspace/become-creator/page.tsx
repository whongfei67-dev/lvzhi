import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/server-session";
import { ArrowRight, BookOpen, ClipboardList } from "lucide-react";

export const dynamic = "force-dynamic";

/**
 * 客户工作台 — 申请成为创作者（仅注册为「客户」的已登录用户）
 */
export default async function WorkspaceBecomeCreatorPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  if (session.role === "creator") redirect("/creator");
  if (session.role !== "client") redirect("/workspace");

  return (
    <div className="p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-[#2C2416]">申请成为创作者</h1>
        <p className="mt-2 text-[#5D4E3A]">
          你当前为<strong className="font-semibold text-[#2C2416]">客户</strong>
          身份。完成下方步骤后，即可在平台发布 Skills、智能体等内容并获得收益。
        </p>

        <ol className="mt-8 space-y-6">
          <li className="flex gap-4 rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[rgba(212,165,116,0.15)]">
              <BookOpen className="h-5 w-5 text-[#D4A574]" />
            </div>
            <div>
              <h2 className="font-semibold text-[#2C2416]">了解创作者权益与规则</h2>
              <p className="mt-1 text-sm text-[#5D4E3A]">
                阅读创作者中心介绍、创作指南与平台规范，确认符合入驻条件。
              </p>
              <Link
                href="/creator-guide/center"
                className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#D4A574] hover:underline"
              >
                前往创作者中心
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </li>
          <li className="flex gap-4 rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[rgba(212,165,116,0.15)]">
              <ClipboardList className="h-5 w-5 text-[#D4A574]" />
            </div>
            <div>
              <h2 className="font-semibold text-[#2C2416]">提交资料与审核</h2>
              <p className="mt-1 text-sm text-[#5D4E3A]">
                后续将在此页或账号设置中开放「升级为创作者」表单；当前可先通过创作者中心入口联系平台完成身份升级。
              </p>
              <Link
                href="/creator-guide"
                className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#D4A574] hover:underline"
              >
                查看创作指南
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </li>
        </ol>

        <p className="mt-8 text-sm text-[#9A8B78]">
          若你已完成身份升级，请从网站导航进入
          <Link href="/creator" className="mx-1 font-medium text-[#D4A574] hover:underline">
            创作者工作台
          </Link>
          管理作品与收益。
        </p>
      </div>
    </div>
  );
}
