"use client";

import { useEffect, useState } from "react";
import { apiRequest, AdminApiError } from "@/lib/api";
import { AdminAuditDrawer } from "@/components/admin-audit-drawer";

type IpApplicationItem = {
  id: string;
  creator_id: string;
  creator_name: string;
  source_type: string;
  source_id: string;
  status: string;
  materials?: Record<string, unknown> | null;
  review_note?: string | null;
  reviewed_at?: string | null;
  created_at: string;
};

type IpListResult = {
  items: IpApplicationItem[];
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
    approved: "已通过",
    rejected: "已驳回",
  };
  return map[status] || status;
}

function formatSourceType(sourceType: string): string {
  const map: Record<string, string> = {
    skill: "技能包",
    agent: "智能体",
  };
  return map[sourceType] || sourceType;
}

function formatAuditAction(action: string): string {
  const map: Record<string, string> = {
    ip_application_approve: "知产申请通过",
    ip_application_reject: "知产申请驳回",
  };
  return map[action] || action;
}

export default function IpReviewPage() {
  const [status, setStatus] = useState("pending");
  const [sourceType, setSourceType] = useState("all");
  const [rows, setRows] = useState<IpApplicationItem[]>([]);
  const [auditRows, setAuditRows] = useState<AuditItem[]>([]);
  const [reasonById, setReasonById] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeAudit, setActiveAudit] = useState<AuditItem | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({
        page: "1",
        pageSize: "30",
        status,
        source_type: sourceType,
      });
      const list = await apiRequest<IpListResult>(`/api/admin/ip-applications?${query.toString()}`);
      setRows(list.items || []);

      const audit = await apiRequest<{ items: AuditItem[] }>(
        "/api/admin/actions?target_type=ip_application&limit=15&include_snapshots=1"
      );
      setAuditRows(audit.items || []);
    } catch (err) {
      setRows([]);
      setAuditRows([]);
      setError(err instanceof AdminApiError ? err.message : "加载知产审核列表失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [status, sourceType]);

  async function review(id: string, action: "approve" | "reject") {
    const reason = (reasonById[id] || "").trim();
    if (!reason) {
      setError("审核理由必填");
      return;
    }
    setError(null);
    try {
      await apiRequest(`/api/admin/ip-applications/${encodeURIComponent(id)}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      await loadData();
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "提交审核失败");
    }
  }

  return (
    <div className="admin-grid" style={{ gap: 16 }}>
      <section className="admin-card">
        <h2 style={{ marginTop: 0, marginBottom: 12, fontSize: 18 }}>知产保护申请审核台</h2>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <select className="admin-select" value={status} onChange={(e) => setStatus(e.target.value)} style={{ maxWidth: 220 }}>
            <option value="pending">待审核</option>
            <option value="approved">已通过</option>
            <option value="rejected">已驳回</option>
            <option value="all">全部状态</option>
          </select>
          <select className="admin-select" value={sourceType} onChange={(e) => setSourceType(e.target.value)} style={{ maxWidth: 220 }}>
            <option value="all">全部类型</option>
            <option value="skill">技能包</option>
            <option value="agent">智能体</option>
          </select>
        </div>
        {error ? <div style={{ color: "#b63f2e", marginBottom: 10 }}>{error}</div> : null}
        {loading ? <div>加载中...</div> : null}

        <table className="admin-table">
          <thead>
            <tr>
              <th>创作者</th>
              <th>内容类型</th>
              <th>内容 ID</th>
              <th>状态</th>
              <th>提交时间</th>
              <th>审核</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.creator_name}</td>
                <td>{formatSourceType(row.source_type)}</td>
                <td>{row.source_id}</td>
                <td>{formatStatus(row.status)}</td>
                <td>{new Date(row.created_at).toLocaleString()}</td>
                <td>
                  <div className="admin-grid" style={{ gap: 6 }}>
                    <textarea
                      className="admin-textarea"
                      placeholder="审核理由（必填）"
                      rows={2}
                      value={reasonById[row.id] || ""}
                      onChange={(e) => setReasonById((prev) => ({ ...prev, [row.id]: e.target.value }))}
                    />
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="admin-btn" disabled={row.status !== "pending"} onClick={() => review(row.id, "approve")}>
                        通过
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
        <h3 style={{ marginTop: 0, marginBottom: 10 }}>最近知产审核动作</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>时间</th>
              <th>操作人</th>
              <th>动作</th>
              <th>目标</th>
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
                <td colSpan={6} style={{ color: "#7c6a56" }}>暂无审计记录</td>
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
