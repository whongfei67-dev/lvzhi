"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { EmptyState } from "@/components/common/empty-state";
import { Pagination } from "@/components/common/pagination";
import { Shield, CheckCircle, Clock, FileText, ArrowRight } from "lucide-react";

interface VerificationStatus {
  level: "none" | "basic" | "professional" | "expert";
  status: "none" | "pending" | "approved" | "rejected";
  submitted_at?: string;
  message?: string;
}

export default function CreatorVerificationPage() {
  const [verification, setVerification] = useState<VerificationStatus>({
    level: "basic",
    status: "approved",
    submitted_at: "2024-01-10",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVerification();
  }, []);

  const fetchVerification = async () => {
    setLoading(false);
    try {
      const result = await api.creator.getVerification();
      setVerification(result as unknown as VerificationStatus);
    } catch {
      // 使用 mock 数据
    }
  };

  const levels = [
    {
      id: "basic" as const,
      name: "基础认证",
      description: "完成基础信息认证，解锁基本功能",
      requirements: ["手机绑定", "邮箱验证", "基本资料"],
      icon: FileText,
    },
    {
      id: "professional" as const,
      name: "专业认证",
      description: "通过专业认证，提升可信度",
      requirements: ["律师执业证书", "律所证明", "身份证信息"],
      icon: Shield,
    },
    {
      id: "expert" as const,
      name: "专家认证",
      description: "获得平台专家称号，享受更多权益",
      requirements: ["专业认证", "作品审核", "行业推荐"],
      icon: CheckCircle,
    },
  ];

  const getCurrentLevelIndex = () => {
    const levelMap = { none: 0, basic: 1, professional: 2, expert: 3 };
    return levelMap[verification.level];
  };

  return (
    <div className="p-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#2C2416]">认证申请</h1>
        <p className="mt-2 text-[#5D4E3A]">申请更高级别的创作者认证，提升你的可信度</p>
      </div>

      {/* 当前认证状态 */}
      <div className="mb-8 rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-[#2C2416]">当前认证状态</h2>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D4A574] to-[#B8860B]">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-[#2C2416]">
              {verification.status === "approved" ? "已认证" : verification.status === "pending" ? "审核中" : "未认证"}
            </h3>
            <p className="mt-1 text-sm text-[#5D4E3A]">
              当前等级：
              {verification.level === "none" ? "无" : verification.level === "basic" ? "基础认证" : verification.level === "professional" ? "专业认证" : "专家认证"}
            </p>
            {verification.submitted_at && (
              <p className="mt-1 text-xs text-[#9A8B78]">认证时间：{verification.submitted_at}</p>
            )}
          </div>
        </div>
      </div>

      {/* 认证等级 */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-[#2C2416]">认证等级</h2>
        <div className="space-y-4">
          {levels.map((level, index) => {
            const Icon = level.icon;
            const isCurrentLevel = getCurrentLevelIndex() === index;
            const isUnlocked = getCurrentLevelIndex() >= index;
            const isNext = getCurrentLevelIndex() === index - 1;

            return (
              <div
                key={level.id}
                className={`rounded-xl border p-6 transition-all ${
                  isCurrentLevel
                    ? "border-[#D4A574] bg-[rgba(212,165,116,0.15)]"
                    : isUnlocked
                    ? "border-[rgba(212,165,116,0.25)] bg-white"
                    : "border-[rgba(212,165,116,0.25)] bg-[rgba(212,165,116,0.08)] opacity-60"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                      isCurrentLevel ? "bg-[#D4A574] text-white" : isUnlocked ? "bg-[rgba(212,165,116,0.15)] text-[#D4A574]" : "bg-[rgba(212,165,116,0.2)] text-[#9A8B78]"
                    }`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-[#2C2416]">{level.name}</h3>
                        {isCurrentLevel && (
                          <span className="rounded-full bg-[#D4A574] px-2 py-0.5 text-xs font-medium text-white">当前</span>
                        )}
                        {isNext && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">可申请</span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-[#5D4E3A]">{level.description}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {level.requirements.map((req) => (
                          <span key={req} className="rounded-full bg-white px-3 py-1 text-xs text-[#5D4E3A]">
                            {req}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {isNext && verification.status !== "pending" && (
                    <button className="shrink-0 rounded-xl bg-[#D4A574] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#B8860B]">
                      申请认证
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 认证说明 */}
      <div className="rounded-xl border border-[rgba(212,165,116,0.25)] bg-[rgba(212,165,116,0.15)] p-6">
        <h3 className="font-semibold text-[#2C2416]">认证说明</h3>
        <ul className="mt-3 space-y-2 text-sm text-[#5D4E3A]">
          <li className="flex items-start gap-2">
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A574]" />
            完成认证后可获得平台认证标识，提升用户信任度
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A574]" />
            高级认证创作者可享受平台流量扶持
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A574]" />
            部分高级功能需要完成相应认证才能使用
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A574]" />
            认证审核通常在 3-5 个工作日内完成
          </li>
        </ul>
      </div>
    </div>
  );
}
