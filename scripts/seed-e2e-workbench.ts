/**
 * 为 E2E 账号批量注入「工作台全链路」测试数据：
 * - 客户端社区帖子（平台理念）
 * - 发布岗位 + 求职投递 + 发布方回复
 * - 虚拟 skills + 已购订单（供工作台“已购”测试）
 *
 * 用法：
 *   node --env-file=apps/api/.env --import tsx scripts/seed-e2e-workbench.ts
 */

import { query } from "../apps/api/src/lib/database.ts";

const API_BASE_URL = (process.env.API_BASE_URL || "http://127.0.0.1:4000").replace(/\/$/, "");
const ORIGIN = process.env.TEST_ACCOUNTS_ORIGIN || "http://localhost:3000";
const PASSWORD = process.env.TEST_ACCOUNT_PASSWORD || process.env.TEST_ACCOUNTS_PASSWORD || "Test@123456";

const E2E_CLIENT_EMAIL = "lvzhi-e2e-client@example.com";
const E2E_CREATOR_EMAIL = "lvzhi-e2e-creator@example.com";
const E2E_ADMIN_EMAIL = "lvzhi-e2e-admin@example.com";

async function request<T = unknown>(
  method: string,
  path: string,
  body?: Record<string, unknown>,
  token?: string,
): Promise<{ ok: boolean; status: number; data: T | null; text: string }> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Origin: ORIGIN,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data: T | null = null;
  try {
    data = text ? (JSON.parse(text) as T) : null;
  } catch {
    data = null;
  }
  return { ok: res.ok, status: res.status, data, text };
}

async function login(email: string): Promise<string> {
  const r = await request<{ data?: { access_token?: string } }>("POST", "/api/auth/login", {
    email,
    password: PASSWORD,
  });
  const token = r.data?.data?.access_token;
  if (!r.ok || !token) {
    throw new Error(`登录失败: ${email} status=${r.status} body=${r.text.slice(0, 200)}`);
  }
  return token;
}

async function getProfileId(email: string): Promise<string> {
  const r = await query<{ id: string }>("SELECT id FROM profiles WHERE email = $1 LIMIT 1", [email]);
  if (!r.rows[0]?.id) throw new Error(`未找到账号：${email}`);
  return r.rows[0].id;
}

async function ensureRoles() {
  await query(`UPDATE profiles SET role = 'client' WHERE email = $1`, [E2E_CLIENT_EMAIL]);
  await query(`UPDATE profiles SET role = 'creator' WHERE email = $1`, [E2E_CREATOR_EMAIL]);
  await query(`UPDATE profiles SET role = 'admin' WHERE email = $1`, [E2E_ADMIN_EMAIL]);
}

async function ensureOrdersColumns() {
  await query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS source_type TEXT`);
  await query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS source_id UUID`);
}

async function seedCommunityPosts(clientToken: string) {
  const posts = [
    {
      title: "【E2E】律植平台创建理念：让法律服务更可复用",
      content:
        "律植希望把律师的经验沉淀为可复用的 Skills 与智能体，让更多中小团队也能快速获得高质量法律支持。我们坚持“专业可信 + 可验证 + 可交付”的产品路径。",
      tags: ["律植理念", "法律科技", "知识复用"],
    },
    {
      title: "【E2E】律植为何强调工作台闭环",
      content:
        "从发布帖子、发布岗位、接收投递，到文件处理、下载与数据分析，工作台提供完整闭环，目标是降低协作成本并提升案件处理效率。",
      tags: ["工作台", "协作", "效率"],
    },
    {
      title: "【E2E】从灵感到交付：律植的产品愿景",
      content:
        "灵感广场是入口，社区是连接，岗位合作是转化，工作台是交付。我们希望把每一次专业实践转化为可持续的数字资产。",
      tags: ["产品愿景", "灵感广场", "交付"],
    },
  ];

  for (const p of posts) {
    const r = await request("POST", "/api/community/posts", p, clientToken);
    if (!r.ok) {
      throw new Error(`创建帖子失败: ${p.title} status=${r.status} body=${r.text.slice(0, 200)}`);
    }
  }
}

async function seedCommunityPostsByDb(clientId: string) {
  const ts = Date.now();
  await query(
    `INSERT INTO community_posts (author_id, title, content, tags, view_count, like_count, comment_count)
     VALUES
      ($1, $2, $3, $4::text[], 96, 12, 3),
      ($1, $5, $6, $7::text[], 72, 9, 2),
      ($1, $8, $9, $10::text[], 45, 6, 1)`,
    [
      clientId,
      `【E2E】律植平台创建理念：让法律服务更可复用-${ts}`,
      "律植希望把律师经验沉淀为可复用资产，让法律服务从“人力密集”转向“知识复利”。",
      ["律植理念", "法律科技", "E2E"],
      `【E2E】律植为何强调工作台闭环-${ts}`,
      "从帖子、岗位、投递、文件处理到数据复盘，工作台串起完整协作闭环。",
      ["工作台", "协作", "E2E"],
      `【E2E】从灵感到交付：律植的产品愿景-${ts}`,
      "灵感广场是入口，社区是连接，岗位合作是转化，工作台是交付。",
      ["产品愿景", "灵感广场", "E2E"],
    ],
  );
}

async function seedOpportunities(clientToken: string, creatorToken: string) {
  const marker = `E2E-${Date.now()}`;
  const clientOppPayloads = [
    {
      title: `【${marker}】企业常法顾问招募`,
      summary: "面向长期合作法律顾问",
      description: "负责合同审查、常规法务咨询与合规建议。",
      opportunity_type: "job",
      category: "企业法务",
      industry: "互联网",
      location: "北京",
      location_type: "hybrid",
      budget: 18000,
      compensation_type: "monthly",
    },
    {
      title: `【${marker}】劳动争议专项协作`,
      summary: "阶段性协作岗位",
      description: "希望有劳动争议诉讼经验，可远程协作。",
      opportunity_type: "collaboration",
      category: "劳动法",
      industry: "人力资源",
      location: "上海",
      location_type: "remote",
      budget: 8000,
      compensation_type: "project",
    },
  ];

  const creatorOppPayload = {
    title: `【${marker}】知识产权案件协办（供投递测试）`,
    summary: "虚拟岗位：用于测试投递/回复流程",
    description: "E2E 虚拟岗位，请勿用于真实业务。",
    opportunity_type: "project",
    category: "知识产权",
    industry: "科技",
    location: "深圳",
    location_type: "remote",
    budget: 6000,
    compensation_type: "project",
  };

  const createdClientIds: string[] = [];
  for (const payload of clientOppPayloads) {
    const r = await request<{ data?: { id?: string } }>("POST", "/api/opportunities", payload, clientToken);
    if (!r.ok || !r.data?.data?.id) {
      throw new Error(`创建客户岗位失败: ${payload.title} status=${r.status} body=${r.text.slice(0, 180)}`);
    }
    createdClientIds.push(r.data.data.id);
  }

  const creatorR = await request<{ data?: { id?: string; slug?: string } }>(
    "POST",
    "/api/opportunities",
    creatorOppPayload,
    creatorToken,
  );
  const creatorOppId = creatorR.data?.data?.id;
  if (!creatorR.ok || !creatorOppId) {
    throw new Error(`创建创作者岗位失败 status=${creatorR.status} body=${creatorR.text.slice(0, 180)}`);
  }

  // 客户岗位状态分布：发布中 / 已下架
  await request("PATCH", `/api/opportunities/${createdClientIds[0]}`, { status: "published" }, clientToken);
  await request("PATCH", `/api/opportunities/${createdClientIds[1]}`, { status: "paused" }, clientToken);

  // 创作者岗位发布，便于客户端投递
  await request("PATCH", `/api/opportunities/${creatorOppId}`, { status: "published" }, creatorToken);

  return { creatorOppId };
}

async function seedApplicationAndReply(
  creatorOppId: string,
  clientToken: string,
  creatorToken: string,
) {
  const apply = await request<{ data?: { application_id?: string } }>(
    "POST",
    `/api/opportunities/${creatorOppId}/applications`,
    {
      file_url: "https://example.com/e2e-resume.pdf",
      original_name: "E2E-求职材料.pdf",
      message: "您好，这是 E2E 客户测试账号提交的虚拟投递材料。",
    },
    clientToken,
  );
  const applicationId = apply.data?.data?.application_id;
  if (!apply.ok || !applicationId) {
    throw new Error(`创建投递失败 status=${apply.status} body=${apply.text.slice(0, 180)}`);
  }

  const reply = await request(
    "PATCH",
    `/api/workspace/opportunity-applications/${applicationId}/reply`,
    { message: "E2E 发布方已收到你的投递，材料完整，可进入下一轮沟通。" },
    creatorToken,
  );
  if (!reply.ok) {
    throw new Error(`回复投递失败 status=${reply.status} body=${reply.text.slice(0, 180)}`);
  }
}

async function seedOpportunitiesByDb(clientId: string, creatorId: string) {
  const ts = Date.now();
  const inserted = await query<{ id: string; slug: string; publisher_id: string }>(
    `INSERT INTO opportunities
      (publisher_id, publisher_role, title, slug, summary, description, opportunity_type, category, industry, location, location_type, budget, compensation_type, status, view_count, application_count)
     VALUES
      ($1, 'client', $2, $3, $4, $5, 'job', '企业法务', '互联网', '北京', 'hybrid', 18000, 'monthly', 'published', 128, 1),
      ($1, 'client', $6, $7, $8, $9, 'collaboration', '劳动法', '人力资源', '上海', 'remote', 8000, 'project', 'paused', 56, 0),
      ($10, 'creator', $11, $12, $13, $14, 'project', '知识产权', '科技', '深圳', 'remote', 6000, 'project', 'published', 88, 1)
     RETURNING id, slug, publisher_id`,
    [
      clientId,
      `【E2E】企业常法顾问招募-${ts}`,
      `e2e-client-job-${ts}`,
      "面向长期合作法律顾问",
      "负责合同审查、常规法务咨询与合规建议。",
      `【E2E】劳动争议专项协作-${ts}`,
      `e2e-client-collab-${ts}`,
      "阶段性协作岗位",
      "希望有劳动争议诉讼经验，可远程协作。",
      creatorId,
      `【E2E】知产案件协办（投递测试）-${ts}`,
      `e2e-creator-project-${ts}`,
      "虚拟岗位：用于测试投递/回复流程",
      "E2E 虚拟岗位，请勿用于真实业务。",
    ],
  );

  const creatorOpp = inserted.rows.find((r) => r.publisher_id === creatorId);
  if (!creatorOpp) {
    throw new Error("未找到创作者岗位，无法写入投递测试数据");
  }
  return { creatorOppId: creatorOpp.id };
}

async function seedApplicationAndReplyByDb(creatorOppId: string, clientId: string) {
  await query(
    `INSERT INTO opportunity_applications
      (opportunity_id, applicant_id, file_url, original_name, message, publisher_reply, publisher_replied_at, created_at, updated_at)
     VALUES
      ($1, $2, 'https://example.com/e2e-resume.pdf', 'E2E-求职材料.pdf', '您好，这是 E2E 客户测试账号提交的虚拟投递材料。', 'E2E 发布方已收到你的投递，材料完整，可进入下一轮沟通。', NOW(), NOW(), NOW())`,
    [creatorOppId, clientId],
  );
}

async function seedSkillsAndOrders(clientId: string, creatorId: string) {
  const ts = Date.now();
  const skillRows = await query<{ id: string }>(
    `INSERT INTO skills
      (creator_id, title, slug, summary, description, category, tags, price_type, price, content, files, status, is_featured)
     VALUES
      ($1, $2, $3, $4, $5, '法律模板', ARRAY['E2E','律植理念'], 'paid', 29.90, '{}'::jsonb, '[]'::jsonb, 'active', true),
      ($1, $6, $7, $8, $9, '合规工具', ARRAY['E2E','下载测试'], 'paid', 49.00, '{}'::jsonb, '[]'::jsonb, 'active', true)
     RETURNING id`,
    [
      creatorId,
      `【E2E】律植平台理念速览 Skill-${ts}`,
      `e2e-skill-vision-${ts}`,
      "用于测试客户购买与下载流程的虚拟 skill",
      "该 skill 仅用于 E2E 工作台联调。",
      `【E2E】合同审查清单 Skill-${ts}`,
      `e2e-skill-checklist-${ts}`,
      "用于测试已购列表与下载行为",
      "包含虚拟下载说明。",
    ],
  );
  const [skillA, skillB] = skillRows.rows.map((x) => x.id);

  const productRows = await query<{ id: string }>(
    `INSERT INTO products
      (creator_id, product_type, related_id, name, description, pricing_type, price, status, metadata)
     VALUES
      ($1, 'content', $2, $3, $4, 'one_time', 29.90, 'active', '{"seed":"e2e","kind":"skill-shadow"}'::jsonb),
      ($1, 'content', $5, $6, $7, 'one_time', 49.00, 'active', '{"seed":"e2e","kind":"skill-shadow"}'::jsonb)
     RETURNING id`,
    [
      creatorId,
      skillA,
      `【E2E商品】律植理念 Skill 映射-${ts}`,
      "用于订单与工作台已购联调（映射至 skills）",
      skillB,
      `【E2E商品】合同清单 Skill 映射-${ts}`,
      "用于订单与工作台已购联调（映射至 skills）",
    ],
  );
  const [productA, productB] = productRows.rows.map((x) => x.id);

  // 工作台“已购”依赖 source_type/source_id + paid 状态
  await query(
    `INSERT INTO orders (user_id, product_id, order_type, amount, currency, status, payment_method, paid_at, source_type, source_id, metadata)
     VALUES
      ($1, $2, 'purchase', 29.90, 'CNY', 'paid', 'balance', NOW(), 'skill', $3, '{"seed":"e2e"}'::jsonb),
      ($1, $4, 'purchase', 49.00, 'CNY', 'paid', 'balance', NOW(), 'skill', $5, '{"seed":"e2e"}'::jsonb)`,
    [clientId, productA, skillA, productB, skillB],
  );
}

async function main() {
  const health = await fetch(`${API_BASE_URL}/health`).catch(() => null);
  if (!health?.ok) {
    throw new Error(`API 不可用: ${API_BASE_URL}`);
  }

  await ensureRoles();
  await ensureOrdersColumns();

  const clientToken = await login(E2E_CLIENT_EMAIL);
  const creatorToken = await login(E2E_CREATOR_EMAIL);
  const clientId = await getProfileId(E2E_CLIENT_EMAIL);
  const creatorId = await getProfileId(E2E_CREATOR_EMAIL);

  try {
    await seedCommunityPosts(clientToken);
  } catch {
    await seedCommunityPostsByDb(clientId);
  }

  let creatorOppId = "";
  try {
    const byApi = await seedOpportunities(clientToken, creatorToken);
    creatorOppId = byApi.creatorOppId;
  } catch {
    const byDb = await seedOpportunitiesByDb(clientId, creatorId);
    creatorOppId = byDb.creatorOppId;
  }

  try {
    await seedApplicationAndReply(creatorOppId, clientToken, creatorToken);
  } catch {
    await seedApplicationAndReplyByDb(creatorOppId, clientId);
  }
  await seedSkillsAndOrders(clientId, creatorId);

  console.log("✅ E2E 工作台测试数据已注入完成");
  console.log(`- 客户账号: ${E2E_CLIENT_EMAIL}`);
  console.log(`- 创作者账号: ${E2E_CREATOR_EMAIL}`);
  console.log("- 已生成：理念帖子、发布岗位、投递回复、虚拟 skills、已购订单");
}

main().catch((e) => {
  console.error("❌ 注入失败:", e instanceof Error ? e.message : e);
  process.exit(1);
});

