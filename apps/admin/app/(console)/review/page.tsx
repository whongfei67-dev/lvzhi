"use client";

import { useEffect, useState } from "react";
import { apiRequest, AdminApiError } from "@/lib/api";
import { AdminAuditDrawer } from "@/components/admin-audit-drawer";

type ReviewItem = {
  id: string;
  title: string;
  status: string;
  risk_level: string;
  created_at: string;
  author_name: string;
  like_count: number;
  comment_count: number;
};

type ReviewResult = {
  items: ReviewItem[];
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

type BatchReviewResult = {
  total: number;
  success: number;
  failed_count: number;
  failed: Array<{ id: string; reason: string }>;
};

function formatReviewStatus(status: string): string {
  const map: Record<string, string> = {
    pending: "待审核",
    published: "已发布",
    hidden: "已下架",
    deleted: "已删除",
  };
  return map[status] || status;
}

function formatRiskLevel(level: string): string {
  const map: Record<string, string> = {
    low: "低风险",
    medium: "中风险",
    high: "高风险",
  };
  return map[level] || level;
}

function formatAuditAction(action: string): string {
  const map: Record<string, string> = {
    community_approve: "社区审核通过",
    community_take_down: "社区内容下架",
    community_restore: "社区内容恢复",
    community_delete: "社区内容删除",
  };
  return map[action] || action;
}

export default function ReviewConsolePage() {
  const [status, setStatus] = useState("pending");
  const [riskLevel, setRiskLevel] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<ReviewItem[]>([]);
  const [auditRows, setAuditRows] = useState<AuditItem[]>([]);
  const [reasonByPost, setReasonByPost] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchAction, setBatchAction] = useState<"approve" | "take_down" | "restore" | "delete">("approve");
  const [batchReason, setBatchReason] = useState("");
  const [batchResult, setBatchResult] = useState<BatchReviewResult | null>(null);
  const [activeAudit, setActiveAudit] = useState<AuditItem | null>(null);
  const [onlyActionable, setOnlyActionable] = useState(true);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const search = new URLSearchParams({
        page: "1",
        pageSize: "30",
        status,
      });
      if (riskLevel !== "all") {
        search.set("risk_level", riskLevel);
      }

      const review = await apiRequest<ReviewResult>(`/api/admin/community/posts?${search.toString()}`);
      setRows(review.items || []);
      setSelectedIds([]);

      const audit = await apiRequest<{ items: AuditItem[] }>(
        "/api/admin/actions?target_type=community_post&limit=15&include_snapshots=1"
      );
      setAuditRows(audit.items || []);
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "加载审核数据失败");
      setRows([]);
      setAuditRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [status, riskLevel]);

  async function moderate(postId: string, action: "approve" | "take_down" | "restore" | "delete") {
    const reason = (reasonByPost[postId] || "").trim();
    if (!reason) {
      setError("处置理由必填");
      return;
    }
    setError(null);
    try {
      await apiRequest(`/api/admin/community/posts/${encodeURIComponent(postId)}/moderate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      await loadData();
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "提交处置失败");
    }
  }

  async function batchModerate(action: "approve" | "take_down" | "restore" | "delete") {
    const reason = batchReason.trim();
    const actionableIds = selectedIds.filter((id) => {
      const row = rows.find((item) => item.id === id);
      return row ? canBatchAction(row, action) : false;
    });
    if (!actionableIds.length) {
      setError("请至少选择一条帖子");
      return;
    }
    if (!reason) {
      setError("批量处置理由必填");
      return;
    }
    try {
      const result = await apiRequest<BatchReviewResult>("/api/admin/community/posts/batch-moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: actionableIds, action, reason }),
      });
      setBatchResult({
        ...result,
        failed: result.failed.map((item) => ({ ...item, reason: normalizeBatchFailReason(item.reason) })),
      });
      await loadData();
      setBatchReason("");
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "批量处置失败");
    }
  }

  function escapeCsvCell(value: unknown): string {
    const raw = String(value ?? "");
    return `"${raw.replace(/"/g, '""')}"`;
  }

  function canBatchAction(row: ReviewItem, action: "approve" | "take_down" | "restore" | "delete"): boolean {
    if (action === "approve") return row.status === "pending";
    if (action === "take_down") return row.status === "published";
    if (action === "restore") return row.status === "hidden";
    if (action === "delete") return row.status !== "deleted";
    return false;
  }

  function normalizeBatchFailReason(reason: string): string {
    const raw = String(reason || "").toLowerCase();
    if (!raw) return "未知错误";
    if (raw.includes("not found")) return "记录不存在";
    if (raw.includes("already processed")) return "记录已处理";
    if (raw.includes("permission") || raw.includes("forbidden")) return "无权限执行该操作";
    if (raw.includes("invalid")) return "参数不合法";
    if (raw.includes("required")) return "缺少必填参数";
    if (raw.includes("unknown error")) return "未知错误";
    return reason;
  }

  const displayRows = onlyActionable ? rows.filter((row) => canBatchAction(row, batchAction)) : rows;
  const actionableDisplayRows = displayRows.filter((row) => canBatchAction(row, batchAction));

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
    const headers = ["id", "title", "author_name", "status", "risk_level", "like_count", "comment_count", "created_at"];
    const data = displayRows.map((row) => [
      row.id,
      row.title,
      row.author_name,
      row.status,
      row.risk_level,
      row.like_count,
      row.comment_count,
      row.created_at,
    ]);
    downloadCsv(`community-review-list-${Date.now()}.csv`, headers, data);
  }

  function exportBatchResultCsv() {
    if (!batchResult) return;
    const headers = ["total", "success", "failed_count", "failed_id", "failed_reason"];
    const data = batchResult.failed.length
      ? batchResult.failed.map((f) => [batchResult.total, batchResult.success, batchResult.failed_count, f.id, f.reason])
      : [[batchResult.total, batchResult.success, batchResult.failed_count, "", ""]];
    downloadCsv(`community-review-batch-result-${Date.now()}.csv`, headers, data);
  }

  return (
    <div className="admin-grid" style={{ gap: 16 }}>
      <section className="admin-card">
        <h2 style={{ marginTop: 0, marginBottom: 12, fontSize: 18 }}>社区审核台</h2>
        <div className="admin-grid cols-2" style={{ marginBottom: 12 }}>
          <select className="admin-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="pending">待审核</option>
            <option value="published">已发布</option>
            <option value="hidden">已下架</option>
            <option value="deleted">已删除</option>
          </select>
          <select className="admin-select" value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)}>
            <option value="all">全部风险级别</option>
            <option value="low">低风险</option>
            <option value="medium">中风险</option>
            <option value="high">高风险</option>
          </select>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
          <select
            className="admin-select"
            value={batchAction}
            onChange={(e) => {
              const next = e.target.value as "approve" | "take_down" | "restore" | "delete";
              setBatchAction(next);
              setSelectedIds((prev) => prev.filter((id) => {
                const row = rows.find((item) => item.id === id);
                return row ? canBatchAction(row, next) : false;
              }));
            }}
            style={{ maxWidth: 220 }}
          >
            <option value="approve">批量通过（仅待审核）</option>
            <option value="take_down">批量下架（仅已发布）</option>
            <option value="restore">批量恢复（仅已下架）</option>
            <option value="delete">批量删除（非已删除）</option>
          </select>
          <input
            className="admin-input"
            placeholder="批量处置理由"
            value={batchReason}
            onChange={(e) => setBatchReason(e.target.value)}
            style={{ maxWidth: 360 }}
          />
          <button className="admin-btn" onClick={() => batchModerate(batchAction)}>执行批量操作</button>
          <button className="admin-btn" onClick={exportCurrentListCsv}>导出当前列表 CSV</button>
          <button className="admin-btn" onClick={exportBatchResultCsv} disabled={!batchResult}>导出批量结果 CSV</button>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#7c6a56" }}>
            <input type="checkbox" checked={onlyActionable} onChange={(e) => setOnlyActionable(e.target.checked)} />
            仅显示当前批量动作可操作项
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
                    <th>失败帖子 ID</th>
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
                  checked={actionableDisplayRows.length > 0 && selectedIds.length === actionableDisplayRows.length}
                  onChange={(e) =>
                    setSelectedIds(e.target.checked ? actionableDisplayRows.map((r) => r.id) : [])
                  }
                />
              </th>
              <th>标题</th>
              <th>作者</th>
              <th>状态</th>
              <th>风险</th>
              <th>互动</th>
              <th>处置</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row) => (
              <tr key={row.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(row.id)}
                    disabled={!canBatchAction(row, batchAction)}
                    onChange={(e) =>
                      setSelectedIds((prev) =>
                        e.target.checked ? [...prev, row.id] : prev.filter((id) => id !== row.id)
                      )
                    }
                  />
                </td>
                <td>{row.title}</td>
                <td>{row.author_name}</td>
                <td>{formatReviewStatus(row.status)}</td>
                <td>{formatRiskLevel(row.risk_level)}</td>
                <td>
                  👍 {row.like_count} / 💬 {row.comment_count}
                </td>
                <td>
                  <div className="admin-grid" style={{ gap: 6 }}>
                    <input
                      className="admin-input"
                      placeholder="处置理由（必填）"
                      value={reasonByPost[row.id] || ""}
                      onChange={(e) => setReasonByPost((prev) => ({ ...prev, [row.id]: e.target.value }))}
                    />
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <button className="admin-btn" onClick={() => moderate(row.id, "approve")}>
                        通过
                      </button>
                      <button className="admin-btn" onClick={() => moderate(row.id, "take_down")}>
                        下架
                      </button>
                      <button className="admin-btn" onClick={() => moderate(row.id, "restore")}>
                        恢复
                      </button>
                      <button className="admin-btn" onClick={() => moderate(row.id, "delete")}>
                        删除
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length && !loading ? (
              <tr>
                <td colSpan={7} style={{ color: "#7c6a56" }}>
                  暂无数据
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      <section className="admin-card">
        <h3 style={{ marginTop: 0, marginBottom: 10 }}>最近审核动作</h3>
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
                <td colSpan={6} style={{ color: "#7c6a56" }}>
                  暂无审计记录
                </td>
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
