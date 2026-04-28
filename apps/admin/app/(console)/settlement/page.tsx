"use client";

import { useEffect, useState } from "react";
import { apiRequest, AdminApiError } from "@/lib/api";
import { AdminAuditDrawer } from "@/components/admin-audit-drawer";

type SettlementItem = {
  id: string;
  creator_name: string;
  source_type: string;
  net_amount: number;
  status: string;
  settlement_status: string;
  created_at: string;
  settlement_review_reason?: string;
};

type BatchReviewResult = {
  total: number;
  success: number;
  failed_count: number;
  failed: Array<{ id: string; reason: string }>;
};

type AdminSession = {
  role?: string;
};

type AdminActionItem = {
  id: string;
  action_type: string;
  reason: string;
  created_at: string;
  actor_name?: string | null;
  before_snapshot?: Record<string, unknown> | null;
  after_snapshot?: Record<string, unknown> | null;
};

function formatBusinessStatus(status: string): string {
  const map: Record<string, string> = {
    pending: "待处理",
    approved: "已通过",
    rejected: "已拒绝",
    paid: "已支付",
    completed: "已完成",
  };
  return map[status] || status;
}

function formatSettlementStatus(status: string): string {
  const map: Record<string, string> = {
    pending: "待结算",
    approved: "已结算通过",
    rejected: "已结算拒绝",
  };
  return map[status] || status;
}

function formatSourceType(type: string): string {
  const map: Record<string, string> = {
    skill: "技能包",
    agent: "智能体",
    consultation: "咨询服务",
    invitation: "邀约服务",
  };
  return map[type] || type;
}

function formatAuditAction(action: string): string {
  const map: Record<string, string> = {
    settlement_approve: "结算审批通过",
    settlement_reject: "结算审批拒绝",
  };
  return map[action] || action;
}

export default function SettlementReviewPage() {
  const [status, setStatus] = useState("pending");
  const [rows, setRows] = useState<SettlementItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [reasonById, setReasonById] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchReason, setBatchReason] = useState("");
  const [batchResult, setBatchResult] = useState<BatchReviewResult | null>(null);
  const [onlyActionable, setOnlyActionable] = useState(false);
  const [sessionRole, setSessionRole] = useState<string>("admin");
  const [settlementPolicy, setSettlementPolicy] = useState<{
    min_settle_amount: number;
    require_manual_review_above: number;
  }>({
    min_settle_amount: 1,
    require_manual_review_above: 10000,
  });
  const [actions, setActions] = useState<AdminActionItem[]>([]);
  const [activeAction, setActiveAction] = useState<AdminActionItem | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const me = await apiRequest<AdminSession>("/api/auth/me");
        setSessionRole(String(me?.role || "admin"));
      } catch {
        setSessionRole("admin");
      }
      try {
        const policies = await apiRequest<Record<string, Record<string, unknown>>>("/api/admin/policies");
        const settlement = policies.settlement || {};
        setSettlementPolicy({
          min_settle_amount: Number(settlement.min_settle_amount ?? 1),
          require_manual_review_above: Number(settlement.require_manual_review_above ?? 10000),
        });
      } catch {
        // keep default policy
      }
    })();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({ page: "1", pageSize: "30", status });
      const data = await apiRequest<{ items: SettlementItem[] }>(`/api/admin/settlements?${query.toString()}`);
      setRows(data.items || []);
      setSelectedIds([]);
      const actionData = await apiRequest<{ items: AdminActionItem[] }>(
        "/api/admin/actions?target_type=creator_earning&limit=10&include_snapshots=1"
      );
      setActions(actionData.items || []);
    } catch (err) {
      setRows([]);
      setError(err instanceof AdminApiError ? err.message : "加载结算列表失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [status]);

  async function review(id: string, action: "approve" | "reject") {
    const reason = (reasonById[id] || "").trim();
    if (!reason) {
      setError("审批理由必填");
      return;
    }
    try {
      await apiRequest(`/api/admin/settlements/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      await loadData();
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "审批失败");
    }
  }

  async function batchReview(action: "approve" | "reject") {
    const reason = batchReason.trim();
    if (!selectedIds.length) {
      setError("请至少选择一条记录");
      return;
    }
    if (!reason) {
      setError("批量审批理由必填");
      return;
    }
    try {
      const result = await apiRequest<BatchReviewResult>("/api/admin/settlements/batch-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, action, reason }),
      });
      setBatchResult(result);
      await loadData();
      setBatchReason("");
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "批量审批失败");
    }
  }

  function canApproveRow(row: SettlementItem): boolean {
    const amount = Number(row.net_amount || 0);
    if (row.settlement_status !== "pending") return false;
    if (amount < settlementPolicy.min_settle_amount) return false;
    if (amount > settlementPolicy.require_manual_review_above && sessionRole !== "superadmin") return false;
    return true;
  }

  const displayRows = onlyActionable ? rows.filter(canApproveRow) : rows;

  function escapeCsvCell(value: unknown): string {
    const raw = String(value ?? "");
    return `"${raw.replace(/"/g, '""')}"`;
  }

  function downloadCsv(filename: string, headers: string[], rowsData: Array<Array<unknown>>) {
    const csv =
      [headers.map(escapeCsvCell).join(","), ...rowsData.map((row) => row.map(escapeCsvCell).join(","))].join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportCurrentListCsv() {
    const headers = ["id", "creator_name", "source_type", "net_amount", "status", "settlement_status", "created_at"];
    const data = displayRows.map((row) => [
      row.id,
      row.creator_name,
      row.source_type,
      row.net_amount,
      row.status,
      row.settlement_status,
      row.created_at,
    ]);
    downloadCsv(`settlement-list-${Date.now()}.csv`, headers, data);
  }

  function exportBatchResultCsv() {
    if (!batchResult) return;
    const headers = ["total", "success", "failed_count", "failed_id", "failed_reason"];
    const data = batchResult.failed.length
      ? batchResult.failed.map((f) => [batchResult.total, batchResult.success, batchResult.failed_count, f.id, f.reason])
      : [[batchResult.total, batchResult.success, batchResult.failed_count, "", ""]];
    downloadCsv(`settlement-batch-result-${Date.now()}.csv`, headers, data);
  }


  return (
    <section className="admin-card">
      <h2 style={{ marginTop: 0, marginBottom: 12, fontSize: 18 }}>结算审批台</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <select className="admin-select" value={status} onChange={(e) => setStatus(e.target.value)} style={{ maxWidth: 260 }}>
          <option value="pending">待处理</option>
          <option value="approved">已通过</option>
          <option value="rejected">已拒绝</option>
          <option value="all">全部</option>
        </select>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
        <input
          className="admin-input"
          placeholder="批量审批理由"
          value={batchReason}
          onChange={(e) => setBatchReason(e.target.value)}
          style={{ maxWidth: 360 }}
        />
        <button className="admin-btn" onClick={() => batchReview("approve")}>批量通过</button>
        <button className="admin-btn" onClick={() => batchReview("reject")}>批量拒绝</button>
        <button className="admin-btn" onClick={exportCurrentListCsv}>导出当前列表 CSV</button>
        <button className="admin-btn" onClick={exportBatchResultCsv} disabled={!batchResult}>导出批量结果 CSV</button>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#7c6a56" }}>
          <input
            type="checkbox"
            checked={onlyActionable}
            onChange={(e) => setOnlyActionable(e.target.checked)}
          />
          仅显示待处理且可审批
        </label>
        <span style={{ fontSize: 12, color: "#7c6a56" }}>已选 {selectedIds.length} 条</span>
      </div>
      {error ? <div style={{ color: "#b63f2e", marginBottom: 10 }}>{error}</div> : null}
      {batchResult ? (
        <div className="admin-card" style={{ marginBottom: 12, padding: 12 }}>
          <div style={{ fontSize: 13, marginBottom: 6 }}>
            批量结果：共 {batchResult.total} 条，成功 {batchResult.success} 条，失败 {batchResult.failed_count} 条
          </div>
          {batchResult.failed.length ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>失败记录 ID</th>
                  <th>原因</th>
                </tr>
              </thead>
              <tbody>
                {batchResult.failed.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>
      ) : null}
      {loading ? <div>加载中...</div> : null}
      <table className="admin-table">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={rows.length > 0 && selectedIds.length === rows.length}
                onChange={(e) =>
                  setSelectedIds(e.target.checked ? displayRows.map((r) => r.id) : [])
                }
              />
            </th>
            <th>创作者</th>
            <th>来源</th>
            <th>净收入</th>
            <th>业务状态</th>
            <th>结算状态</th>
            <th>审批</th>
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row) => (
            <tr key={row.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(row.id)}
                  onChange={(e) =>
                    setSelectedIds((prev) =>
                      e.target.checked ? [...prev, row.id] : prev.filter((id) => id !== row.id)
                    )
                  }
                />
              </td>
              <td>{row.creator_name}</td>
              <td>{formatSourceType(row.source_type)}</td>
              <td>{Number(row.net_amount || 0).toFixed(2)}</td>
              <td>{formatBusinessStatus(row.status)}</td>
              <td>
                {formatSettlementStatus(row.settlement_status)}
                {row.settlement_status === "pending" && !canApproveRow(row) ? (
                  <span style={{ marginLeft: 6, color: "#b63f2e", fontSize: 12 }}>受策略限制</span>
                ) : null}
              </td>
              <td>
                <div className="admin-grid" style={{ gap: 6 }}>
                  <input
                    className="admin-input"
                    placeholder="审批理由"
                    value={reasonById[row.id] || ""}
                    onChange={(e) => setReasonById((prev) => ({ ...prev, [row.id]: e.target.value }))}
                  />
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="admin-btn" onClick={() => review(row.id, "approve")}>通过</button>
                    <button className="admin-btn" onClick={() => review(row.id, "reject")}>拒绝</button>
                  </div>
                </div>
              </td>
            </tr>
          ))}
          {!displayRows.length && !loading ? (
            <tr>
              <td colSpan={7} style={{ color: "#7c6a56" }}>暂无数据</td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <div style={{ marginTop: 16 }}>
        <h3 style={{ margin: "0 0 8px 0", fontSize: 15 }}>最近结算审批审计</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>时间</th>
              <th>动作</th>
              <th>操作人</th>
              <th>理由</th>
              <th>详情</th>
            </tr>
          </thead>
          <tbody>
            {actions.map((a) => (
              <tr key={a.id}>
                <td>{new Date(a.created_at).toLocaleString()}</td>
                <td>{formatAuditAction(a.action_type)}</td>
                <td>{a.actor_name || "—"}</td>
                <td>{a.reason || "—"}</td>
                <td>
                  <button className="admin-btn" onClick={() => setActiveAction(a)}>查看</button>
                </td>
              </tr>
            ))}
            {!actions.length ? (
              <tr>
                <td colSpan={5} style={{ color: "#7c6a56" }}>暂无审计记录</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <AdminAuditDrawer
        item={activeAction}
        onClose={() => setActiveAction(null)}
        title={activeAction ? `审计详情：${formatAuditAction(activeAction.action_type)}` : "审计详情"}
        diffBefore={activeAction?.before_snapshot || null}
        diffAfter={activeAction?.after_snapshot || null}
        rawBefore={activeAction?.before_snapshot || null}
        rawAfter={activeAction?.after_snapshot || null}
      />
    </section>
  );
}
