"use client";

type DiffEntry = {
  key: string;
  before: unknown;
  after: unknown;
  change: "added" | "removed" | "changed";
};

const CHANGE_LABEL: Record<DiffEntry["change"], string> = {
  added: "新增",
  removed: "删除",
  changed: "修改",
};

function buildDiffEntries(beforeRaw: unknown, afterRaw: unknown): DiffEntry[] {
  const before = (beforeRaw && typeof beforeRaw === "object" ? beforeRaw : {}) as Record<string, unknown>;
  const after = (afterRaw && typeof afterRaw === "object" ? afterRaw : {}) as Record<string, unknown>;
  const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));
  const entries: DiffEntry[] = [];

  keys.forEach((key) => {
    const b = before[key];
    const a = after[key];
    const hasBefore = Object.prototype.hasOwnProperty.call(before, key);
    const hasAfter = Object.prototype.hasOwnProperty.call(after, key);
    if (!hasBefore && hasAfter) {
      entries.push({ key, before: null, after: a, change: "added" });
      return;
    }
    if (hasBefore && !hasAfter) {
      entries.push({ key, before: b, after: null, change: "removed" });
      return;
    }
    if (JSON.stringify(b) !== JSON.stringify(a)) {
      entries.push({ key, before: b, after: a, change: "changed" });
    }
  });

  return entries;
}

type AdminAuditDiffTableProps = {
  beforeSnapshot: unknown;
  afterSnapshot: unknown;
  emptyLabel?: string;
};

export function AdminAuditDiffTable({
  beforeSnapshot,
  afterSnapshot,
  emptyLabel = "无字段变化",
}: AdminAuditDiffTableProps) {
  const entries = buildDiffEntries(beforeSnapshot, afterSnapshot);

  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th>字段</th>
          <th>变更前</th>
          <th>变更后</th>
          <th>变化</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry) => (
          <tr
            key={entry.key}
            style={{
              background:
                entry.change === "added"
                  ? "rgba(76, 175, 80, 0.12)"
                  : entry.change === "removed"
                    ? "rgba(244, 67, 54, 0.12)"
                    : "rgba(255, 193, 7, 0.12)",
            }}
          >
            <td>{entry.key}</td>
            <td>{JSON.stringify(entry.before)}</td>
            <td>{JSON.stringify(entry.after)}</td>
            <td>{CHANGE_LABEL[entry.change]}</td>
          </tr>
        ))}
        {!entries.length ? (
          <tr>
            <td colSpan={4} style={{ color: "#7c6a56" }}>{emptyLabel}</td>
          </tr>
        ) : null}
      </tbody>
    </table>
  );
}
