"use client";

import { useState } from "react";
import Link from "next/link";
import { Rocket, Mail, MessageSquare, ArrowLeft } from "lucide-react";

export default function PromotionPage() {
  const [formData, setFormData] = useState({
    name: "",
    agentName: "",
    agentUrl: "",
    email: "",
    phone: "",
    budget: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Promotion form:", formData);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[rgba(212,165,116,0.08)] flex items-center justify-center px-6">
        <div className="w-full max-w-md text-center space-y-6 rounded-[32px] border border-[rgba(212,165,116,0.25)] bg-white p-10 shadow-sm">
          <div className="flex items-center justify-center">
            <Mail className="h-16 w-16 text-[#D4A574]" />
          </div>
          <h1 className="text-2xl font-bold text-[#2C2416]">提交成功</h1>
          <p className="text-[#9A8B78] leading-7">
            感谢您的推广申请！我们会在 1-2 个工作日内与您联系，讨论具体推广方案。
          </p>
          <Link
            href="/"
            className="block w-full rounded-2xl bg-gradient-to-r from-[#D4A574] to-[#B8860B] py-3 text-sm font-semibold text-white hover:shadow-md transition-shadow"
          >
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[rgba(212,165,116,0.08)]">
      <div className="bg-white border-b border-[rgba(212,165,116,0.25)]">
        <div className="mx-auto max-w-4xl px-6 py-10 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[#5D4E3A] hover:text-[#D4A574] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            返回首页
          </Link>
          <div className="mt-6 flex items-start gap-4">
            <Rocket className="h-12 w-12 text-[#D4A574] shrink-0" />
            <div>
              <h1 className="text-3xl font-bold text-[#2C2416]">智能体推广</h1>
              <p className="mt-2 text-lg text-[#5D4E3A]">
                提升智能体曝光度，触达更多潜在用户
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.5fr]">
          {/* Left: features */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[#2C2416]">推广服务包含</h2>
              <ul className="mt-4 space-y-3">
                {[
                  "首页推荐位展示",
                  "榜单优先排名",
                  "社区精选推送",
                  "定制营销方案",
                  "数据分析报告",
                  "持续优化建议",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#D4A574] shrink-0" />
                    <span className="text-sm text-[#5D4E3A]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-[rgba(212,165,116,0.2)] bg-[rgba(212,165,116,0.08)] p-6">
              <p className="text-sm font-semibold text-[#B8860B]900">推广周期</p>
              <p className="mt-2 text-sm text-[#B8860B] leading-relaxed">
                最短 7 天，建议 30 天以上获得最佳效果。我们会根据您的预算和目标制定个性化推广方案。
              </p>
            </div>
          </div>

          {/* Right: form */}
          <div className="rounded-3xl border border-[rgba(212,165,116,0.25)] bg-white p-8 shadow-sm">
            <h2 className="text-xl font-bold text-[#2C2416]">提交推广申请</h2>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#D4A574]">
                  您的姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="请输入您的姓名"
                  className="h-12 w-full rounded-2xl border border-[rgba(212,165,116,0.25)] bg-[rgba(212,165,116,0.08)] px-4 text-sm outline-none placeholder:text-[#9A8B78] focus:border-blue-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#D4A574]">
                  智能体名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.agentName}
                  onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
                  required
                  placeholder="请输入智能体名称"
                  className="h-12 w-full rounded-2xl border border-[rgba(212,165,116,0.25)] bg-[rgba(212,165,116,0.08)] px-4 text-sm outline-none placeholder:text-[#9A8B78] focus:border-blue-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#D4A574]">
                  智能体链接
                </label>
                <input
                  type="url"
                  value={formData.agentUrl}
                  onChange={(e) => setFormData({ ...formData, agentUrl: e.target.value })}
                  placeholder="https://lvzhi.ai/agents/..."
                  className="h-12 w-full rounded-2xl border border-[rgba(212,165,116,0.25)] bg-[rgba(212,165,116,0.08)] px-4 text-sm outline-none placeholder:text-[#9A8B78] focus:border-blue-400"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#D4A574]">
                    邮箱 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="your@email.com"
                    className="h-12 w-full rounded-2xl border border-[rgba(212,165,116,0.25)] bg-[rgba(212,165,116,0.08)] px-4 text-sm outline-none placeholder:text-[#9A8B78] focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#D4A574]">
                    电话 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    placeholder="请输入联系电话"
                    className="h-12 w-full rounded-2xl border border-[rgba(212,165,116,0.25)] bg-[rgba(212,165,116,0.08)] px-4 text-sm outline-none placeholder:text-[#9A8B78] focus:border-blue-400"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#D4A574]">
                  预算范围
                </label>
                <select
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="h-12 w-full rounded-2xl border border-[rgba(212,165,116,0.25)] bg-[rgba(212,165,116,0.08)] px-4 text-sm outline-none focus:border-blue-400"
                >
                  <option value="">请选择预算范围</option>
                  <option value="5k-10k">5,000 - 10,000 元</option>
                  <option value="10k-30k">10,000 - 30,000 元</option>
                  <option value="30k-50k">30,000 - 50,000 元</option>
                  <option value="50k+">50,000 元以上</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#D4A574]">
                  推广需求说明
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  placeholder="请描述您的推广目标、期望效果等..."
                  className="w-full rounded-2xl border border-[rgba(212,165,116,0.25)] bg-[rgba(212,165,116,0.08)] px-4 py-3 text-sm outline-none placeholder:text-[#9A8B78] focus:border-blue-400 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-gradient-to-r from-[#D4A574] to-[#B8860B] px-4 py-3 text-sm font-semibold text-white hover:shadow-md transition-shadow"
              >
                提交申请
              </button>
            </form>

            <div className="mt-6 space-y-2 border-t border-[rgba(212,165,116,0.2)] pt-6">
              <p className="text-sm font-medium text-[#D4A574]">联系我们</p>
              <a
                href="mailto:cooperation@lvzhi.ai"
                className="flex items-center gap-2 text-sm text-[#5D4E3A] hover:text-[#D4A574] transition-colors"
              >
                <Mail className="h-4 w-4" />
                cooperation@lvzhi.ai
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
