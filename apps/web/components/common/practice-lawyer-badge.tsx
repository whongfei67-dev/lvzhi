import { ShieldCheck } from "lucide-react";

/**
 * 全站统一的律师平台认证标识（文案固定为「执业律师」）
 * - soft：浅色底（列表、卡片、帖子详情）
 * - solid：高对比（律师详情 Hero 等深色底）
 */
export function PracticeLawyerBadge({
  variant = "soft",
  className = "",
}: {
  variant?: "soft" | "solid";
  className?: string;
}) {
  if (variant === "solid") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-[#D4A574] px-3 py-1 text-xs font-semibold text-white shadow-sm ${className}`}
      >
        <ShieldCheck className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
        执业律师
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-[rgba(212,165,116,0.18)] px-2.5 py-0.5 text-xs font-semibold text-[#5C4033] ring-1 ring-[rgba(212,165,116,0.28)] ${className}`}
    >
      <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#B8860B]" strokeWidth={2.25} aria-hidden />
      执业律师
    </span>
  );
}
