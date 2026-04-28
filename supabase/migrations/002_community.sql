-- ────────────────────────────────────────────────
-- v2.1 Community features migration
-- 在 Supabase SQL Editor 中执行此文件
-- ────────────────────────────────────────────────

-- 1. agents 表新增字段
alter table public.agents
  add column if not exists pricing_model text not null default 'free'
    check (pricing_model in ('free', 'freemium', 'per_use', 'subscription', 'commercial')),
  add column if not exists monthly_price numeric(10,2),
  add column if not exists tags text[] default '{}';

-- 2. 智能体收藏表
create table if not exists public.agent_favorites (
  id           uuid primary key default gen_random_uuid(),
  agent_id     uuid references public.agents(id)   on delete cascade not null,
  user_id      uuid references public.profiles(id)  on delete cascade not null,
  created_at   timestamptz default now(),
  unique(agent_id, user_id)
);
alter table public.agent_favorites enable row level security;

create policy "agent_favorites: public read"
  on public.agent_favorites for select using (true);
create policy "agent_favorites: auth insert"
  on public.agent_favorites for insert with check (auth.uid() = user_id);
create policy "agent_favorites: own delete"
  on public.agent_favorites for delete using (auth.uid() = user_id);

-- 3. 智能体评分表
create table if not exists public.agent_ratings (
  id           uuid primary key default gen_random_uuid(),
  agent_id     uuid references public.agents(id)   on delete cascade not null,
  user_id      uuid references public.profiles(id)  on delete cascade not null,
  score        int not null check (score between 1 and 5),
  comment      text,
  created_at   timestamptz default now(),
  unique(agent_id, user_id)
);
alter table public.agent_ratings enable row level security;

create policy "agent_ratings: public read"
  on public.agent_ratings for select using (true);
create policy "agent_ratings: auth insert"
  on public.agent_ratings for insert with check (auth.uid() = user_id);
create policy "agent_ratings: own update"
  on public.agent_ratings for update using (auth.uid() = user_id);

-- 4. 用户关注表
create table if not exists public.user_follows (
  id           uuid primary key default gen_random_uuid(),
  follower_id  uuid references public.profiles(id)  on delete cascade not null,
  following_id uuid references public.profiles(id)  on delete cascade not null,
  created_at   timestamptz default now(),
  unique(follower_id, following_id),
  check (follower_id != following_id)
);
alter table public.user_follows enable row level security;

create policy "user_follows: public read"
  on public.user_follows for select using (true);
create policy "user_follows: auth insert"
  on public.user_follows for insert with check (auth.uid() = follower_id);
create policy "user_follows: own delete"
  on public.user_follows for delete using (auth.uid() = follower_id);

-- 5. 社区帖子表
create table if not exists public.community_posts (
  id            uuid primary key default gen_random_uuid(),
  author_id     uuid references public.profiles(id)  on delete cascade not null,
  title         text not null,
  content       text,
  agent_id      uuid references public.agents(id)    on delete set null,
  tags          text[] default '{}',
  view_count    int default 0,
  like_count    int default 0,
  comment_count int default 0,
  created_at    timestamptz default now()
);
alter table public.community_posts enable row level security;

create policy "community_posts: public read"
  on public.community_posts for select using (true);
create policy "community_posts: auth insert"
  on public.community_posts for insert with check (auth.uid() = author_id);
create policy "community_posts: own update"
  on public.community_posts for update using (auth.uid() = author_id);
create policy "community_posts: own delete"
  on public.community_posts for delete using (auth.uid() = author_id);
