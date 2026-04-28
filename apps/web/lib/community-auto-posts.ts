/**
 * 社区列表页：按当前标签/话题上下文生成两条示例帖（围绕标签类型与法律 Skills）。
 * 用于主站与标签/话题子路由展示，与真实 API 数据合并时以 id 去重。
 */

export interface CommunityAutoPost {
  id: string;
  author_id: string;
  title: string;
  content: string;
  tags: string[];
  topic: string;
  like_count: number;
  dislike_count: number;
  comment_count: number;
  view_count: number;
  created_at: string;
  author_name: string;
  author_avatar: string | null;
}

function stableSmallInts(seed: string): [number, number, number, number] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const a = 8 + (h % 120);
  const b = 3 + ((h >> 3) % 80);
  const c = 1 + ((h >> 7) % 25);
  const d = 4 + ((h >> 11) % 40);
  return [a, b, c, d];
}

function avatarUrl(seed: string) {
  return `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(seed)}`;
}

export function buildTwoCommunityAutoPosts(input: {
  tag?: string | null;
  topicSlug?: string | null;
  topicLabel?: string | null;
  /** 用于稳定 id 与互动数字，如 `tag-合同` 或 `topic-experience` */
  seed: string;
}): CommunityAutoPost[] {
  const tag = (input.tag || "").trim();
  const topicLabel =
    (input.topicLabel || "").trim() ||
    (input.topicSlug === "experience"
      ? "创作经验"
      : input.topicSlug === "case"
        ? "案例分析"
        : input.topicSlug === "help"
          ? "提问求助"
          : input.topicSlug === "discussion"
            ? "讨论交流"
            : input.topicSlug || "综合");
  const theme = tag || topicLabel || "法律 Skills";
  const [likes1, comments1, dis1, views1] = stableSmallInts(`${input.seed}-a`);
  const [likes2, comments2, dis2, views2] = stableSmallInts(`${input.seed}-b`);

  const t = Date.now();
  const createdAt1 = new Date(t - 2 * 60 * 60 * 1000).toISOString();
  const createdAt2 = new Date(t - 37 * 60 * 1000 - 12 * 1000).toISOString();

  return [
    {
      id: `auto-${input.seed}-1`,
      author_id: "auto-1",
      title: `如何把「${theme}」场景做成可复用的法律 Skills？`,
      content: `围绕「${theme}」，建议把要件清单、提示词模板与审查步骤沉淀为 Skills：先固定输入输出，再接入案例回归；与智能体搭配时，注意义务告知与免责声明边界。`,
      tags: [theme, "法律 Skills", "智能体"],
      topic: topicLabel,
      like_count: likes1,
      dislike_count: dis1,
      comment_count: comments1,
      view_count: views1 * 12,
      created_at: createdAt1,
      author_name: "周律师",
      author_avatar: avatarUrl(`${input.seed}-zhou`),
    },
    {
      id: `auto-${input.seed}-2`,
      author_id: "auto-2",
      title: `「${theme}」相关的合同/证据链：从 Skills 到交付物`,
      content: `结合「${theme}」类项目，推荐用 Skills 固化：条款风险点、证据目录模板与沟通纪要结构；团队协作时可用版本号与变更说明，方便客户与同行复用。`,
      tags: [theme, "Skills", "交付"],
      topic: topicLabel,
      like_count: likes2,
      dislike_count: dis2,
      comment_count: comments2,
      view_count: views2 * 9,
      created_at: createdAt2,
      author_name: "林法务",
      author_avatar: avatarUrl(`${input.seed}-lin`),
    },
  ];
}
