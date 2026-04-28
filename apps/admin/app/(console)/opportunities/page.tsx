"use client";

import { useEffect, useState } from "react";
import { apiRequest, AdminApiError } from "@/lib/api";
import { AdminAuditDrawer } from "@/components/admin-audit-drawer";

type OpportunityItem = {
  id: string;
  title: string;
  type: string;
  location: string | null;
  status: "active" | "pending" | "closed" | string;
  view_count: number;
  application_count: number;
  publisher_name: string | null;
  created_at: string;
};

type OpportunityListResult = {
  items: OpportunityItem[];
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
    active: "发布中",
    closed: "已下架",
    pending: "处理中",
  };
  return map[status] || status;
}

function formatType(type: string): string {
  const map: Record<string, string> = {
    job: "招聘",
    collaboration: "合作",
    project: "项目",
    service_offer: "服务",
  };
  return map[type] || type;
}

function formatAuditAction(action: string): string {
  const map: Record<string, string> = {
    opportunity_take_down: "岗位下架",
    opportunity_restore: "岗位恢复",
    opportunity_update: "岗位状态更新",
  };
  return map[action] || action;
}

export default function OpportunityModerationPage() {
  const [status, setStatus] = useState<"active" | "closed" | "pending" | "all">("active");
  const [rows, setRows] = useState<OpportunityItem[]>([]);
  const [reasonById, setReasonById] = useState<Record<string, string>>({});
  const [auditRows, setAuditRows] = useState<AuditItem[]>([]);
  const [activeAudit, setActiveAudit] = useState<AuditItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({
        page: "1",
        limit: "50",
      });
      if (status !== "all") query.set("status", status);

      const list = await apiRequest<OpportunityListResult>(`/api/admin/opportunities?${query.toString()}`);
      setRows(list.items || []);

      const audit = await apiRequest<{ items: AuditItem[] }>(
        "/api/admin/actions?target_type=opportunity&limit=20&include_snapshots=1"
      );
      setAuditRows(audit.items || []);
    } catch (err) {
      setRows([]);
      setAuditRows([]);
      setError(err instanceof AdminApiError ? err.message : "加载岗位处置数据失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [status]);

  async function moderate(id: string, next: "active" | "closed") {
    const reason = (reasonById[id] || "").trim();
    if (!reason) {
      setError("处置理由必填");
      return;
    }
    setError(null);
    try {
      await apiRequest(`/api/admin/opportunities/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: next,
          reason,
        }),
      });
      await loadData();
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "岗位处置失败");
    }
  }

  return (
    <div className="admin-grid" style={{ gap: 16 }}>
      <section className="admin-card">
        <h2 style={{ marginTop: 0, marginBottom: 12, fontSize: 18 }}>岗位处置台</h2>
        <p style={{ marginTop: 0, marginBottom: 12, fontSize: 12, color: "#7c6a56" }}>
          岗位发布无需后台预审；管理员可按平台规则执行下架/恢复，系统会自动通知岗位发布者。
        </p>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <select className="admin-select" value={status} onChange={(e) => setStatus(e.target.value as typeof status)} style={{ maxWidth: 220 }}>
            <option value="active">发布中</option>
            <option value="closed">已下架</option>
            <option value="pending">处理中（历史）</option>
            <option value="all">全部状态</option>
          </select>
        </div>
        {error ? <div style={{ color: "#b63f2e", marginBottom: 10 }}>{error}</div> : null}
        {loading ? <div>加载中...</div> : null}
        <table className="admin-table">
          <thead>
            <tr>
              <th>岗位</th>
              <th>类型</th>
              <th>发布者</th>
              <th>状态</th>
              <th>数据</th>
              <th>处置</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <div>{row.title}</div>
                  <div style={{ fontSize: 12, color: "#7c6a56" }}>{row.location || "—"}</div>
                </td>
                <td>{formatType(row.type)}</td>
                <td>{row.publisher_name || "—"}</td>
                <td>{formatStatus(row.status)}</td>
                <td>
                  <div style={{ fontSize: 12, color: "#7c6a56" }}>
                    浏览 {row.view_count} · 投递 {row.application_count}
                  </div>
                </td>
                <td>
                  <div className="admin-grid" style={{ gap: 6 }}>
                    <input
                      className="admin-input"
                      placeholder="处置理由（会写入通知）"
                      value={reasonById[row.id] || ""}
                      onChange={(e) => setReasonById((prev) => ({ ...prev, [row.id]: e.target.value }))}
                    />
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        className="admin-btn"
                        disabled={row.status !== "active"}
                        onClick={() => moderate(row.id, "closed")}
                      >
                        下架
                      </button>
                      <button
                        className="admin-btn"
                        disabled={row.status !== "closed"}
                        onClick={() => moderate(row.id, "active")}
                      >
                        恢复
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
        <h3 style={{ marginTop: 0, marginBottom: 10 }}>最近岗位处置动作</h3>
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

