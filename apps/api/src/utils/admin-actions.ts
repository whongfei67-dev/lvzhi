import { query } from '../lib/database.js'

let adminActionsTableEnsured = false

export async function ensureAdminActionsTable(): Promise<void> {
  if (adminActionsTableEnsured) return
  await query(`
    CREATE TABLE IF NOT EXISTS admin_actions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      actor_id UUID NOT NULL,
      action_type TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id UUID,
      before_snapshot JSONB,
      after_snapshot JSONB,
      reason TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  await query(
    'CREATE INDEX IF NOT EXISTS idx_admin_actions_target_created ON admin_actions(target_type, created_at DESC)'
  )
  adminActionsTableEnsured = true
}

type LogAdminActionInput = {
  actorId: string
  actionType: string
  targetType: string
  targetId?: string | null
  beforeSnapshot?: unknown
  afterSnapshot?: unknown
  reason?: string | null
}

export async function logAdminAction(input: LogAdminActionInput): Promise<void> {
  await ensureAdminActionsTable()
  await query(
    `INSERT INTO admin_actions
      (actor_id, action_type, target_type, target_id, before_snapshot, after_snapshot, reason)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7)`,
    [
      input.actorId,
      input.actionType,
      input.targetType,
      input.targetId ?? null,
      input.beforeSnapshot === undefined ? null : JSON.stringify(input.beforeSnapshot),
      input.afterSnapshot === undefined ? null : JSON.stringify(input.afterSnapshot),
      input.reason ?? null,
    ]
  )
}
