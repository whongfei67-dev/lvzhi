"use client";

import Link from "next/link";

export default function NewSkillPage() {
  return (
    <div className="page-shell py-10 max-w-2xl space-y-6">
      <Link href="/creator/skills" className="text-sm text-[var(--muted)] hover:text-[var(--accent)]">
        ← 返回 Skills 列表
      </Link>
      <div className="card p-8 space-y-4">
        <p className="text-sm font-semibold text-[#B8860B]">创作者 · Skills</p>
        <h1 className="text-2xl font-bold text-[var(--ink)]">创建 Skills</h1>
        <p className="text-[var(--muted)] leading-relaxed">
          内测阶段技能包编辑与审核提交流程仍在联调。请先在工作台整理素材与定价策略；完整表单与文件上传将在下一迭代开放。
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/creator-guide/getting-started"
            className="inline-flex rounded-2xl bg-gradient-to-r from-[#D4A574] to-[#B8860B] px-4 py-2 text-sm font-semibold text-white"
          >
            创作者入门
          </Link>
          <Link
            href="/creator/skills"
            className="inline-flex rounded-2xl border border-[rgba(212,165,116,0.3)] px-4 py-2 text-sm font-medium text-[#5C4033] hover:bg-[rgba(212,165,116,0.08)]"
          >
            返回列表
          </Link>
        </div>
      </div>
    </div>
  );
}
