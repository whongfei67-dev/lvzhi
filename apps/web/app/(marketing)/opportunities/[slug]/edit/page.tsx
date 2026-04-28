"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api/client";

type FormState = {
  title: string;
  summary: string;
  description: string;
  location: string;
  budget: string;
  deadline: string;
};

export default function OpportunityEditPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sp = useMemo(() => searchParams ?? new URLSearchParams(), [searchParams]);
  const slug = String(params?.slug || "");
  const idFromQuery = String(sp.get("id") || "");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [opportunityId, setOpportunityId] = useState("");
  const [form, setForm] = useState<FormState>({
    title: "",
    summary: "",
    description: "",
    location: "",
    budget: "",
    deadline: "",
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const row = idFromQuery
          ? await api.opportunities.getById(idFromQuery)
          : await api.opportunities.get(slug);
        if (cancelled) return;
        setOpportunityId(String((row as Record<string, unknown>).id || ""));
        setForm({
          title: String((row as Record<string, unknown>).title || ""),
          summary: String((row as Record<string, unknown>).summary || ""),
          description: String((row as Record<string, unknown>).description || ""),
          location: String((row as Record<string, unknown>).location || ""),
          budget: String((row as Record<string, unknown>).budget || ""),
          deadline: String((row as Record<string, unknown>).deadline || "").slice(0, 10),
        });
      } catch {
        if (!cancelled) setError("岗位信息加载失败，请返回后重试。");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, idFromQuery]);

  const detailHref = useMemo(() => `/opportunities/${encodeURIComponent(slug)}`, [slug]);

  const save = async () => {
    if (!opportunityId) return;
    setSaving(true);
    setError(null);
    setOk(null);
    try {
      await api.opportunities.update(opportunityId, {
        title: form.title.trim(),
        summary: form.summary.trim(),
        description: form.description.trim(),
        location: form.location.trim() || null,
        budget: form.budget.trim() || null,
        deadline: form.deadline || null,
      });
      setOk("保存成功");
      setTimeout(() => router.push(detailHref), 500);
    } catch {
      setError("保存失败，请稍后重试。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Link href={detailHref} className="inline-flex items-center gap-2 text-sm text-[#9A8B78] hover:text-[#D4A574]">
          <ArrowLeft className="h-4 w-4" />
          返回岗位详情
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-[#2C2416]">修改岗位</h1>
        <p className="mt-2 text-sm text-[#5D4E3A]">保存后将更新当前岗位信息；如需上架请回工作台点击“上架申请”。</p>

        {loading ? <p className="mt-6 text-sm text-[#9A8B78]">加载中…</p> : null}
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        {ok ? <p className="mt-4 text-sm text-[#3c8c5a]">{ok}</p> : null}

        {!loading ? (
          <div className="mt-6 space-y-4 rounded-2xl border border-[rgba(212,165,116,0.25)] bg-white p-6">
            <label className="block">
              <span className="mb-1 block text-sm text-[#5D4E3A]">标题</span>
              <input
                className="w-full rounded-xl border border-[rgba(212,165,116,0.25)] px-3 py-2"
                value={form.title}
                onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-[#5D4E3A]">摘要</span>
              <input
                className="w-full rounded-xl border border-[rgba(212,165,116,0.25)] px-3 py-2"
                value={form.summary}
                onChange={(e) => setForm((s) => ({ ...s, summary: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-[#5D4E3A]">详情说明</span>
              <textarea
                rows={6}
                className="w-full rounded-xl border border-[rgba(212,165,116,0.25)] px-3 py-2"
                value={form.description}
                onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block">
                <span className="mb-1 block text-sm text-[#5D4E3A]">地点</span>
                <input
                  className="w-full rounded-xl border border-[rgba(212,165,116,0.25)] px-3 py-2"
                  value={form.location}
                  onChange={(e) => setForm((s) => ({ ...s, location: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm text-[#5D4E3A]">预算</span>
                <input
                  className="w-full rounded-xl border border-[rgba(212,165,116,0.25)] px-3 py-2"
                  value={form.budget}
                  onChange={(e) => setForm((s) => ({ ...s, budget: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm text-[#5D4E3A]">截止日期</span>
                <input
                  type="date"
                  className="w-full rounded-xl border border-[rgba(212,165,116,0.25)] px-3 py-2"
                  value={form.deadline}
                  onChange={(e) => setForm((s) => ({ ...s, deadline: e.target.value }))}
                />
              </label>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => void save()}
                className="rounded-xl bg-[#D4A574] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#B8860B] disabled:opacity-60"
              >
                {saving ? "保存中…" : "保存修改"}
              </button>
              <Link
                href={detailHref}
                className="rounded-xl border border-[rgba(212,165,116,0.25)] px-5 py-2.5 text-sm font-medium text-[#5D4E3A]"
              >
                取消
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

