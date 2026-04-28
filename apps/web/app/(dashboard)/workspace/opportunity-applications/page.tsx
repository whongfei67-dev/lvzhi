"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { Briefcase, ExternalLink, FileDown } from "lucide-react";

type Row = {
  id: string;
  file_url: string;
  original_name: string | null;
  message: string | null;
  created_at: string;
  updated_at: string;
  opportunity_id: string | null;
  community_post_id?: string | null;
  application_source?: string | null;
  opportunity_title: string;
  opportunity_slug: string;
  applicant_name: string;
};

const OA_COMMUNITY_TEXT_FILE = "community:text-only";

function rowIsCommunityApplication(r: Row): boolean {
  return r.application_source === "community_post" || Boolean(r.community_post_id);
}

export default function OpportunityApplicationsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await api.workspace.getOpportunityApplications({ page, limit: 20 });
        if (!cancelled) {
          setRows((res.items as unknown as Row[]) || []);
          setTotal(res.total);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setRows([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#2C2416]">机会投递</h1>
        <p className="mt-2 text-[#5D4E3A]">
          展示他人向您发布的合作机会所上传的投递材料，以及通过社区帖子向您发起的正文投递（岗位管理同一入口）。
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-[rgba(212,165,116,0.12)]" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-[rgba(212,165,116,0.25)] bg-white p-12 text-center">
          <Briefcase className="mx-auto h-10 w-10 text-[#9A8B78]" aria-hidden />
          <p className="mt-4 text-sm text-[#5D4E3A]">
            暂无投递记录。当有人在您发布的机会页完成「上传并提交投递」，或在社区向您「投递」帖子后，会出现在这里。
          </p>
          <Link href="/opportunities" className="mt-6 inline-block text-sm font-medium text-[#D4A574] hover:text-[#B8860B]">
            去合作机会发布或浏览 →
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {rows.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl border border-[rgba(212,165,116,0.25)] bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#9A8B78]">
                    {rowIsCommunityApplication(r) ? "关联社区帖子" : "关联机会"}
                  </p>
                  <Link
                    href={
                      rowIsCommunityApplication(r) && r.community_post_id
                        ? `/community/post/${encodeURIComponent(r.community_post_id)}`
                        : `/opportunities/${encodeURIComponent(r.opportunity_slug || r.opportunity_id || "")}`
                    }
                    className="mt-1 inline-flex items-center gap-1 text-base font-semibold text-[#2C2416] hover:text-[#D4A574]"
                  >
                    {r.opportunity_title}
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
                  </Link>
                  <p className="mt-2 text-sm text-[#5D4E3A]">
                    投递人：<span className="font-medium text-[#2C2416]">{r.applicant_name}</span>
                  </p>
                  {r.message ? (
                    <p className="mt-2 max-w-2xl whitespace-pre-wrap text-sm text-[#5D4E3A]">{r.message}</p>
                  ) : null}
                  <p className="mt-2 text-xs text-[#9A8B78]">
                    更新时间：{new Date(r.updated_at).toLocaleString("zh-CN")}
                  </p>
                </div>
                {r.file_url === OA_COMMUNITY_TEXT_FILE ? (
                  <span className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[rgba(212,165,116,0.35)] bg-[rgba(255,251,244,0.9)] px-4 py-2.5 text-sm font-medium text-[#5D4E3A]">
                    正文投递（无附件）
                  </span>
                ) : (
                  <a
                    href={r.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#D4A574] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#B8860B]"
                  >
                    <FileDown className="h-4 w-4" aria-hidden />
                    下载材料
                  </a>
                )}
              </div>
              {r.original_name ? (
                <p className="mt-3 text-xs text-[#9A8B78]">文件名：{r.original_name}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {total > 20 ? (
        <div className="mt-8 flex justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-[rgba(212,165,116,0.3)] px-4 py-2 text-sm disabled:opacity-40"
          >
            上一页
          </button>
          <span className="px-3 py-2 text-sm text-[#5D4E3A]">
            第 {page} 页 · 共 {Math.max(1, Math.ceil(total / 20))} 页
          </span>
          <button
            type="button"
            disabled={page >= Math.max(1, Math.ceil(total / 20))}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-[rgba(212,165,116,0.3)] px-4 py-2 text-sm disabled:opacity-40"
          >
            下一页
          </button>
        </div>
      ) : null}
    </div>
  );
}
