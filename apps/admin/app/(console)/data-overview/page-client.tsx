"use client";

import { useEffect, useMemo, useState } from "react";
import { apiRequest, AdminApiError } from "@/lib/api";

type OverviewItem = {
  id: string;
  display_name: string | null;
  nickname: string | null;
  email: string | null;
  phone: string | null;
  contact_address: string | null;
  work_organization: string | null;
  city: string | null;
  gender: string | null;
  birth_year: number | null;
  role: string;
  status: string;
  verified: boolean;
  verification_status: string | null;
  follower_count?: number | null;
  created_at: string;
};

type OverviewPayload = {
  summary: {
    total_users: number;
    verified_users: number;
    unverified_users: number;
    by_role: Record<string, number>;
    by_status: Record<string, number>;
    analytics: {
      by_gender: Record<string, number>;
      by_age_bucket: Record<string, number>;
      by_city: Array<{ city: string; count: number }>;
      business: {
        income_total_cny: number;
        settlements_approved_count: number;
        payment_total_cny: number;
        payment_count: number;
        platform_income_cny: number;
        platform_expense_cny: number;
        creator_payout_cny: number;
        promotion_income_cny: number;
        payment_details: Array<{
          order_id: string;
          user_id: string;
          payer_name: string;
          payment_account: string;
          amount_cny: number;
          paid_at: string;
          remark: string;
        }>;
        creator_payout_details: Array<{
          earning_id: string;
          creator_id: string;
          creator_name: string;
          amount_cny: number;
          paid_at: string;
          remark: string;
        }>;
        posts_total: number;
        posts_published: number;
        practicing_lawyers_total: number;
        practicing_lawyers_by_domain: Array<{ domain: string; count: number }>;
        online_skills_total: number;
        online_skills_by_category: Array<{ category: string; count: number }>;
        community_active_users_7d: number;
        community_active_users_30d: number;
        community_post_details: Array<{
          post_id: string;
          title: string;
          status: string;
          author_id: string;
          author_name: string;
          like_count: number;
          comment_count: number;
          view_count: number;
          created_at: string;
        }>;
        community_active_user_details: Array<{
          user_id: string;
          user_name: string;
          posts_7d: number;
          comments_7d: number;
          posts_30d: number;
          comments_30d: number;
          last_active_at: string;
        }>;
        opportunities_total: number;
        opportunities_published: number;
        opportunities_applications_total: number;
        opportunities_details: Array<{
          id: string;
          title: string;
          type: string;
          status: string;
          publisher_id: string;
          publisher_name: string;
          location: string;
          application_count: number;
          view_count: number;
          created_at: string;
        }>;
        skills_details: Array<{
          id: string;
          title: string;
          category: string;
          status: string;
          creator_id: string;
          creator_name: string;
          purchase_count: number;
          view_count: number;
          favorite_count: number;
          created_at: string;
        }>;
        total_follow_relations: number;
        followed_accounts_total: number;
        follower_users_total: number;
        follower_leaderboard: Array<{
          user_id: string;
          display_name: string;
          role: string;
          creator_level: string;
          lawyer_verified: boolean;
          follower_count: number;
        }>;
        refreshed_at: string;
        refresh_cycle: string;
      };
    };
    data_source?: string;
  };
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  items: OverviewItem[];
};

type PaginatedDetail<T> = {
  module: string;
  metric: string;
  page: number;
  pageSize: number;
  total: number;
  items: T[];
};

type PaymentDetailRow = {
  key: string;
  name: string;
  id: string;
  account: string;
  amount: number;
  at: string;
  remark: string;
};

type CommunityActiveRow = {
  key: string;
  user_name: string;
  user_id: string;
  posts: number;
  comments: number;
  last_active_at: string;
};

type CommunityPostRow = {
  key: string;
  title: string;
  post_id: string;
  author_name: string;
  author_id: string;
  metrics: string;
  created_at: string;
  status: string;
};

type OpportunityDetailRow = {
  id: string;
  title: string;
  publisher_name: string;
  publisher_id: string;
  location: string;
  view_count: number;
  application_count: number;
  status: string;
  created_at: string;
};

type SkillDetailRow = {
  id: string;
  title: string;
  creator_name: string;
  creator_id: string;
  category: string;
  view_count: number;
  favorite_count: number;
  purchase_count: number;
  status: string;
  created_at: string;
};

function roleLabel(role: string): string {
  const map: Record<string, string> = {
    visitor: "游客",
    client: "普通用户",
    creator: "创作者",
    admin: "管理员",
    superadmin: "超管",
  };
  return map[role] || role;
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    active: "正常",
    suspended: "已停用",
    banned: "已封禁",
    pending: "待处理",
  };
  return map[status] || status;
}

function genderLabel(gender: string): string {
  const map: Record<string, string> = {
    male: "男",
    female: "女",
    m: "男",
    f: "女",
    unknown: "未填写",
    other: "其他",
  };
  const key = String(gender || "").toLowerCase();
  return map[key] || gender || "未填写";
}

function ageBucketLabel(bucket: string): string {
  const map: Record<string, string> = {
    "<18": "18岁以下",
    "18-24": "18-24岁",
    "25-34": "25-34岁",
    "35-44": "35-44岁",
    "45-54": "45-54岁",
    "55+": "55岁以上",
    unknown: "未填写",
  };
  return map[bucket] || bucket;
}

function percentPart(value: number, total: number): string {
  if (!total) return "0%";
  return `${((value / total) * 100).toFixed(1)}%`;
}

function formatMoney(value: number): string {
  return `¥ ${value.toLocaleString("zh-CN", { maximumFractionDigits: 2 })}`;
}

function formatCount(value: number): string {
  return `${value.toLocaleString("zh-CN")} 人`;
}

function inferAge(birthYear: number | null | undefined): string {
  if (!birthYear || !Number.isFinite(birthYear)) return "—";
  const current = new Date().getFullYear();
  const age = current - birthYear;
  if (age < 0 || age > 120) return "—";
  return `${age} 岁`;
}

function Icon({ path }: { path: string }) {
  return (
    <span style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(212,165,116,0.14)", display: "grid", placeItems: "center" }}>
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#8b5f3d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d={path} />
      </svg>
    </span>
  );
}

function MetricCard({
  title,
  value,
  iconPath,
  active = false,
  onClick,
}: {
  title: string;
  value: string;
  iconPath: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className="admin-card"
      onClick={onClick}
      style={{
        margin: 0,
        padding: 12,
        textAlign: "left",
        cursor: onClick ? "pointer" : "default",
        border: active ? "1px solid rgba(212,165,116,0.62)" : undefined,
        background: active ? "rgba(212,165,116,0.12)" : undefined,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#7c6a56" }}>
        <Icon path={iconPath} />
        <span>{title}</span>
      </div>
      <div style={{ marginTop: 8, fontSize: 22, fontWeight: 700, color: "#2c2416" }}>{value}</div>
    </button>
  );
}

const REGION_RULES: Array<{ region: string; aliases: string[] }> = [
  { region: "中国大陆", aliases: ["北京", "上海", "广州", "深圳", "杭州", "南京", "成都", "重庆", "武汉", "西安", "天津", "苏州", "长沙", "青岛", "沈阳", "郑州", "济南", "厦门", "宁波", "合肥", "福州"] },
  { region: "港澳台", aliases: ["香港", "澳门", "台北", "高雄", "台中", "新北"] },
  { region: "东南亚", aliases: ["新加坡", "吉隆坡", "曼谷", "雅加达", "胡志明", "河内", "马尼拉"] },
  { region: "东亚", aliases: ["东京", "大阪", "首尔", "釜山"] },
  { region: "欧洲", aliases: ["伦敦", "巴黎", "柏林", "马德里", "罗马", "阿姆斯特丹", "苏黎世"] },
  { region: "北美", aliases: ["纽约", "洛杉矶", "旧金山", "多伦多", "温哥华", "芝加哥"] },
  { region: "大洋洲", aliases: ["悉尼", "墨尔本", "奥克兰"] },
  { region: "其他地区", aliases: [] },
];

function inferRegionFromCity(city: string): string {
  const normalized = city.trim();
  for (const rule of REGION_RULES) {
    if (rule.aliases.some((alias) => normalized.includes(alias))) {
      return rule.region;
    }
  }
  return "其他地区";
}

function registerWindowLabel(value: string): string {
  const map: Record<string, string> = {
    all: "全部时间",
    "7d": "近7天注册",
    "30d": "近30天注册",
    "90d": "近90天注册",
    "1y": "近1年注册",
  };
  return map[value] || "全部时间";
}

function detailWindowLabel(value: string): string {
  const map: Record<string, string> = {
    all: "全量历史",
    "7d": "近7天",
    "30d": "近30天",
    "90d": "近90天",
  };
  return map[value] || "全量历史";
}

function toCsvCell(value: unknown): string {
  const raw = String(value ?? "");
  const escaped = raw.replace(/"/g, '""');
  return `"${escaped}"`;
}

export default function DataOverviewClient() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [city, setCity] = useState("all");
  const [registerWindow, setRegisterWindow] = useState("all");
  const [detailWindow, setDetailWindow] = useState("30d");
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<OverviewPayload | null>(null);
  const [selectedUser, setSelectedUser] = useState<OverviewItem | null>(null);
  const [activePaymentMetric, setActivePaymentMetric] = useState<"platform_income" | "platform_expense" | "creator_payout" | "promotion_income" | "payment_total" | "payment_count" | "settlement_income">("payment_total");
  const [activeCommunityMetric, setActiveCommunityMetric] = useState<"posts_total" | "posts_published" | "active_7d" | "active_30d">("posts_total");
  const [activeOpportunityMetric, setActiveOpportunityMetric] = useState<"total" | "published" | "applications">("total");
  const [activeSkillMetric, setActiveSkillMetric] = useState<"total" | "category">("total");
  const [paymentDetailPage, setPaymentDetailPage] = useState(1);
  const [communityDetailPage, setCommunityDetailPage] = useState(1);
  const [opportunityDetailPage, setOpportunityDetailPage] = useState(1);
  const [skillDetailPage, setSkillDetailPage] = useState(1);
  const [paymentDetailData, setPaymentDetailData] = useState<PaginatedDetail<PaymentDetailRow> | null>(null);
  const [communityDetailData, setCommunityDetailData] = useState<PaginatedDetail<CommunityActiveRow | CommunityPostRow> | null>(null);
  const [opportunityDetailData, setOpportunityDetailData] = useState<PaginatedDetail<OpportunityDetailRow> | null>(null);
  const [skillDetailData, setSkillDetailData] = useState<PaginatedDetail<SkillDetailRow> | null>(null);
  const [detailLoading, setDetailLoading] = useState<Record<string, boolean>>({});

  const roleOptions = useMemo(() => {
    const fromSummary = payload ? Object.keys(payload.summary.by_role) : [];
    const all = Array.from(new Set(["all", ...fromSummary]));
    return all;
  }, [payload]);

  const statusOptions = useMemo(() => {
    const fromSummary = payload ? Object.keys(payload.summary.by_status) : [];
    const all = Array.from(new Set(["all", ...fromSummary]));
    return all;
  }, [payload]);

  const cityOptions = useMemo(() => {
    const fromSummary = payload?.summary.analytics?.by_city || [];
    return ["all", ...fromSummary.map((x) => x.city)];
  }, [payload]);

  const totalUsers = payload?.summary.total_users ?? 0;
  const genderEntries = useMemo(
    () => Object.entries(payload?.summary.analytics?.by_gender || {}).sort((a, b) => b[1] - a[1]),
    [payload]
  );
  const ageEntries = useMemo(
    () => Object.entries(payload?.summary.analytics?.by_age_bucket || {}).sort((a, b) => b[1] - a[1]),
    [payload]
  );
  const cityEntries = useMemo(() => payload?.summary.analytics?.by_city || [], [payload]);
  const business = payload?.summary.analytics?.business;
  const lawyerDomainEntries = business?.practicing_lawyers_by_domain || [];
  const skillCategoryEntries = business?.online_skills_by_category || [];
  const followerLeaderboardEntries = business?.follower_leaderboard || [];
  const selectedCityCount = useMemo(() => {
    if (city === "all") return totalUsers;
    return cityEntries.find((x) => x.city === city)?.count ?? 0;
  }, [city, cityEntries, totalUsers]);
  const regionEntries = useMemo(() => {
    const regionMap = new Map<string, Array<{ city: string; count: number }>>();
    for (const entry of cityEntries) {
      const region = inferRegionFromCity(entry.city);
      const list = regionMap.get(region) || [];
      list.push(entry);
      regionMap.set(region, list);
    }
    return REGION_RULES.map((rule) => {
      const cities = (regionMap.get(rule.region) || []).sort((a, b) => b.count - a.count);
      return {
        region: rule.region,
        total: cities.reduce((sum, item) => sum + item.count, 0),
        cities,
      };
    }).filter((item) => item.cities.length > 0);
  }, [cityEntries]);
  const paymentDetailRows = useMemo(() => paymentDetailData?.items || [], [paymentDetailData]);
  const communityActiveRows = useMemo(
    () => (activeCommunityMetric === "active_7d" || activeCommunityMetric === "active_30d" ? ((communityDetailData?.items || []) as CommunityActiveRow[]) : []),
    [communityDetailData, activeCommunityMetric]
  );
  const communityPostRows = useMemo(
    () => (activeCommunityMetric === "posts_total" || activeCommunityMetric === "posts_published" ? ((communityDetailData?.items || []) as CommunityPostRow[]) : []),
    [communityDetailData, activeCommunityMetric]
  );
  const opportunityDetailRows = useMemo(
    () => opportunityDetailData?.items || [],
    [opportunityDetailData]
  );
  const skillDetailRows = useMemo(
    () => skillDetailData?.items || [],
    [skillDetailData]
  );

  function downloadCsv(filename: string, headers: string[], rows: Array<Array<unknown>>) {
    const content = [headers.map(toCsvCell).join(","), ...rows.map((row) => row.map(toCsvCell).join(","))].join("\n");
    const blob = new Blob([`\uFEFF${content}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        role,
        status,
        city,
        register_window: registerWindow,
      });
      if (keyword.trim()) {
        query.set("keyword", keyword.trim());
      }
      const data = await apiRequest<OverviewPayload>(`/api/admin/data-overview?${query.toString()}`);
      setPayload(data);
    } catch (err) {
      setPayload(null);
      setError(err instanceof AdminApiError ? err.message : "加载数据总览失败");
    } finally {
      setLoading(false);
    }
  }

  async function loadDetail<T>(moduleName: "payment" | "community" | "opportunity" | "skill", metric: string, pageNo: number): Promise<PaginatedDetail<T> | null> {
    try {
      setDetailLoading((prev) => ({ ...prev, [`${moduleName}`]: true }));
      const query = new URLSearchParams({
        module: moduleName,
        metric,
        page: String(pageNo),
        pageSize: "50",
        time_window: detailWindow,
      });
      const data = await apiRequest<PaginatedDetail<T>>(`/api/admin/data-overview/details?${query.toString()}`);
      return data;
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "加载明细失败");
      return null;
    } finally {
      setDetailLoading((prev) => ({ ...prev, [`${moduleName}`]: false }));
    }
  }

  useEffect(() => {
    void loadData();
  }, [page, pageSize, role, status, city, registerWindow, keyword]);

  useEffect(() => {
    if (!selectedUser) return;
    const exists = (payload?.items || []).some((item) => item.id === selectedUser.id);
    if (!exists) {
      setSelectedUser(null);
    }
  }, [payload, selectedUser]);

  useEffect(() => {
    setPaymentDetailPage(1);
  }, [activePaymentMetric]);
  useEffect(() => {
    setCommunityDetailPage(1);
  }, [activeCommunityMetric]);
  useEffect(() => {
    setOpportunityDetailPage(1);
  }, [activeOpportunityMetric]);
  useEffect(() => {
    setSkillDetailPage(1);
  }, [activeSkillMetric]);
  useEffect(() => {
    setPaymentDetailPage(1);
    setCommunityDetailPage(1);
    setOpportunityDetailPage(1);
    setSkillDetailPage(1);
  }, [detailWindow]);

  useEffect(() => {
    void (async () => {
      const res = await loadDetail<PaymentDetailRow>("payment", activePaymentMetric, paymentDetailPage);
      if (res) setPaymentDetailData(res);
    })();
  }, [activePaymentMetric, paymentDetailPage, detailWindow]);

  useEffect(() => {
    void (async () => {
      const res = await loadDetail<CommunityActiveRow | CommunityPostRow>("community", activeCommunityMetric, communityDetailPage);
      if (res) setCommunityDetailData(res);
    })();
  }, [activeCommunityMetric, communityDetailPage, detailWindow]);

  useEffect(() => {
    void (async () => {
      const res = await loadDetail<OpportunityDetailRow>("opportunity", activeOpportunityMetric, opportunityDetailPage);
      if (res) setOpportunityDetailData(res);
    })();
  }, [activeOpportunityMetric, opportunityDetailPage, detailWindow]);

  useEffect(() => {
    void (async () => {
      const res = await loadDetail<SkillDetailRow>("skill", activeSkillMetric, skillDetailPage);
      if (res) setSkillDetailData(res);
    })();
  }, [activeSkillMetric, skillDetailPage, detailWindow]);

  return (
    <div className="admin-grid" style={{ gap: 16 }}>
      <section className="admin-card">
        <h2 style={{ marginTop: 0, marginBottom: 12, fontSize: 18 }}>数据总览台（仅超管）</h2>
        <p style={{ marginTop: 0, color: "#7c6a56", fontSize: 13 }}>
          仅展示数据库实时用户数据（无虚拟占位）；上线后新注册用户会自动纳入统计。
        </p>

        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
            <div className="admin-card" style={{ margin: 0 }}>
              <div style={{ fontSize: 12, color: "#7c6a56" }}>用户总数</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{totalUsers}</div>
            </div>
            <div className="admin-card" style={{ margin: 0 }}>
              <div style={{ fontSize: 12, color: "#7c6a56" }}>已实名/已认证</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{payload?.summary.verified_users ?? 0}</div>
            </div>
            <div className="admin-card" style={{ margin: 0 }}>
              <div style={{ fontSize: 12, color: "#7c6a56" }}>未认证</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{payload?.summary.unverified_users ?? 0}</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <select className="admin-select" value={role} onChange={(e) => { setPage(1); setRole(e.target.value); }} style={{ maxWidth: 200 }}>
              {roleOptions.map((item) => (
                <option key={item} value={item}>{item === "all" ? "全部角色" : roleLabel(item)}</option>
              ))}
            </select>
            <select className="admin-select" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} style={{ maxWidth: 200 }}>
              {statusOptions.map((item) => (
                <option key={item} value={item}>{item === "all" ? "全部状态" : statusLabel(item)}</option>
              ))}
            </select>
            <select className="admin-select" value={city} onChange={(e) => { setPage(1); setCity(e.target.value); }} style={{ maxWidth: 220 }}>
              {cityOptions.map((item) => (
                <option key={item} value={item}>{item === "all" ? "全部地区" : item}</option>
              ))}
            </select>
            <select className="admin-select" value={registerWindow} onChange={(e) => { setPage(1); setRegisterWindow(e.target.value); }} style={{ maxWidth: 220 }}>
              <option value="all">全部时间</option>
              <option value="7d">近7天注册</option>
              <option value="30d">近30天注册</option>
              <option value="90d">近90天注册</option>
              <option value="1y">近1年注册</option>
            </select>
            <input
              className="admin-input"
              placeholder="搜索昵称/邮箱/手机号/城市"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              style={{ minWidth: 260, flex: 1 }}
            />
            <button className="admin-btn" onClick={() => { setPage(1); setKeyword(keywordInput); }}>
              搜索
            </button>
            <button className="admin-btn" onClick={() => { setKeywordInput(""); setKeyword(""); setRole("all"); setStatus("all"); setCity("all"); setRegisterWindow("all"); setPage(1); }}>
              重置
            </button>
          </div>
        </div>
      </section>

      <section className="admin-card" style={{ display: "grid", gap: 12 }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>用户画像分析</h3>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
          <div className="admin-card" style={{ margin: 0 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>性别分布</div>
            <div style={{ display: "grid", gap: 8 }}>
              {genderEntries.map(([g, count]) => (
                <div key={g} style={{ display: "grid", gap: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6b5b4d" }}>
                    <span>{genderLabel(g)}</span>
                    <span>{count} 人（{percentPart(count, totalUsers)}）</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 999, background: "rgba(212,165,116,0.15)" }}>
                    <div style={{ height: "100%", borderRadius: 999, background: "linear-gradient(90deg, #d4a574, #b8860b)", width: percentPart(count, totalUsers) }} />
                  </div>
                </div>
              ))}
              {!genderEntries.length ? <div style={{ fontSize: 12, color: "#7c6a56" }}>暂无性别数据</div> : null}
            </div>
          </div>

          <div className="admin-card" style={{ margin: 0 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>年龄分布</div>
            <div style={{ display: "grid", gap: 8 }}>
              {ageEntries.map(([bucket, count]) => (
                <div key={bucket} style={{ display: "grid", gap: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6b5b4d" }}>
                    <span>{ageBucketLabel(bucket)}</span>
                    <span>{count} 人（{percentPart(count, totalUsers)}）</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 999, background: "rgba(212,165,116,0.15)" }}>
                    <div style={{ height: "100%", borderRadius: 999, background: "linear-gradient(90deg, #7ba9d6, #4f7aa6)", width: percentPart(count, totalUsers) }} />
                  </div>
                </div>
              ))}
              {!ageEntries.length ? <div style={{ fontSize: 12, color: "#7c6a56" }}>暂无年龄数据</div> : null}
            </div>
          </div>
        </div>
      </section>

      <section className="admin-card" style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>平台核心经营数据（真实数据）</h3>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "#7c6a56" }}>
              明细窗口：{detailWindowLabel(detailWindow)} · {business?.refresh_cycle === "daily" ? "每日更新" : "实时更新"} ·
              {business?.refreshed_at ? ` 最近更新时间：${new Date(business.refreshed_at).toLocaleString()}` : " 最近更新时间：—"}
            </span>
            <select className="admin-select" value={detailWindow} onChange={(e) => setDetailWindow(e.target.value)} style={{ maxWidth: 150 }}>
              <option value="all">全量历史</option>
              <option value="7d">近7天</option>
              <option value="30d">近30天</option>
              <option value="90d">近90天</option>
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          <div className="admin-card" style={{ margin: 0 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>支付数据</div>
            <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
              <MetricCard title="平台收入" value={formatMoney(business?.platform_income_cny || 0)} iconPath="M3 12h18M12 3v18M5 5l14 14M19 5L5 19" active={activePaymentMetric === "platform_income"} onClick={() => setActivePaymentMetric("platform_income")} />
              <MetricCard title="平台支出" value={formatMoney(business?.platform_expense_cny || 0)} iconPath="M4 7h16v10H4zM8 11h8" active={activePaymentMetric === "platform_expense"} onClick={() => setActivePaymentMetric("platform_expense")} />
              <MetricCard title="向创作者支付" value={formatMoney(business?.creator_payout_cny || 0)} iconPath="M3 12h3l2 6 4-12 3 8h5" active={activePaymentMetric === "creator_payout"} onClick={() => setActivePaymentMetric("creator_payout")} />
              <MetricCard title="推广收入" value={formatMoney(business?.promotion_income_cny || 0)} iconPath="M4 20V10M10 20V4M16 20v-7M22 20v-11" active={activePaymentMetric === "promotion_income"} onClick={() => setActivePaymentMetric("promotion_income")} />
              <MetricCard title="支付总额" value={formatMoney(business?.payment_total_cny || 0)} iconPath="M2 7h20v10H2zM2 11h20" active={activePaymentMetric === "payment_total"} onClick={() => setActivePaymentMetric("payment_total")} />
              <MetricCard title="支付笔数" value={`${(business?.payment_count || 0).toLocaleString("zh-CN")} 笔`} iconPath="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" active={activePaymentMetric === "payment_count"} onClick={() => setActivePaymentMetric("payment_count")} />
              <MetricCard title="结算收入" value={formatMoney(business?.income_total_cny || 0)} iconPath="M3 4h18M3 12h18M3 20h18" active={activePaymentMetric === "settlement_income"} onClick={() => setActivePaymentMetric("settlement_income")} />
            </div>
            <div style={{ marginTop: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                <div style={{ fontSize: 12, color: "#7c6a56" }}>
                {activePaymentMetric === "platform_expense" || activePaymentMetric === "creator_payout" || activePaymentMetric === "settlement_income"
                  ? "结算/支出明细（创作者 / 金额 / 时间 / 备注）"
                  : activePaymentMetric === "promotion_income"
                  ? "推广收入明细（付款账户 / 金额 / 时间 / 备注）"
                  : "支付/收入明细（付款账户 / 金额 / 时间 / 备注）"}
                </div>
                <button
                  className="admin-btn"
                  onClick={() =>
                    downloadCsv(
                      `payment-detail-${activePaymentMetric}.csv`,
                      ["名称", "ID", "账户", "金额", "时间", "备注"],
                      paymentDetailRows.map((item) => [item.name, item.id, item.account, item.amount, item.at, item.remark])
                    )
                  }
                >
                  导出当前明细 CSV
                </button>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="admin-table" style={{ minWidth: 860 }}>
                  <thead>
                    <tr>
                      <th>{activePaymentMetric === "platform_expense" || activePaymentMetric === "creator_payout" || activePaymentMetric === "settlement_income" ? "创作者" : "付款用户"}</th>
                      <th>{activePaymentMetric === "platform_expense" || activePaymentMetric === "creator_payout" || activePaymentMetric === "settlement_income" ? "创作者账户信息" : "付款账户信息"}</th>
                      <th>{activePaymentMetric === "platform_expense" || activePaymentMetric === "creator_payout" || activePaymentMetric === "settlement_income" ? "结算金额" : "付款金额"}</th>
                      <th>{activePaymentMetric === "platform_expense" || activePaymentMetric === "creator_payout" || activePaymentMetric === "settlement_income" ? "结算时间" : "付款时间"}</th>
                      <th>备注</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentDetailRows.slice(0, 80).map((item) => (
                      <tr key={item.key}>
                        <td>
                          <div>{item.name || "未命名用户"}</div>
                          <div style={{ fontSize: 12, color: "#7c6a56" }}>{item.id}</div>
                        </td>
                        <td>{item.account || "—"}</td>
                        <td>{formatMoney(item.amount || 0)}</td>
                        <td>{item.at ? new Date(item.at).toLocaleString() : "—"}</td>
                        <td>{item.remark || "—"}</td>
                      </tr>
                    ))}
                    {!paymentDetailRows.length ? (
                      <tr>
                        <td colSpan={5} style={{ color: "#7c6a56" }}>
                          暂无对应明细
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: "#7c6a56" }}>
                  共 {paymentDetailData?.total ?? 0} 条，当前第 {paymentDetailData?.page ?? 1} / {Math.max(1, Math.ceil((paymentDetailData?.total ?? 0) / (paymentDetailData?.pageSize ?? 50)))} 页
                  {detailLoading.payment ? " · 加载中..." : ""}
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="admin-btn" disabled={(paymentDetailData?.page ?? 1) <= 1} onClick={() => setPaymentDetailPage((prev) => Math.max(1, prev - 1))}>
                    上一页
                  </button>
                  <button
                    className="admin-btn"
                    disabled={(paymentDetailData?.page ?? 1) >= Math.max(1, Math.ceil((paymentDetailData?.total ?? 0) / (paymentDetailData?.pageSize ?? 50)))}
                    onClick={() => setPaymentDetailPage((prev) => prev + 1)}
                  >
                    下一页
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="admin-card" style={{ margin: 0 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>社区数据</div>
            <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
              <MetricCard title="帖子总数" value={`${(business?.posts_total || 0).toLocaleString("zh-CN")} 篇`} iconPath="M4 4h16v16H4zM8 8h8M8 12h8M8 16h6" active={activeCommunityMetric === "posts_total"} onClick={() => setActiveCommunityMetric("posts_total")} />
              <MetricCard title="已发布帖子" value={`${(business?.posts_published || 0).toLocaleString("zh-CN")} 篇`} iconPath="M20 6L9 17l-5-5" active={activeCommunityMetric === "posts_published"} onClick={() => setActiveCommunityMetric("posts_published")} />
              <MetricCard title="活跃用户(7天)" value={formatCount(business?.community_active_users_7d || 0)} iconPath="M3 12h3l3 8 4-16 3 8h5" active={activeCommunityMetric === "active_7d"} onClick={() => setActiveCommunityMetric("active_7d")} />
              <MetricCard title="活跃用户(30天)" value={formatCount(business?.community_active_users_30d || 0)} iconPath="M3 12h3l3 8 4-16 3 8h5" active={activeCommunityMetric === "active_30d"} onClick={() => setActiveCommunityMetric("active_30d")} />
            </div>
            <div style={{ marginTop: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                <div style={{ fontSize: 12, color: "#7c6a56" }}>
                  {activeCommunityMetric === "active_7d" || activeCommunityMetric === "active_30d"
                  ? "活跃用户明细（用户 / 发帖数 / 评论数 / 最近活跃时间）"
                  : "帖子明细（标题 / 作者 / 互动数据 / 发布时间）"}
                </div>
                <button
                  className="admin-btn"
                  onClick={() =>
                    downloadCsv(
                      `community-detail-${activeCommunityMetric}.csv`,
                      activeCommunityMetric === "active_7d" || activeCommunityMetric === "active_30d"
                        ? ["用户", "用户ID", "发帖数", "评论数", "最近活跃时间"]
                        : ["帖子", "帖子ID", "作者", "作者ID", "互动数据", "发布时间", "状态"],
                      (activeCommunityMetric === "active_7d" || activeCommunityMetric === "active_30d"
                        ? communityActiveRows.map((item) => [item.user_name, item.user_id, item.posts, item.comments, item.last_active_at])
                        : communityPostRows.map((item) => [item.title, item.post_id, item.author_name, item.author_id, item.metrics, item.created_at, item.status]))
                    )
                  }
                >
                  导出当前明细 CSV
                </button>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="admin-table" style={{ minWidth: 860 }}>
                  <thead>
                    {activeCommunityMetric === "active_7d" || activeCommunityMetric === "active_30d" ? (
                      <tr>
                        <th>用户</th>
                        <th>发帖数</th>
                        <th>评论数</th>
                        <th>最近活跃时间</th>
                      </tr>
                    ) : (
                      <tr>
                        <th>帖子</th>
                        <th>作者</th>
                        <th>互动数据</th>
                        <th>发布时间</th>
                        <th>状态</th>
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {activeCommunityMetric === "active_7d" || activeCommunityMetric === "active_30d"
                      ? communityActiveRows.slice(0, 80).map((item) => (
                          <tr key={item.user_id}>
                            <td>
                              <div>{item.user_name || "未命名用户"}</div>
                              <div style={{ fontSize: 12, color: "#7c6a56" }}>{item.user_id}</div>
                            </td>
                            <td>{item.posts}</td>
                            <td>{item.comments}</td>
                            <td>{item.last_active_at ? new Date(item.last_active_at).toLocaleString() : "—"}</td>
                          </tr>
                        ))
                      : communityPostRows.slice(0, 80).map((item) => (
                            <tr key={item.post_id}>
                              <td>
                                <div>{item.title || "未命名帖子"}</div>
                                <div style={{ fontSize: 12, color: "#7c6a56" }}>{item.post_id}</div>
                              </td>
                              <td>
                                <div>{item.author_name || "未命名用户"}</div>
                                <div style={{ fontSize: 12, color: "#7c6a56" }}>{item.author_id || "—"}</div>
                              </td>
                              <td>{item.metrics}</td>
                              <td>{item.created_at ? new Date(item.created_at).toLocaleString() : "—"}</td>
                              <td>{item.status || "—"}</td>
                            </tr>
                          ))}
                    {!(activeCommunityMetric === "active_7d" || activeCommunityMetric === "active_30d" ? communityActiveRows.length : communityPostRows.length) ? (
                      <tr>
                        <td colSpan={activeCommunityMetric === "active_7d" || activeCommunityMetric === "active_30d" ? 4 : 5} style={{ color: "#7c6a56" }}>
                          暂无对应明细
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: "#7c6a56" }}>
                  共 {communityDetailData?.total ?? 0} 条，当前第 {communityDetailData?.page ?? 1} / {Math.max(1, Math.ceil((communityDetailData?.total ?? 0) / (communityDetailData?.pageSize ?? 50)))} 页
                  {detailLoading.community ? " · 加载中..." : ""}
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="admin-btn" disabled={(communityDetailData?.page ?? 1) <= 1} onClick={() => setCommunityDetailPage((prev) => Math.max(1, prev - 1))}>
                    上一页
                  </button>
                  <button
                    className="admin-btn"
                    disabled={(communityDetailData?.page ?? 1) >= Math.max(1, Math.ceil((communityDetailData?.total ?? 0) / (communityDetailData?.pageSize ?? 50)))}
                    onClick={() => setCommunityDetailPage((prev) => prev + 1)}
                  >
                    下一页
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="admin-card" style={{ margin: 0 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>律师数据</div>
            <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
              <MetricCard title="执业律师人数" value={formatCount(business?.practicing_lawyers_total || 0)} iconPath="M4 20h16M7 20V8h10v12M12 8V4M9 4h6" />
              <MetricCard title="总关注关系数" value={formatCount(business?.total_follow_relations || 0)} iconPath="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8" />
              <MetricCard title="被关注账号数" value={formatCount(business?.followed_accounts_total || 0)} iconPath="M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-6H9v6H5a2 2 0 0 1-2-2z" />
            </div>
            <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
              {lawyerDomainEntries.map((entry) => (
                <div key={entry.domain} style={{ display: "grid", gap: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6b5b4d" }}>
                    <span>{entry.domain}</span>
                    <span>{entry.count} 人</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 999, background: "rgba(212,165,116,0.15)" }}>
                    <div style={{ height: "100%", borderRadius: 999, background: "linear-gradient(90deg, #d4a574, #8b5f3d)", width: percentPart(entry.count, business?.practicing_lawyers_total || 0) }} />
                  </div>
                </div>
              ))}
              {!lawyerDomainEntries.length ? <div style={{ fontSize: 12, color: "#7c6a56" }}>暂无律师领域细分数据</div> : null}
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, color: "#7c6a56", marginBottom: 6 }}>
                关注者人数排行榜（创作者 / 律师） · 关注用户数 {formatCount(business?.follower_users_total || 0)}
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="admin-table" style={{ minWidth: 680 }}>
                  <thead>
                    <tr>
                      <th>排名</th>
                      <th>用户</th>
                      <th>身份</th>
                      <th>关注者</th>
                    </tr>
                  </thead>
                  <tbody>
                    {followerLeaderboardEntries.slice(0, 20).map((item, index) => (
                      <tr key={item.user_id}>
                        <td>#{index + 1}</td>
                        <td>
                          <div>{item.display_name || "未命名用户"}</div>
                          <div style={{ fontSize: 12, color: "#7c6a56" }}>{item.user_id}</div>
                        </td>
                        <td>
                          {item.lawyer_verified || item.creator_level === "lawyer"
                            ? "执业律师"
                            : item.role === "creator"
                              ? "创作者"
                              : item.role}
                        </td>
                        <td>{(item.follower_count || 0).toLocaleString("zh-CN")}</td>
                      </tr>
                    ))}
                    {!followerLeaderboardEntries.length ? (
                      <tr>
                        <td colSpan={4} style={{ color: "#7c6a56" }}>
                          暂无关注者排行榜数据
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="admin-card" style={{ margin: 0 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>岗位数据</div>
            <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
              <MetricCard title="岗位总数" value={`${(business?.opportunities_total || 0).toLocaleString("zh-CN")} 个`} iconPath="M3 7h18v14H3zM7 7V4h10v3" active={activeOpportunityMetric === "total"} onClick={() => setActiveOpportunityMetric("total")} />
              <MetricCard title="在架岗位" value={`${(business?.opportunities_published || 0).toLocaleString("zh-CN")} 个`} iconPath="M5 12l4 4L19 6" active={activeOpportunityMetric === "published"} onClick={() => setActiveOpportunityMetric("published")} />
              <MetricCard title="岗位投递总量" value={`${(business?.opportunities_applications_total || 0).toLocaleString("zh-CN")} 份`} iconPath="M3 8l9 6 9-6M5 10v10h14V10" active={activeOpportunityMetric === "applications"} onClick={() => setActiveOpportunityMetric("applications")} />
            </div>
            <div style={{ marginTop: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                <div style={{ fontSize: 12, color: "#7c6a56" }}>
                  岗位明细（标题 / 发布者 / 地区 / 浏览与投递 / 发布时间）
                </div>
                <button
                  className="admin-btn"
                  onClick={() =>
                    downloadCsv(
                      `opportunity-detail-${activeOpportunityMetric}.csv`,
                      ["岗位", "岗位ID", "发布者", "发布者ID", "地区", "浏览数", "投递数", "状态", "发布时间"],
                      opportunityDetailRows.map((item) => [
                        item.title,
                        item.id,
                        item.publisher_name,
                        item.publisher_id,
                        item.location,
                        item.view_count,
                        item.application_count,
                        item.status,
                        item.created_at,
                      ])
                    )
                  }
                >
                  导出当前明细 CSV
                </button>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="admin-table" style={{ minWidth: 900 }}>
                  <thead>
                    <tr>
                      <th>岗位</th>
                      <th>发布者</th>
                      <th>地区</th>
                      <th>浏览/投递</th>
                      <th>状态</th>
                      <th>发布时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {opportunityDetailRows.slice(0, 80).map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div>{item.title}</div>
                            <div style={{ fontSize: 12, color: "#7c6a56" }}>{item.id}</div>
                          </td>
                          <td>
                            <div>{item.publisher_name || "未命名用户"}</div>
                            <div style={{ fontSize: 12, color: "#7c6a56" }}>{item.publisher_id || "—"}</div>
                          </td>
                          <td>{item.location || "—"}</td>
                          <td>浏览 {item.view_count} · 投递 {item.application_count}</td>
                          <td>{item.status || "—"}</td>
                          <td>{item.created_at ? new Date(item.created_at).toLocaleString() : "—"}</td>
                        </tr>
                      ))}
                    {!opportunityDetailRows.length ? (
                      <tr>
                        <td colSpan={6} style={{ color: "#7c6a56" }}>
                          暂无对应明细
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: "#7c6a56" }}>
                  共 {opportunityDetailData?.total ?? 0} 条，当前第 {opportunityDetailData?.page ?? 1} / {Math.max(1, Math.ceil((opportunityDetailData?.total ?? 0) / (opportunityDetailData?.pageSize ?? 50)))} 页
                  {detailLoading.opportunity ? " · 加载中..." : ""}
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="admin-btn" disabled={(opportunityDetailData?.page ?? 1) <= 1} onClick={() => setOpportunityDetailPage((prev) => Math.max(1, prev - 1))}>
                    上一页
                  </button>
                  <button
                    className="admin-btn"
                    disabled={(opportunityDetailData?.page ?? 1) >= Math.max(1, Math.ceil((opportunityDetailData?.total ?? 0) / (opportunityDetailData?.pageSize ?? 50)))}
                    onClick={() => setOpportunityDetailPage((prev) => prev + 1)}
                  >
                    下一页
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="admin-card" style={{ margin: 0 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>技能数据（分类统计）</div>
            <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
              <MetricCard title="上线技能总量" value={`${(business?.online_skills_total || 0).toLocaleString("zh-CN")} 个`} iconPath="M4 18V6l8-3 8 3v12l-8 3-8-3z" active={activeSkillMetric === "total"} onClick={() => setActiveSkillMetric("total")} />
              <MetricCard title="技能分类统计" value={`${(skillCategoryEntries || []).length.toLocaleString("zh-CN")} 类`} iconPath="M3 6h18M3 12h18M3 18h18" active={activeSkillMetric === "category"} onClick={() => setActiveSkillMetric("category")} />
            </div>
            <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
              {(activeSkillMetric === "category" ? skillCategoryEntries : skillCategoryEntries.slice(0, 8)).map((entry) => (
                <div key={entry.category} style={{ display: "grid", gap: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6b5b4d" }}>
                    <span>{entry.category}</span>
                    <span>{entry.count} 个</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 999, background: "rgba(212,165,116,0.15)" }}>
                    <div style={{ height: "100%", borderRadius: 999, background: "linear-gradient(90deg, #7ba9d6, #4f7aa6)", width: percentPart(entry.count, business?.online_skills_total || 0) }} />
                  </div>
                </div>
              ))}
              {!skillCategoryEntries.length ? <div style={{ fontSize: 12, color: "#7c6a56" }}>暂无技能分类数据</div> : null}
            </div>
            <div style={{ marginTop: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                <div style={{ fontSize: 12, color: "#7c6a56" }}>
                  技能明细（标题 / 创作者 / 分类 / 互动数据 / 发布时间）
                </div>
                <button
                  className="admin-btn"
                  onClick={() =>
                    downloadCsv(
                      `skill-detail-${activeSkillMetric}.csv`,
                      ["技能", "技能ID", "创作者", "创作者ID", "分类", "浏览数", "收藏数", "购买数", "状态", "发布时间"],
                      skillDetailRows.map((item) => [
                        item.title,
                        item.id,
                        item.creator_name,
                        item.creator_id,
                        item.category,
                        item.view_count,
                        item.favorite_count,
                        item.purchase_count,
                        item.status,
                        item.created_at,
                      ])
                    )
                  }
                >
                  导出当前明细 CSV
                </button>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="admin-table" style={{ minWidth: 900 }}>
                  <thead>
                    <tr>
                      <th>技能</th>
                      <th>创作者</th>
                      <th>分类</th>
                      <th>互动数据</th>
                      <th>状态</th>
                      <th>发布时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {skillDetailRows.slice(0, 80).map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div>{item.title}</div>
                            <div style={{ fontSize: 12, color: "#7c6a56" }}>{item.id}</div>
                          </td>
                          <td>
                            <div>{item.creator_name || "未命名创作者"}</div>
                            <div style={{ fontSize: 12, color: "#7c6a56" }}>{item.creator_id || "—"}</div>
                          </td>
                          <td>{item.category || "未分类"}</td>
                          <td>浏览 {item.view_count} · 收藏 {item.favorite_count} · 购买 {item.purchase_count}</td>
                          <td>{item.status || "—"}</td>
                          <td>{item.created_at ? new Date(item.created_at).toLocaleString() : "—"}</td>
                        </tr>
                      ))}
                    {!skillDetailRows.length ? (
                      <tr>
                        <td colSpan={6} style={{ color: "#7c6a56" }}>
                          暂无对应明细
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: "#7c6a56" }}>
                  共 {skillDetailData?.total ?? 0} 条，当前第 {skillDetailData?.page ?? 1} / {Math.max(1, Math.ceil((skillDetailData?.total ?? 0) / (skillDetailData?.pageSize ?? 50)))} 页
                  {detailLoading.skill ? " · 加载中..." : ""}
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="admin-btn" disabled={(skillDetailData?.page ?? 1) <= 1} onClick={() => setSkillDetailPage((prev) => Math.max(1, prev - 1))}>
                    上一页
                  </button>
                  <button
                    className="admin-btn"
                    disabled={(skillDetailData?.page ?? 1) >= Math.max(1, Math.ceil((skillDetailData?.total ?? 0) / (skillDetailData?.pageSize ?? 50)))}
                    onClick={() => setSkillDetailPage((prev) => prev + 1)}
                  >
                    下一页
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-card" style={{ display: "grid", gap: 12 }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>地域分布（2D 世界地图滑动视图）</h3>
        <div style={{ display: "grid", gap: 14, gridTemplateColumns: "minmax(320px, 1fr) minmax(260px, 1fr)" }}>
          <div style={{ display: "grid", gap: 10 }}>
            <div
              style={{
                borderRadius: 14,
                border: "1px solid rgba(212,165,116,0.2)",
                background: "linear-gradient(180deg, rgba(125,170,210,0.2), rgba(125,170,210,0.08))",
                padding: 10,
              }}
            >
              <div style={{ fontSize: 12, color: "#6b5b4d", marginBottom: 8 }}>
                横向滑动切换区域，点击城市即可联动用户明细筛选
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  overflowX: "auto",
                  scrollSnapType: "x mandatory",
                  paddingBottom: 4,
                  touchAction: "pan-x",
                }}
              >
                {regionEntries.map((region) => (
                  <div
                    key={region.region}
                    style={{
                      minWidth: 300,
                      flex: "0 0 300px",
                      scrollSnapAlign: "start",
                      borderRadius: 12,
                      border: "1px solid rgba(212,165,116,0.26)",
                      background: "#fff",
                      padding: 10,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div style={{ fontWeight: 700, color: "#5c4033" }}>{region.region}</div>
                      <div style={{ fontSize: 12, color: "#7c6a56" }}>{region.total} 人</div>
                    </div>
                    <div style={{ display: "grid", gap: 6 }}>
                      {region.cities.slice(0, 8).map((entry) => {
                        const active = city === entry.city;
                        return (
                          <button
                            key={entry.city}
                            type="button"
                            onClick={() => { setPage(1); setCity(entry.city); }}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              borderRadius: 8,
                              border: active ? "1px solid rgba(212,165,116,0.62)" : "1px solid rgba(212,165,116,0.2)",
                              background: active ? "rgba(212,165,116,0.16)" : "#fff",
                              color: "#5c4033",
                              padding: "6px 8px",
                              cursor: "pointer",
                              fontSize: 12,
                            }}
                          >
                            <span>{entry.city}</span>
                            <span>{entry.count} 人</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {!regionEntries.length ? (
                  <div style={{ minWidth: 300, borderRadius: 12, border: "1px dashed rgba(212,165,116,0.3)", padding: 12, color: "#7c6a56" }}>
                    暂无地域数据
                  </div>
                ) : null}
              </div>
            </div>
            <div className="admin-card" style={{ margin: 0 }}>
              <div style={{ fontSize: 12, color: "#7c6a56" }}>当前筛选区域</div>
              <div style={{ marginTop: 6, fontSize: 20, fontWeight: 700, color: "#2c2416" }}>{city === "all" ? "全部地区" : city}</div>
              <div style={{ marginTop: 2, fontSize: 13, color: "#7c6a56" }}>{selectedCityCount} 人</div>
            </div>
          </div>

          <div className="admin-card" style={{ margin: 0 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>城市用户榜（真实注册城市）</div>
            <div style={{ display: "grid", gap: 8, maxHeight: 320, overflow: "auto" }}>
              {cityEntries.map((entry) => {
                const active = city === entry.city;
                return (
                  <button
                    key={entry.city}
                    type="button"
                    onClick={() => { setPage(1); setCity(entry.city); }}
                    style={{
                      textAlign: "left",
                      borderRadius: 10,
                      border: active ? "1px solid rgba(212,165,116,0.62)" : "1px solid rgba(212,165,116,0.2)",
                      background: active ? "rgba(212,165,116,0.16)" : "#fff",
                      color: "#5c4033",
                      padding: "8px 10px",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>{entry.city}</span>
                    <span>{entry.count} 人</span>
                  </button>
                );
              })}
              {!cityEntries.length ? <div style={{ fontSize: 12, color: "#7c6a56" }}>暂无城市数据</div> : null}
            </div>
            <button
              type="button"
              className="admin-btn"
              style={{ marginTop: 10 }}
              onClick={() => { setPage(1); setCity("all"); }}
            >
              查看全部地区
            </button>
          </div>
        </div>
      </section>

      <section className="admin-card" style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>用户列表（可查看详情）</h3>
            <span style={{ fontSize: 12, color: "#7c6a56" }}>
              当前筛选：{role === "all" ? "全部角色" : roleLabel(role)} · {status === "all" ? "全部状态" : statusLabel(status)} · {city === "all" ? "全部地区" : city} · {registerWindowLabel(registerWindow)}
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end", alignItems: "center" }}>
            <select className="admin-select" value={role} onChange={(e) => { setPage(1); setRole(e.target.value); }} style={{ maxWidth: 180 }}>
              {roleOptions.map((item) => (
                <option key={item} value={item}>{item === "all" ? "全部角色" : roleLabel(item)}</option>
              ))}
            </select>
            <select className="admin-select" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} style={{ maxWidth: 180 }}>
              {statusOptions.map((item) => (
                <option key={item} value={item}>{item === "all" ? "全部状态" : statusLabel(item)}</option>
              ))}
            </select>
            <select className="admin-select" value={city} onChange={(e) => { setPage(1); setCity(e.target.value); }} style={{ maxWidth: 200 }}>
              {cityOptions.map((item) => (
                <option key={item} value={item}>{item === "all" ? "全部地区" : item}</option>
              ))}
            </select>
            <select className="admin-select" value={registerWindow} onChange={(e) => { setPage(1); setRegisterWindow(e.target.value); }} style={{ maxWidth: 200 }}>
              <option value="all">全部时间</option>
              <option value="7d">近7天注册</option>
              <option value="30d">近30天注册</option>
              <option value="90d">近90天注册</option>
              <option value="1y">近1年注册</option>
            </select>
            <input
              className="admin-input"
              placeholder="搜索昵称/邮箱/手机号/城市"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              style={{ minWidth: 220, maxWidth: 320 }}
            />
            <button className="admin-btn" onClick={() => { setPage(1); setKeyword(keywordInput); }}>
              搜索
            </button>
            <button className="admin-btn" onClick={() => { setKeywordInput(""); setKeyword(""); setRole("all"); setStatus("all"); setCity("all"); setRegisterWindow("all"); setPage(1); }}>
              重置
            </button>
          </div>
        </div>
        {error ? <div style={{ color: "#b63f2e", marginBottom: 10 }}>{error}</div> : null}
        {loading ? <div style={{ marginBottom: 10 }}>加载中...</div> : null}
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: selectedUser ? "minmax(320px, 1fr) minmax(320px, 420px)" : "1fr" }}>
          <div style={{ display: "grid", gap: 8 }}>
            {(payload?.items || []).map((item) => {
              const active = selectedUser?.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedUser(item)}
                  style={{
                    borderRadius: 12,
                    border: active ? "1px solid rgba(212,165,116,0.62)" : "1px solid rgba(212,165,116,0.2)",
                    background: active ? "rgba(212,165,116,0.15)" : "#fff",
                    textAlign: "left",
                    padding: 12,
                    cursor: "pointer",
                    display: "grid",
                    gap: 6,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#2c2416" }}>{item.display_name || item.nickname || "未命名用户"}</div>
                      <div style={{ fontSize: 12, color: "#7c6a56" }}>{item.id}</div>
                    </div>
                    <div style={{ fontSize: 12, color: "#7c6a56" }}>{new Date(item.created_at).toLocaleDateString()}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", fontSize: 12, color: "#6b5b4d" }}>
                    <span>角色：{roleLabel(item.role)}</span>
                    <span>状态：{statusLabel(item.status)}</span>
                    <span>关注我的人数：{formatCount(Number(item.follower_count || 0))}</span>
                    <span>城市：{item.city || "—"}</span>
                    <span>年龄：{inferAge(item.birth_year)}</span>
                  </div>
                </button>
              );
            })}
            {!payload?.items?.length && !loading ? <div style={{ color: "#7c6a56" }}>暂无匹配用户</div> : null}
          </div>

          {selectedUser ? (
            <aside className="admin-card" style={{ margin: 0, position: "sticky", top: 10, alignSelf: "start" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>用户详细信息</div>
                <button type="button" className="admin-btn" onClick={() => setSelectedUser(null)}>关闭</button>
              </div>
              <div style={{ display: "grid", gap: 8, fontSize: 13 }}>
                <div><strong>用户：</strong>{selectedUser.display_name || selectedUser.nickname || "未命名用户"}</div>
                <div><strong>用户ID：</strong>{selectedUser.id}</div>
                <div><strong>角色：</strong>{roleLabel(selectedUser.role)}</div>
                <div><strong>账号状态：</strong>{statusLabel(selectedUser.status)}</div>
                <div><strong>认证状态：</strong>{selectedUser.verification_status || (selectedUser.verified ? "verified" : "unverified")}</div>
                <div><strong>关注我的人数：</strong>{formatCount(Number(selectedUser.follower_count || 0))}</div>
                <div><strong>城市：</strong>{selectedUser.city || "—"}</div>
                <div><strong>性别：</strong>{genderLabel(selectedUser.gender || "unknown")}</div>
                <div><strong>年龄：</strong>{inferAge(selectedUser.birth_year)}</div>
                <div><strong>邮箱：</strong>{selectedUser.email || "—"}</div>
                <div><strong>手机号：</strong>{selectedUser.phone || "—"}</div>
                <div><strong>联系地址：</strong>{selectedUser.contact_address || "—"}</div>
                <div><strong>机构/单位：</strong>{selectedUser.work_organization || "—"}</div>
                <div><strong>注册时间：</strong>{new Date(selectedUser.created_at).toLocaleString()}</div>
              </div>
            </aside>
          ) : null}
        </div>

        <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#7c6a56" }}>
            共 {payload?.pagination.total ?? 0} 条，当前第 {payload?.pagination.page ?? 1} / {payload?.pagination.totalPages ?? 1} 页
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="admin-btn"
              disabled={!payload || payload.pagination.page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              上一页
            </button>
            <button
              className="admin-btn"
              disabled={!payload || payload.pagination.page >= payload.pagination.totalPages}
              onClick={() => setPage((prev) => prev + 1)}
            >
              下一页
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
