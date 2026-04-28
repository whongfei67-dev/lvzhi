import { modules, roles } from "@/lib/prd-data";

const jobs = [
  { title: "合规法务实习生", match: "92%", city: "上海", tags: ["实习", "合规", "外企"] },
  { title: "争议解决律师助理", match: "87%", city: "深圳", tags: ["律所", "诉讼", "应届可投"] },
  { title: "知识产权律师", match: "81%", city: "杭州", tags: ["专利", "执业 2 年+", "高匹配"] },
];

const agents = [
  { name: "合同审阅助手", demoType: "轻量交互演示", stats: "演示 2,480 次 / 转化 12.6%" },
  { name: "劳动争议问答助手", demoType: "15 秒快速演示", stats: "演示 1,908 次 / 转化 9.8%" },
  { name: "求职文书生成助手", demoType: "求职展示型", stats: "试用 864 次 / 好评 96%" },
];

const metrics = [
  { label: "今日演示开始次数", value: "1,286" },
  { label: "有效演示次数", value: "942" },
  { label: "7 日咨询转化用户", value: "118" },
  { label: "真实好评率", value: "94.2%" },
];

export function WorkspacePage() {
  return (
    <main className="page-shell py-12 space-y-8">
      {/* Hero */}
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
        <div className="space-y-4">
          <p className="text-sm font-medium text-[var(--highlight)] uppercase tracking-wider">Workspace</p>
          <h1 className="text-3xl font-bold text-[var(--ink)]">产品骨架已经按 PRD 切开</h1>
          <p className="text-[var(--muted)] leading-relaxed">
            这个页面不是最终设计稿，而是把首页、角色工作台、职位、智能体演示与数据口径先落成统一骨架，
            方便我们继续接后端和真实数据。
          </p>
        </div>
        <div className="card p-6 grid grid-cols-2 gap-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="space-y-1">
              <span className="text-xs text-[var(--muted)]">{metric.label}</span>
              <strong className="block text-xl font-bold text-[var(--ink)]">{metric.value}</strong>
            </div>
          ))}
        </div>
      </section>

      {/* Roles + Jobs */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <article className="card p-6 space-y-4">
          <div className="flex items-start justify-between">
            <h2 className="text-lg font-semibold text-[var(--ink)]">统一账号与角色切换</h2>
            <span className="text-xs text-[var(--muted)] bg-[var(--surface-strong)] px-2 py-1 rounded-full border border-[var(--line)]">
              账号是最小管理主体
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {roles.map((role) => (
              <div key={role.id} className="p-3 rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] space-y-1">
                <strong className="text-sm font-semibold text-[var(--ink)]">{role.name}</strong>
                <p className="text-xs text-[var(--muted)] leading-relaxed">{role.summary}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="card p-6 space-y-4">
          <div className="flex items-start justify-between">
            <h2 className="text-lg font-semibold text-[var(--ink)]">职位推荐</h2>
            <span className="text-xs text-[var(--muted)] bg-[var(--surface-strong)] px-2 py-1 rounded-full border border-[var(--line)]">
              AI 匹配入口
            </span>
          </div>
          <div className="space-y-3">
            {jobs.map((job) => (
              <div key={job.title} className="flex items-start justify-between p-3 rounded-xl border border-[var(--line)] bg-[var(--surface-strong)]">
                <div>
                  <strong className="text-sm font-semibold text-[var(--ink)]">{job.title}</strong>
                  <p className="text-xs text-[var(--muted)]">{job.city}</p>
                </div>
                <div className="text-right space-y-1.5">
                  <em className="block text-sm font-bold text-[var(--success)] not-italic">{job.match}</em>
                  <div className="flex gap-1 flex-wrap justify-end">
                    {job.tags.map((tag) => (
                      <span key={tag} className="text-xs px-1.5 py-0.5 rounded-full bg-[var(--accent)]/8 text-[var(--accent)] border border-[var(--accent)]/15">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      {/* Agents + Modules */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <article className="card p-6 space-y-4">
          <div className="flex items-start justify-between">
            <h2 className="text-lg font-semibold text-[var(--ink)]">智能体市场与演示</h2>
            <span className="text-xs text-[var(--muted)] bg-[var(--surface-strong)] px-2 py-1 rounded-full border border-[var(--line)]">
              演示是独立内容对象
            </span>
          </div>
          <div className="space-y-3">
            {agents.map((agent) => (
              <div key={agent.name} className="flex items-start justify-between p-3 rounded-xl border border-[var(--line)] bg-[var(--surface-strong)]">
                <div>
                  <strong className="text-sm font-semibold text-[var(--ink)]">{agent.name}</strong>
                  <p className="text-xs text-[var(--muted)]">{agent.demoType}</p>
                </div>
                <span className="text-xs text-[var(--muted)] text-right max-w-[140px] leading-relaxed">
                  {agent.stats}
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="card p-6 space-y-4">
          <div className="flex items-start justify-between">
            <h2 className="text-lg font-semibold text-[var(--ink)]">MVP 模块清单</h2>
            <span className="text-xs text-[var(--muted)] bg-[var(--surface-strong)] px-2 py-1 rounded-full border border-[var(--line)]">
              后续开发顺序
            </span>
          </div>
          <div className="space-y-2">
            {modules.map((module) => (
              <div key={module.id} className="flex items-center justify-between p-3 rounded-xl border border-[var(--line)] bg-[var(--surface-strong)]">
                <strong className="text-sm font-semibold text-[var(--ink)]">{module.name}</strong>
                <span className="text-xs text-[var(--highlight)] font-medium">{module.phase}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
