"use client";

import type { ReactNode } from "react";
import { AdminAuditDiffTable } from "@/components/admin-audit-diff-table";

type AuditDrawerItem = {
  action_type: string;
  created_at: string;
  actor_name?: string | null;
  reason?: string | null;
};

type AdminAuditDrawerProps = {
  item: AuditDrawerItem | null;
  onClose: () => void;
  title: string;
  diffBefore: unknown;
  diffAfter: unknown;
  rawBefore?: unknown;
  rawAfter?: unknown;
  diffHeading?: string;
  extraSection?: ReactNode;
  showRawSnapshots?: boolean;
};

export function AdminAuditDrawer({
  item,
  onClose,
  title,
  diffBefore,
  diffAfter,
  rawBefore,
  rawAfter,
  diffHeading = "高亮变更",
  extraSection,
  showRawSnapshots = true,
}: AdminAuditDrawerProps) {
  if (!item) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "grid",
        placeItems: "center",
        zIndex: 70,
      }}
    >
      <div className="admin-card" style={{ width: "min(980px, 92vw)", maxHeight: "80vh", overflow: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>{title}</h3>
          <button className="admin-btn" onClick={onClose}>
            关闭
          </button>
        </div>
        <div style={{ fontSize: 12, color: "#7c6a56", marginBottom: 8 }}>
          {new Date(item.created_at).toLocaleString()} · {item.actor_name || "未知操作人"}
        </div>
        <div style={{ fontSize: 13, marginBottom: 8 }}>变更理由：{item.reason || "—"}</div>
        {extraSection}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>{diffHeading}</div>
          <AdminAuditDiffTable beforeSnapshot={diffBefore} afterSnapshot={diffAfter} />
        </div>
        {showRawSnapshots ? (
          <div className="admin-grid cols-2">
            <div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>变更前</div>
              <pre style={{ background: "#f7f4ef", borderRadius: 8, padding: 10, fontSize: 12, overflow: "auto" }}>
                {JSON.stringify(rawBefore ?? null, null, 2)}
              </pre>
            </div>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>变更后</div>
              <pre style={{ background: "#f7f4ef", borderRadius: 8, padding: 10, fontSize: 12, overflow: "auto" }}>
                {JSON.stringify(rawAfter ?? null, null, 2)}
              </pre>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
