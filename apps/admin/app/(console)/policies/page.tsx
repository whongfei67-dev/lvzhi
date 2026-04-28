"use client";

import { useEffect, useState } from "react";
import { apiRequest, AdminApiError } from "@/lib/api";
import { AdminAuditDrawer } from "@/components/admin-audit-drawer";

type PolicyPayload = Record<string, Record<string, unknown>>;
type PolicyHistoryItem = {
  id: string;
  action_type: string;
  reason: string;
  before_snapshot?: Record<string, unknown> | null;
  after_snapshot?: Record<string, unknown> | null;
  created_at: string;
  actor_name?: string | null;
};

function formatPolicyAction(action: string): string {
  const map: Record<string, string> = {
    policy_update: "策略更新",
    policy_rollback: "策略回滚",
  };
  return map[action] || action;
}

export default function PolicyConfigPage() {
  const [policies, setPolicies] = useState<PolicyPayload>({});
  const [historyByGroup, setHistoryByGroup] = useState<Record<string, PolicyHistoryItem[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeHistory, setActiveHistory] = useState<PolicyHistoryItem | null>(null);

  async function loadPolicies() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<PolicyPayload>("/api/admin/policies");
      setPolicies(data || {});
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "加载策略失败");
      setPolicies({});
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPolicies();
  }, []);

  useEffect(() => {
    const keys = Object.keys(policies);
    if (!keys.length) return;
    keys.forEach((key) => {
      if (!historyByGroup[key]) {
        void loadHistory(key);
      }
    });
  }, [policies, historyByGroup]);

  async function loadHistory(group: string) {
    try {
      const query = new URLSearchParams({ key: group, limit: "10" });
      const data = await apiRequest<{ items: PolicyHistoryItem[] }>(`/api/admin/policies/history?${query.toString()}`);
      setHistoryByGroup((prev) => ({ ...prev, [group]: data.items || [] }));
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "加载策略历史失败");
    }
  }

  function updateField(group: string, key: string, value: string) {
    setPolicies((prev) => ({
      ...prev,
      [group]: {
        ...(prev[group] || {}),
        [key]: value === "" ? "" : Number.isNaN(Number(value)) ? value : Number(value),
      },
    }));
  }

  async function saveGroup(group: string) {
    const r = reason.trim();
    if (!r) {
      setError("保存策略前请填写变更理由");
      return;
    }
    try {
      await apiRequest(`/api/admin/policies/${encodeURIComponent(group)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: policies[group] || {}, reason: r }),
      });
      setError(null);
      await loadPolicies();
      await loadHistory(group);
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "保存策略失败");
    }
  }

  async function rollback(group: string, actionId: string) {
    const r = reason.trim();
    if (!r) {
      setError("回滚前请填写变更理由");
      return;
    }
    try {
      await apiRequest(`/api/admin/policies/${encodeURIComponent(group)}/rollback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action_id: actionId, reason: r }),
      });
      setError(null);
      await loadPolicies();
      await loadHistory(group);
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "回滚失败");
    }
  }

  function computeDiffLines(item: PolicyHistoryItem): string[] {
    const beforeConfig = (item.before_snapshot?.config || {}) as Record<string, unknown>;
    const afterConfig = (item.after_snapshot?.config || {}) as Record<string, unknown>;
    const keys = Array.from(new Set([...Object.keys(beforeConfig), ...Object.keys(afterConfig)]));
    return keys
      .filter((k) => JSON.stringify(beforeConfig[k]) !== JSON.stringify(afterConfig[k]))
      .map((k) => `${k}: ${JSON.stringify(beforeConfig[k] ?? null)} -> ${JSON.stringify(afterConfig[k] ?? null)}`);
  }


  return (
    <div className="admin-grid" style={{ gap: 16 }}>
      <section className="admin-card">
        <h2 style={{ marginTop: 0, marginBottom: 12, fontSize: 18 }}>策略配置（仅超管可写）</h2>
        <p style={{ marginTop: 0, color: "#7c6a56", fontSize: 13 }}>
          管理员可查看策略，超管可更新并写入审计日志。
        </p>
        <input
          className="admin-input"
          placeholder="本次变更理由（保存时必填）"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          style={{ marginBottom: 10 }}
        />
        {error ? <div style={{ color: "#b63f2e", marginBottom: 10 }}>{error}</div> : null}
        {loading ? <div>加载中...</div> : null}
      </section>

      {Object.entries(policies).map(([group, config]) => (
        <section key={group} className="admin-card">
          <h3 style={{ marginTop: 0, marginBottom: 10 }}>{group} 策略</h3>
          <div className="admin-grid cols-2">
            {Object.entries(config || {}).map(([key, value]) => (
              <label key={key} style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, color: "#7c6a56" }}>{key}</span>
                <input
                  className="admin-input"
                  value={String(value ?? "")}
                  onChange={(e) => updateField(group, key, e.target.value)}
                />
              </label>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <button className="admin-btn primary" onClick={() => saveGroup(group)}>
              保存 {group}
            </button>
            <button className="admin-btn" style={{ marginLeft: 8 }} onClick={() => void loadHistory(group)}>
              刷新历史
            </button>
          </div>

          <div style={{ marginTop: 14 }}>
            <h4 style={{ margin: "0 0 8px 0", fontSize: 14 }}>最近变更历史</h4>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>时间</th>
                  <th>动作</th>
                  <th>操作人</th>
                  <th>理由</th>
                  <th>详情</th>
                  <th>回滚</th>
                </tr>
              </thead>
              <tbody>
                {(historyByGroup[group] || []).map((item) => (
                  <tr key={item.id}>
                    <td>{new Date(item.created_at).toLocaleString()}</td>
                    <td>{formatPolicyAction(item.action_type)}</td>
                    <td>{item.actor_name || "—"}</td>
                    <td>{item.reason || "—"}</td>
                    <td>
                      <button className="admin-btn" onClick={() => setActiveHistory(item)}>
                        查看
                      </button>
                    </td>
                    <td>
                      <button className="admin-btn" onClick={() => rollback(group, item.id)}>
                        回滚到该版本前
                      </button>
                    </td>
                  </tr>
                ))}
                {!historyByGroup[group]?.length ? (
                  <tr>
                    <td colSpan={6} style={{ color: "#7c6a56" }}>暂无历史记录</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <AdminAuditDrawer
        item={activeHistory}
        onClose={() => setActiveHistory(null)}
        title={activeHistory ? `策略审计详情：${formatPolicyAction(activeHistory.action_type)}` : "策略审计详情"}
        diffBefore={activeHistory?.before_snapshot?.config || null}
        diffAfter={activeHistory?.after_snapshot?.config || null}
        rawBefore={activeHistory?.before_snapshot || null}
        rawAfter={activeHistory?.after_snapshot || null}
        diffHeading="高亮对比"
        extraSection={
          activeHistory ? (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>差异明细</div>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {computeDiffLines(activeHistory).length ? (
                  computeDiffLines(activeHistory).map((line) => <li key={line} style={{ fontSize: 12 }}>{line}</li>)
                ) : (
                  <li style={{ fontSize: 12 }}>无字段变化</li>
                )}
              </ul>
            </div>
          ) : null
        }
      />
    </div>
  );
}
