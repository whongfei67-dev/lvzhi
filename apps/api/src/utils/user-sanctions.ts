import { query } from '../lib/database.js'

export type SanctionDuration = 'none' | '48h' | '7d' | '6m' | 'permanent'
export type SanctionScope = 'full' | 'trade_and_mute' | 'ranking_only'

let sanctionColumnsEnsured = false

const PERMANENT_UNTIL = '9999-12-31T23:59:59.000Z'

export async function ensureUserSanctionColumns() {
  if (sanctionColumnsEnsured) return
  try {
    await query('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS muted_until TIMESTAMPTZ')
    await query('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trade_restricted_until TIMESTAMPTZ')
    await query('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ranking_suspended_until TIMESTAMPTZ')
    await query('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS recommendation_suspended_until TIMESTAMPTZ')
    await query('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sanction_note TEXT')
    await query('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sanction_updated_at TIMESTAMPTZ')
  } catch (err) {
    console.warn('[sanctions] ensureUserSanctionColumns failed:', err)
  }
  sanctionColumnsEnsured = true
}

function toUntilIso(duration: SanctionDuration): string | null {
  const now = Date.now()
  if (duration === 'none') return null
  if (duration === '48h') return new Date(now + 48 * 60 * 60 * 1000).toISOString()
  if (duration === '7d') return new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString()
  if (duration === '6m') return new Date(now + 180 * 24 * 60 * 60 * 1000).toISOString()
  if (duration === 'permanent') return PERMANENT_UNTIL
  return null
}

function isFutureTime(value?: string | null): boolean {
  if (!value) return false
  const ts = new Date(value).getTime()
  return Number.isFinite(ts) && ts > Date.now()
}

export async function assertNotMuted(userId: string) {
  await ensureUserSanctionColumns()
  const result = await query<{ muted_until: string | null }>(
    'SELECT muted_until FROM profiles WHERE id = $1 LIMIT 1',
    [userId]
  )
  const mutedUntil = result.rows[0]?.muted_until || null
  if (isFutureTime(mutedUntil)) {
    throw new Error('当前账号处于禁言状态，暂不可发布或评论')
  }
}

export async function assertNotTradeRestricted(userId: string) {
  await ensureUserSanctionColumns()
  const result = await query<{ trade_restricted_until: string | null }>(
    'SELECT trade_restricted_until FROM profiles WHERE id = $1 LIMIT 1',
    [userId]
  )
  const restrictedUntil = result.rows[0]?.trade_restricted_until || null
  if (isFutureTime(restrictedUntil)) {
    throw new Error('当前账号处于限制下载/购买状态，请稍后再试')
  }
}

export async function applyUserSanction(options: {
  userId: string
  duration: SanctionDuration
  scope: SanctionScope
  note: string
}) {
  const { userId, duration, scope, note } = options
  await ensureUserSanctionColumns()
  const until = toUntilIso(duration)
  if (!until) {
    return null
  }
  const applyMute = scope === 'full' || scope === 'trade_and_mute'
  const applyTrade = scope === 'full' || scope === 'trade_and_mute'
  const applyRanking = scope === 'full' || scope === 'ranking_only'

  const result = await query(
    `UPDATE profiles
     SET muted_until = CASE
           WHEN $2 THEN GREATEST(COALESCE(muted_until, '1970-01-01'::timestamptz), $1::timestamptz)
           ELSE muted_until
         END,
         trade_restricted_until = CASE
           WHEN $3 THEN GREATEST(COALESCE(trade_restricted_until, '1970-01-01'::timestamptz), $1::timestamptz)
           ELSE trade_restricted_until
         END,
         ranking_suspended_until = CASE
           WHEN $4 THEN GREATEST(COALESCE(ranking_suspended_until, '1970-01-01'::timestamptz), $1::timestamptz)
           ELSE ranking_suspended_until
         END,
         recommendation_suspended_until = CASE
           WHEN $4 THEN GREATEST(COALESCE(recommendation_suspended_until, '1970-01-01'::timestamptz), $1::timestamptz)
           ELSE recommendation_suspended_until
         END,
         sanction_note = $5,
         sanction_updated_at = NOW()
     WHERE id = $6
     RETURNING id, muted_until, trade_restricted_until, ranking_suspended_until, recommendation_suspended_until, sanction_note`,
    [until, applyMute, applyTrade, applyRanking, note, userId]
  )
  return result.rows[0] || null
}
