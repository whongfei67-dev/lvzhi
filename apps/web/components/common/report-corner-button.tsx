"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { ApiError, community, getSession } from "@/lib/api/client";

type ReportTargetType = "community_post" | "community_comment" | "skill" | "agent" | "creator_profile";

type Props = {
  targetType: ReportTargetType;
  targetId: string;
  cornerLabel?: string;
  className?: string;
};

const REASON_OPTIONS = [
  "违法违规",
  "虚假误导",
  "侵权抄袭",
  "骚扰辱骂",
  "隐私泄露",
  "其他",
];

export function ReportCornerButton({
  targetType,
  targetId,
  cornerLabel = "举报",
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState(REASON_OPTIONS[0]);
  const [detail, setDetail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const normalizedId = useMemo(() => String(targetId || "").trim(), [targetId]);

  async function onSubmit() {
    if (!normalizedId || submitting) return;
    setSubmitting(true);
    setError(null);
    setMsg(null);
    try {
      const session = await getSession();
      if (!session || session.role === "visitor") {
        setError("请先登录后再举报");
        return;
      }
      await community.report({
        target_type: targetType,
        target_id: normalizedId,
        reason,
        detail: detail.trim() || undefined,
      });
      setMsg("举报已提交，平台将尽快审核。");
      setDetail("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "举报提交失败，请稍后再试");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className={className}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[rgba(212,165,116,0.22)] bg-[rgba(255,248,240,0.75)] px-3 py-1.5 text-xs text-[#8B7355] hover:border-[rgba(212,165,116,0.45)] hover:text-[#5C4033]"
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          {cornerLabel}
        </button>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/35 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[rgba(212,165,116,0.25)] bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#2C2416]">提交举报</h3>
              <button type="button" onClick={() => setOpen(false)} className="rounded-md p-1 text-[#8B7355] hover:bg-[#f8efe3]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mb-3 text-xs leading-relaxed text-[#8B7355]">
              请选择举报原因并补充说明。平台会在审核后处理并反馈结果。
            </p>
            <div className="space-y-3">
              <select
                className="w-full rounded-xl border border-[rgba(212,165,116,0.28)] bg-white px-3 py-2 text-sm text-[#2C2416] focus:border-[#D4A574] focus:outline-none"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                {REASON_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <textarea
                rows={4}
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="补充说明（可选）"
                className="w-full resize-none rounded-xl border border-[rgba(212,165,116,0.28)] bg-white px-3 py-2 text-sm text-[#2C2416] placeholder:text-[#9A8B78] focus:border-[#D4A574] focus:outline-none"
              />
              {msg ? <div className="text-sm text-[#2f8f4e]">{msg}</div> : null}
              {error ? <div className="text-sm text-[#b63f2e]">{error}</div> : null}
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-[rgba(212,165,116,0.28)] px-3 py-2 text-sm text-[#6B5B4D] hover:bg-[#fdf7ef]"
                >
                  取消
                </button>
                <button
                  type="button"
                  disabled={!normalizedId || submitting}
                  onClick={() => void onSubmit()}
                  className="rounded-lg bg-[#D4A574] px-3 py-2 text-sm font-medium text-white hover:bg-[#B8860B] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "提交中..." : "提交举报"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
