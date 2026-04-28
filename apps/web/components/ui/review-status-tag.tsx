import * as React from "react";
import { TableStatusTag, type TagColor } from "./table-status-tag";

export type ReviewStatus =
  | "pending_review"
  | "under_review"
  | "approved"
  | "active"
  | "rejected"
  | "needs_revision"
  | "published"
  | "hidden"
  | "withdrawn"
  | (string & {});

const CONFIG: Record<string, { label: string; color: TagColor }> = {
  pending_review:  { label: "审核中",  color: "amber"  },
  under_review:    { label: "审核中",  color: "blue"   },
  approved:        { label: "审核通过已上架",  color: "green"  },
  active:          { label: "审核通过已上架",  color: "green"  },
  rejected:        { label: "已拒绝",  color: "red"    },
  needs_revision:  { label: "需修改",  color: "orange" },
  published:       { label: "审核通过已上架",  color: "green"  },
  hidden:          { label: "已下架",  color: "slate"  },
  withdrawn:       { label: "已撤回",  color: "slate"  },
};

interface ReviewStatusTagProps {
  status: ReviewStatus;
  label?: string;
  className?: string;
}

export function ReviewStatusTag({ status, label, className }: ReviewStatusTagProps) {
  const cfg = CONFIG[status] ?? { label: status, color: "slate" as TagColor };
  return (
    <TableStatusTag
      label={label ?? cfg.label}
      color={cfg.color}
      className={className}
    />
  );
}
