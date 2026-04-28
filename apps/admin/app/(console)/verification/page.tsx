"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest, AdminApiError } from "@/lib/api";
import { AdminAuditDrawer } from "@/components/admin-audit-drawer";

type VerificationApplication = {
  id: string;
  applicant_id: string;
  display_name: string;
  email: string;
  verification_type: "lawyer" | "excellent" | "master";
  bar_number: string | null;
  law_firm: string | null;
  specialty: string[] | null;
  certificate_url?: string | null;
  certificate_info_url?: string | null;
  certificate_stamp_url?: string | null;
  id_card_url?: string | null;
  application_note?: string | null;
  status: string;
  created_at: string;
  updated_at?: string | null;
  review_note?: string | null;
  lawyer_profile_visible?: boolean;
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

function formatVerificationStatus(status: string): string {
  const map: Record<string, string> = {
    pending: "待审",
    approved: "已通过",
    rejected: "已驳回",
  };
  return map[status] || status;
}

function formatAuditAction(action: string): string {
  const map: Record<string, string> = {
    verification_approve: "认证审批通过",
    verification_reject: "认证审批驳回",
    lawyer_profile_take_down: "认证律师页下架",
    lawyer_profile_restore: "认证律师页恢复上架",
  };
  return map[action] || action;
}

function formatLocalDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN", { hour12: false });
}

function withAdminMediaProxy(url: string): string {
  const raw = String(url || "").trim();
  if (!raw) return "";
  if (raw.startsWith("/api/media?")) return raw;
  if (!/^https?:\/\//i.test(raw)) return raw;
  try {
    const u = new URL(raw);
    const host = u.host.toLowerCase();
    const endpoint = String(process.env.NEXT_PUBLIC_OSS_ENDPOINT || "").trim().toLowerCase();
    const bucket = String(process.env.NEXT_PUBLIC_OSS_BUCKET || "").trim().toLowerCase();
    const endpointHost = endpoint && bucket ? `${bucket}.${endpoint}` : "";
    const cdnHost = (() => {
      const cdn = String(process.env.NEXT_PUBLIC_OSS_CDN_URL || "").trim();
      if (!cdn) return "";
      try {
        return new URL(cdn).host.toLowerCase();
      } catch {
        return "";
      }
    })();
    const isAliyunOssHost = host === "aliyuncs.com" || host.endsWith(".aliyuncs.com");
    const shouldProxy =
      (endpointHost && host === endpointHost) ||
      (cdnHost && host === cdnHost) ||
      isAliyunOssHost;
    return shouldProxy ? `/api/media?url=${encodeURIComponent(raw)}` : raw;
  } catch {
    return raw;
  }
}

function isPlaceholderMaterialUrl(url: string): boolean {
  const raw = String(url || "").trim();
  if (!raw) return false;
  try {
    const u = new URL(raw);
    const host = u.host.toLowerCase();
    return host === "example.com" || host.endsWith(".example.com");
  } catch {
    return false;
  }
}

function renderMaterialLink(label: string, url: string, key: string) {
  if (isPlaceholderMaterialUrl(url)) {
    return (
      <span key={key} style={{ color: "#b45309", fontSize: 12 }}>
        {label}（测试占位数据，请重传）
      </span>
    );
  }
  return (
    <a key={key} href={withAdminMediaProxy(url)} target="_blank" rel="noreferrer" style={{ color: "#1d4ed8" }}>
      {label}
    </a>
  );
}

export default function VerificationConsolePage() {
  const [verificationType, setVerificationType] = useState<"lawyer" | "excellent" | "master">("lawyer");
  const [status, setStatus] = useState("pending");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<VerificationApplication[]>([]);
  const [auditRows, setAuditRows] = useState<AuditItem[]>([]);
  const [reasonById, setReasonById] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchReason, setBatchReason] = useState("");
  const [batchResult, setBatchResult] = useState<BatchReviewResult | null>(null);
  const [activeAudit, setActiveAudit] = useState<AuditItem | null>(null);
  const [onlyActionable, setOnlyActionable] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({
        verification_type: verificationType,
        status,
        page: "1",
        pageSize: "30",
      });
      const listData = await apiRequest<{ items: VerificationApplication[] }>(
        `/api/admin/verification/applications?${query.toString()}`
      );
      setRows(listData.items || []);
      setSelectedIds([]);

      if (verificationType === "lawyer") {
        const [verificationAudit, lawyerProfileAudit] = await Promise.all([
          apiRequest<{ items: AuditItem[] }>(`/api/admin/actions?target_type=lawyer_verification&limit=15&include_snapshots=1`),
          apiRequest<{ items: AuditItem[] }>(`/api/admin/actions?target_type=lawyer_profile&limit=15&include_snapshots=1`),
        ]);
        const merged = [...(verificationAudit.items || []), ...(lawyerProfileAudit.items || [])]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 15);
        setAuditRows(merged);
      } else {
        const auditData = await apiRequest<{ items: AuditItem[] }>(
          `/api/admin/actions?target_type=creator_verification&limit=15&include_snapshots=1`
        );
        setAuditRows(auditData.items || []);
      }
      setLastSyncedAt(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "加载认证列表失败");
      setRows([]);
      setAuditRows([]);
    } finally {
      setLoading(false);
    }
  }, [status, verificationType]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void loadData();
    }, 10000);
    return () => window.clearInterval(timer);
  }, [loadData]);

  async function review(id: string, action: "approve" | "reject") {
    const reason = (reasonById[id] || "").trim();
    if (!reason) {
      setError("审批理由必填");
      return;
    }

    setError(null);
    try {
      await apiRequest(`/api/admin/verification/applications/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reason,
          verification_type: verificationType,
        }),
      });
      await loadData();
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "审批失败");
    }
  }

  async function batchReview(action: "approve" | "reject") {
    const reason = batchReason.trim();
    const actionableIds = selectedIds.filter((id) => {
      const row = rows.find((item) => item.id === id);
      return row?.status === "pending";
    });
    if (!actionableIds.length) {
      setError("请至少选择一条申请");
      return;
    }
    if (!reason) {
      setError("批量审批理由必填");
      return;
    }
    try {
      const result = await apiRequest<BatchReviewResult>("/api/admin/verification/applications/batch-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: actionableIds, action, reason, verification_type: verificationType }),
      });
      setBatchResult({
        ...result,
        failed: result.failed.map((item) => ({ ...item, reason: normalizeBatchFailReason(item.reason) })),
      });
      await loadData();
      setBatchReason("");
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "批量审批失败");
    }
  }

  async function updateLawyerProfileVisibility(item: VerificationApplication, visible: boolean) {
    const reason = (reasonById[item.id] || "").trim();
    if (!visible && !reason) {
      setError("下架认证律师页时，审批理由必填");
      return;
    }
    setError(null);
    try {
      await apiRequest(`/api/admin/verification/lawyer-profile/${encodeURIComponent(item.applicant_id)}/visibility`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visible,
          reason: reason || undefined,
        }),
      });
      await loadData();
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "更新认证律师展示状态失败");
    }
  }

  function escapeCsvCell(value: unknown): string {
    const raw = String(value ?? "");
    return `"${raw.replace(/"/g, '""')}"`;
  }

  function normalizeBatchFailReason(reason: string): string {
    const raw = String(reason || "").toLowerCase();
    if (!raw) return "未知错误";
    if (raw.includes("not found")) return "申请不存在";
    if (raw.includes("already processed")) return "申请已处理";
    if (raw.includes("not found or already processed")) return "申请不存在或已处理";
    if (raw.includes("permission") || raw.includes("forbidden")) return "无权限执行该操作";
    if (raw.includes("invalid")) return "参数不合法";
    if (raw.includes("required")) return "缺少必填参数";
    if (raw.includes("unknown error")) return "未知错误";
    return reason;
  }

  const displayRows = onlyActionable ? rows.filter((item) => item.status === "pending") : rows;

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
    const headers = [
      "id",
      "display_name",
      "email",
      "verification_type",
      "bar_number",
      "law_firm",
      "certificate_url",
      "certificate_info_url",
      "certificate_stamp_url",
      "id_card_url",
      "application_note",
      "status",
      "created_at",
    ];
    const data = displayRows.map((item) => [
      item.id,
      item.display_name,
      item.email,
      item.verification_type,
      item.bar_number,
      item.law_firm,
      item.certificate_url || "",
      item.certificate_info_url || "",
      item.certificate_stamp_url || "",
      item.id_card_url || "",
      item.application_note || "",
      item.status,
      item.created_at,
    ]);
    downloadCsv(`verification-list-${Date.now()}.csv`, headers, data);
  }

  function exportBatchResultCsv() {
    if (!batchResult) return;
    const headers = ["total", "success", "failed_count", "failed_id", "failed_reason"];
    const data = batchResult.failed.length
      ? batchResult.failed.map((f) => [batchResult.total, batchResult.success, batchResult.failed_count, f.id, f.reason])
      : [[batchResult.total, batchResult.success, batchResult.failed_count, "", ""]];
    downloadCsv(`verification-batch-result-${Date.now()}.csv`, headers, data);
  }

  return (
    <div className="admin-grid" style={{ gap: 16 }}>
      <section className="admin-card">
        <h2 style={{ marginTop: 0, marginBottom: 12, fontSize: 18 }}>认证审批台</h2>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <select
            className="admin-select"
            value={verificationType}
            onChange={(e) => setVerificationType(e.target.value as "lawyer" | "excellent" | "master")}
            style={{ maxWidth: 280 }}
          >
            <option value="lawyer">律师认证</option>
            <option value="excellent">优秀创作者认证</option>
            <option value="master">大师级创作者认证</option>
          </select>
          <select className="admin-select" value={status} onChange={(e) => setStatus(e.target.value)} style={{ maxWidth: 280 }}>
            <option value="pending">待审</option>
            <option value="approved">已通过</option>
            <option value="rejected">已驳回</option>
            <option value="all">全部状态</option>
          </select>
          <button className="admin-btn" onClick={() => void loadData()} disabled={loading}>
            {loading ? "刷新中..." : "刷新列表"}
          </button>
          <span style={{ fontSize: 12, color: "#7c6a56" }}>
            {lastSyncedAt ? `最近同步：${lastSyncedAt}` : "最近同步：未同步"}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
          <input
            className="admin-input"
            placeholder="批量审批理由"
            value={batchReason}
            onChange={(e) => setBatchReason(e.target.value)}
            style={{ maxWidth: 360 }}
          />
          <button className="admin-btn" onClick={() => batchReview("approve")}>批量通过</button>
          <button className="admin-btn" onClick={() => batchReview("reject")}>批量驳回</button>
          <button className="admin-btn" onClick={exportCurrentListCsv}>导出当前列表 CSV</button>
          <button className="admin-btn" onClick={exportBatchResultCsv} disabled={!batchResult}>导出批量结果 CSV</button>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#7c6a56" }}>
            <input type="checkbox" checked={onlyActionable} onChange={(e) => setOnlyActionable(e.target.checked)} />
            仅显示可批量审批（待审）
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
                    <th>失败申请 ID</th>
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
                  checked={displayRows.filter((r) => r.status === "pending").length > 0 && selectedIds.length === displayRows.filter((r) => r.status === "pending").length}
                  onChange={(e) =>
                    setSelectedIds(e.target.checked ? displayRows.filter((r) => r.status === "pending").map((r) => r.id) : [])
                  }
                />
              </th>
              <th>申请人</th>
              <th>邮箱</th>
              <th>认证类型</th>
              <th>申请提交时间</th>
              <th>最近更新时间</th>
              <th>执业证号</th>
              <th>律所</th>
              <th>专长</th>
              <th>认证材料</th>
              <th>补充说明</th>
              <th>状态</th>
              <th>认证律师页展示</th>
              <th>审批</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((item) => (
              <tr key={item.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    disabled={item.status !== "pending"}
                    onChange={(e) =>
                      setSelectedIds((prev) =>
                        e.target.checked ? [...prev, item.id] : prev.filter((id) => id !== item.id)
                      )
                    }
                  />
                </td>
                <td>{item.display_name}</td>
                <td>{item.email}</td>
                <td>
                  {item.verification_type === "lawyer"
                    ? "律师认证"
                    : item.verification_type === "excellent"
                      ? "优秀创作者"
                      : "大师级创作者"}
                </td>
                <td>{formatLocalDateTime(item.created_at)}</td>
                <td>{formatLocalDateTime(item.updated_at || item.created_at)}</td>
                <td>{item.bar_number || "—"}</td>
                <td>{item.law_firm || "—"}</td>
                <td>{Array.isArray(item.specialty) && item.specialty.length ? item.specialty.join(" / ") : "—"}</td>
                <td>
                  <div style={{ display: "grid", gap: 4 }}>
                    {(() => {
                      const hasSplitCertificate = Boolean(item.certificate_info_url || item.certificate_stamp_url);
                      const legacyCertParts = String(item.certificate_url || "")
                        .split(",")
                        .map((part) => part.trim())
                        .filter(Boolean);
                      return (
                        <>
                    {item.certificate_info_url
                      ? renderMaterialLink("执业证复印件（信息页）", item.certificate_info_url, `${item.id}-cert-info`)
                      : null}
                    {item.certificate_stamp_url
                      ? renderMaterialLink("执业证复印件（盖章页）", item.certificate_stamp_url, `${item.id}-cert-stamp`)
                      : null}
                    {item.certificate_url ? (
                      hasSplitCertificate ? null : legacyCertParts.length <= 1 ? (
                        renderMaterialLink("执业证材料（兼容旧数据）", legacyCertParts[0], `${item.id}-legacy-cert-0`)
                      ) : (
                        legacyCertParts.map((url, idx) => (
                          renderMaterialLink(`执业证材料（兼容旧数据）${idx + 1}`, url, `${item.id}-legacy-cert-${idx}`)
                        ))
                      )
                    ) : null}
                    {item.id_card_url
                      ? item.id_card_url
                          .split(",")
                          .map((part) => part.trim())
                          .filter(Boolean)
                          .map((url, idx) => (
                            renderMaterialLink(`身份证材料${idx + 1}`, url, `${item.id}-id-${idx}`)
                          ))
                      : null}
                    {!item.certificate_url && !item.certificate_info_url && !item.certificate_stamp_url && !item.id_card_url
                      ? "—"
                      : null}
                        </>
                      );
                    })()}
                  </div>
                </td>
                <td>{item.application_note || "—"}</td>
                <td>{formatVerificationStatus(item.status)}</td>
                <td>
                  {item.verification_type === "lawyer"
                    ? item.status === "approved"
                      ? item.lawyer_profile_visible === false
                        ? "已下架"
                        : "展示中"
                      : "待认证通过后可设置"
                    : "不适用"}
                </td>
                <td>
                  <div className="admin-grid" style={{ gap: 6 }}>
                    <textarea
                      className="admin-textarea"
                      placeholder="审批理由（必填）"
                      rows={2}
                      value={reasonById[item.id] || ""}
                      onChange={(e) => setReasonById((prev) => ({ ...prev, [item.id]: e.target.value }))}
                    />
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="admin-btn" onClick={() => review(item.id, "approve")}>
                        通过
                      </button>
                      <button className="admin-btn" onClick={() => review(item.id, "reject")}>
                        驳回
                      </button>
                      {item.verification_type === "lawyer" && item.status === "approved" ? (
                        item.lawyer_profile_visible === false ? (
                          <button className="admin-btn" onClick={() => updateLawyerProfileVisibility(item, true)}>
                            恢复上架
                          </button>
                        ) : (
                          <button className="admin-btn" onClick={() => updateLawyerProfileVisibility(item, false)}>
                            从认证律师页下架
                          </button>
                        )
                      ) : null}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length && !loading ? (
              <tr>
                <td colSpan={14} style={{ color: "#7c6a56" }}>
                  暂无数据
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      <section className="admin-card">
        <h3 style={{ marginTop: 0, marginBottom: 10 }}>最近认证审批动作</h3>
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
