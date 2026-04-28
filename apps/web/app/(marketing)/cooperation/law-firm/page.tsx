"use client";
import { useState } from "react";
import Link from "next/link";
import { Handshake, Mail, ArrowLeft } from "lucide-react";

export default function LawFirmPage() {
  const [submitted, setSubmitted] = useState(false);
  if (submitted) {
    return (
      <div className="min-h-screen bg-[rgba(212,165,116,0.08)] flex items-center justify-center px-6">
        <div className="w-full max-w-md text-center space-y-6 rounded-[32px] border border-[rgba(212,165,116,0.25)] bg-white p-10 shadow-sm">
          <Mail className="h-16 w-16 text-[#D4A574] mx-auto" />
          <h1 className="text-2xl font-bold text-[#2C2416]">提交成功</h1>
          <p className="text-[#9A8B78]">我们会在 1-2 个工作日内与您联系</p>
          <Link href="/" className="block w-full rounded-2xl bg-gradient-to-r from-[#D4A574] to-[#B8860B] py-3 text-sm font-semibold text-white">返回首页</Link>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-[rgba(212,165,116,0.08)]">
      <div className="bg-white border-b border-[rgba(212,165,116,0.25)]">
        <div className="mx-auto max-w-4xl px-6 py-10 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#5D4E3A] hover:text-[#D4A574]"><ArrowLeft className="h-4 w-4" />返回首页</Link>
          <div className="mt-6 flex items-start gap-4">
            <Handshake className="h-12 w-12 text-[#D4A574]" />
            <div><h1 className="text-3xl font-bold text-[#2C2416]">律所入驻</h1><p className="mt-2 text-lg text-[#5D4E3A]">律所品牌展示与智能体集成解决方案</p></div>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
        <div className="rounded-3xl border border-[rgba(212,165,116,0.25)] bg-white p-8 shadow-sm">
          <h2 className="text-xl font-bold">提交入驻申请</h2>
          <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="mt-6 space-y-4">
            <input required placeholder="联系人" className="h-12 w-full rounded-2xl border border-[rgba(212,165,116,0.25)] bg-[rgba(212,165,116,0.08)] px-4 text-sm" />
            <input required placeholder="律所名称" className="h-12 w-full rounded-2xl border border-[rgba(212,165,116,0.25)] bg-[rgba(212,165,116,0.08)] px-4 text-sm" />
            <input placeholder="律所规模（律师人数）" className="h-12 w-full rounded-2xl border border-[rgba(212,165,116,0.25)] bg-[rgba(212,165,116,0.08)] px-4 text-sm" />
            <input required type="email" placeholder="邮箱" className="h-12 w-full rounded-2xl border border-[rgba(212,165,116,0.25)] bg-[rgba(212,165,116,0.08)] px-4 text-sm" />
            <input required type="tel" placeholder="电话" className="h-12 w-full rounded-2xl border border-[rgba(212,165,116,0.25)] bg-[rgba(212,165,116,0.08)] px-4 text-sm" />
            <textarea rows={4} placeholder="入驻需求说明..." className="w-full rounded-2xl border border-[rgba(212,165,116,0.25)] bg-[rgba(212,165,116,0.08)] px-4 py-3 text-sm resize-none" />
            <button type="submit" className="w-full rounded-2xl bg-gradient-to-r from-[#D4A574] to-teal-600 px-4 py-3 text-sm font-semibold text-white">提交申请</button>
          </form>
        </div>
      </div>
    </div>
  );
}
