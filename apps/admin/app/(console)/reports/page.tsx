"use client";

import { useEffect, useState } from "react";
import { apiRequest, AdminApiError } from "@/lib/api";
import { AdminAuditDrawer } from "@/components/admin-audit-drawer";

type ReportItem = {
  id: string;
  reporter_id: string;
  reporter_name: string;
  target_type: string;
  target_id: string;
  reason: string;
  detail?: string | null;
  status: string;
  disposition?: string | null;
  review_note?: string | null;
  reviewed_at?: string | null;
  created_at: string;
};

type PenaltyDuration = "none" | "48h" | "7d" | "6m" | "permanent";
type PenaltyScope = "full" | "trade_and_mute" | "ranking_only";

type ReportListResult = {
  items: ReportItem[];
  total: number;
  page: number;
  pageSize: number;
};

type AuditItem = {
  id: string;
  action_type: string;
  target_id: string;
  reason: string | null;
  created_at: string;
  actor_name: string | null;
  before_snapshot?: Record<string, unknown> | null;
  after_snapshot?: Record<string, unknown> | null;
};

function formatStatus(status: string): string {
  const map: Record<string, string> = {
    pending: "待审核",
    resolved: "已采纳",
    rejected: "已驳回",
  };
  return map[status] || status;
}

function formatTargetType(targetType: string): string {
  const map: Record<string, string> = {
    community_post: "社区帖子",
    community_comment: "社区评论",
    skill: "技能包",
    agent: "智能体",
    creator_profile: "创作者主页",
  };
  return map[targetType] || targetType;
}

function formatDisposition(disposition?: string | null): string {
  const map: Record<string, string> = {
    none: "不联动处置",
    take_down: "下架",
    delete: "删除",
  };
  return map[String(disposition || "")] || "—";
}

function formatAuditAction(action: string): string {
  const map: Record<string, string> = {
    report_resolve: "举报采纳",
    report_reject: "举报驳回",
  };
  return map[action] || action;
}

export default function ReportsReviewPage() {
  const [status, setStatus] = useState("pending");
  const [targetType, setTargetType] = useState("all");
  const [rows, setRows] = useState<ReportItem[]>([]);
  const [auditRows, setAuditRows] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reasonById, setReasonById] = useState<Record<string, string>>({});
  const [dispositionById, setDispositionById] = useState<Record<string, "none" | "take_down" | "delete">>({});
  const [penaltyDurationById, setPenaltyDurationById] = useState<Record<string, PenaltyDuration>>({});
  const [penaltyScopeById, setPenaltyScopeById] = useState<Record<string, PenaltyScope>>({});
  const [activeAudit, setActiveAudit] = useState<AuditItem | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({
        page: "1",
        pageSize: "30",
        status,
        target_type: targetType,
      });
      const list = await apiRequest<ReportListResult>(`/api/admin/reports?${query.toString()}`);
      setRows(list.items || []);
      const audit = await apiRequest<{ items: AuditItem[] }>(
        "/api/admin/actions?target_type=user_report&limit=15&include_snapshots=1"
      );
      setAuditRows(audit.items || []);
    } catch (err) {
      setRows([]);
      setAuditRows([]);
      setError(err instanceof AdminApiError ? err.message : "加载举报审核列表失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [status, targetType]);

  async function review(id: string, action: "approve" | "reject") {
    const reason = (reasonById[id] || "").trim();
    if (!reason) {
      setError("审核理由必填");
      return;
    }
    const disposition = dispositionById[id] || "none";
    const penaltyDuration = penaltyDurationById[id] || "none";
    const penaltyScope = penaltyScopeById[id] || "full";
    try {
      await apiRequest(`/api/admin/reports/${encodeURIComponent(id)}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reason,
          disposition,
          penalty_duration: penaltyDuration,
          penalty_scope: penaltyScope,
        }),
      });
      await loadData();
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "提交审核失败");
    }
  }

  return (
    <div className="admin-grid" style={{ gap: 16 }}>
      <section className="admin-card">
        <h2 style={{ marginTop: 0, marginBottom: 12, fontSize: 18 }}>用户举报审核台</h2>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <select className="admin-select" value={status} onChange={(e) => setStatus(e.target.value)} style={{ maxWidth: 220 }}>
            <option value="pending">待审核</option>
            <option value="resolved">已采纳</option>
            <option value="rejected">已驳回</option>
            <option value="all">全部状态</option>
          </select>
          <select className="admin-select" value={targetType} onChange={(e) => setTargetType(e.target.value)} style={{ maxWidth: 220 }}>
            <option value="all">全部目标</option>
            <option value="community_post">社区帖子</option>
            <option value="community_comment">社区评论</option>
            <option value="skill">技能包</option>
            <option value="agent">智能体</option>
            <option value="creator_profile">创作者主页</option>
          </select>
        </div>
        {error ? <div style={{ color: "#b63f2e", marginBottom: 10 }}>{error}</div> : null}
        {loading ? <div>加载中...</div> : null}

        <table className="admin-table">
          <thead>
            <tr>
              <th>举报人</th>
              <th>目标类型</th>
              <th>目标 ID</th>
              <th>举报理由</th>
              <th>状态</th>
              <th>审核</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.reporter_name}</td>
                <td>{formatTargetType(row.target_type)}</td>
                <td>{row.target_id}</td>
                <td>
                  <div style={{ maxWidth: 260 }}>
                    <div>{row.reason}</div>
                    {row.detail ? <div style={{ marginTop: 4, color: "#7c6a56", fontSize: 12 }}>{row.detail}</div> : null}
                  </div>
                </td>
                <td>{formatStatus(row.status)}</td>
                <td>
                  <div className="admin-grid" style={{ gap: 6 }}>
                    <textarea
                      className="admin-textarea"
                      placeholder="审核理由（必填）"
                      rows={2}
                      value={reasonById[row.id] || ""}
                      onChange={(e) => setReasonById((prev) => ({ ...prev, [row.id]: e.target.value }))}
                    />
                    <select
                      className="admin-select"
                      value={dispositionById[row.id] || "none"}
                      onChange={(e) =>
                        setDispositionById((prev) => ({
                          ...prev,
                          [row.id]: e.target.value as "none" | "take_down" | "delete",
                        }))
                      }
                      disabled={row.target_type !== "community_post"}
                    >
                      <option value="none">不联动处置</option>
                      <option value="take_down">联动下架帖子</option>
                      <option value="delete">联动删除帖子</option>
                    </select>
                    <select
                      className="admin-select"
                      value={penaltyDurationById[row.id] || "none"}
                      onChange={(e) =>
                        setPenaltyDurationById((prev) => ({
                          ...prev,
                          [row.id]: e.target.value as PenaltyDuration,
                        }))
                      }
                    >
                      <option value="none">不追加处罚</option>
                      <option value="48h">处罚 48 小时</option>
                      <option value="7d">处罚 7 天</option>
                      <option value="6m">处罚 6 个月</option>
                      <option value="permanent">永久处罚</option>
                    </select>
                    <select
                      className="admin-select"
                      value={penaltyScopeById[row.id] || "full"}
                      onChange={(e) =>
                        setPenaltyScopeById((prev) => ({
                          ...prev,
                          [row.id]: e.target.value as PenaltyScope,
                        }))
                      }
                      disabled={(penaltyDurationById[row.id] || "none") === "none"}
                    >
                      <option value="full">全量处罚（禁言+限购下载+移出榜单）</option>
                      <option value="trade_and_mute">社区与交易处罚（禁言+限购下载）</option>
                      <option value="ranking_only">榜单处罚（移出排行/推荐）</option>
                    </select>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="admin-btn" disabled={row.status !== "pending"} onClick={() => review(row.id, "approve")}>
                        采纳
                      </button>
                      <button className="admin-btn" disabled={row.status !== "pending"} onClick={() => review(row.id, "reject")}>
                        驳回
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length && !loading ? (
              <tr>
                <td colSpan={6} style={{ color: "#7c6a56" }}>暂无数据</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      <section className="admin-card">
        <h3 style={{ marginTop: 0, marginBottom: 10 }}>最近举报审核动作</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>时间</th>
              <th>操作人</th>
              <th>动作</th>
              <th>目标</th>
              <th>处置</th>
              <th>理由</th>
              <th>详情</th>
            </tr>
          </thead>
          <tbody>
            {auditRows.map((row) => (
              <tr key={row.id}>
                <td>{new Date(row.created_at).toLocaleString()}</td>
                <td>{row.actor_name || "—"}</td>
                <td>{formatAuditAction(row.action_type)}</td>
                <td>{row.target_id}</td>
                <td>{formatDisposition((row.after_snapshot?.disposition as string) || null)}</td>
                <td>{row.reason || "—"}</td>
                <td>
                  <button className="admin-btn" onClick={() => setActiveAudit(row)}>
                    查看
                  </button>
                </td>
              </tr>
            ))}
            {!auditRows.length ? (
              <tr>
                <td colSpan={7} style={{ color: "#7c6a56" }}>暂无审计记录</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      <AdminAuditDrawer
        item={activeAudit}
        onClose={() => setActiveAudit(null)}
        title={activeAudit ? `审计详情：${formatAuditAction(activeAudit.action_type)}` : "审计详情"}
        diffBefore={activeAudit?.before_snapshot || null}
        diffAfter={activeAudit?.after_snapshot || null}
        rawBefore={activeAudit?.before_snapshot || null}
        rawAfter={activeAudit?.after_snapshot || null}
      />
    </div>
  );
}
