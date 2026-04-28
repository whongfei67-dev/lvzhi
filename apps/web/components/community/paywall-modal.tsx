"use client";

import { useState } from "react";

interface PaywallModalProps {
  postTitle: string;
  price: number;
  onClose: () => void;
}

export function PaywallModal({ postTitle, price, onClose }: PaywallModalProps) {
  const [selected, setSelected] = useState<"single" | "member">("single");
  const [paid, setPaid] = useState(false);

  if (paid) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl">
          <div className="text-5xl mb-4">🎉</div>
          <h3 className="text-lg font-bold text-slate-950">解锁成功！</h3>
          <p className="mt-2 text-sm text-slate-500">你现在可以阅读完整内容了。</p>
          <button
            onClick={onClose}
            className="mt-6 block w-full rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 py-3 text-sm font-semibold text-white"
          >
            开始阅读
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden">
        {/* Header */}
        <div className="border-b border-slate-100 bg-slate-50 px-6 py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">付费内容</p>
              <h3 className="mt-1 text-base font-bold text-slate-950 line-clamp-2">{postTitle}</h3>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 rounded-xl border border-slate-200 bg-white p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Options */}
          <div className="grid grid-cols-2 gap-3">
            {/* Single read */}
            <button
              type="button"
              onClick={() => setSelected("single")}
              className={`rounded-2xl border p-4 text-left transition-all ${
                selected === "single"
                  ? "border-blue-300 bg-blue-50 ring-2 ring-blue-100"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <p className="text-xs font-semibold text-slate-500">单次阅读</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">¥{price}</p>
              <p className="mt-1 text-xs text-slate-400">永久解锁本篇</p>
            </button>

            {/* Member */}
            <button
              type="button"
              onClick={() => setSelected("member")}
              className={`rounded-2xl border p-4 text-left transition-all relative overflow-hidden ${
                selected === "member"
                  ? "border-indigo-300 bg-indigo-50 ring-2 ring-indigo-100"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <span className="absolute right-2 top-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                推荐
              </span>
              <p className="text-xs font-semibold text-slate-500">月度会员</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">¥39</p>
              <p className="mt-1 text-xs text-slate-400">解锁全部付费帖</p>
            </button>
          </div>

          {/* Perks */}
          {selected === "member" && (
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 space-y-1">
              {["当月所有付费帖无限阅读", "新帖优先推送通知", "专属会员标识"].map((perk) => (
                <p key={perk} className="flex items-center gap-2 text-xs text-indigo-700">
                  <span className="text-indigo-400">✓</span> {perk}
                </p>
              ))}
            </div>
          )}

          {/* Notice */}
          <p className="text-xs text-slate-400 leading-relaxed">
            付费阅读收益将按比例分配给帖子作者，重复点击同一付费帖仅计为一次有效阅读。
          </p>

          {/* CTA */}
          <button
            onClick={() => setPaid(true)}
            className="w-full rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            {selected === "single" ? `支付 ¥${price} 解锁本篇` : "开通月度会员 ¥39/月"}
          </button>

          <p className="text-center text-xs text-slate-400">
            演示模式 · 实际支付接口待接入
          </p>
        </div>
      </div>
    </div>
  );
}
