import type { Metadata } from "next";
import Link from "next/link";

import { WorkbenchRolesExperience } from "./_components/workbench-real/WorkbenchRolesExperience";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "工作台多角色联调 UI | 律植",
  description: "客户 / 创作者 / 管理员 / 超管工作台 React 联调（可测路由与交互）",
  robots: { index: false, follow: false },
};

const SPLIT_LINKS = [
  { href: "/project-test/workbench/client", label: "仅客户" },
  { href: "/project-test/workbench/creator", label: "仅创作者" },
  { href: "/project-test/workbench/admin", label: "仅管理员" },
  { href: "/project-test/workbench/super", label: "仅超管" },
] as const;

export default function WorkbenchIntegrationPage() {
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
        <span>
          本页为<strong className="font-semibold">四合一</strong>（React 按钮切 Tab）；要<strong className="font-semibold">分项单独测</strong>请打开：
        </span>
        {SPLIT_LINKS.map((item, i) => (
          <span key={item.href}>
            {i > 0 ? <span className="mx-1 opacity-50">|</span> : null}
            <Link href={item.href} className="text-[#284A3D] underline underline-offset-2">
              {item.label}
            </Link>
          </span>
        ))}
        <p className="mt-2 text-[11px] text-[#7a6b5c]">
          本组路由为 <strong className="font-semibold">React 实装</strong>（非整页 HTML 注入），样式仍由{" "}
          <code className="rounded bg-white px-1 py-0.5 text-[#2C2416]">workbench-integration.css</code> 限定在{" "}
          <code className="rounded bg-white px-1 py-0.5 text-[#2C2416]">#workbench-integration-mount</code>
          。静态对照页：{" "}
          <Link href="/workbench-roles-demo.html" className="text-[#284A3D] underline underline-offset-2">
            /workbench-roles-demo.html
          </Link>
        </p>
      </div>
      <WorkbenchRolesExperience mode="combined" />
    </>
  );
}
