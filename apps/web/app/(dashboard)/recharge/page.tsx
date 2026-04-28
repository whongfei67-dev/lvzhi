"use client"

import React, { useEffect, useState } from 'react'
import { api, storage } from '@/lib/api/client'
import type { Product } from '@/lib/api/types'
import { Wallet, CreditCard, Check, AlertCircle } from 'lucide-react'

const products: Product[] = [
  { id: '1', name: '基础套餐', description: '适合轻度用户', price: 10, credits: 100, bonus_credits: 0 },
  { id: '2', name: '标准套餐', description: '最受欢迎', price: 50, credits: 550, bonus_credits: 50 },
  { id: '3', name: '高级套餐', description: '适合频繁使用', price: 100, credits: 1200, bonus_credits: 200 },
  { id: '4', name: '专业套餐', description: '企业级用户', price: 500, credits: 6500, bonus_credits: 1500 },
]

export default function RechargePage() {
  const [balance, setBalance] = useState<number>(0)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'alipay' | 'wechat' | 'balance'>('balance')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)

  useEffect(() => {
    // Token 通过 HttpOnly Cookie 设置，无需手动检查
    async function fetchBalance() {
      try {
        const data = await api.balance.getBalance()
        setBalance(data.balance)
      } catch {
        // 可能没有余额记录
      }
    }
    fetchBalance()
  }, [])

  const handleRecharge = async () => {
    if (!selectedProduct) return

    setLoading(true)
    setError(null)

    try {
      // 创建订单
      const order = await api.orders.create({
        product_id: selectedProduct.id,
        payment_method: paymentMethod,
      })

      if (paymentMethod === 'balance') {
        // 余额支付直接成功
        setSuccess(true)
        setOrderId(order.id)
        // 刷新余额
        const data = await api.balance.getBalance()
        setBalance(data.balance)
      } else {
        // 第三方支付
        let paymentResult
        if (paymentMethod === 'alipay') {
          paymentResult = await api.orders.payAlipay(order.id)
          // 打开支付链接
          if (paymentResult.payment_url) {
            window.location.href = paymentResult.payment_url
            return
          }
        } else {
          paymentResult = await api.orders.payWechat(order.id)
          // 微信支付二维码
          if (paymentResult.code_url) {
            setOrderId(order.id)
            // TODO: 显示二维码
          }
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '充值失败'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[rgba(212,165,116,0.08)] text-[#2C2416]">
      <main className="mx-auto max-w-4xl px-6 py-10 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#2C2416]">充值积分</h1>
          <p className="mt-2 text-[#9A8B78]">选择套餐，快速获取积分</p>
        </div>

        {/* Current Balance */}
        <div className="mb-8 rounded-3xl border border-[rgba(212,165,116,0.25)] bg-[rgba(212,165,116,0.08)] p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(212,165,116,0.15)]">
                <Wallet className="h-6 w-6 text-[#D4A574]" />
              </div>
              <div>
                <div className="text-sm text-[#D4A574]">当前余额</div>
                <div className="text-3xl font-bold text-[#B8860B]">{balance} <span className="text-lg font-normal">积分</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-[#2C2416]">选择套餐</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className={`relative rounded-2xl border p-5 text-left transition-all ${
                  selectedProduct?.id === product.id
                    ? 'border-[#B8860B] bg-[rgba(212,165,116,0.08)] ring-2 ring-blue-500'
                    : 'border-[rgba(212,165,116,0.25)] bg-white hover:border-[#B8A88A]'
                }`}
              >
                {product.bonus_credits > 0 && (
                  <div className="absolute -top-3 right-4 rounded-full bg-gradient-to-r from-[#D4A574] to-[#B8860B] px-3 py-1 text-xs font-medium text-white">
                    赠送 {product.bonus_credits}
                  </div>
                )}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-[#2C2416]">{product.name}</div>
                    <div className="mt-1 text-sm text-[#9A8B78]">{product.description}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[#2C2416]">¥{product.price}</div>
                    <div className="text-sm text-[#D4A574]">{product.credits + product.bonus_credits} 积分</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Payment Method */}
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-[#2C2416]">支付方式</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <button
              onClick={() => setPaymentMethod('balance')}
              className={`flex items-center gap-3 rounded-2xl border p-4 transition-all ${
                paymentMethod === 'balance'
                  ? 'border-[#B8860B] bg-[rgba(212,165,116,0.08)]'
                  : 'border-[rgba(212,165,116,0.25)] bg-white hover:border-[#B8A88A]'
              }`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(212,165,116,0.08)]">
                <Wallet className="h-5 w-5 text-[#D4A574]" />
              </div>
              <div className="text-left">
                <div className="font-medium text-[#2C2416]">余额支付</div>
                <div className="text-xs text-[#9A8B78]">立即到账</div>
              </div>
              {paymentMethod === 'balance' && (
                <Check className="ml-auto h-5 w-5 text-[#D4A574]" />
              )}
            </button>
            <button
              onClick={() => setPaymentMethod('alipay')}
              className={`flex items-center gap-3 rounded-2xl border p-4 transition-all ${
                paymentMethod === 'alipay'
                  ? 'border-[#B8860B] bg-[rgba(212,165,116,0.08)]'
                  : 'border-[rgba(212,165,116,0.25)] bg-white hover:border-[#B8A88A]'
              }`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(212,165,116,0.08)]">
                <CreditCard className="h-5 w-5 text-[#D4A574]" />
              </div>
              <div className="text-left">
                <div className="font-medium text-[#2C2416]">支付宝</div>
                <div className="text-xs text-[#9A8B78]">安全快捷</div>
              </div>
              {paymentMethod === 'alipay' && (
                <Check className="ml-auto h-5 w-5 text-[#D4A574]" />
              )}
            </button>
            <button
              onClick={() => setPaymentMethod('wechat')}
              className={`flex items-center gap-3 rounded-2xl border p-4 transition-all ${
                paymentMethod === 'wechat'
                  ? 'border-[#B8860B] bg-[rgba(212,165,116,0.08)]'
                  : 'border-[rgba(212,165,116,0.25)] bg-white hover:border-[#B8A88A]'
              }`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.098-.913 2.644-1.452 4.397-1.452 4.153 0 7.349 2.797 7.349 6.18 0 3.383-3.196 6.18-7.349 6.18-2.009 0-3.862-.725-5.296-1.97a6.345 6.345 0 0 1-1.792 1.023l-.019.01a7.484 7.484 0 0 1-3.624.946A4.373 4.373 0 0 1 6.502 19a4.413 4.413 0 0 1-2.664-.93l-.004-.003a4.416 4.416 0 0 1-2.45-3.854c0-1.144.438-2.189 1.163-3.014l.004.003a4.374 4.374 0 0 1 1.833-1.033A4.39 4.39 0 0 1 8.69 2.188m3.14 13.276a4.425 4.425 0 0 1 2.664.93l.004.003a4.416 4.416 0 0 1 2.45 3.854c0 1.144-.438 2.189-1.163 3.014l-.004-.003a4.374 4.374 0 0 1-1.833 1.033 4.39 4.39 0 0 1-4.122-.26zm1.657-1.34c.403-.26.865-.417 1.366-.417a2.43 2.43 0 0 1 2.317 1.63 2.43 2.43 0 0 1-.7 2.545 2.426 2.426 0 0 1-1.617.566c-.501 0-.963-.157-1.366-.417a2.43 2.43 0 0 1-1.366-2.317 2.425 2.425 0 0 1 .366-1.59z"/>
                </svg>
              </div>
              <div className="text-left">
                <div className="font-medium text-[#2C2416]">微信支付</div>
                <div className="text-xs text-[#9A8B78]">安全快捷</div>
              </div>
              {paymentMethod === 'wechat' && (
                <Check className="ml-auto h-5 w-5 text-[#D4A574]" />
              )}
            </button>
          </div>
        </div>

        {/* Error/Success */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div className="text-sm text-red-600">{error}</div>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-[rgba(212,165,116,0.25)] bg-[rgba(212,165,116,0.08)] p-4">
            <Check className="h-5 w-5 text-[#D4A574]" />
            <div className="text-sm text-[#D4A574]">
              充值成功！订单号：{orderId}，积分已到账。
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleRecharge}
          disabled={!selectedProduct || loading}
          className="w-full rounded-2xl bg-gradient-to-r from-[#D4A574] to-[#B8860B] py-4 text-lg font-semibold text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          {loading ? '处理中...' : selectedProduct ? `立即支付 ¥${selectedProduct.price}` : '请选择套餐'}
        </button>

        {/* Notes */}
        <div className="mt-6 rounded-2xl bg-[rgba(212,165,116,0.08)] p-4">
          <h3 className="font-medium text-[#D4A574]">充值说明</h3>
          <ul className="mt-2 space-y-1 text-sm text-[#9A8B78]">
            <li>• 积分支付成功后即时到账</li>
            <li>• 赠送积分与购买积分使用方法相同</li>
            <li>• 积分不可提现，不可转让</li>
            <li>• 如有问题，请联系客服</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
