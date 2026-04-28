import * as React from "react";
import { TableStatusTag, type TagColor } from "./table-status-tag";

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "processing"
  | "completed"
  | "refunded"
  | "cancelled"
  | "expired"
  | (string & {});

const CONFIG: Record<string, { label: string; color: TagColor }> = {
  pending_payment: { label: "待支付",  color: "amber"  },
  paid:            { label: "已支付",  color: "blue"   },
  processing:      { label: "处理中",  color: "indigo" },
  completed:       { label: "已完成",  color: "green"  },
  refunded:        { label: "已退款",  color: "slate"  },
  cancelled:       { label: "已取消",  color: "red"    },
  expired:         { label: "已过期",  color: "slate"  },
};

interface OrderStatusTagProps {
  status: OrderStatus;
  /** Override the display label */
  label?: string;
  className?: string;
}

export function OrderStatusTag({ status, label, className }: OrderStatusTagProps) {
  const cfg = CONFIG[status] ?? { label: status, color: "slate" as TagColor };
  return (
    <TableStatusTag
      label={label ?? cfg.label}
      color={cfg.color}
      className={className}
    />
  );
}
