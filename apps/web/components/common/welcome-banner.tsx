"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Hand } from "lucide-react";

const COOKIE_KEY = "lvzhi_welcome_dismissed";
const COOKIE_DAYS = 7;

export function WelcomeBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check cookie
    const dismissed = document.cookie.split("; ").find((row) => row.startsWith(`${COOKIE_KEY}=`));
    if (!dismissed) {
      setVisible(true);
    }
  }, []);

  function handleDismiss() {
    setVisible(false);
    const expires = new Date(Date.now() + COOKIE_DAYS * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${COOKIE_KEY}=1; expires=${expires}; path=/`;
  }

  if (!visible) return null;

  return (
    <div className="relative border-b border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50">
      <div className="mx-auto max-w-7xl px-6 py-3 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: welcome message */}
          <div className="flex items-center gap-3">
            <Hand className="h-6 w-6 text-blue-600" />
            <div className="text-sm">
              <span className="font-semibold text-slate-900">欢迎来到律植！</span>
              <span className="ml-2 text-slate-600">
                3 步快速上手：
                <Link href="/agents" className="mx-1 font-medium text-blue-600 hover:underline">
                  ① 浏览智能体
                </Link>
                →
                <Link href="/agents" className="mx-1 font-medium text-blue-600 hover:underline">
                  ② 免费体验
                </Link>
                →
                <Link href="/register" className="mx-1 font-medium text-blue-600 hover:underline">
                  ③ 发布作品
                </Link>
              </span>
            </div>
          </div>

          {/* Right: close button */}
          <button
            onClick={handleDismiss}
            className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-600 transition-colors"
            aria-label="关闭"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
