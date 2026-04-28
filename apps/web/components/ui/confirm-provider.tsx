"use client";

import * as React from "react";
import { ConfirmDialog } from "./confirm-dialog";
import { Button } from "./button";

interface ConfirmDialogOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary";
  onConfirm: () => void | Promise<void>;
}

interface ConfirmDialogState extends ConfirmDialogOptions {
  id: string;
  open: boolean;
  loading: boolean;
}

let dialogIdCounter = 0;

const ConfirmDialogContext = React.createContext<{
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>;
} | null>(null);

export function useConfirm() {
  const context = React.useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error("useConfirm must be used within ConfirmDialogProvider");
  }
  return context;
}

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [dialogs, setDialogs] = React.useState<ConfirmDialogState[]>([]);

  const confirm = React.useCallback((options: ConfirmDialogOptions): Promise<boolean> => {
    const id = `confirm-${++dialogIdCounter}`;
    return new Promise((resolve) => {
      setDialogs((prev) => [
        ...prev,
        {
          ...options,
          id,
          open: true,
          loading: false,
        },
      ]);
    });
  }, []);

  const handleClose = React.useCallback((id: string) => {
    setDialogs((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const handleConfirm = React.useCallback(async (id: string) => {
    const dialog = dialogs.find((d) => d.id === id);
    if (dialog) {
      setDialogs((prev) =>
        prev.map((d) => (d.id === id ? { ...d, loading: true } : d))
      );
      try {
        await dialog.onConfirm();
      } finally {
        setDialogs((prev) => prev.filter((d) => d.id !== id));
      }
    }
  }, [dialogs]);

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}
      {dialogs.map((dialog) => (
        <ConfirmDialog
          key={dialog.id}
          open={dialog.open}
          onOpenChange={(open) => {
            if (!open) handleClose(dialog.id);
          }}
          title={dialog.title}
          description={dialog.description}
          confirmText={dialog.confirmText}
          cancelText={dialog.cancelText}
          variant={dialog.variant}
          onConfirm={() => handleConfirm(dialog.id)}
          loading={dialog.loading}
        />
      ))}
    </ConfirmDialogContext.Provider>
  );
}

// ============================================
// 快捷确认方法
// ============================================

export type QuickConfirmType = "delete" | "withdraw" | "cancel" | "submit" | "publish" | "unpublish";

const quickConfirmDefaults: Record<QuickConfirmType, { title: string; description: string; confirmText: string; variant: "danger" | "primary" }> = {
  delete: {
    title: "确认删除",
    description: "此操作不可撤销，删除后数据将无法恢复。",
    confirmText: "删除",
    variant: "danger",
  },
  withdraw: {
    title: "确认提现",
    description: "提现申请提交后将无法撤销，请确认金额是否正确。",
    confirmText: "确认提现",
    variant: "danger",
  },
  cancel: {
    title: "确认取消",
    description: "确定要取消此操作吗？",
    confirmText: "确认取消",
    variant: "primary",
  },
  submit: {
    title: "确认提交",
    description: "确定要提交此内容吗？",
    confirmText: "提交",
    variant: "primary",
  },
  publish: {
    title: "确认发布",
    description: "发布后内容将对所有用户可见。",
    confirmText: "发布",
    variant: "primary",
  },
  unpublish: {
    title: "确认下架",
    description: "下架后用户将无法访问此内容。",
    confirmText: "下架",
    variant: "danger",
  },
};

export interface QuickConfirmOptions {
  customTitle?: string;
  customDescription?: string;
  customConfirmText?: string;
  onConfirm: () => void | Promise<void>;
}

export function useQuickConfirm() {
  const { confirm } = useConfirm();

  const confirmAction = React.useCallback(
    (type: QuickConfirmType, options: QuickConfirmOptions) => {
      const defaults = quickConfirmDefaults[type];
      return confirm({
        title: options.customTitle || defaults.title,
        description: options.customDescription || defaults.description,
        confirmText: options.customConfirmText || defaults.confirmText,
        variant: defaults.variant,
        onConfirm: options.onConfirm,
      });
    },
    [confirm]
  );

  return {
    confirmDelete: (options: QuickConfirmOptions) => confirmAction("delete", options),
    confirmWithdraw: (options: QuickConfirmOptions) => confirmAction("withdraw", options),
    confirmCancel: (options: QuickConfirmOptions) => confirmAction("cancel", options),
    confirmSubmit: (options: QuickConfirmOptions) => confirmAction("submit", options),
    confirmPublish: (options: QuickConfirmOptions) => confirmAction("publish", options),
    confirmUnpublish: (options: QuickConfirmOptions) => confirmAction("unpublish", options),
    confirm: confirmAction,
  };
}
