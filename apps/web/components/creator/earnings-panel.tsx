"use client"

import { useState } from "react"
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight } from "lucide-react"

interface EarningsPanelProps {
  totalEarnings?: number
  pendingEarnings?: number
  withdrawalAmount?: number
}

export function EarningsPanel({
  totalEarnings = 0,
  pendingEarnings = 0,
  withdrawalAmount = 0,
}: EarningsPanelProps) {
  const [withdrawing, setWithdrawing] = useState(false)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-950">收益概览</h3>
        <Wallet className="h-5 w-5 text-slate-400" />
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-emerald-600">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xl font-bold">¥{totalEarnings.toFixed(2)}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">累计收益</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-amber-600">
            <TrendingDown className="h-4 w-4" />
            <span className="text-xl font-bold">¥{pendingEarnings.toFixed(2)}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">待结算</p>
        </div>
        <div className="text-center">
          <span className="text-xl font-bold text-slate-950">¥{withdrawalAmount.toFixed(2)}</span>
          <p className="mt-1 text-xs text-slate-500">可提现</p>
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={() => setWithdrawing(true)}
          disabled={withdrawalAmount <= 0}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:bg-blue-700"
        >
          立即提现
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>

      {withdrawing && (
        <div className="mt-4 rounded-lg bg-slate-50 p-4">
          <p className="text-sm text-slate-600">提现功能即将上线</p>
          <button
            onClick={() => setWithdrawing(false)}
            className="mt-2 text-sm text-blue-600"
          >
            关闭
          </button>
        </div>
      )}
    </div>
  )
}
