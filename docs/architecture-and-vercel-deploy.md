# 律植项目架构与 Vercel 部署说明

## 1. 当前项目架构

这是一个基于 `pnpm workspace` 的 monorepo：

- `apps/web`
  - Next.js 15 App Router
  - 当前对外主产品入口
  - 已直接接入 Supabase SSR / Browser Client
  - 当前大部分业务数据读取都发生在这里

- `apps/api`
  - Fastify 独立后端服务
  - 目前仍处于骨架阶段
  - 已有 `health` 路由和 `service_role` Supabase client
  - 当前前端尚未依赖该服务作为主业务 API

- `packages/types`
  - 前后端共享类型定义
  - 用于收敛用户、智能体、订阅、下载等领域模型

- `supabase/migrations`
  - PostgreSQL / Supabase 迁移 SQL
  - 当前数据库能力最完整，已经覆盖用户、社区、商品、订单、权限、下载、安全、认证等系统

## 2. 前端、数据库、后端的职责边界

### 前端 `apps/web`

当前前端是系统的主承载层，特点是：

- 使用 Next.js Server Components 直接从 Supabase 读数据
- 登录注册直接使用 Supabase Auth
- 页面层已包含：
  - 营销页
  - 创作者后台
  - 客户工作台（`/workspace`）、创作者工作台（`/creator`）、合作机会公区（`/opportunities`）；遗留 `/dashboard/recruiter` 由中间件 301 承接
  - 社区、榜单、智能体市场等

这意味着：

- 现在最适合先部署到 Vercel 的，是 `apps/web`
- 这是当前最接近“完整可运行产品”的部分

### 数据库 `supabase/migrations`

数据库是当前最完整的业务真相来源，已经具备：

- 用户与角色体系
- 社区帖子 / 评论 / 点赞
- 智能体 / 商品 / 订单 / 订阅
- 权限系统
- API 调用与计费
- 下载限制 / 文件上传安全
- 认证、安全、防火墙、反爬虫等扩展系统

当前建议：

- 继续把数据库作为核心领域模型来源
- 新增后端接口时优先围绕现有表与函数组织服务层

### 后端 `apps/api`

后端目前是“待扩展的业务服务层”，还不是线上主入口。

适合承载的职责包括：

- 需要 `service_role` 的后台操作
- 审核流、风控、定时任务
- 聚合型接口
- 不能直接暴露给浏览器的管理操作

但就当前阶段而言：

- 它还不适合作为 Vercel 主部署目标
- 更适合作为后续独立服务继续演进

## 3. 为什么 Vercel 首阶段应以 `apps/web` 为主

原因很直接：

- `apps/web` 已经是完整 Next.js 应用
- 与 Vercel 运行模型天然匹配
- 当前产品数据流主要依赖 Supabase，而不是 Fastify API
- `apps/api` 还是传统长驻服务思路，不是当前最优的 Vercel 部署对象

因此当前推荐的部署边界是：

- Vercel：部署 `apps/web`
- Supabase：数据库 + Auth + RLS
- `apps/api`：保留为独立后端服务，未来按需部署到 Railway / Render / Fly / ECS 等

## 4. 当前已补齐的 Vercel 友好结构

已完成的调整：

- `apps/web/vercel.json`
  - 明确这是一个 Next.js Vercel 项目

- `apps/web/.env.example`
  - 提供最小前端部署环境变量模板

- `apps/web/app/api/health/route.ts`
  - 在 Vercel 侧提供 `/api/health`
  - 用于部署后健康检查和环境联通确认

- `apps/api/.env.example`
  - 为独立 API 服务保留环境变量模板

- `packages/types/tsconfig.json`
  - 让共享类型包可被 workspace 正常 typecheck

- `apps/web/package.json`
  - 修正 `db:migrate:local` 脚本路径

## 5. 推荐的部署方式

### 方式 A：推荐

把 `apps/web` 作为 Vercel Project 的 Root Directory。

部署时：

1. 在 Vercel 导入整个仓库
2. 将 Root Directory 设为 `apps/web`
3. 配置环境变量：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. 直接部署

这是当前最稳定、最符合现状的方式。

### 方式 B：后续演进

如果以后希望把更多后端逻辑也收进 Vercel，可逐步把 `apps/api` 的部分能力迁移到：

- `apps/web/app/api/...` Route Handlers
- 或 Server Actions / Server-only services

但这应该建立在：

- 明确哪些接口必须 `service_role`
- 明确哪些逻辑适合无状态函数
- 明确哪些任务仍应保留为独立服务

## 6. 当前不建议的做法

当前不建议直接把 `apps/api` 原样部署到 Vercel，原因是：

- 它是 Fastify 常驻服务结构
- 目前没有转换为 Vercel Functions / Route Handlers
- 前端也还没有依赖它作为统一 API 层

强行一起迁移，只会增加部署复杂度，而不会立刻提升交付质量。

## 7. 下一步建议

建议按这个顺序推进：

1. 先把 `apps/web` 作为正式线上入口部署到 Vercel
2. 再梳理哪些业务必须经过 `apps/api`
3. 决定：
   - 保持 `apps/api` 独立部署
   - 或逐步把部分接口迁移到 `apps/web/app/api`

如果后续继续开发后端，我建议优先补这些模块：

- `profiles`
- `agents`
- `orders`
- `subscriptions`
- `student_verifications`

这几块和当前数据库、前端页面的耦合度最高，最适合作为后端服务第一批真实业务接口。
