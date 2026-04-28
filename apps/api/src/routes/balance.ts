/**
 * 余额与订单 API 路由
 */

import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { query, transaction } from '../lib/database.js'
import { success, created, errors, paginated } from '../utils/response.js'
import { createOrderSchema, withdrawSchema } from '../utils/validation.js'
import { verifyAlipaySign, verifyWechatSign, isSandboxMode, createAlipayPrecreateOrder, createWechatPayOrder } from '../utils/payment.js'
import type { JwtPayload } from '../types.js'
import { assertNotTradeRestricted, ensureUserSanctionColumns } from '../utils/user-sanctions.js'

export const balanceRoute: FastifyPluginAsync = async (app: FastifyInstance) => {
  let withdrawTableEnsured = false
  await ensureUserSanctionColumns()

  async function ensureWithdrawTable() {
    if (withdrawTableEnsured) return
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS withdraw_requests (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          amount NUMERIC(12, 2) NOT NULL,
          fee NUMERIC(12, 2) NOT NULL DEFAULT 0,
          actual_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
          account_type TEXT NOT NULL DEFAULT 'alipay',
          account TEXT NOT NULL DEFAULT '',
          account_name TEXT,
          status TEXT NOT NULL DEFAULT 'pending',
          rejection_reason TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          processed_at TIMESTAMPTZ
        )
      `)
      await query("ALTER TABLE withdraw_requests ADD COLUMN IF NOT EXISTS review_reason TEXT")
    } catch (err) {
      console.warn('[balance] ensureWithdrawTable failed:', err)
    }
    withdrawTableEnsured = true
  }

  async function getWithdrawPolicy() {
    const fallback = {
      min_amount: 10,
      max_amount: 50000,
      fee_rate: 0.05,
      daily_limit_count: 3,
    }
    try {
      const result = await query<{ config_json: Record<string, unknown> }>(
        `SELECT config_json FROM admin_policies WHERE policy_key = 'withdraw' LIMIT 1`
      )
      const cfg = result.rows[0]?.config_json || {}
      return {
        min_amount: Number(cfg.min_amount ?? fallback.min_amount),
        max_amount: Number(cfg.max_amount ?? fallback.max_amount),
        fee_rate: Number(cfg.fee_rate ?? fallback.fee_rate),
        daily_limit_count: Number(cfg.daily_limit_count ?? fallback.daily_limit_count),
      }
    } catch {
      return fallback
    }
  }

  // ============================================
  // GET /api/balance - 获取余额 (需要认证)
  // ============================================
  app.get('/api/balance', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const user = request.user as JwtPayload

    try {
      const result = await query(
        'SELECT user_id, balance, frozen_balance, updated_at FROM user_balances WHERE user_id = $1',
        [user.user_id]
      )

      if (result.rows.length === 0) {
        // 初始化余额
        await query(
          'INSERT INTO user_balances (user_id, balance, frozen_balance) VALUES ($1, 0, 0) ON CONFLICT (user_id) DO NOTHING',
          [user.user_id]
        )
        return success(reply, { balance: 0, frozen: 0 })
      }

      return success(reply, result.rows[0])

    } catch (err) {
      console.error('Get balance error:', err)
      return errors.internal(reply, 'Failed to get balance')
    }
  })

  // ============================================
  // GET /api/balance/transactions - 获取余额流水 (需要认证)
  // ============================================
  app.get('/api/balance/transactions', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const user = request.user as JwtPayload
    const {
      page = '1',
      pageSize = '20',
      type,
    } = request.query as {
      page?: string
      pageSize?: string
      type?: string
    }

    const pageNum = parseInt(page)
    const pageSizeNum = parseInt(pageSize)
    const offset = (pageNum - 1) * pageSizeNum

    try {
      const conditions: string[] = ['user_id = $1']
      const params: unknown[] = [user.user_id]
      let paramIndex = 2

      if (type) {
        conditions.push(`transaction_type = $${paramIndex++}`)
        params.push(type)
      }

      const whereClause = `WHERE ${conditions.join(' AND ')}`

      const countResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM balance_transactions ${whereClause}`,
        params
      )
      const total = parseInt(countResult.rows[0]?.count || '0')

      params.push(pageSizeNum, offset)
      const result = await query(
        `SELECT id, transaction_type, amount, balance_after,
                description, order_id, created_at
         FROM balance_transactions
         ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
        params
      )

      return paginated(reply, result.rows, total, pageNum, pageSizeNum)

    } catch (err) {
      console.error('Get transactions error:', err)
      return errors.internal(reply, 'Failed to get transactions')
    }
  })

  // ============================================
  // POST /api/balance/withdraw - 申请提现 (需要认证)
  // ============================================
  app.post('/api/balance/withdraw', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const validation = withdrawSchema.safeParse(request.body)
    if (!validation.success) {
      return errors.badRequest(reply, validation.error.errors[0].message)
    }

    const user = request.user as JwtPayload
    const { amount, type, account, account_name } = validation.data

    try {
      await ensureWithdrawTable()
      const withdrawPolicy = await getWithdrawPolicy()
      // 检查余额
      const balance = await query<{ balance: number }>(
        'SELECT balance FROM user_balances WHERE user_id = $1',
        [user.user_id]
      )

      if (balance.rows.length === 0 || balance.rows[0].balance < amount) {
        return errors.badRequest(reply, 'Insufficient balance')
      }

      if (amount < withdrawPolicy.min_amount) {
        return errors.badRequest(reply, `Minimum withdrawal is ${withdrawPolicy.min_amount} credits`)
      }

      if (amount > withdrawPolicy.max_amount) {
        return errors.badRequest(reply, `Maximum withdrawal is ${withdrawPolicy.max_amount} credits`)
      }

      const dailyCount = await query<{ count: string }>(
        `SELECT COUNT(*)::text as count
         FROM withdraw_requests
         WHERE user_id = $1
           AND created_at >= DATE_TRUNC('day', NOW())`,
        [user.user_id]
      )
      if (parseInt(dailyCount.rows[0]?.count || '0') >= withdrawPolicy.daily_limit_count) {
        return errors.badRequest(reply, `Daily withdrawal limit is ${withdrawPolicy.daily_limit_count} times`)
      }

      const fee = Math.floor(amount * withdrawPolicy.fee_rate)
      const actualAmount = amount - fee

      // 创建提现记录
      const result = await transaction(async (client) => {
        // 扣除余额
        await client.query(
          'UPDATE user_balances SET balance = balance - $1 WHERE user_id = $2',
          [amount, user.user_id]
        )

        // 创建提现记录
        const withdrawResult = await client.query(
          `INSERT INTO withdraw_requests (user_id, amount, fee, actual_amount, account_type, account, account_name, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
           RETURNING *`,
          [user.user_id, amount, fee, actualAmount, type, account, account_name]
        )

        // 记录流水
        await client.query(
          `INSERT INTO balance_transactions (user_id, transaction_type, amount, balance_after, description)
           VALUES ($1, 'withdrawal', $2, $3, $4)`,
          [user.user_id, -amount, balance.rows[0].balance - amount - fee, `提现到${type === 'alipay' ? '支付宝' : '银行'}`]
        )

        return withdrawResult
      })

      return created(reply, result.rows[0], 'Withdrawal request submitted')

    } catch (err) {
      console.error('Withdraw error:', err)
      return errors.internal(reply, 'Failed to submit withdrawal')
    }
  })

  // ============================================
  // GET /api/balance/withdraw/records - 获取提现记录 (需要认证)
  // ============================================
  app.get('/api/balance/withdraw/records', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const user = request.user as JwtPayload
    const { page = '1', pageSize = '20' } = request.query as { page?: string; pageSize?: string }

    const pageNum = parseInt(page)
    const pageSizeNum = parseInt(pageSize)
    const offset = (pageNum - 1) * pageSizeNum

    try {
      await ensureWithdrawTable()
      const countResult = await query<{ count: string }>(
        'SELECT COUNT(*) as count FROM withdraw_requests WHERE user_id = $1',
        [user.user_id]
      )
      const total = parseInt(countResult.rows[0]?.count || '0')

      const result = await query(
        `SELECT id, amount, fee, actual_amount, account_type, account, account_name,
                status, rejection_reason, created_at, processed_at
         FROM withdraw_requests
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [user.user_id, pageSizeNum, offset]
      )

      return paginated(reply, result.rows, total, pageNum, pageSizeNum)

    } catch (err) {
      console.error('Get withdraw records error:', err)
      return errors.internal(reply, 'Failed to get records')
    }
  })
}

// ============================================
// 订单相关路由
// ============================================

export const orderRoute: FastifyPluginAsync = async (app: FastifyInstance) => {

  // ============================================
  // GET /api/products - 获取产品列表
  // ============================================
  app.get('/api/products', async (request, reply) => {
    try {
      const result = await query(
        `SELECT id, name, description, price, currency, status, created_at
         FROM products
         WHERE status = 'active'
         ORDER BY price ASC`
      )

      return success(reply, result.rows)

    } catch (err) {
      console.error('Get products error:', err)
      return errors.internal(reply, 'Failed to get products')
    }
  })

  // ============================================
  // GET /api/products/:id - 获取产品详情
  // ============================================
  app.get<{ Params: { id: string } }>('/api/products/:id', async (request, reply) => {
    const { id } = request.params

    try {
      const result = await query(
        `SELECT id, name, description, price, currency, status, created_at
         FROM products
         WHERE id = $1 AND status = 'active'`,
        [id]
      )

      if (result.rows.length === 0) {
        return errors.notFound(reply, 'Product not found')
      }

      return success(reply, result.rows[0])

    } catch (err) {
      console.error('Get product error:', err)
      return errors.internal(reply, 'Failed to get product')
    }
  })

  // ============================================
  // POST /api/orders - 创建订单 (需要认证)
  // ============================================
  app.post('/api/orders', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const validation = createOrderSchema.safeParse(request.body)
    if (!validation.success) {
      return errors.badRequest(reply, validation.error.errors[0].message)
    }

    const user = request.user as JwtPayload
    const { product_id, payment_method } = validation.data

    try {
      await assertNotTradeRestricted(String(user.user_id || user.id || ''))
      // 获取产品信息
      const product = await query<{ id: string; name: string; price: number }>(
        'SELECT id, name, price FROM products WHERE id = $1 AND status = $2',
        [product_id, 'active']
      )

      if (product.rows.length === 0) {
        return errors.notFound(reply, 'Product not found')
      }

      // 如果使用余额支付
      if (payment_method === 'balance') {
        const balance = await query<{ balance: number }>(
          'SELECT balance FROM user_balances WHERE user_id = $1',
          [user.user_id]
        )

        if (balance.rows.length === 0 || balance.rows[0].balance < product.rows[0].price) {
          return errors.badRequest(reply, 'Insufficient balance')
        }

        // 直接扣款
        const result = await transaction(async (client) => {
          // 先获取当前余额
          const currentBalance = await client.query(
            'SELECT balance FROM user_balances WHERE user_id = $1 FOR UPDATE',
            [user.user_id]
          )
          
          const newBalance = currentBalance.rows[0].balance - product.rows[0].price
          
          await client.query(
            'UPDATE user_balances SET balance = $1, total_consumed = total_consumed + $2, updated_at = NOW() WHERE user_id = $3',
            [newBalance, product.rows[0].price, user.user_id]
          )

          const orderResult = await client.query(
            `INSERT INTO orders (user_id, product_id, order_type, biz_type, amount, status, payment_method)
             VALUES ($1, $2, 'purchase', 'general', $3, 'paid', 'balance')
             RETURNING *`,
            [user.user_id, product_id, product.rows[0].price]
          )

          await client.query(
            `INSERT INTO balance_transactions (user_id, order_id, transaction_type, amount, balance_after, description)
             VALUES ($1, $2, 'purchase', $3, $4, $5)`,
            [user.user_id, orderResult.rows[0].id, -product.rows[0].price, newBalance, `购买 ${product.rows[0].name}`]
          )

          return orderResult
        })

        return created(reply, result.rows[0], 'Order completed')

      } else {
        // 创建待支付订单
        const result = await query(
          `INSERT INTO orders (user_id, product_id, order_type, biz_type, amount, status, payment_method)
           VALUES ($1, $2, 'purchase', 'general', $3, 'pending', $4)
           RETURNING id, user_id, product_id, order_type, amount, status, payment_method, created_at`,
          [user.user_id, product_id, product.rows[0].price, payment_method]
        )

        return created(reply, result.rows[0], 'Order created')

      }

    } catch (err) {
      console.error('Create order error:', err)
      if (err instanceof Error && err.message.includes('限制下载/购买')) {
        return errors.forbidden(reply, err.message)
      }
      return errors.internal(reply, 'Failed to create order')
    }
  })

  // ============================================
  // GET /api/orders - 获取订单列表 (需要认证)
  // ============================================
  app.get('/api/orders', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const user = request.user as JwtPayload
    const { page = '1', pageSize = '20', status } = request.query as {
      page?: string
      pageSize?: string
      status?: string
    }

    const pageNum = parseInt(page)
    const pageSizeNum = parseInt(pageSize)
    const offset = (pageNum - 1) * pageSizeNum

    try {
      const conditions: string[] = ['o.user_id = $1']
      const params: unknown[] = [user.user_id]
      let paramIndex = 2

      if (status) {
        conditions.push(`o.status = $${paramIndex++}`)
        params.push(status)
      }

      const whereClause = `WHERE ${conditions.join(' AND ')}`

      const countResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM orders o ${whereClause}`,
        params
      )
      const total = parseInt(countResult.rows[0]?.count || '0')

      params.push(pageSizeNum, offset)
      const result = await query(
        `SELECT o.id, o.product_id, o.amount, o.status, o.payment_method,
                o.payment_id, o.created_at, o.paid_at,
                p.name as product_name
         FROM orders o
         JOIN products p ON p.id = o.product_id
         ${whereClause}
         ORDER BY o.created_at DESC
         LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
        params
      )

      return paginated(reply, result.rows, total, pageNum, pageSizeNum)

    } catch (err) {
      console.error('Get orders error:', err)
      return errors.internal(reply, 'Failed to get orders')
    }
  })

  // ============================================
  // GET /api/orders/:id - 获取订单详情 (需要认证)
  // ============================================
  app.get<{ Params: { id: string } }>('/api/orders/:id', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { id } = request.params
    const user = request.user as JwtPayload

    try {
      const result = await query(
        `SELECT o.id, o.product_id, o.amount, o.status, o.payment_method,
                o.payment_id, o.created_at, o.paid_at,
                p.name as product_name
         FROM orders o
         JOIN products p ON p.id = o.product_id
         WHERE o.id = $1 AND o.user_id = $2`,
        [id, user.user_id]
      )

      if (result.rows.length === 0) {
        return errors.notFound(reply, 'Order not found')
      }

      return success(reply, result.rows[0])

    } catch (err) {
      console.error('Get order error:', err)
      return errors.internal(reply, 'Failed to get order')
    }
  })

  // ============================================
  // POST /api/payments/alipay - 发起支付宝支付
  // ============================================
  app.post('/api/payments/alipay', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { order_id } = request.body as { order_id?: string }

    if (!order_id) {
      return errors.badRequest(reply, 'Order ID is required')
    }

    const user = request.user as JwtPayload

    try {
      // 验证订单
      const order = await query<{ id: string; amount: number; status: string }>(
        'SELECT id, amount, status FROM orders WHERE id = $1 AND user_id = $2',
        [order_id, user.user_id]
      )

      if (order.rows.length === 0) {
        return errors.notFound(reply, 'Order not found')
      }

      if (order.rows[0].status !== 'pending') {
        return errors.badRequest(reply, 'Order already paid or cancelled')
      }

      // 根据环境选择沙箱或真实支付
      const result = await createAlipayPrecreateOrder(
        order_id,
        order.rows[0].amount,
        '律植积分充值'
      )

      return success(reply, {
        order_id,
        payment_url: result.qrCode,
        qr_code: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      })

    } catch (err) {
      console.error('Alipay error:', err)
      return errors.internal(reply, 'Failed to initiate payment')
    }
  })

  // ============================================
  // POST /api/payments/alipay/callback - 支付宝回调
  // ============================================
  app.post('/api/payments/alipay/callback', async (request, reply) => {
    const body = request.body as Record<string, string>

    try {
      // 沙箱模式跳过验证
      if (isSandboxMode()) {
        console.log('[SANDBOX] Alipay callback received (verification skipped)')
      } else {
        // 生产环境验证支付宝签名
        const publicKey = process.env.ALIPAY_PUBLIC_KEY || ''
        if (publicKey && !verifyAlipaySign(body, publicKey)) {
          console.error('Alipay sign verification failed')
          return reply.send('fail')
        }
      }

      const { out_trade_no, trade_status, trade_no } = body

      if (trade_status === 'TRADE_SUCCESS') {
        // 幂等性处理：使用 UPDATE ... RETURNING 检查是否实际更新了订单
        const updateResult = await transaction(async (client) => {
          const result = await client.query<{ id: string; user_id: string; amount: number }>(
            `UPDATE orders SET status = 'paid', payment_id = $1, paid_at = NOW()
             WHERE id = $2 AND status = 'pending'
             RETURNING id, user_id, amount`,
            [trade_no, out_trade_no]
          )
          return result
        })

        // 只有在订单实际被更新时才处理余额（幂等性保证）
        if (updateResult.rows.length > 0) {
          const order = updateResult.rows[0]
          await transaction(async (client) => {
            await client.query(
              'UPDATE user_balances SET balance = balance + $1, total_recharged = total_recharged + $1, updated_at = NOW() WHERE user_id = $2',
              [order.amount, order.user_id]
            )

            await client.query(
              `INSERT INTO balance_transactions (user_id, order_id, transaction_type, amount, balance_after, description)
               VALUES ($1, $2, 'recharge', $3, (SELECT balance FROM user_balances WHERE user_id = $1), $4)`,
              [order.user_id, out_trade_no, order.amount, `余额充值`]
            )
          })
        }

        console.log(`[PAYMENT] Alipay paid: ${out_trade_no}`)
      }

      return reply.send('success')

    } catch (err) {
      console.error('Alipay callback error:', err)
      return reply.send('fail')
    }
  })

  // ============================================
  // POST /api/payments/wechat - 发起微信支付
  // ============================================
  app.post('/api/payments/wechat', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { order_id } = request.body as { order_id?: string }

    if (!order_id) {
      return errors.badRequest(reply, 'Order ID is required')
    }

    const user = request.user as JwtPayload

    try {
      const order = await query<{ id: string; amount: number; status: string }>(
        'SELECT id, amount, status FROM orders WHERE id = $1 AND user_id = $2',
        [order_id, user.user_id]
      )

      if (order.rows.length === 0) {
        return errors.notFound(reply, 'Order not found')
      }

      if (order.rows[0].status !== 'pending') {
        return errors.badRequest(reply, 'Order already paid or cancelled')
      }

      // 根据环境选择沙箱或真实支付
      const result = await createWechatPayOrder(
        order_id,
        order.rows[0].amount,
        '律植积分充值'
      )

      return success(reply, {
        order_id,
        code_url: result.codeUrl,
      })

    } catch (err) {
      console.error('Wechat pay error:', err)
      return errors.internal(reply, 'Failed to initiate payment')
    }
  })

  // ============================================
  // POST /api/payments/wechat/callback - 微信支付回调
  // ============================================
  app.post('/api/payments/wechat/callback', async (request, reply) => {
    const body = request.body as Record<string, string>

    try {
      // 沙箱模式跳过验证
      if (isSandboxMode()) {
        console.log('[SANDBOX] Wechat callback received (verification skipped)')
      } else {
        // 生产环境验证微信支付签名
        const apiKey = process.env.WECHAT_API_KEY || ''
        if (apiKey && !verifyWechatSign(body, apiKey)) {
          console.error('Wechat sign verification failed')
          return reply.send('<xml><return_code><![CDATA[FAIL]]></return_code></xml>')
        }
      }

      const { out_trade_no, transaction_id, return_code } = body

      if (return_code === 'SUCCESS') {
        // 幂等性处理：使用 UPDATE ... RETURNING 检查是否实际更新了订单
        const updateResult = await transaction(async (client) => {
          const result = await client.query<{ id: string; user_id: string; amount: number }>(
            `UPDATE orders SET status = 'paid', payment_id = $1, paid_at = NOW()
             WHERE id = $2 AND status = 'pending'
             RETURNING id, user_id, amount`,
            [transaction_id, out_trade_no]
          )
          return result
        })

        // 只有在订单实际被更新时才处理余额（幂等性保证）
        if (updateResult.rows.length > 0) {
          const order = updateResult.rows[0]
          await transaction(async (client) => {
            await client.query(
              'UPDATE user_balances SET balance = balance + $1, total_recharged = total_recharged + $1, updated_at = NOW() WHERE user_id = $2',
              [order.amount, order.user_id]
            )

            await client.query(
              `INSERT INTO balance_transactions (user_id, order_id, transaction_type, amount, balance_after, description)
               VALUES ($1, $2, 'recharge', $3, (SELECT balance FROM user_balances WHERE user_id = $1), $4)`,
              [order.user_id, out_trade_no, order.amount, `余额充值`]
            )
          })
        }

        console.log(`[PAYMENT] Wechat paid: ${out_trade_no}`)
      }

      return reply.send('<xml><return_code><![CDATA[SUCCESS]]></return_code></xml>')

    } catch (err) {
      console.error('Wechat callback error:', err)
      return reply.send('<xml><return_code><![CDATA[FAIL]]></return_code></xml>')
    }
  })
}
