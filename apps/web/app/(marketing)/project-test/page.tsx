import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getUpstreamApiBaseUrl } from "@/lib/upstream-api-base";

export const metadata: Metadata = {
  title: "项目联调测试页 | 律植",
  description: "内测/迁移后快速验证 Web 与 API 连通及主路由可达",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type HealthResult =
  | { ok: true; body: unknown; ms: number }
  | { ok: false; error: string; ms: number };

/** Node 17+ 才有 AbortSignal.timeout；旧环境避免整页 500 */
async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { cache: "no-store", signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

async function probeHealth(path: string): Promise<HealthResult> {
  const base = getUpstreamApiBaseUrl();
  const url = `${base}${path}`;
  const t0 = Date.now();
  try {
    const res = await fetchWithTimeout(url, 4500);
    const ms = Date.now() - t0;
    const text = await res.text();
    let body: unknown = text;
    try {
      body = JSON.parse(text) as unknown;
    } catch {
      /* 非 JSON */
    }
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}`, ms };
    return { ok: true, body, ms };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e), ms: Date.now() - t0 };
  }
}

const ROUTE_GROUPS: { title: string; items: { href: string; label: string }[] }[] = [
  {
    title: "营销与公区（蓝图一级）",
    items: [
      { href: "/", label: "首页" },
      { href: "/inspiration", label: "灵感广场" },
      { href: "/community", label: "社区" },
      { href: "/opportunities", label: "合作机会" },
      { href: "/creator-guide", label: "创作指南" },
      { href: "/lawyers", label: "发现律师" },
    ],
  },
  {
    title: "社区：话题 / 标签（独立路由）",
    items: [
      { href: "/community/topic", label: "话题广场" },
      { href: "/community/topic/experience", label: "话题详情示例" },
      { href: "/community/tag", label: "标签广场" },
      { href: "/community/tag/%E5%8A%B3%E5%8A%A8%E6%B3%95", label: "标签详情示例" },
    ],
  },
  {
    title: "工作台与账户",
    items: [
      { href: "/project-test/workbench", label: "工作台多角色联调（四合一 · React）" },
      { href: "/project-test/workbench/client", label: "联调 · 客户工作台（单项）" },
      { href: "/project-test/workbench/creator", label: "联调 · 创作者工作台（单项）" },
      { href: "/project-test/workbench/admin", label: "联调 · 管理员工作台（单项）" },
      { href: "/project-test/workbench/super", label: "联调 · 超管工作台（单项）" },
      { href: "/workspace", label: "客户工作台" },
      { href: "/creator", label: "创作者工作台" },
      { href: "/login", label: "登录" },
      { href: "/register", label: "注册" },
    ],
  },
  {
    title: "合规与联系",
    items: [
      { href: "/terms", label: "用户协议" },
      { href: "/privacy", label: "隐私政策" },
      { href: "/contact", label: "联系我们" },
    ],
  },
];

function HealthBlock({
  title,
  result,
  urlHint,
}: {
  title: string;
  result: HealthResult;
  urlHint: string;
}) {
  return (
    <div
      className="rounded-2xl border p-4"
      style={{ borderColor: "rgba(212,165,116,0.35)", background: "#fff" }}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[#5C4033]">{title}</h3>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            result.ok ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
          }`}
        >
          {result.ok ? "可达" : "失败"}
        </span>
      </div>
      <p className="mt-1 text-xs text-[#9A8B78]">探测：{urlHint}</p>
      <p className="mt-1 text-xs text-[#5D4E3A]">耗时 {result.ms} ms</p>
      {!result.ok ? (
        <p className="mt-2 text-sm text-red-700">{result.error}</p>
      ) : (
        <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-[#FFF8F0] p-2 text-xs text-[#2C2416]">
          {JSON.stringify(result.body, null, 2)}
        </pre>
      )}
    </div>
  );
}

function HealthProbeFallback() {
  return (
    <section className="mb-10 grid gap-4 sm:grid-cols-2" aria-busy="true">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border p-4"
          style={{ borderColor: "rgba(212,165,116,0.35)", background: "#fff" }}
        >
          <div className="h-4 w-32 rounded bg-[rgba(212,165,116,0.25)]" />
          <div className="mt-3 h-3 w-full max-w-[220px] rounded bg-[rgba(212,165,116,0.15)]" />
          <p className="mt-3 text-xs text-[#9A8B78]">正在从 Next 服务端探测 API（最多约 5 秒）…</p>
        </div>
      ))}
    </section>
  );
}

async function HealthProbeSection() {
  const [basic, detailed] = await Promise.all([probeHealth("/health"), probeHealth("/health/detailed")]);
  const apiBase = getUpstreamApiBaseUrl();

  return (
    <section className="mb-10 grid gap-4 sm:grid-cols-2">
      <HealthBlock title="API /health" result={basic} urlHint={`${apiBase}/health`} />
      <HealthBlock title="API /health/detailed" result={detailed} urlHint={`${apiBase}/health/detailed`} />
    </section>
  );
}

export default function ProjectTestPage() {
  return (
    <div className="min-h-screen bg-[#FFF8F0] px-4 py-10 text-[#2C2416]">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 border-b border-[rgba(212,165,116,0.35)] pb-6">
          <div className="mb-3">
            <Link
              href="/"
              className="inline-block rounded-xl border border-[rgba(212,165,116,0.4)] bg-white px-3 py-2 text-sm font-medium text-[#284A3D] transition-colors hover:border-[#D4A574] hover:bg-[rgba(212,165,116,0.08)]"
            >
              返回主页
            </Link>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#B8860B]">内测 / 迁移自检</p>
          <h1 className="mt-2 text-2xl font-bold text-[#5C4033]">项目联调测试页</h1>
          <div
            className="mt-4 rounded-2xl border-2 border-amber-400 bg-amber-50 px-4 py-3 text-sm text-[#5C4033]"
            role="status"
          >
            <p className="font-semibold">请在本机浏览器打开的是下面这个地址（端口 3000 = Next 网站）：</p>
            <p className="mt-2 font-mono text-base font-bold text-[#284A3D]">http://127.0.0.1:3000/project-test</p>
            <p className="mt-3 text-[#5D4E3A]">
              <strong className="font-semibold">连不上本页时：</strong>① 必须在含{" "}
              <code className="rounded bg-white px-1">package.json</code> 的目录执行 pnpm（在用户主目录{" "}
              <code className="rounded bg-white px-1">~</code> 执行会报{" "}
              <code className="rounded bg-white px-1">ERR_PNPM_NO_IMPORTER_MANIFEST_FOUND</code>
              ）。② 在「律植（新）代码」根目录执行{" "}
              <code className="rounded bg-white px-1">pnpm dev</code>（同时起 Web+API）或{" "}
              <code className="rounded bg-white px-1">pnpm dev:web</code>（仅 Next）；或在{" "}
              <code className="rounded bg-white px-1">apps/web</code> 下执行{" "}
              <code className="rounded bg-white px-1">pnpm dev</code>
              。③ 终端里会打印实际端口（默认多为 3000），用该端口打开本路径{" "}
              <code className="rounded bg-white px-1">/project-test</code>。仅执行{" "}
              <code className="rounded bg-white px-1">pnpm dev:api</code> 只有 4000 API，浏览器访问 3000 会失败。
            </p>
            <p className="mt-2 text-xs text-[#5D4E3A]">
              开发环境下，全站页脚与顶部导航会显示「测试页 / 联调测试页」入口链接至此。
            </p>
            <p className="mt-3 text-[#5D4E3A]">
              <strong className="font-semibold">工作台多角色联调：</strong>
              四合一（React 实装，可测 Tab 与侧栏锚点）在{" "}
              <Link
                href="/project-test/workbench"
                className="font-mono font-semibold text-[#284A3D] underline underline-offset-2"
              >
                /project-test/workbench
              </Link>
              ；分项单独测：
              <Link href="/project-test/workbench/client" className="ml-1 font-mono text-[#284A3D] underline">
                …/client
              </Link>
              、
              <Link href="/project-test/workbench/creator" className="font-mono text-[#284A3D] underline">
                …/creator
              </Link>
              、
              <Link href="/project-test/workbench/admin" className="font-mono text-[#284A3D] underline">
                …/admin
              </Link>
              、
              <Link href="/project-test/workbench/super" className="font-mono text-[#284A3D] underline">
                …/super
              </Link>
              。视觉对齐静态对照{" "}
              <Link href="/workbench-roles-demo.html" className="underline">
                /workbench-roles-demo.html
              </Link>
              。
            </p>
            <p className="mt-3 text-[#5D4E3A]">
              不要把测试页当成 <code className="rounded bg-white px-1">http://127.0.0.1:4000/</code> 打开：4000
              是 API（Fastify），不是 Next 网站。若下方「API /health」显示失败，再在根目录执行{" "}
              <code className="rounded bg-white px-1">pnpm dev:api</code>
              ，并访问 <code className="rounded bg-white px-1">http://127.0.0.1:4000/health</code> 应返回 JSON。
            </p>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-[#5D4E3A]">
            路径：<code className="rounded bg-white px-1.5 py-0.5 text-[#284A3D]">/project-test</code>
            。本页由 Next 服务端去请求 API（见环境变量{" "}
            <code className="rounded bg-white px-1">API_PROXY_TARGET</code>，默认{" "}
            <code className="rounded bg-white px-1">http://127.0.0.1:4000</code>
            ）。生产环境建议在网关层限制或删除本页。
          </p>
        </header>

        <Suspense fallback={<HealthProbeFallback />}>
          <HealthProbeSection />
        </Suspense>

        <section className="mb-10 rounded-2xl border border-[rgba(212,165,116,0.35)] bg-white p-5">
          <h2 className="text-sm font-semibold text-[#5C4033]">命令行（在「律植（新）代码」根目录）</h2>
          <ul className="mt-3 space-y-2 font-mono text-xs text-[#2C2416]">
            <li>
              <span className="text-[#9A8B78]"># 站内链接审计</span>
              <br />
              pnpm beta:audit-links
            </li>
            <li className="pt-1">
              <span className="text-[#9A8B78]"># API 冒烟（需 API 已启动）</span>
              <br />
              pnpm beta:smoke
            </li>
          </ul>
        </section>

        {ROUTE_GROUPS.map((group) => (
          <section key={group.title} className="mb-8">
            <h2 className="mb-3 text-sm font-semibold text-[#5C4033]">{group.title}</h2>
            <ul className="flex flex-wrap gap-2">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-block rounded-xl border border-[rgba(212,165,116,0.4)] bg-white px-3 py-2 text-sm text-[#284A3D] transition-colors hover:border-[#D4A574] hover:bg-[rgba(212,165,116,0.08)]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <p className="text-center text-xs text-[#9A8B78]">
          更系统的代码整理建议见仓库{" "}
          <code className="rounded bg-white px-1">律植项目/内测工程/代码整理与优化方案.md</code>
        </p>
      </div>
    </div>
  );
}
