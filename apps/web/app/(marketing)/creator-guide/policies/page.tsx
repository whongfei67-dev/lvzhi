"use client";

import { PageHeader } from "@/components/layout/page-header";
import { AlertTriangle, Ban, CheckCircle, FileWarning, Shield } from "lucide-react";
import {
  CREATOR_GUIDE_CLASSROOM_HERO_IMAGE,
  CREATOR_GUIDE_HERO_IMAGE_ALT,
} from "@/lib/creator-guide-hero";

const COMMUNITY_RULES = [
  {
    title: "真实与合法",
    detail:
      "社区帖子、评论、技能包描述、智能体介绍不得包含违法违规、虚假宣传、恶意引流、侵犯他人权益的信息。",
  },
  {
    title: "专业与审慎表达",
    detail:
      "不得发布夸大效果、承诺结果、误导性法律建议。涉及法律观点需清晰标注适用范围和风险边界。",
  },
  {
    title: "版权与授权",
    detail:
      "上传内容应确保拥有合法版权或授权。搬运、抄袭、盗用模板、未授权使用他人作品将触发下架与处罚。",
  },
  {
    title: "社区互动秩序",
    detail:
      "禁止辱骂、歧视、骚扰、人身攻击、恶意刷屏与带节奏攻击。发现异常可通过平台举报入口提交证据。",
  },
  {
    title: "审核与追溯",
    detail:
      "平台采用机审+人工复审。已发布内容在用户举报或巡检命中风险后，可再次进入审核并触发处置。",
  },
];

const TAKEDOWN_RULES = [
  {
    scope: "律师认证 / 优秀创作者认证 / 大师级创作者认证",
    rule: "认证通过后会同步前台认证标签；如后续出现违规，平台可撤销认证并同步移除标签。",
  },
  {
    scope: "技能包与智能体上线",
    rule:
      "上线前必须通过审核。若运行中发现违规、误导性内容或被有效投诉，可执行下架整改；整改通过后可恢复展示。",
  },
  {
    scope: "社区帖子",
    rule:
      "违规帖子可被下架/删除。情节严重或屡犯会叠加账号处罚，并限制互动、下载、购买等能力。",
  },
  {
    scope: "排行榜与推荐位",
    rule:
      "违规律师/创作者可被临时或长期移出排行榜与推荐位，处罚期结束且复审通过后可恢复。",
  },
];

const PENALTY_LEVELS = [
  {
    level: "一级处置",
    duration: "48小时",
    actions: "禁言 + 无法下载/购买 + 移出排行榜/推荐（如适用）",
  },
  {
    level: "二级处置",
    duration: "7天",
    actions: "禁言 + 无法下载/购买 + 移出排行榜/推荐（如适用）",
  },
  {
    level: "三级处置",
    duration: "6个月",
    actions: "长期禁言 + 无法下载/购买 + 下架相关内容 + 移出排行榜/推荐",
  },
  {
    level: "四级处置",
    duration: "永久",
    actions: "永久禁言 + 永久限制下载/购买 + 永久下架/封禁账号 + 永久移出排行榜/推荐",
  },
];

const APPEAL_FLOW = [
  "被处置后可在创作者中心提交申诉材料（说明 + 证据 + 修正方案）。",
  "平台将在规定时限内完成人工复核，并给出处置维持、降级或撤销结论。",
  "需要整改的内容，需在复审通过后恢复上线；未通过前维持下架状态。",
  "恶意重复违规、伪造材料或规避处罚，将从重处理并可能直接升级至高级处置。",
];

const SECTION_TITLE_CLASS = "text-lg font-semibold text-[#2C2416]";
const SECTION_CARD_CLASS =
  "rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-5";

export default function RulesPage() {
  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <PageHeader
        title="平台规则"
        description="社区规则、审核标准、下架与处罚机制（创作者必读）"
        backHref="/creator-guide"
        heroImage={CREATOR_GUIDE_CLASSROOM_HERO_IMAGE}
        heroImageAlt={CREATOR_GUIDE_HERO_IMAGE_ALT}
      />

      <section className="mx-auto max-w-6xl px-6 py-6 lg:px-8">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h2 className="font-semibold text-amber-800">重要提示</h2>
              <p className="mt-2 text-sm text-amber-700">
                本页为创作者发布、审核、下架与处罚的统一规则入口。提交内容即视为同意并遵守以下规则。
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-6 px-6 py-2 lg:px-8">
        <div className={SECTION_CARD_CLASS}>
          <h3 className={`${SECTION_TITLE_CLASS} flex items-center gap-2`}>
            <Shield className="h-5 w-5 text-[#D4A574]" />
            一、社区发布规则
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-[#5D4E3A]">
            {COMMUNITY_RULES.map((item) => (
              <li key={item.title} className="rounded-lg bg-[rgba(255,248,240,0.7)] p-3">
                <p className="font-medium text-[#2C2416]">{item.title}</p>
                <p className="mt-1 leading-6">{item.detail}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className={SECTION_CARD_CLASS}>
          <h3 className={`${SECTION_TITLE_CLASS} flex items-center gap-2`}>
            <FileWarning className="h-5 w-5 text-[#D4A574]" />
            二、下架与同步规则
          </h3>
          <div className="mt-4 space-y-3 text-sm text-[#5D4E3A]">
            {TAKEDOWN_RULES.map((item) => (
              <div key={item.scope} className="rounded-lg bg-[rgba(255,248,240,0.7)] p-3">
                <p className="font-medium text-[#2C2416]">{item.scope}</p>
                <p className="mt-1 leading-6">{item.rule}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={SECTION_CARD_CLASS}>
          <h3 className={`${SECTION_TITLE_CLASS} flex items-center gap-2`}>
            <Ban className="h-5 w-5 text-[#D4A574]" />
            三、处罚梯度（统一执行）
          </h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-sm">
              <thead>
                <tr className="bg-[rgba(212,165,116,0.12)] text-left text-[#5D4E3A]">
                  <th className="px-3 py-2 font-semibold">处置等级</th>
                  <th className="px-3 py-2 font-semibold">处置时长</th>
                  <th className="px-3 py-2 font-semibold">处置动作</th>
                </tr>
              </thead>
              <tbody>
                {PENALTY_LEVELS.map((row) => (
                  <tr key={row.level} className="border-b border-[rgba(212,165,116,0.2)] text-[#5D4E3A]">
                    <td className="px-3 py-2 font-medium text-[#2C2416]">{row.level}</td>
                    <td className="px-3 py-2">{row.duration}</td>
                    <td className="px-3 py-2 leading-6">{row.actions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={SECTION_CARD_CLASS}>
          <h3 className={`${SECTION_TITLE_CLASS} flex items-center gap-2`}>
            <CheckCircle className="h-5 w-5 text-[#D4A574]" />
            四、申诉与恢复流程
          </h3>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-[#5D4E3A]">
            {APPEAL_FLOW.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      </section>

      <div className="pb-16" />
    </div>
  );
}
