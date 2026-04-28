"use client";

import { useEffect, useState } from "react";
import { apiRequest, AdminApiError } from "@/lib/api";
import { AdminAuditDrawer } from "@/components/admin-audit-drawer";

type WithdrawalItem = {
  id: string;
  user_name: string;
  amount: number;
  fee: number;
  actual_amount: number;
  account_type: string;
  account: string;
  account_name: string;
  status: string;
  created_at: string;
  processed_at?: string;
  review_reason?: string;
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

function formatWithdrawStatus(status: string): string {
  const map: Record<string, string> = {
    pending: "待处理",
    approved: "已通过",
    rejected: "已拒绝",
  };
  return map[status] || status;
}

function formatAccountType(type: string): string {
  const map: Record<string, string> = {
    alipay: "支付宝",
    bank: "银行卡",
  };
  return map[type] || type;
}

function formatAuditAction(action: string): string {
  const map: Record<string, string> = {
    withdraw_approve: "提现审批通过",
    withdraw_reject: "提现审批拒绝",
  };
  return map[action] || action;
}

export default function WithdrawReviewPage() {
  const [status, setStatus] = useState("pending");
  const [rows, setRows] = useState<WithdrawalItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [reasonById, setReasonById] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchReason, setBatchReason] = useState("");
  const [batchResult, setBatchResult] = useState<BatchReviewResult | null>(null);
  const [onlyActionable, setOnlyActionable] = useState(false);
  const [sessionRole, setSessionRole] = useState<string>("admin");
  const [withdrawPolicy, setWithdrawPolicy] = useState<{
    min_amount: number;
    max_amount: number;
    require_superadmin_above: number;
  }>({
    min_amount: 10,
    max_amount: 50000,
    require_superadmin_above: 20000,
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
        const withdraw = policies.withdraw || {};
        setWithdrawPolicy({
          min_amount: Number(withdraw.min_amount ?? 10),
          max_amount: Number(withdraw.max_amount ?? 50000),
          require_superadmin_above: Number(withdraw.require_superadmin_above ?? 20000),
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
      const data = await apiRequest<{ items: WithdrawalItem[] }>(`/api/admin/withdrawals?${query.toString()}`);
      setRows(data.items || []);
      setSelectedIds([]);
      const actionData = await apiRequest<{ items: AdminActionItem[] }>(
        "/api/admin/actions?target_type=withdraw_request&limit=10&include_snapshots=1"
      );
      setActions(actionData.items || []);
    } catch (err) {
      setRows([]);
      setError(err instanceof AdminApiError ? err.message : "加载提现审批列表失败");
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
      await apiRequest(`/api/admin/withdrawals/${encodeURIComponent(id)}`, {
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
      const result = await apiRequest<BatchReviewResult>("/api/admin/withdrawals/batch-review", {
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

  function canApproveRow(row: WithdrawalItem): boolean {
    const amount = Number(row.amount || 0);
    if (row.status !== "pending") return false;
    if (amount < withdrawPolicy.min_amount) return false;
    if (amount > withdrawPolicy.max_amount) return false;
    if (amount > withdrawPolicy.require_superadmin_above && sessionRole !== "superadmin") return false;
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
    const headers = ["id", "user_name", "amount", "actual_amount", "account_type", "status", "created_at", "review_reason"];
    const data = displayRows.map((row) => [
      row.id,
      row.user_name,
      row.amount,
      row.actual_amount,
      row.account_type,
      row.status,
      row.created_at,
      row.review_reason || "",
    ]);
    downloadCsv(`withdraw-list-${Date.now()}.csv`, headers, data);
  }

  function exportBatchResultCsv() {
    if (!batchResult) return;
    const headers = ["total", "success", "failed_count", "failed_id", "failed_reason"];
    const data = batchResult.failed.length
      ? batchResult.failed.map((f) => [batchResult.total, batchResult.success, batchResult.failed_count, f.id, f.reason])
      : [[batchResult.total, batchResult.success, batchResult.failed_count, "", ""]];
    downloadCsv(`withdraw-batch-result-${Date.now()}.csv`, headers, data);
  }


  return (
    <section className="admin-card">
      <h2 style={{ marginTop: 0, marginBottom: 12, fontSize: 18 }}>提现审批台</h2>
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
            <th>申请人</th>
            <th>金额</th>
            <th>到账</th>
            <th>账户</th>
            <th>状态</th>
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
              <td>{row.user_name}</td>
              <td>{Number(row.amount || 0).toFixed(2)}</td>
              <td>{Number(row.actual_amount || 0).toFixed(2)}</td>
              <td>{formatAccountType(row.account_type)} / {row.account_name || row.account}</td>
              <td>
                {formatWithdrawStatus(row.status)}
                {row.status === "pending" && !canApproveRow(row) ? (
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
        <h3 style={{ margin: "0 0 8px 0", fontSize: 15 }}>最近提现审批审计</h3>
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
