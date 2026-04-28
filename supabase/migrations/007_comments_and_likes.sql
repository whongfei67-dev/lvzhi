-- ============================================
-- 007: 评论与点赞系统
-- ============================================

-- ──────────────────────────────────────────
-- 1. 通用评论表
-- ──────────────────────────────────────────
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('agent', 'post', 'product', 'job', 'comment')),
  target_id UUID NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(content) > 0 AND length(content) <= 5000),
  like_count INTEGER DEFAULT 0 CHECK (like_count >= 0),
  reply_count INTEGER DEFAULT 0 CHECK (reply_count >= 0),
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_target ON comments(target_type, target_id, created_at DESC) WHERE is_deleted = false;
CREATE INDEX idx_comments_user ON comments(user_id, created_at DESC);
CREATE INDEX idx_comments_parent ON comments(parent_id) WHERE parent_id IS NOT NULL;

COMMENT ON TABLE comments IS '通用评论表：支持智能体、帖子、商品、职位等多种实体';
COMMENT ON COLUMN comments.parent_id IS '父评论ID，支持多级回复';
COMMENT ON COLUMN comments.is_deleted IS '软删除标记';

-- ──────────────────────────────────────────
-- 2. 通用点赞表
-- ──────────────────────────────────────────
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('agent', 'post', 'comment', 'product', 'job')),
  target_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, target_type, target_id)
);

CREATE INDEX idx_likes_target ON likes(target_type, target_id);
CREATE INDEX idx_likes_user ON likes(user_id, created_at DESC);

COMMENT ON TABLE likes IS '通用点赞表：支持多种实体类型';

-- ──────────────────────────────────────────
-- 3. 触发器：更新评论回复数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_comment_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL THEN
    UPDATE comments
    SET reply_count = reply_count + 1,
        updated_at = NOW()
    WHERE id = NEW.parent_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NOT NULL THEN
    UPDATE comments
    SET reply_count = GREATEST(0, reply_count - 1),
        updated_at = NOW()
    WHERE id = OLD.parent_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_comment_reply
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_reply_count();

-- ──────────────────────────────────────────
-- 4. 触发器：更新评论点赞数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_comment_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.target_type = 'comment' THEN
    UPDATE comments
    SET like_count = like_count + 1,
        updated_at = NOW()
    WHERE id = NEW.target_id;
  ELSIF TG_OP = 'DELETE' AND OLD.target_type = 'comment' THEN
    UPDATE comments
    SET like_count = GREATEST(0, like_count - 1),
        updated_at = NOW()
    WHERE id = OLD.target_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_comment_liked
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_like_count();

-- ──────────────────────────────────────────
-- 5. 触发器：更新帖子点赞数（扩展现有 community_posts）
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.target_type = 'post' THEN
    UPDATE community_posts
    SET like_count = like_count + 1
    WHERE id = NEW.target_id;
  ELSIF TG_OP = 'DELETE' AND OLD.target_type = 'post' THEN
    UPDATE community_posts
    SET like_count = GREATEST(0, like_count - 1)
    WHERE id = OLD.target_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_post_liked
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_like_count();

-- ──────────────────────────────────────────
-- 6. 触发器：更新智能体点赞数（扩展现有 agents）
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_agent_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.target_type = 'agent' THEN
    UPDATE agents
    SET metadata = jsonb_set(
      COALESCE(metadata, '{}'),
      '{like_count}',
      to_jsonb(COALESCE((metadata->>'like_count')::int, 0) + 1)
    )
    WHERE id = NEW.target_id;
  ELSIF TG_OP = 'DELETE' AND OLD.target_type = 'agent' THEN
    UPDATE agents
    SET metadata = jsonb_set(
      COALESCE(metadata, '{}'),
      '{like_count}',
      to_jsonb(GREATEST(0, COALESCE((metadata->>'like_count')::int, 0) - 1))
    )
    WHERE id = OLD.target_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_agent_liked
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_like_count();

-- ──────────────────────────────────────────
-- 7. RLS 策略
-- ──────────────────────────────────────────
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Comments: 所有人可查看未删除评论，用户可管理自己的评论
CREATE POLICY "comments_select_all" ON comments
  FOR SELECT USING (is_deleted = false);

CREATE POLICY "comments_insert_authenticated" ON comments
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND user_id = auth.uid()
  );

CREATE POLICY "comments_update_own" ON comments
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "comments_delete_own" ON comments
  FOR DELETE USING (user_id = auth.uid());

-- Likes: 所有人可查看点赞，用户可管理自己的点赞
CREATE POLICY "likes_select_all" ON likes
  FOR SELECT USING (true);

CREATE POLICY "likes_insert_authenticated" ON likes
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND user_id = auth.uid()
  );

CREATE POLICY "likes_delete_own" ON likes
  FOR DELETE USING (user_id = auth.uid());
