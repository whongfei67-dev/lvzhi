"use client";

import { useEffect, useState } from "react";
import { apiRequest, AdminApiError } from "@/lib/api";
import { AdminAuditDrawer } from "@/components/admin-audit-drawer";

type ContentItem = {
  id: string;
  content_type: "skill" | "agent";
  title: string;
  summary: string;
  category: string;
  status: string;
  created_at: string;
  updated_at?: string;
  creator_name: string;
  review_payload?: Record<string, unknown> | null;
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

function formatSkillSubmissionType(category: string): string {
  if (category === "legal_module") return "法律模块";
  if (category === "compliance_tool") return "合规工具";
  if (category === "ai_skill") return "AI技能";
  if (category === "agent") return "智能体";
  // 兼容历史值
  if (category === "skill_pack") return "法律模块";
  if (category === "template") return "合规工具";
  if (category === "code") return "AI技能";
  return category || "法律模块";
}

function formatContentType(type: string, category?: string): string {
  if (type === "skill") return formatSkillSubmissionType(String(category || ""));
  if (type === "agent") return "智能体";
  return type;
}

function formatStatus(status: string): string {
  const map: Record<string, string> = {
    pending_review: "待审核",
    active: "已上架",
    hidden: "已下架",
    rejected: "已驳回",
    published: "已发布",
    draft: "草稿",
  };
  return map[status] || status;
}

function formatAuditAction(action: string): string {
  const map: Record<string, string> = {
    content_approve: "内容审核通过",
    content_reject: "内容审核驳回",
    content_take_down: "内容下架",
    content_restore: "内容恢复",
  };
  return map[action] || action;
}

export default function ContentReviewPage() {
  const [contentType, setContentType] = useState<"all" | "skill" | "agent">("all");
  const [status, setStatus] = useState("pending_review");
  const [rows, setRows] = useState<ContentItem[]>([]);
  const [auditRows, setAuditRows] = useState<AuditItem[]>([]);
  const [reasonByKey, setReasonByKey] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeAudit, setActiveAudit] = useState<AuditItem | null>(null);
  const [activeSubmission, setActiveSubmission] = useState<ContentItem | null>(null);

  const payload = activeSubmission?.review_payload && typeof activeSubmission.review_payload === "object"
    ? (activeSubmission.review_payload as Record<string, unknown>)
    : null;
  const payloadWorkbench =
    payload?.workbench && typeof payload.workbench === "object" && !Array.isArray(payload.workbench)
      ? (payload.workbench as Record<string, unknown>)
      : null;
  const payloadTags = Array.isArray(payload?.tags) ? payload.tags.map((x) => String(x)) : [];
  const payloadFiles = Array.isArray(payload?.files) ? payload?.files : [];

  function renderPreviewLink(label: string, raw: unknown, key: string) {
    const url = typeof raw === "string" ? raw.trim() : "";
    if (!url) return null;
    return (
      <a key={key} href={url} target="_blank" rel="noreferrer" style={{ color: "#1d4ed8", textDecoration: "underline" }}>
        {label}
      </a>
    );
  }

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({
        page: "1",
        pageSize: "30",
        content_type: contentType,
        status,
      });
      const list = await apiRequest<{ items: ContentItem[] }>(`/api/admin/content/submissions?${query.toString()}`);
      setRows(list.items || []);

      const audit = await apiRequest<{ items: AuditItem[] }>(
        "/api/admin/actions?target_type=skill_submission&limit=10&include_snapshots=1"
      );
      const audit2 = await apiRequest<{ items: AuditItem[] }>(
        "/api/admin/actions?target_type=agent_submission&limit=10&include_snapshots=1"
      );
      const merged = [...(audit.items || []), ...(audit2.items || [])].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setAuditRows(merged.slice(0, 20));
    } catch (err) {
      setRows([]);
      setAuditRows([]);
      setError(err instanceof AdminApiError ? err.message : "加载内容审核列表失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [contentType, status]);

  async function review(row: ContentItem, action: "approve" | "reject" | "take_down" | "restore") {
    const key = `${row.content_type}:${row.id}`;
    const actionDefaultReason: Record<typeof action, string> = {
      approve: "审核通过，允许上架展示",
      reject: "审核未通过，请按规范修改后重提",
      take_down: "触发平台治理规则，执行下架",
      restore: "复审通过，恢复展示",
    };
    const reason = (reasonByKey[key] || "").trim() || actionDefaultReason[action];
    if (!reason) {
      setError("审核理由必填");
      return;
    }
    try {
      setError(null);
      setSuccess(null);
      await apiRequest(`/api/admin/content/submissions/${row.content_type}/${encodeURIComponent(row.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      setSuccess(`已提交「${row.title}」的审核动作：${action === "approve" ? "通过" : action === "reject" ? "驳回" : action === "take_down" ? "下架" : "恢复"}`);
      await loadData();
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "审核提交失败");
    }
  }

  return (
    <div className="admin-grid" style={{ gap: 16 }}>
      <section className="admin-card">
        <h2 style={{ marginTop: 0, marginBottom: 12, fontSize: 18 }}>内容审核台（灵感广场）</h2>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <select className="admin-select" value={contentType} onChange={(e) => setContentType(e.target.value as "all" | "skill" | "agent")} style={{ maxWidth: 220 }}>
            <option value="all">全部内容</option>
            <option value="skill">技能包/模板/代码</option>
            <option value="agent">智能体</option>
          </select>
          <select className="admin-select" value={status} onChange={(e) => setStatus(e.target.value)} style={{ maxWidth: 220 }}>
            <option value="pending_review">待审核</option>
            <option value="active">已上架</option>
            <option value="hidden">已下架</option>
            <option value="rejected">已驳回</option>
            <option value="all">全部状态</option>
          </select>
        </div>
        {error ? <div style={{ color: "#b63f2e", marginBottom: 10 }}>{error}</div> : null}
        {success ? <div style={{ color: "#2f8f4e", marginBottom: 10 }}>{success}</div> : null}
        {loading ? <div>加载中...</div> : null}
        <table className="admin-table">
          <thead>
            <tr>
              <th>类型</th>
              <th>标题</th>
              <th>创作者</th>
              <th>分类</th>
              <th>状态</th>
              <th>提交时间</th>
              <th>报审包</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const key = `${row.content_type}:${row.id}`;
              return (
                <tr key={key}>
                  <td>{formatContentType(row.content_type, row.category)}</td>
                  <td>{row.title}</td>
                  <td>{row.creator_name}</td>
                  <td>{row.content_type === "skill" ? formatSkillSubmissionType(row.category || "") : (row.category || "—")}</td>
                  <td>{formatStatus(row.status)}</td>
                  <td>{new Date(row.created_at).toLocaleString()}</td>
                  <td>
                    <button className="admin-btn" onClick={() => setActiveSubmission(row)}>
                      一键查看
                    </button>
                  </td>
                  <td>
                    <div className="admin-grid" style={{ gap: 6 }}>
                      <input
                        className="admin-input"
                        placeholder="审核理由（必填）"
                        value={reasonByKey[key] || ""}
                        onChange={(e) => setReasonByKey((prev) => ({ ...prev, [key]: e.target.value }))}
                      />
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button className="admin-btn" onClick={() => review(row, "approve")}>通过</button>
                        <button className="admin-btn" onClick={() => review(row, "reject")}>驳回</button>
                        <button className="admin-btn" onClick={() => review(row, "take_down")}>下架</button>
                        <button className="admin-btn" onClick={() => review(row, "restore")}>恢复</button>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!rows.length && !loading ? (
              <tr>
                <td colSpan={8} style={{ color: "#7c6a56" }}>暂无数据</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      <section className="admin-card">
        <h3 style={{ marginTop: 0, marginBottom: 10 }}>最近内容审核动作</h3>
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
                  <button className="admin-btn" onClick={() => setActiveAudit(row)}>查看</button>
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

      {activeSubmission ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.45)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 60,
            padding: 16,
          }}
          onClick={() => setActiveSubmission(null)}
        >
          <div
            className="admin-card"
            style={{ width: "min(920px, 100%)", maxHeight: "85vh", overflow: "auto", padding: 16 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h3 style={{ margin: 0 }}>报审内容详情</h3>
              <button className="admin-btn" onClick={() => setActiveSubmission(null)}>关闭</button>
            </div>
            <table className="admin-table" style={{ marginBottom: 10 }}>
              <tbody>
                <tr><th style={{ width: 160 }}>内容类型</th><td>{formatContentType(activeSubmission.content_type, activeSubmission.category)}</td></tr>
                <tr><th>标题</th><td>{activeSubmission.title || "—"}</td></tr>
                <tr><th>创作者</th><td>{activeSubmission.creator_name || "—"}</td></tr>
                <tr><th>简介</th><td style={{ whiteSpace: "pre-wrap" }}>{String(payload?.summary || activeSubmission.summary || "—")}</td></tr>
                <tr><th>领域/分类</th><td>{String(payload?.category || activeSubmission.category || "—")}</td></tr>
                <tr>
                  <th>标签</th>
                  <td>
                    {payloadTags.length
                      ? payloadTags.join(" / ")
                      : "—"}
                  </td>
                </tr>
                <tr><th>价格</th><td>{String(payloadWorkbench?.price_label || payload?.price || "—")}</td></tr>
                <tr><th>架构简述</th><td style={{ whiteSpace: "pre-wrap" }}>{String(payload?.description || "—")}</td></tr>
                <tr><th>采用工具</th><td style={{ whiteSpace: "pre-wrap" }}>{String(payloadWorkbench?.tools || "—")}</td></tr>
                <tr><th>应用场景</th><td style={{ whiteSpace: "pre-wrap" }}>{String(payloadWorkbench?.scenarios || "—")}</td></tr>
                <tr><th>提交时间</th><td>{new Date(activeSubmission.created_at).toLocaleString()}</td></tr>
                <tr><th>最近更新</th><td>{activeSubmission.updated_at ? new Date(activeSubmission.updated_at).toLocaleString() : "—"}</td></tr>
                <tr>
                  <th>材料与文件</th>
                  <td>
                    <div style={{ display: "grid", gap: 6 }}>
                      {renderPreviewLink("封面图", payload?.cover_image, "cover")}
                      {renderPreviewLink("作品文件（主）", payloadWorkbench?.package_file_url, "package-main")}
                      {Array.isArray(payloadFiles) && payloadFiles.length
                        ? payloadFiles.map((file, idx) => {
                            const f = file && typeof file === "object" ? (file as Record<string, unknown>) : {};
                            const label = String(f.original_name || `附件${idx + 1}`);
                            return renderPreviewLink(label, f.url, `file-${idx}`);
                          })
                        : null}
                      {!payload?.cover_image && !payloadWorkbench?.package_file_url && !payloadFiles.length
                        ? <span style={{ color: "#7c6a56" }}>暂无可预览材料</span>
                        : null}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <details>
              <summary style={{ cursor: "pointer", color: "#7c6a56" }}>查看完整报审 JSON</summary>
              <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", marginTop: 8 }}>
                {JSON.stringify(payload || {}, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      ) : null}
    </div>
  );
}

