-- =============================================================
-- 律植（职）MVP 初始数据库 Schema
-- 在 Supabase SQL 编辑器中执行此文件
-- =============================================================

-- 用户档案（扩展 Supabase auth.users）
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  role text not null check (role in ('seeker', 'lawyer', 'recruiter', 'client', 'admin')),
  display_name text,
  avatar_url text,
  bio text,
  phone text,
  verified boolean default false,
  created_at timestamptz default now()
);

-- 求职方详情
create table if not exists public.seeker_profiles (
  user_id uuid references public.profiles on delete cascade primary key,
  education_level text,
  school text,
  graduation_year int,
  skill_tags text[],
  resume_url text,
  ai_skill_portrait jsonb
);

-- 律师详情
create table if not exists public.lawyer_profiles (
  user_id uuid references public.profiles on delete cascade primary key,
  bar_number text unique,
  law_firm text,
  specialty text[],
  years_experience int,
  verified_at timestamptz
);

-- 招聘方/律所详情
create table if not exists public.recruiter_profiles (
  user_id uuid references public.profiles on delete cascade primary key,
  org_name text,
  org_type text check (org_type in ('law_firm', 'enterprise')),
  business_license_url text,
  verified_at timestamptz
);

-- 职位
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  recruiter_id uuid references public.profiles on delete cascade not null,
  title text not null,
  description text,
  requirements text,
  location text,
  salary_range text,
  job_type text check (job_type in ('full_time', 'intern', 'part_time')),
  specialty text[],
  status text default 'active' check (status in ('active', 'closed', 'draft')),
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- 求职申请
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs on delete cascade not null,
  seeker_id uuid references public.profiles on delete cascade not null,
  status text default 'pending' check (
    status in ('pending', 'viewed', 'interviewing', 'rejected', 'offered')
  ),
  cover_letter text,
  applied_at timestamptz default now(),
  unique(job_id, seeker_id)
);

-- 法律智能体
create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references public.profiles on delete cascade not null,
  name text not null,
  description text,
  category text check (
    category in ('contract', 'litigation', 'consultation', 'compliance', 'other')
  ),
  price numeric(10, 2) default 0,
  is_free_trial boolean default true,
  status text default 'pending_review' check (
    status in ('pending_review', 'active', 'rejected')
  ),
  demo_content jsonb,
  created_at timestamptz default now()
);

-- 智能体演示事件
create table if not exists public.agent_demos (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.agents on delete cascade not null,
  viewer_id uuid references public.profiles on delete set null,
  started_at timestamptz default now(),
  completed_at timestamptz,
  converted boolean default false
);

-- 律师推广订单
create table if not exists public.promo_orders (
  id uuid primary key default gen_random_uuid(),
  lawyer_id uuid references public.profiles on delete cascade not null,
  plan_type text check (plan_type in ('basic', 'featured', 'premium')),
  status text default 'active',
  started_at timestamptz,
  expires_at timestamptz,
  amount numeric(10, 2)
);

-- =============================================================
-- 索引
-- =============================================================

create index if not exists jobs_recruiter_id_idx on public.jobs(recruiter_id);
create index if not exists jobs_status_idx on public.jobs(status);
create index if not exists jobs_created_at_idx on public.jobs(created_at desc);
create index if not exists applications_job_id_idx on public.applications(job_id);
create index if not exists applications_seeker_id_idx on public.applications(seeker_id);
create index if not exists agents_creator_id_idx on public.agents(creator_id);
create index if not exists agents_status_idx on public.agents(status);
create index if not exists agent_demos_agent_id_idx on public.agent_demos(agent_id);

-- =============================================================
-- Row Level Security (RLS)
-- =============================================================

-- 开启 RLS
alter table public.profiles enable row level security;
alter table public.seeker_profiles enable row level security;
alter table public.lawyer_profiles enable row level security;
alter table public.recruiter_profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
alter table public.agents enable row level security;
alter table public.agent_demos enable row level security;
alter table public.promo_orders enable row level security;

-- profiles：用户只能读写自己的档案，所有人可以看已验证用户的公开信息
create policy "profiles: own read/write"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles: public read"
  on public.profiles for select
  using (true);

-- seeker_profiles：只有本人可读写
create policy "seeker_profiles: own read/write"
  on public.seeker_profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- lawyer_profiles：本人读写，所有人可读
create policy "lawyer_profiles: own insert"
  on public.lawyer_profiles for insert
  with check (auth.uid() = user_id);

create policy "lawyer_profiles: own update"
  on public.lawyer_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "lawyer_profiles: own delete"
  on public.lawyer_profiles for delete
  using (auth.uid() = user_id);

create policy "lawyer_profiles: public read"
  on public.lawyer_profiles for select
  using (true);

-- recruiter_profiles：只有本人可读写
create policy "recruiter_profiles: own read/write"
  on public.recruiter_profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- jobs：招聘方管理自己的职位，所有人可看 active 职位
create policy "jobs: recruiter manage"
  on public.jobs for all
  using (auth.uid() = recruiter_id)
  with check (auth.uid() = recruiter_id);

create policy "jobs: public read active"
  on public.jobs for select
  using (status = 'active');

-- applications：求职方投递/查看自己的申请，招聘方查看针对自己职位的申请
create policy "applications: seeker manage"
  on public.applications for all
  using (auth.uid() = seeker_id)
  with check (auth.uid() = seeker_id);

create policy "applications: recruiter read"
  on public.applications for select
  using (
    exists (
      select 1 from public.jobs
      where jobs.id = applications.job_id
        and jobs.recruiter_id = auth.uid()
    )
  );

-- agents：律师管理自己的智能体，所有人可看 active 的智能体
create policy "agents: creator manage"
  on public.agents for all
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

create policy "agents: public read active"
  on public.agents for select
  using (status = 'active');

-- agent_demos：任何登录用户可以创建演示记录，只能看自己的记录
create policy "agent_demos: insert authenticated"
  on public.agent_demos for insert
  with check (auth.uid() is not null);

create policy "agent_demos: own read"
  on public.agent_demos for select
  using (auth.uid() = viewer_id);

create policy "agent_demos: creator read"
  on public.agent_demos for select
  using (
    exists (
      select 1 from public.agents
      where agents.id = agent_demos.agent_id
        and agents.creator_id = auth.uid()
    )
  );

-- promo_orders：律师只能看自己的推广订单
create policy "promo_orders: own read/write"
  on public.promo_orders for all
  using (auth.uid() = lawyer_id)
  with check (auth.uid() = lawyer_id);

-- admin：管理员可以读写所有智能体（含待审核）
create policy "agents: admin manage"
  on public.agents for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- =============================================================
-- 触发器：注册时自动创建 profile
-- =============================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'seeker'),
    coalesce(new.raw_user_meta_data->>'display_name', new.email)
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
