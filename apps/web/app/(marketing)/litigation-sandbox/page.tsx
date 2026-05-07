"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Scale, ShieldCheck, Sparkles } from "lucide-react";

type SandboxForm = {
  role: "employee" | "company";
  entryDate: string;
  monthlySalary: string;
  hasLaborContract: "yes" | "no";
  socialSecurity: "yes" | "no";
  dismissReason: string;
  hasWrittenNotice: "yes" | "no";
  hasPerformancePolicy: "yes" | "no";
  hasPerformanceWarning: "yes" | "no";
  signedExitAgreement: "yes" | "no";
  evidenceOwned: string;
  coreClaim: string;
  alreadyArbitrated: "yes" | "no";
  hasOpponentMaterial: "yes" | "no";
  needLawyerReview: "yes" | "no";
};

const initialForm: SandboxForm = {
  role: "employee",
  entryDate: "",
  monthlySalary: "",
  hasLaborContract: "yes",
  socialSecurity: "yes",
  dismissReason: "",
  hasWrittenNotice: "no",
  hasPerformancePolicy: "no",
  hasPerformanceWarning: "no",
  signedExitAgreement: "no",
  evidenceOwned: "",
  coreClaim: "",
  alreadyArbitrated: "no",
  hasOpponentMaterial: "no",
  needLawyerReview: "yes",
};

const disputeTypes = [
  { id: "labor-open", label: "劳动争议 - 违法解除 / 绩效不合格辞退（已开放）", enabled: true },
  { id: "contract", label: "合同纠纷（即将开放）", enabled: false },
  { id: "debt", label: "欠款追讨（即将开放）", enabled: false },
  { id: "shareholder", label: "股东纠纷（即将开放）", enabled: false },
  { id: "family", label: "婚姻家事（即将开放）", enabled: false },
  { id: "ip", label: "知识产权（即将开放）", enabled: false },
];

export default function LitigationSandboxPage() {
  const [selectedDispute, setSelectedDispute] = useState("labor-open");
  const [form, setForm] = useState<SandboxForm>(initialForm);
  const [generated, setGenerated] = useState(false);

  const result = useMemo(() => {
    const weakEvidence = form.hasWrittenNotice === "no" || form.hasPerformancePolicy === "no";
    const pressureLevel =
      form.signedExitAgreement === "yes" ? "对方抗辩空间较大" : weakEvidence ? "有一定抗辩空间" : "抗辩空间较小";
    const supportLevel =
      form.hasLaborContract === "yes" && form.socialSecurity === "yes" ? "主张支撑度：中等偏强" : "主张支撑度：中等";
    const evidenceLevel = form.evidenceOwned.trim()
      ? "证据完整度：部分关键证据缺失"
      : "证据完整度：主要依赖单方陈述";
    return { pressureLevel, supportLevel, evidenceLevel };
  }, [form]);

  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <section className="rounded-3xl border border-cyan-300/20 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_38%),linear-gradient(130deg,rgba(15,23,42,0.94),rgba(30,41,59,0.9))] p-8 shadow-[0_24px_64px_-30px_rgba(6,182,212,0.8)]">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/35 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
            <Sparkles className="h-3.5 w-3.5" />
            律植诉讼风险沙盘（Demo）
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-cyan-50">开庭前，先做一次案件风险推演。</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300">
            输入案情或补充材料，模拟双方攻防、裁判关注问题和证据压力测试，生成庭审准备报告。
          </p>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-600/40 bg-slate-900/55 p-6">
          <h2 className="text-lg font-semibold text-slate-100">第一步：选择纠纷类型</h2>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {disputeTypes.map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={!item.enabled}
                onClick={() => setSelectedDispute(item.id)}
                className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                  selectedDispute === item.id
                    ? "border-cyan-300/60 bg-cyan-400/10 text-cyan-100"
                    : "border-slate-600/40 bg-slate-800/40 text-slate-300"
                } disabled:cursor-not-allowed disabled:opacity-45`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-600/40 bg-slate-900/55 p-6">
          <h2 className="text-lg font-semibold">第二步：输入案情信息</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="你是员工方还是公司方？">
              <select value={form.role} onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as SandboxForm["role"] }))} className={inputClass}>
                <option value="employee">员工方</option>
                <option value="company">公司方</option>
              </select>
            </Field>
            <Field label="入职时间">
              <input type="date" value={form.entryDate} onChange={(e) => setForm((prev) => ({ ...prev, entryDate: e.target.value }))} className={inputClass} />
            </Field>
            <Field label="月工资（元）">
              <input value={form.monthlySalary} onChange={(e) => setForm((prev) => ({ ...prev, monthlySalary: e.target.value }))} className={inputClass} placeholder="例如 16000" />
            </Field>
            <Field label="公司解除理由">
              <input value={form.dismissReason} onChange={(e) => setForm((prev) => ({ ...prev, dismissReason: e.target.value }))} className={inputClass} placeholder="例如 绩效不合格" />
            </Field>
            <Field label="当前已有证据">
              <textarea value={form.evidenceOwned} onChange={(e) => setForm((prev) => ({ ...prev, evidenceOwned: e.target.value }))} className={`${inputClass} min-h-[92px]`} />
            </Field>
            <Field label="你的主要诉求">
              <textarea value={form.coreClaim} onChange={(e) => setForm((prev) => ({ ...prev, coreClaim: e.target.value }))} className={`${inputClass} min-h-[92px]`} />
            </Field>
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setGenerated(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(120deg,#0891b2,#1d4ed8)] px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_30px_-18px_rgba(14,165,233,0.8)] transition hover:opacity-90"
            >
              开始风险推演
            </button>
          </div>
        </section>

        {generated ? (
          <>
            <section className="mt-6 grid gap-4 md:grid-cols-3">
              <MetricCard icon={<Scale className="h-4 w-4" />} title={result.supportLevel} detail="结合当前输入事实与材料进行结构化判断。" />
              <MetricCard icon={<ShieldCheck className="h-4 w-4" />} title={result.evidenceLevel} detail="建议优先补齐解除程序和绩效过程类证据。" />
              <MetricCard icon={<AlertTriangle className="h-4 w-4" />} title={result.pressureLevel} detail="若存在离职协议或对方材料未知，需谨慎评估。" />
            </section>

            <section className="mt-6 grid gap-4 lg:grid-cols-3">
              <Panel title="争议焦点识别">
                <List items={["公司解除是否合法", "绩效不合格是否有充分依据", "公司是否履行合法解除程序", "是否应支付赔偿金", "证据是否足以支撑主张"]} />
              </Panel>
              <Panel title="模拟双方攻防">
                <List items={["我方主张：违法解除、程序瑕疵、赔偿责任", "对方抗辩：制度充分、已告知、已改进", "裁判关注：制度证据、通知送达、工资年限证明"]} />
              </Panel>
              <Panel title="证据压力测试">
                <List items={["工作年限：劳动合同/社保记录（较完整）", "工资标准：银行流水（较强）", "解除理由：口头通知（较弱）", "绩效依据：暂无（缺失）"]} />
              </Panel>
            </section>

            <section className="mt-6 rounded-2xl border border-slate-600/40 bg-slate-900/55 p-6">
              <h3 className="text-lg font-semibold text-slate-100">庭审准备报告（预览）</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Panel title="报告目录">
                  <List
                    items={[
                      "案情摘要 / 时间线 / 主要诉求",
                      "核心争议焦点与攻防结构",
                      "模拟发问清单与证据压力测试",
                      "缺失材料清单与补充建议",
                      "是否建议律师复核与推荐路径",
                    ]}
                  />
                </Panel>
                <Panel title="下一步动作">
                  <List
                    items={[
                      "继续补充材料",
                      "保存到我的律植（后续接入）",
                      "让律师复核这份报告",
                      "查看相关律师能力档案",
                      "重新推演",
                    ]}
                  />
                </Panel>
              </div>
            </section>
          </>
        ) : null}

        <section className="mt-6 rounded-2xl border border-amber-300/25 bg-amber-300/10 p-5 text-sm leading-relaxed text-amber-50">
          <p className="font-semibold">合规提示</p>
          <p className="mt-2">
            本工具用于案情梳理、庭审准备和诉讼风险推演；不替代律师正式法律意见，不承诺案件结果，不输出确定胜诉率。评估仅基于当前输入信息，复杂案件建议由律师进一步复核。平台不直接提供法律服务，具体法律服务由律师或律所依法提供。
          </p>
        </section>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-slate-300">{label}</span>
      {children}
    </label>
  );
}

function MetricCard({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return (
    <div className="rounded-xl border border-cyan-300/25 bg-cyan-400/10 p-4">
      <div className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-cyan-300/35 text-cyan-100">{icon}</div>
      <p className="text-sm font-semibold text-cyan-50">{title}</p>
      <p className="mt-1 text-xs text-slate-200">{detail}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-600/35 bg-slate-800/45 p-4">
      <h4 className="text-sm font-semibold text-slate-100">{title}</h4>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5 text-xs leading-relaxed text-slate-200">
      {items.map((item) => (
        <li key={item} className="rounded-lg border border-slate-500/25 bg-slate-700/20 px-2.5 py-1.5">
          {item}
        </li>
      ))}
    </ul>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-500/35 bg-slate-800/55 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-400/20";

