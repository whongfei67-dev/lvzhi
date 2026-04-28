-- ============================================
-- 010: 扩展现有表以支持新系统
-- ============================================

-- ──────────────────────────────────────────
-- 1. 扩展 agents 表
-- ──────────────────────────────────────────
ALTER TABLE agents ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0 CHECK (view_count >= 0);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS trial_count INTEGER DEFAULT 0 CHECK (trial_count >= 0);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_agents_product ON agents(product_id);

COMMENT ON COLUMN agents.product_id IS '关联商品ID，用于付费智能体';
COMMENT ON COLUMN agents.view_count IS '浏览次数';
COMMENT ON COLUMN agents.trial_count IS '试用次数';
COMMENT ON COLUMN agents.metadata IS '扩展字段：点赞数、收藏数等';

-- ──────────────────────────────────────────
-- 2. 扩展 community_posts 表
-- ──────────────────────────────────────────
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL;
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0 CHECK (view_count >= 0);
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0 CHECK (comment_count >= 0);

CREATE INDEX IF NOT EXISTS idx_community_posts_product ON community_posts(product_id);

COMMENT ON COLUMN community_posts.product_id IS '关联商品ID，用于付费内容';
COMMENT ON COLUMN community_posts.view_count IS '浏览次数';
COMMENT ON COLUMN community_posts.comment_count IS '评论数';

-- ──────────────────────────────────────────
-- 3. 扩展 jobs 表
-- ──────────────────────────────────────────
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0 CHECK (view_count >= 0);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS application_count INTEGER DEFAULT 0 CHECK (application_count >= 0);

COMMENT ON COLUMN jobs.view_count IS '浏览次数';
COMMENT ON COLUMN jobs.application_count IS '申请人数';

-- ──────────────────────────────────────────
-- 4. 扩展 profiles 表
-- ──────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0 CHECK (follower_count >= 0);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0 CHECK (following_count >= 0);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned_until TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned_reason TEXT;

COMMENT ON COLUMN profiles.follower_count IS '粉丝数';
COMMENT ON COLUMN profiles.following_count IS '关注数';
COMMENT ON COLUMN profiles.is_verified IS '认证标识';
COMMENT ON COLUMN profiles.is_banned IS '封禁状态';

-- ──────────────────────────────────────────
-- 5. 触发器：更新帖子评论数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.target_type = 'post' THEN
    UPDATE community_posts
    SET comment_count = comment_count + 1
    WHERE id = NEW.target_id;
  ELSIF TG_OP = 'DELETE' AND OLD.target_type = 'post' THEN
    UPDATE community_posts
    SET comment_count = GREATEST(0, comment_count - 1)
    WHERE id = OLD.target_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_post_commented
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comment_count();

-- ──────────────────────────────────────────
-- 6. 触发器：更新用户关注数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_user_follow_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- 增加被关注者的粉丝数
    UPDATE profiles
    SET follower_count = follower_count + 1
    WHERE id = NEW.following_id;

    -- 增加关注者的关注数
    UPDATE profiles
    SET following_count = following_count + 1
    WHERE id = NEW.follower_id;
  ELSIF TG_OP = 'DELETE' THEN
    -- 减少被关注者的粉丝数
    UPDATE profiles
    SET follower_count = GREATEST(0, follower_count - 1)
    WHERE id = OLD.following_id;

    -- 减少关注者的关注数
    UPDATE profiles
    SET following_count = GREATEST(0, following_count - 1)
    WHERE id = OLD.follower_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_followed
  AFTER INSERT OR DELETE ON user_follows
  FOR EACH ROW
  EXECUTE FUNCTION update_user_follow_count();

-- ──────────────────────────────────────────
-- 7. 触发器：更新职位申请数
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_job_application_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE jobs
    SET application_count = application_count + 1
    WHERE id = NEW.job_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE jobs
    SET application_count = GREATEST(0, application_count - 1)
    WHERE id = OLD.job_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_job_applied
  AFTER INSERT OR DELETE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_job_application_count();

-- ──────────────────────────────────────────
-- 8. 创建视图：用户统计概览
-- ──────────────────────────────────────────
CREATE OR REPLACE VIEW user_stats AS
SELECT
  p.id AS user_id,
  p.display_name,
  p.role,
  p.follower_count,
  p.following_count,
  p.is_verified,
  COALESCE(ub.balance, 0) AS balance,
  COALESCE(agent_stats.agent_count, 0) AS agent_count,
  COALESCE(agent_stats.total_favorites, 0) AS total_favorites,
  COALESCE(post_stats.post_count, 0) AS post_count,
  COALESCE(post_stats.total_likes, 0) AS total_post_likes,
  COALESCE(order_stats.total_revenue, 0) AS total_revenue,
  COALESCE(order_stats.order_count, 0) AS order_count
FROM profiles p
LEFT JOIN user_balances ub ON ub.user_id = p.id
LEFT JOIN (
  SELECT
    creator_id,
    COUNT(*) AS agent_count,
    SUM((metadata->>'like_count')::int) AS total_favorites
  FROM agents
  WHERE status = 'active'
  GROUP BY creator_id
) agent_stats ON agent_stats.creator_id = p.id
LEFT JOIN (
  SELECT
    author_id,
    COUNT(*) AS post_count,
    SUM(like_count) AS total_likes
  FROM community_posts
  GROUP BY author_id
) post_stats ON post_stats.author_id = p.id
LEFT JOIN (
  SELECT
    pr.creator_id,
    SUM(o.amount) AS total_revenue,
    COUNT(o.id) AS order_count
  FROM orders o
  JOIN products pr ON pr.id = o.product_id
  WHERE o.status = 'paid'
  GROUP BY pr.creator_id
) order_stats ON order_stats.creator_id = p.id;

COMMENT ON VIEW user_stats IS '用户统计概览：粉丝、作品、收入等';

-- ──────────────────────────────────────────
-- 9. 创建视图：热门智能体排行
-- ──────────────────────────────────────────
CREATE OR REPLACE VIEW trending_agents AS
SELECT
  a.id,
  a.name,
  a.description,
  a.category,
  a.pricing_model,
  a.creator_id,
  p.display_name AS creator_name,
  p.is_verified AS creator_verified,
  a.view_count,
  a.trial_count,
  COALESCE((a.metadata->>'like_count')::int, 0) AS like_count,
  COALESCE(fav.favorite_count, 0) AS favorite_count,
  COALESCE(rating.avg_rating, 0) AS avg_rating,
  COALESCE(rating.rating_count, 0) AS rating_count,
  -- 热度分数：综合浏览、试用、收藏、评分
  (
    a.view_count * 0.1 +
    a.trial_count * 0.3 +
    COALESCE(fav.favorite_count, 0) * 0.4 +
    COALESCE(rating.avg_rating, 0) * COALESCE(rating.rating_count, 0) * 0.2
  ) AS trending_score,
  a.created_at
FROM agents a
JOIN profiles p ON p.id = a.creator_id
LEFT JOIN (
  SELECT agent_id, COUNT(*) AS favorite_count
  FROM agent_favorites
  GROUP BY agent_id
) fav ON fav.agent_id = a.id
LEFT JOIN (
  SELECT agent_id, AVG(score) AS avg_rating, COUNT(*) AS rating_count
  FROM agent_ratings
  GROUP BY agent_id
) rating ON rating.agent_id = a.id
WHERE a.status = 'active'
ORDER BY trending_score DESC;

COMMENT ON VIEW trending_agents IS '热门智能体排行：基于浏览、试用、收藏、评分的综合热度';

-- ──────────────────────────────────────────
-- 10. 创建视图：创作者排行
-- ──────────────────────────────────────────
CREATE OR REPLACE VIEW top_creators AS
SELECT
  p.id,
  p.display_name,
  p.avatar_url,
  p.bio,
  p.is_verified,
  p.follower_count,
  us.agent_count,
  us.total_favorites,
  us.post_count,
  us.total_revenue,
  -- 创作者影响力分数
  (
    p.follower_count * 0.3 +
    us.agent_count * 0.2 +
    us.total_favorites * 0.3 +
    us.total_revenue * 0.2
  ) AS influence_score,
  p.created_at
FROM profiles p
JOIN user_stats us ON us.user_id = p.id
WHERE p.role = 'creator'
ORDER BY influence_score DESC;

COMMENT ON VIEW top_creators IS '创作者排行：基于粉丝、作品、收藏、收入的综合影响力';
