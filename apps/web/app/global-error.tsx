"use client";

import { useEffect } from "react";

/**
 * 根布局级错误：必须自带 html/body（见 Next App Router global-error 约定）。
 */
export default function GlobalError({
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
    <html lang="zh-CN">
      <body className="m-0 bg-[#F7FBFE] font-sans text-[#26363D] antialiased">
        <main className="flex min-h-screen items-center justify-center px-6">
          <div className="w-full max-w-md text-center">
            <h1 className="mb-3 text-xl font-bold">严重错误</h1>
            <p className="mb-6 text-sm text-[#55656D] leading-relaxed">
              根布局无法渲染。请刷新页面；若反复出现，请联系技术支持。
            </p>
            <button
              type="button"
              onClick={() => reset()}
              className="rounded-xl bg-[#26363D] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1C2A30]"
            >
              重试
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
