import * as React from "react";

interface CommunityStatsSectionProps {
  agentCount?: number;
  lawyerCount?: number;
  verifiedLawyerCount?: number;
  userCount?: number;
  demoCount?: number;
}

const STAT_CONFIG = [
  {
    key: "agentCount" as const,
    defaultValue: 500,
    suffix: "+",
    label: "法律智能体",
    description: "覆盖合同、诉讼、合规等全场景",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
    color: "text-blue-600 bg-blue-100",
  },
  {
    key: "verifiedLawyerCount" as const,
    defaultValue: 100,
    suffix: "+",
    label: "执业律师",
    description: "完成平台执业资质认证的律师创作者",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      </svg>
    ),
    color: "text-emerald-600 bg-emerald-100",
  },
  {
    key: "lawyerCount" as const,
    defaultValue: 200,
    suffix: "+",
    label: "认证创作者",
    description: "通过律师资质认证的创作者",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.97z" />
      </svg>
    ),
    color: "text-indigo-600 bg-indigo-100",
  },
  {
    key: "userCount" as const,
    defaultValue: 10000,
    suffix: "+",
    label: "注册用户",
    description: "求职者、客户、法律爱好者",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    color: "text-violet-600 bg-violet-100",
  },
  {
    key: "demoCount" as const,
    defaultValue: 50000,
    suffix: "+",
    label: "演示次数",
    description: "用户真实体验的智能体演示",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
      </svg>
    ),
    color: "text-amber-600 bg-amber-100",
  },
];

function formatNumber(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(0)}w`;
  if (n >= 1000)  return `${(n / 1000).toFixed(0)}k`;
  return `${n}`;
}

export function CommunityStatsSection({
  agentCount,
  lawyerCount,
  verifiedLawyerCount,
  userCount,
  demoCount,
}: CommunityStatsSectionProps) {
  const values = { agentCount, lawyerCount, verifiedLawyerCount, userCount, demoCount };

  return (
    <section className="bg-slate-50 py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">平台数据</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-950">正在蓬勃生长的法律 AI 生态</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {STAT_CONFIG.map(({ key, defaultValue, suffix, label, description, icon, color }) => {
            const raw = values[key] ?? defaultValue;
            return (
              <div
                key={key}
                className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color}`}>
                  {icon}
                </div>
                <div>
                  <p className="text-4xl font-bold text-slate-950">
                    {formatNumber(raw)}{suffix}
                  </p>
                  <p className="mt-1 font-semibold text-slate-700">{label}</p>
                  <p className="mt-1 text-sm text-slate-500">{description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
