-- Phase 1: 独立后台审核与审计基础

ALTER TABLE community_posts
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published';

ALTER TABLE community_posts
  ADD COLUMN IF NOT EXISTS risk_level TEXT NOT NULL DEFAULT 'low';

ALTER TABLE community_posts
  ADD COLUMN IF NOT EXISTS reviewed_by UUID;

ALTER TABLE community_posts
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

ALTER TABLE community_posts
  ADD COLUMN IF NOT EXISTS review_reason TEXT;

ALTER TABLE community_posts
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

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
);

CREATE INDEX IF NOT EXISTS idx_admin_actions_target_created
  ON admin_actions(target_type, created_at DESC);

