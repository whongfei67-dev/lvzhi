-- ============================================
-- 律植项目数据库迁移脚本 v2.1
-- 版本: v2.1 - 适配现有数据库（分步执行）
-- 说明: 创建缺失的表，跳过已存在的表
-- ============================================

-- ============================================
-- 步骤1: 创建新表（使用 IF NOT EXISTS）
-- ============================================

-- 1.1 创建 opportunities 表
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publisher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  publisher_role VARCHAR(20) NOT NULL DEFAULT 'client',
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  summary TEXT,
  description TEXT,
  cover_image VARCHAR(500),
  opportunity_type VARCHAR(50) NOT NULL DEFAULT 'job',
  category VARCHAR(100),
  industry VARCHAR(100),
  location VARCHAR(200),
  location_type VARCHAR(20) DEFAULT 'onsite',
  budget DECIMAL(12, 2),
  compensation_type VARCHAR(50),
  contact_email VARCHAR(255),
  contact_wechat VARCHAR(100),
  deadline TIMESTAMP WITH TIME ZONE,
  status VARCHAR(30) NOT NULL DEFAULT 'pending_review',
  view_count INTEGER DEFAULT 0,
  application_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opportunities_publisher ON opportunities(publisher_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_type ON opportunities(opportunity_type);
CREATE INDEX IF NOT EXISTS idx_opportunities_featured ON opportunities(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_opportunities_slug ON opportunities(slug);

-- 1.2 创建 invitations 表
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sender_role VARCHAR(20) NOT NULL,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_role VARCHAR(20) NOT NULL,
  source_type VARCHAR(50) NOT NULL,
  source_id UUID NOT NULL,
  invitation_type VARCHAR(50) NOT NULL,
  message TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invitations_sender ON invitations(sender_id);
CREATE INDEX IF NOT EXISTS idx_invitations_receiver ON invitations(receiver_id);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_source ON invitations(source_type, source_id);

-- 1.3 创建 trials 表
CREATE TABLE IF NOT EXISTS trials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source_type VARCHAR(20) NOT NULL,
  source_id UUID NOT NULL,
  message TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trials_creator ON trials(creator_id);
CREATE INDEX IF NOT EXISTS idx_trials_target ON trials(target_user_id);
CREATE INDEX IF NOT EXISTS idx_trials_status ON trials(status);
CREATE INDEX IF NOT EXISTS idx_trials_source ON trials(source_type, source_id);

-- 1.4 创建 creator_guides 表
CREATE TABLE IF NOT EXISTS creator_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  summary TEXT,
  content TEXT,
  section VARCHAR(50) NOT NULL DEFAULT 'getting-started',
  category VARCHAR(100),
  order_index INTEGER DEFAULT 0,
  guide_type VARCHAR(20) DEFAULT 'article',
  video_url VARCHAR(500),
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guides_section ON creator_guides(section);
CREATE INDEX IF NOT EXISTS idx_guides_status ON creator_guides(status);
CREATE INDEX IF NOT EXISTS idx_guides_slug ON creator_guides(slug);

-- 1.5 创建 creator_verifications 表
CREATE TABLE IF NOT EXISTS creator_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  verification_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  materials JSONB DEFAULT '{}',
  review_note TEXT,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verifications_creator ON creator_verifications(creator_id);
CREATE INDEX IF NOT EXISTS idx_verifications_type ON creator_verifications(verification_type);
CREATE INDEX IF NOT EXISTS idx_verifications_status ON creator_verifications(status);

-- 1.6 创建 creator_earnings 表
CREATE TABLE IF NOT EXISTS creator_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source_type VARCHAR(20) NOT NULL,
  source_id UUID NOT NULL,
  order_id UUID,
  gross_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  platform_fee DECIMAL(12, 2) NOT NULL DEFAULT 0,
  net_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  settled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_earnings_creator ON creator_earnings(creator_id);
CREATE INDEX IF NOT EXISTS idx_earnings_status ON creator_earnings(status);
CREATE INDEX IF NOT EXISTS idx_earnings_source ON creator_earnings(source_type, source_id);

-- 1.7 创建 notifications 表
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, is_read);

-- 1.8 创建 ip_applications 表
CREATE TABLE IF NOT EXISTS ip_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source_type VARCHAR(20) NOT NULL,
  source_id UUID NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  materials JSONB DEFAULT '{}',
  review_note TEXT,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ip_creator ON ip_applications(creator_id);
CREATE INDEX IF NOT EXISTS idx_ip_source ON ip_applications(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_ip_status ON ip_applications(status);

-- 1.9 创建 follows 表
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

-- 1.10 创建 skills 表
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  summary TEXT,
  description TEXT,
  cover_image VARCHAR(500),
  category VARCHAR(50) NOT NULL,
  tags TEXT[] DEFAULT '{}',
  price_type VARCHAR(20) NOT NULL DEFAULT 'paid',
  price DECIMAL(10, 2) DEFAULT 0,
  content JSONB,
  files JSONB DEFAULT '[]',
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,
  purchase_count INTEGER DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_skills_creator ON skills(creator_id);
CREATE INDEX IF NOT EXISTS idx_skills_status ON skills(status);
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
CREATE INDEX IF NOT EXISTS idx_skills_slug ON skills(slug);

-- 1.11 创建 community_topics 表
CREATE TABLE IF NOT EXISTS community_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_topics_slug ON community_topics(slug);

-- 1.12 创建 community_comments 表
CREATE TABLE IF NOT EXISTS community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES community_comments(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'published',
  likes_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_post ON community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author ON community_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON community_comments(parent_id);

-- ============================================
-- 步骤2: 更新 lawyer_profiles 表（添加字段）
-- ============================================

DO $$
BEGIN
  -- 添加新字段
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lawyer_profiles' AND column_name = 'id') THEN
    ALTER TABLE lawyer_profiles ADD COLUMN id UUID DEFAULT gen_random_uuid();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lawyer_profiles' AND column_name = 'name') THEN
    ALTER TABLE lawyer_profiles ADD COLUMN name VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lawyer_profiles' AND column_name = 'slug') THEN
    ALTER TABLE lawyer_profiles ADD COLUMN slug VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lawyer_profiles' AND column_name = 'city') THEN
    ALTER TABLE lawyer_profiles ADD COLUMN city VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lawyer_profiles' AND column_name = 'title') THEN
    ALTER TABLE lawyer_profiles ADD COLUMN title VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lawyer_profiles' AND column_name = 'bio') THEN
    ALTER TABLE lawyer_profiles ADD COLUMN bio TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lawyer_profiles' AND column_name = 'review_count') THEN
    ALTER TABLE lawyer_profiles ADD COLUMN review_count INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lawyer_profiles' AND column_name = 'average_rating') THEN
    ALTER TABLE lawyer_profiles ADD COLUMN average_rating DECIMAL(3, 2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lawyer_profiles' AND column_name = 'products_count') THEN
    ALTER TABLE lawyer_profiles ADD COLUMN products_count INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lawyer_profiles' AND column_name = 'product_downloads') THEN
    ALTER TABLE lawyer_profiles ADD COLUMN product_downloads INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lawyer_profiles' AND column_name = 'product_favorites') THEN
    ALTER TABLE lawyer_profiles ADD COLUMN product_favorites INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lawyer_profiles' AND column_name = 'featured_status') THEN
    ALTER TABLE lawyer_profiles ADD COLUMN featured_status VARCHAR(20) DEFAULT 'normal';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lawyer_profiles' AND column_name = 'featured_order') THEN
    ALTER TABLE lawyer_profiles ADD COLUMN featured_order INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lawyer_profiles' AND column_name = 'created_at') THEN
    ALTER TABLE lawyer_profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lawyer_profiles' AND column_name = 'updated_at') THEN
    ALTER TABLE lawyer_profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- 迁移现有数据到新字段
UPDATE lawyer_profiles SET 
  name = COALESCE(name, p.display_name),
  slug = COALESCE(slug, 'lawyer-' || user_id::text),
  city = COALESCE(city, ''),
  expertise = COALESCE(expertise, specialty),
  years_of_practice = COALESCE(years_of_practice, 0)
FROM profiles p
WHERE lawyer_profiles.user_id = p.id;

-- ============================================
-- 步骤3: 创建 lawyer_reviews 表（使用独立主键）
-- ============================================

CREATE TABLE IF NOT EXISTS lawyer_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lawyer_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  tags TEXT[] DEFAULT '{}',
  content TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'published',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_lawyer ON lawyer_reviews(lawyer_user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON lawyer_reviews(reviewer_id);

-- ============================================
-- 步骤4: 插入初始数据
-- ============================================

-- 创作指南
INSERT INTO creator_guides (title, slug, summary, content, section, order_index, guide_type, status) VALUES
  ('欢迎来到律植创作中心', 'welcome', '了解如何在律植平台上分享您的创作', '欢迎来到律植！在这里，您可以分享您的法律智能体和技能包...', 'getting-started', 1, 'article', 'published')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO creator_guides (title, slug, summary, content, section, order_index, guide_type, status) VALUES
  ('平台规则与审核标准', 'platform-rules', '了解平台的内容规范和审核标准', '为维护平台质量，我们制定了以下规则...', 'rules', 1, 'article', 'published')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO creator_guides (title, slug, summary, content, section, order_index, guide_type, status) VALUES
  ('如何创建第一个技能包', 'create-first-skill', '手把手教您创建第一个技能包', '在本教程中，我们将学习...', 'tutorials', 1, 'article', 'published')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO creator_guides (title, slug, summary, content, section, order_index, guide_type, status) VALUES
  ('常见问题解答', 'faq', '解答创作者常见问题', 'Q: 如何提高下载量？ A: ...', 'faq', 1, 'article', 'published')
ON CONFLICT (slug) DO NOTHING;

-- 社区话题
INSERT INTO community_topics (name, slug, description) VALUES
  ('法律咨询', 'legal-consultation', '讨论法律咨询相关话题')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO community_topics (name, slug, description) VALUES
  ('智能体开发', 'agent-development', '交流智能体开发经验')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO community_topics (name, slug, description) VALUES
  ('行业动态', 'industry-news', '分享法律行业最新动态')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO community_topics (name, slug, description) VALUES
  ('职业发展', 'career', '探讨法律职业发展')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO community_topics (name, slug, description) VALUES
  ('工具分享', 'tool-sharing', '分享法律工作工具和资源')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 步骤5: 更新 profiles 表
-- ============================================

DO $$
BEGIN
  -- 添加新字段
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'creator_level') THEN
    ALTER TABLE profiles ADD COLUMN creator_level VARCHAR(20) DEFAULT 'basic';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'lawyer_verified') THEN
    ALTER TABLE profiles ADD COLUMN lawyer_verified BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'lawyer_profile_id') THEN
    ALTER TABLE profiles ADD COLUMN lawyer_profile_id UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'balance') THEN
    ALTER TABLE profiles ADD COLUMN balance DECIMAL(12, 2) DEFAULT 0;
  END IF;
END $$;

-- ============================================
-- 步骤6: 创建更新触发器
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 为相关表创建触发器
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'opportunities', 'invitations', 'trials', 'creator_guides',
    'creator_verifications', 'lawyer_profiles', 'lawyer_reviews',
    'creator_earnings', 'ip_applications', 'skills'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%s_updated_at ON %s', tbl, tbl);
    EXECUTE format('CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', tbl, tbl);
  END LOOP;
END;
$$;

-- ============================================
-- 完成
-- ============================================
