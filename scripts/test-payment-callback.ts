/**
 * 沙箱测试脚本
 *
 * 用于测试支付回调功能，模拟真实支付通知
 *
 * 使用方法：
 * 1. 启动 API 服务: npm run dev
 * 2. 运行此脚本: npx tsx scripts/test-payment-callback.ts
 */

import crypto from 'crypto'

// 配置
const API_BASE = process.env.API_BASE || 'http://localhost:3001'

// 生成测试订单
async function createTestOrder() {
  // TODO: 创建测试订单的逻辑
  console.log('[TEST] 创建测试订单...')
}

// 模拟支付宝回调
function mockAlipayCallback(orderId: string, amount: number) {
  const params = {
    out_trade_no: orderId,
    trade_status: 'TRADE_SUCCESS',
    trade_no: `20260330${Date.now()}`,
    total_amount: amount.toString(),
    seller_id: '2088000000000000',
    buyer_logon_id: '159****1234',
    gmt_payment: new Date().toISOString(),
  }

  // 生成签名（沙箱模式下使用简化签名）
  const signParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key as keyof typeof params]}`)
    .join('&')

  const sign = crypto
    .createHmac('sha256', 'sandbox_secret')
    .update(signParams)
    .digest('base64')

  return { ...params, sign }
}

// 模拟微信支付回调
function mockWechatCallback(orderId: string, amount: number) {
  const params = {
    return_code: 'SUCCESS',
    return_msg: 'OK',
    appid: 'wx0000000000000000',
    mch_id: '0000000',
    nonce_str: crypto.randomBytes(16).toString('hex'),
    sign: '',
    result_code: 'SUCCESS',
    out_trade_no: orderId,
    transaction_id: `40${Date.now()}`,
    total_fee: (amount * 100).toString(),
    cash_fee: (amount * 100).toString(),
    time_end: new Date().toISOString().replace(/[-:]/g, '').split('.')[0],
  }

  // 生成签名
  const signParams = Object.keys(params)
    .filter(k => k !== 'sign')
    .sort()
    .map(key => `${key}=${params[key as keyof typeof params]}`)
    .join('&')

  params.sign = crypto
    .createHmac('sha256', 'sandbox_api_key')
    .update(signParams + '&key=sandbox_api_key')
    .digest('hex')
    .toUpperCase()

  return params
}

// 发送回调到 API
async function sendCallback(type: 'alipay' | 'wechat', params: Record<string, string>) {
  const endpoint = type === 'alipay'
    ? '/api/payments/alipay/callback'
    : '/api/payments/wechat/callback'

  console.log(`[TEST] 发送 ${type} 回调...`)

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  const result = await response.text()
  console.log(`[TEST] 回调响应: ${response.status} - ${result}`)

  return response.ok
}

// 主函数
async function main() {
  const orderId = 'test_order_' + Date.now()
  const amount = 10 // 10 元

  console.log('='.repeat(50))
  console.log('支付沙箱测试')
  console.log('='.repeat(50))

  // 测试支付宝
  console.log('\n[1] 测试支付宝回调')
  const alipayParams = mockAlipayCallback(orderId, amount)
  const alipayResult = await sendCallback('alipay', alipayParams)
  console.log(`支付宝测试: ${alipayResult ? '✅ 通过' : '❌ 失败'}`)

  // 测试微信支付
  console.log('\n[2] 测试微信支付回调')
  const wechatParams = mockWechatCallback(orderId, amount)
  const wechatResult = await sendCallback('wechat', wechatParams)
  console.log(`微信支付测试: ${wechatResult ? '✅ 通过' : '❌ 失败'}`)

  console.log('\n' + '='.repeat(50))
  console.log('测试完成')
  console.log('='.repeat(50))
}

main().catch(console.error)