"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { HelpCircle, ChevronDown, Search } from "lucide-react";
import {
  CREATOR_GUIDE_CLASSROOM_HERO_IMAGE,
  CREATOR_GUIDE_HERO_IMAGE_ALT,
} from "@/lib/creator-guide-hero";

const FAQS = [
  {
    id: "1",
    question: "如何创建第一个 Skills？",
    answer: "登录后进入工作台，点击「创建 Skills」按钮，填写名称、描述、分类等信息，上传相关文件或内容，即可创建。创建后需要通过平台审核才能上线。",
    tags: ["入门", "Skills"],
  },
  {
    id: "2",
    question: "智能体和 Skills 有什么区别？",
    answer: "Skills 是一种可复用的模板、提示词或工具，可以被下载和使用。智能体是具有对话能力的 AI 产品，可以与用户进行实时交互，解决问题或提供建议。",
    tags: ["入门", "概念"],
  },
  {
    id: "3",
    question: "如何设置智能体的收费模式？",
    answer: "在创建智能体时，你可以选择免费或付费模式。付费模式下可以设置单次使用价格或订阅价格。平台会收取一定比例的服务费。",
    tags: ["收费", "智能体"],
  },
  {
    id: "4",
    question: "内容审核需要多长时间？",
    answer: "一般情况下，内容审核会在 1-3 个工作日内完成。如果内容复杂或需要额外审核，可能会延长至 5 个工作日。你可以在工作台查看审核状态。",
    tags: ["审核", "规则"],
  },
  {
    id: "5",
    question: "收益如何提现？",
    answer: "当你的账户余额达到 100 元时，可以在工作台申请提现。提现申请审核通过后，资金会打入你绑定的支付宝或银行卡。",
    tags: ["收益", "提现"],
  },
  {
    id: "6",
    question: "如何申请律师认证？",
    answer: "在个人设置中提交律师认证申请，需要上传律师执业证书等信息。平台会在 3-5 个工作日内完成认证审核。",
    tags: ["认证", "律师"],
  },
  {
    id: "7",
    question: "可以删除已发布的内容吗？",
    answer: "可以。在工作台中找到对应的 Skills 或智能体，点击「下架」按钮即可。下架后内容将不再对外展示，但已购买的用户仍然可以使用。",
    tags: ["管理", "Skills"],
  },
  {
    id: "8",
    question: "如何联系平台客服？",
    answer: "你可以通过以下方式联系客服：1) 在「帮助中心」提交工单；2) 发送邮件至 support@lvzhi.com；3) 在社区发帖并 @官方账号。",
    tags: ["其他"],
  },
];

export default function FAQPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFAQS = searchQuery
    ? FAQS.filter(
        (faq) =>
          faq.question.includes(searchQuery) ||
          faq.answer.includes(searchQuery) ||
          faq.tags.some((tag) => tag.includes(searchQuery))
      )
    : FAQS;

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <PageHeader
        title="常见问题"
        description="解答创作过程中的常见疑问，快速找到答案"
        backHref="/creator-guide"
        heroImage={CREATOR_GUIDE_CLASSROOM_HERO_IMAGE}
        heroImageAlt={CREATOR_GUIDE_HERO_IMAGE_ALT}
      />

      {/* 搜索 */}
      <section className="mx-auto max-w-6xl px-6 py-6 lg:px-8">
        <div className="relative mx-auto max-w-xl">
          <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9A8B78]" />
          <input
            type="text"
            placeholder="搜索问题..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-[rgba(212,165,116,0.25)] bg-white py-3.5 pl-14 pr-5 text-[#2C2416] placeholder:text-[#9A8B78] focus:border-[#D4A574] focus:outline-none focus:ring-2 focus:ring-[#D4A574]/10"
          />
        </div>
      </section>

      {/* FAQ 列表 */}
      <section className="mx-auto max-w-6xl px-6 py-6 lg:px-8">
        <div className="space-y-4">
          {filteredFAQS.map((faq) => (
            <div
              key={faq.id}
              className="overflow-hidden rounded-xl border border-[rgba(212,165,116,0.25)] bg-white transition-all"
            >
              <button
                onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                className="flex w-full items-center justify-between p-5 text-left"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle className="h-5 w-5 text-[#D4A574]" />
                  <span className="font-medium text-[#2C2416]">{faq.question}</span>
                </div>
                <ChevronDown
                  className={`h-5 w-5 text-[#9A8B78] transition-transform ${
                    expandedId === faq.id ? "rotate-180" : ""
                  }`}
                />
              </button>

              {expandedId === faq.id && (
                <div className="border-t border-[rgba(212,165,116,0.25)] p-5">
                  <p className="text-[#5D4E3A] leading-relaxed">{faq.answer}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {faq.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-[rgba(212,165,116,0.15)] px-2.5 py-0.5 text-xs text-[#5D4E3A]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredFAQS.length === 0 && (
          <div className="rounded-2xl border border-[rgba(212,165,116,0.25)] bg-white p-12 text-center">
            <HelpCircle className="mx-auto h-12 w-12 text-[#9A8B78]" />
            <h3 className="mt-4 text-lg font-semibold text-[#2C2416]">未找到相关问题</h3>
            <p className="mt-2 text-sm text-[#5D4E3A]">试试其他关键词，或者联系客服获取帮助</p>
          </div>
        )}
      </section>

      {/* 联系客服 */}
      <section className="mx-auto max-w-6xl px-6 py-8 pb-16 lg:px-8">
        <div className="rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-6 text-center">
          <h3 className="font-semibold text-[#2C2416]">没有找到答案？</h3>
          <p className="mt-2 text-sm text-[#5D4E3A]">我们的客服团队随时为你提供帮助</p>
          <Link
            href="/contact"
            className="mt-4 inline-block rounded-xl bg-[#D4A574] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#B8860B]"
          >
            联系客服
          </Link>
        </div>
      </section>
    </div>
  );
}
