"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[calc(100vh-68px)] items-center justify-center bg-[#F7FBFE] px-6">
      <div className="w-full max-w-lg text-center">
        <h1 className="mb-3 text-2xl font-bold text-[#26363D]">页面出错了</h1>
        <p className="mb-8 text-[#55656D] leading-relaxed">
          应用运行中发生异常。你可以重试当前页面，或返回首页继续浏览。
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full rounded-xl bg-[#26363D] px-6 py-3 text-sm font-semibold text-white hover:bg-[#1C2A30] transition-colors sm:w-auto"
          >
            重试
          </button>
          <Link
            href="/"
            className="w-full rounded-xl border border-[#DFE9EE] bg-white px-6 py-3 text-sm font-medium text-[#26363D] hover:border-[#CFE1F7] transition-colors sm:w-auto"
          >
            返回首页
          </Link>
        </div>
      </div>
    </main>
  );
}
