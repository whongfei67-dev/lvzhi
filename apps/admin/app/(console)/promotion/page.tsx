"use client";

import { useEffect, useMemo, useState } from "react";
import { apiRequest, AdminApiError } from "@/lib/api";

type PromotionConfig = {
  inspiration_skill_ids: string[];
  lawyer_recommend_mode: "comprehensive" | "domain";
  lawyer_domain: string;
  lawyer_ids: string[];
  updated_at?: string;
  updated_by?: string;
};

type PromotionOptions = {
  skills: Array<{ id: string; title: string; category: string; status: string }>;
  lawyers: Array<{ id: string; display_name: string; city: string; specialty: string[] }>;
};

const LAWYER_DOMAIN_OPTIONS = [
  "合同法",
  "诉讼仲裁",
  "法律咨询",
  "知识产权",
  "劳动仲裁",
  "婚姻家事",
  "刑事辩护",
];

export default function PromotionConsolePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  const [options, setOptions] = useState<PromotionOptions>({ skills: [], lawyers: [] });
  const [config, setConfig] = useState<PromotionConfig>({
    inspiration_skill_ids: [],
    lawyer_recommend_mode: "comprehensive",
    lawyer_domain: "",
    lawyer_ids: [],
  });
  const [skillKeyword, setSkillKeyword] = useState("");
  const [lawyerKeyword, setLawyerKeyword] = useState("");

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [cfg, opts] = await Promise.all([
        apiRequest<PromotionConfig>("/api/admin/promotion-config"),
        apiRequest<PromotionOptions>("/api/admin/promotion-options"),
      ]);
      setConfig({
        inspiration_skill_ids: cfg.inspiration_skill_ids || [],
        lawyer_recommend_mode: cfg.lawyer_recommend_mode || "comprehensive",
        lawyer_domain: cfg.lawyer_domain || "",
        lawyer_ids: cfg.lawyer_ids || [],
      });
      setOptions(opts);
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "加载推广合作台失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const filteredSkills = useMemo(() => {
    const kw = skillKeyword.trim().toLowerCase();
    if (!kw) return options.skills;
    return options.skills.filter((item) => item.title.toLowerCase().includes(kw) || item.category.toLowerCase().includes(kw));
  }, [options.skills, skillKeyword]);

  const filteredLawyers = useMemo(() => {
    const kw = lawyerKeyword.trim().toLowerCase();
    if (!kw) return options.lawyers;
    return options.lawyers.filter((item) => item.display_name.toLowerCase().includes(kw) || item.city.toLowerCase().includes(kw) || item.specialty.join(" ").toLowerCase().includes(kw));
  }, [options.lawyers, lawyerKeyword]);

  function toggleSkill(id: string) {
    setConfig((prev) => {
      const exists = prev.inspiration_skill_ids.includes(id);
      return {
        ...prev,
        inspiration_skill_ids: exists
          ? prev.inspiration_skill_ids.filter((item) => item !== id)
          : [...prev.inspiration_skill_ids, id],
      };
    });
  }

  function toggleLawyer(id: string) {
    setConfig((prev) => {
      const exists = prev.lawyer_ids.includes(id);
      return {
        ...prev,
        lawyer_ids: exists
          ? prev.lawyer_ids.filter((item) => item !== id)
          : [...prev.lawyer_ids, id],
      };
    });
  }

  async function saveConfig() {
    setSaving(true);
    setError(null);
    setHint(null);
    try {
      await apiRequest<PromotionConfig>("/api/admin/promotion-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      setHint("推广合作配置已保存，并将映射到灵感广场与找律师推荐位。");
      await loadData();
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "保存推广配置失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-grid" style={{ gap: 16 }}>
      <section className="admin-card">
        <h2 style={{ marginTop: 0, marginBottom: 10, fontSize: 18 }}>推广合作台</h2>
        <p style={{ marginTop: 0, color: "#7c6a56", fontSize: 13 }}>
          可将灵感广场技能包映射到推荐页，也可选择认证执业律师映射到“找律师”综合榜单或具体领域榜单。
        </p>
        {error ? <div style={{ color: "#b63f2e", marginBottom: 10 }}>{error}</div> : null}
        {hint ? <div style={{ color: "#5c4033", marginBottom: 10 }}>{hint}</div> : null}
      </section>

      <section className="admin-card" style={{ display: "grid", gap: 12 }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>映射策略</h3>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, color: "#7c6a56" }}>律师推荐策略</span>
            <select
              className="admin-select"
              value={config.lawyer_recommend_mode}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, lawyer_recommend_mode: e.target.value === "domain" ? "domain" : "comprehensive" }))
              }
            >
              <option value="comprehensive">映射到找律师综合推荐榜单</option>
              <option value="domain">映射到指定领域榜单页</option>
            </select>
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, color: "#7c6a56" }}>指定榜单领域（可选）</span>
            <select
              className="admin-select"
              value={config.lawyer_domain || ""}
              onChange={(e) => setConfig((prev) => ({ ...prev, lawyer_domain: e.target.value }))}
              disabled={config.lawyer_recommend_mode !== "domain"}
            >
              <option value="">请选择领域</option>
              {LAWYER_DOMAIN_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="admin-card" style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>灵感广场技能包推荐映射</h3>
          <input
            className="admin-input"
            placeholder="搜索技能标题/分类"
            value={skillKeyword}
            onChange={(e) => setSkillKeyword(e.target.value)}
            style={{ maxWidth: 300 }}
          />
        </div>
        <div style={{ fontSize: 12, color: "#7c6a56" }}>已选 {config.inspiration_skill_ids.length} 个技能包</div>
        <div style={{ display: "grid", gap: 8, maxHeight: 320, overflow: "auto" }}>
          {loading ? <div>加载中...</div> : null}
          {!loading &&
            filteredSkills.map((item) => {
              const checked = config.inspiration_skill_ids.includes(item.id);
              return (
                <label key={item.id} style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid rgba(212,165,116,0.2)", borderRadius: 10, padding: "8px 10px" }}>
                  <input type="checkbox" checked={checked} onChange={() => toggleSkill(item.id)} />
                  <span style={{ flex: 1 }}>
                    <span style={{ color: "#2c2416" }}>{item.title}</span>
                    <span style={{ color: "#7c6a56", fontSize: 12 }}>（{item.category}）</span>
                  </span>
                </label>
              );
            })}
          {!loading && !filteredSkills.length ? <div style={{ color: "#7c6a56" }}>暂无技能候选</div> : null}
        </div>
      </section>

      <section className="admin-card" style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>推广律师映射（认证执业律师）</h3>
          <input
            className="admin-input"
            placeholder="搜索律师/城市/领域"
            value={lawyerKeyword}
            onChange={(e) => setLawyerKeyword(e.target.value)}
            style={{ maxWidth: 300 }}
          />
        </div>
        <div style={{ fontSize: 12, color: "#7c6a56" }}>已选 {config.lawyer_ids.length} 位律师</div>
        <div style={{ display: "grid", gap: 8, maxHeight: 320, overflow: "auto" }}>
          {loading ? <div>加载中...</div> : null}
          {!loading &&
            filteredLawyers.map((item) => {
              const checked = config.lawyer_ids.includes(item.id);
              return (
                <label key={item.id} style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid rgba(212,165,116,0.2)", borderRadius: 10, padding: "8px 10px" }}>
                  <input type="checkbox" checked={checked} onChange={() => toggleLawyer(item.id)} />
                  <span style={{ flex: 1 }}>
                    <span style={{ color: "#2c2416" }}>{item.display_name}</span>
                    <span style={{ color: "#7c6a56", fontSize: 12 }}>（{item.city} · {item.specialty.join(" / ") || "未填写领域"}）</span>
                  </span>
                </label>
              );
            })}
          {!loading && !filteredLawyers.length ? <div style={{ color: "#7c6a56" }}>暂无律师候选</div> : null}
        </div>
      </section>

      <section className="admin-card" style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button
          className="admin-btn"
          onClick={() => loadData()}
          disabled={saving}
        >
          重新加载
        </button>
        <button
          className="admin-btn"
          onClick={() => saveConfig()}
          disabled={saving}
        >
          {saving ? "保存中..." : "保存并映射"}
        </button>
      </section>
    </div>
  );
}

