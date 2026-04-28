import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { WorkbenchRolesExperience } from "../_components/workbench-real/WorkbenchRolesExperience";
import type { WorkbenchDemoRole } from "@/lib/workbench/types";

export const dynamic = "force-dynamic";

const ROLES = ["client", "creator", "admin", "super"] as const satisfies readonly WorkbenchDemoRole[];

function isWorkbenchRole(s: string): s is WorkbenchDemoRole {
  return (ROLES as readonly string[]).includes(s);
}

const ROLE_TITLE: Record<WorkbenchDemoRole, string> = {
  client: "客户工作台",
  creator: "创作者工作台",
  admin: "管理员工作台",
  super: "超管工作台",
};

interface PageProps {
  params: Promise<{ role: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { role: raw } = await params;
  if (!isWorkbenchRole(raw)) {
    return { title: "工作台联调 | 律植", robots: { index: false, follow: false } };
  }
  return {
    title: `${ROLE_TITLE[raw]} · 分项联调 | 律植`,
    description: `工作台（${ROLE_TITLE[raw]}）React 联调独立路由`,
    robots: { index: false, follow: false },
  };
}

export default async function WorkbenchRoleSplitPage({ params }: PageProps) {
  const { role: raw } = await params;
  if (!isWorkbenchRole(raw)) notFound();

  return (
    <>
      <div
        className="border-b px-4 py-3 text-center text-xs leading-relaxed"
        style={{ background: "#FFF8F0", color: "#5D4E3A", borderColor: "rgba(212,165,116,0.35)" }}
      >
        <Link href="/project-test" className="font-medium text-[#284A3D] underline underline-offset-2">
          返回项目联调测试页
        </Link>
        <span className="mx-2 opacity-60">·</span>
        <Link href="/project-test/workbench" className="text-[#284A3D] underline underline-offset-2">
          四合一（React）
        </Link>
        <span className="mx-2 opacity-60">·</span>
        <span>
          当前分项：<strong className="font-semibold text-[#2C2416]">{ROLE_TITLE[raw]}</strong>（
          <code className="rounded bg-white px-1 py-0.5 text-[11px]">/project-test/workbench/{raw}</code>）
        </span>
      </div>
      <WorkbenchRolesExperience mode="split" lockedRole={raw} />
    </>
  );
}
