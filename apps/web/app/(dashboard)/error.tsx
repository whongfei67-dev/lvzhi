"use client";

import { useEffect } from "react";
import Link from "next/link";

/** 工作台 / 个人中心等 (dashboard) 段内错误边界，避免仅依赖根 error 时偶发 chunk 未就绪 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard]", error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] items-center justify-center bg-[#F7FBFE] px-6">
      <div className="w-full max-w-lg text-center">
        <h1 className="mb-3 text-2xl font-bold text-[#26363D]">页面出错了</h1>
        <p className="mb-8 text-[#55656D] leading-relaxed">
          工作台区域加载异常。可重试或返回首页；若刚改过代码，请停掉 dev 后删除 <code className="rounded bg-white/80 px-1">apps/web/.next</code> 再启动。
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full rounded-xl bg-[#26363D] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1C2A30] sm:w-auto"
          >
            重试
          </button>
          <Link
            href="/"
            className="w-full rounded-xl border border-[#DFE9EE] bg-white px-6 py-3 text-sm font-medium text-[#26363D] transition-colors hover:border-[#CFE1F7] sm:w-auto"
          >
            返回首页
          </Link>
        </div>
      </div>
    </main>
  );
}
