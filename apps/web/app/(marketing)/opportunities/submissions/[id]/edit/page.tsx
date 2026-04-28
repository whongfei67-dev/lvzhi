"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Upload } from "lucide-react";
import { api, uploadFormFile } from "@/lib/api/client";

type SubmissionRow = Record<string, unknown>;

export default function OpportunitySubmissionEditPage() {
  const params = useParams();
  const router = useRouter();
  const submissionId = String(params?.id || "");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [row, setRow] = useState<SubmissionRow | null>(null);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.workspace.getMyOpportunitySubmissions({ page: 1, limit: 100 });
        const found = (res.items || []).find((x) => String(x.id) === submissionId) || null;
        if (cancelled) return;
        setRow(found);
        setMessage(found ? String(found.message || "") : "");
        if (!found) setError("未找到该投递记录，请从工作台重新进入。");
      } catch {
        if (!cancelled) setError("加载投递记录失败，请稍后重试。");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [submissionId]);

  const backHref = useMemo(() => "/workspace/workbench/cli-job-manage", []);
  const oppSlug = String(row?.opportunity_slug || row?.opportunity_id || "");
  const opportunityHref = `/opportunities/${encodeURIComponent(oppSlug)}`;

  const save = async () => {
    if (!row) return;
    const targetId = String(row.opportunity_slug || row.opportunity_id || "");
    if (!targetId) {
      setError("投递目标无效，无法保存。");
      return;
    }

    setSaving(true);
    setError(null);
    setOk(null);
    try {
      let fileUrl = String(row.file_url || "");
      let originalName = String(row.original_name || "");
      let uploadedId: string | undefined;
      if (file) {
        const up = await uploadFormFile(file);
        fileUrl = up.url;
        originalName = up.original_name;
        uploadedId = up.id || undefined;
      }

      await api.opportunities.submitApplication(targetId, {
        file_url: fileUrl,
        original_name: originalName || undefined,
        message: message.trim() || undefined,
        uploaded_file_id: uploadedId,
      });

      setOk("投递修改已提交");
      setTimeout(() => router.push(backHref), 600);
    } catch {
      setError("保存失败，请稍后重试。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Link href={backHref} className="inline-flex items-center gap-2 text-sm text-[#9A8B78] hover:text-[#D4A574]">
          <ArrowLeft className="h-4 w-4" />
          返回我的岗位
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-[#2C2416]">修改投递</h1>
        <p className="mt-2 text-sm text-[#5D4E3A]">可直接修改已提交的投递说明，并可重新上传材料覆盖旧版本。</p>

        {loading ? <p className="mt-6 text-sm text-[#9A8B78]">加载中…</p> : null}
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        {ok ? <p className="mt-4 text-sm text-[#3c8c5a]">{ok}</p> : null}

        {!loading && row ? (
          <div className="mt-6 space-y-4 rounded-2xl border border-[rgba(212,165,116,0.25)] bg-white p-6">
            <div className="text-sm text-[#5D4E3A]">
              <div>
                岗位：
                <Link href={opportunityHref} className="text-[#D4A574] hover:underline">
                  {String(row.opportunity_title || "—")}
                </Link>
              </div>
              <div className="mt-1">当前文件：{String(row.original_name || "未命名文件")}</div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,image/jpeg,image/png,image/gif,image/webp"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[rgba(212,165,116,0.45)] bg-[rgba(255,255,255,0.5)] px-4 py-4 text-sm text-[#5D4E3A]"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 text-[#D4A574]" />
              {file ? `新文件：${file.name}` : "点击重新上传投递文件（可选）"}
            </button>

            <label className="block">
              <span className="mb-1 block text-sm text-[#5D4E3A]">投递说明</span>
              <textarea
                rows={5}
                className="w-full rounded-xl border border-[rgba(212,165,116,0.25)] px-3 py-2"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </label>

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
                href={backHref}
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

