/** 社区侧栏：与帖子详情页右侧保持一致 */
export const COMMUNITY_HOT_TAGS = [
  "合同审查",
  "劳动争议",
  "智能体设计",
  "提示词优化",
  "案例分享",
  "法律咨询",
] as const;

export const COMMUNITY_QUICK_LINKS = [
  { href: "/creator-guide", label: "创作入门指南" },
  { href: "/inspiration", label: "灵感广场" },
  { href: "/opportunities", label: "合作机会" },
  { href: "/community/topic", label: "话题广场" },
  { href: "/community/tag", label: "标签广场" },
] as const;
