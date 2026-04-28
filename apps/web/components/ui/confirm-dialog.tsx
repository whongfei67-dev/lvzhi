"use client";

import * as React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from "./modal";
import { Button, type ButtonProps } from "./button";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary";
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}

/**
 * 通用确认弹窗组件
 * 用于敏感操作的二次确认（如删除、提现等）
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "确认",
  cancelText = "取消",
  variant = "primary",
  onConfirm,
  loading = false,
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm()
    if (variant !== "danger") {
      onOpenChange(false)
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="sm">
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
          {description && (
            <ModalDescription>{description}</ModalDescription>
          )}
        </ModalHeader>
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant}
            onClick={handleConfirm}
            disabled={loading}
          >
            {confirmText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

// ============================================
// 预置的确认对话框 Hook
// ============================================

interface UseConfirmOptions {
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: "danger" | "primary"
  onConfirm: () => void | Promise<void>
}

interface ConfirmState extends UseConfirmOptions {
  open: boolean
}

export function useConfirmDialog() {
  const [state, setState] = React.useState<ConfirmState | null>(null)

  const confirm = React.useCallback((options: UseConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({
        ...options,
        open: true,
        onConfirm: async () => {
          await options.onConfirm()
          resolve(true)
          setState(null)
        },
      })
    })
  }, [])

  const cancel = React.useCallback(() => {
    setState(null)
  }, [])

  const ConfirmDialogComponent = React.useCallback(() => {
    if (!state) return null

    return (
      <ConfirmDialog
        open={state.open}
        onOpenChange={(open) => {
          if (!open) {
            setState(null)
          }
        }}
        title={state.title}
        description={state.description}
        confirmText={state.confirmText}
        cancelText={state.cancelText}
        variant={state.variant}
        onConfirm={state.onConfirm}
      />
    )
  }, [state])

  return {
    confirm,
    cancel,
    ConfirmDialog: ConfirmDialogComponent,
  }
}

// ============================================
// 快速确认方法
// ============================================

type QuickConfirmAction = "delete" | "withdraw" | "cancel" | "submit"

interface QuickConfirmMessages {
  delete: { title: string; description: string; confirmText: string }
  withdraw: { title: string; description: string; confirmText: string }
  cancel: { title: string; description: string; confirmText: string }
  submit: { title: string; description: string; confirmText: string }
}

const defaultMessages: QuickConfirmMessages = {
  delete: {
    title: "确认删除",
    description: "此操作不可撤销，删除后数据将无法恢复。",
    confirmText: "删除",
  },
  withdraw: {
    title: "确认提现",
    description: "提现申请提交后将无法撤销，请确认金额是否正确。",
    confirmText: "确认提现",
  },
  cancel: {
    title: "确认取消",
    description: "确定要取消此操作吗？",
    confirmText: "确认取消",
  },
  submit: {
    title: "确认提交",
    description: "确定要提交此内容吗？",
    confirmText: "提交",
  },
}

export function useQuickConfirm() {
  const [state, setState] = React.useState<{
    action: QuickConfirmAction
    customTitle?: string
    customDescription?: string
    customConfirmText?: string
    open: boolean
    onConfirm: () => void | Promise<void>
    loading: boolean
  } | null>(null)

  const confirm = React.useCallback((
    action: QuickConfirmAction,
    onConfirm: () => void | Promise<void>,
    customTitle?: string,
    customDescription?: string,
    customConfirmText?: string
  ) => {
    setState({
      action,
      customTitle,
      customDescription,
      customConfirmText,
      open: true,
      onConfirm: async () => {
        await onConfirm()
      },
      loading: false,
    })
  }, [])

  const handleClose = React.useCallback(() => {
    setState(null)
  }, [])

  const handleConfirm = React.useCallback(async () => {
    if (!state) return
    setState((prev) => prev ? { ...prev, loading: true } : null)
    await state.onConfirm()
    setState(null)
  }, [state])

  const QuickConfirmDialog = React.useCallback(() => {
    if (!state) return null

    const messages = defaultMessages[state.action]
    const title = state.customTitle || messages.title
    const description = state.customDescription || messages.description
    const confirmText = state.customConfirmText || messages.confirmText

    return (
      <ConfirmDialog
        open={state.open}
        onOpenChange={(open) => {
          if (!open) handleClose()
        }}
        title={title}
        description={description}
        confirmText={confirmText}
        variant={state.action === "delete" || state.action === "withdraw" ? "danger" : "primary"}
        onConfirm={handleConfirm}
        loading={state.loading}
      />
    )
  }, [state, handleClose, handleConfirm])

  return {
    confirm,
    QuickConfirmDialog,
  }
}
