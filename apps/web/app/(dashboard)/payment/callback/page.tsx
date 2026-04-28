"use client"

import React, { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react'

function PaymentCallbackContent() {
  const searchParams = useSearchParams()
  const sp = useMemo(() => searchParams ?? new URLSearchParams(), [searchParams])
  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'pending'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const orderId = sp.get('order_id')
    const tradeStatus = sp.get('trade_status') // 支付宝
    const resultCode = sp.get('result_code') // 微信

    // 判断支付状态
    if (tradeStatus === 'TRADE_SUCCESS' || resultCode === 'SUCCESS') {
      setStatus('success')
      setMessage('支付成功！积分已到账。')
    } else if (tradeStatus === 'TRADE_CLOSED' || resultCode === 'FAILED') {
      setStatus('failed')
      setMessage('支付失败，请重试。')
    } else if (tradeStatus === 'WAIT_BUYER_PAY') {
      setStatus('pending')
      setMessage('等待支付确认...')
    } else {
      // 默认检查订单状态
      setStatus('pending')
      setMessage('正在确认支付状态...')
    }
  }, [sp])

  return (
    <div className="min-h-screen bg-[rgba(212,165,116,0.08)] flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="rounded-3xl border border-[rgba(212,165,116,0.25)] bg-white p-8 shadow-sm text-center">
          {status === 'loading' && (
            <>
              <div className="mx-auto h-16 w-16 rounded-full bg-[rgba(212,165,116,0.15)] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#9A8B78]" />
              </div>
              <h1 className="mt-6 text-xl font-semibold text-[#2C2416]">支付确认中</h1>
              <p className="mt-2 text-[#9A8B78]">请稍候，正在确认支付状态...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto h-16 w-16 rounded-full bg-[rgba(212,165,116,0.15)] flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-[#D4A574]" />
              </div>
              <h1 className="mt-6 text-xl font-semibold text-[#D4A574]">支付成功</h1>
              <p className="mt-2 text-[#9A8B78]">{message}</p>
              <div className="mt-8 flex flex-col gap-3">
                <Link
                  href="/user"
                  className="w-full rounded-2xl bg-gradient-to-r from-[#D4A574] to-[#B8860B] py-3 text-sm font-semibold text-white"
                >
                  查看余额
                </Link>
                <Link
                  href="/"
                  className="w-full rounded-2xl border border-[rgba(212,165,116,0.25)] py-3 text-sm font-medium text-[#D4A574] hover:bg-[rgba(212,165,116,0.08)]"
                >
                  返回首页
                </Link>
              </div>
            </>
          )}

          {status === 'failed' && (
            <>
              <div className="mx-auto h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <h1 className="mt-6 text-xl font-semibold text-red-700">支付失败</h1>
              <p className="mt-2 text-[#9A8B78]">{message}</p>
              <div className="mt-8 flex flex-col gap-3">
                <Link
                  href="/dashboard/recharge"
                  className="w-full rounded-2xl bg-gradient-to-r from-[#D4A574] to-[#B8860B] py-3 text-sm font-semibold text-white"
                >
                  重新充值
                </Link>
                <Link
                  href="/"
                  className="w-full rounded-2xl border border-[rgba(212,165,116,0.25)] py-3 text-sm font-medium text-[#D4A574] hover:bg-[rgba(212,165,116,0.08)]"
                >
                  返回首页
                </Link>
              </div>
            </>
          )}

          {status === 'pending' && (
            <>
              <div className="mx-auto h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-amber-600" />
              </div>
              <h1 className="mt-6 text-xl font-semibold text-amber-700">支付处理中</h1>
              <p className="mt-2 text-[#9A8B78]">{message}</p>
              <p className="mt-4 text-sm text-[#9A8B78]">
                如果长时间未到账，请联系客服。
              </p>
              <div className="mt-8 flex flex-col gap-3">
                <Link
                  href="/user"
                  className="w-full rounded-2xl bg-gradient-to-r from-[#D4A574] to-[#B8860B] py-3 text-sm font-semibold text-white"
                >
                  查看余额
                </Link>
                <Link
                  href="/dashboard/recharge"
                  className="w-full rounded-2xl border border-[rgba(212,165,116,0.25)] py-3 text-sm font-medium text-[#D4A574] hover:bg-[rgba(212,165,116,0.08)]"
                >
                  重新充值
                </Link>
              </div>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-[#9A8B78]">
          如有问题，请联系客服：support@lvzhi.com
        </p>
      </div>
    </div>
  )
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[rgba(212,165,116,0.08)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#9A8B78]" />
      </div>
    }>
      <PaymentCallbackContent />
    </Suspense>
  )
}
