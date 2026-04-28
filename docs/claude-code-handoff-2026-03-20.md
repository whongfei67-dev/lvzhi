# Claude Code Handoff - 2026-03-20

## 项目

- 项目名：`律植项目`
- 工作目录：`/Users/wanghongfei/Desktop/律植项目`
- 当前重点：Supabase / PostgreSQL 迁移 SQL 整理、可重复执行化、双跑验证

## 本次已完成工作

### 1. 迁移文件结构确认

已确认项目内存在以下迁移链路：

- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/002_community.sql`
- `supabase/migrations/003_rename_role_lawyer_to_creator.sql`
- `supabase/migrations/004_products_and_orders.sql`
- `supabase/migrations/005_subscriptions.sql`
- `supabase/migrations/006_coupons.sql`
- `supabase/migrations/007_comments_and_likes.sql`
- `supabase/migrations/008_permissions.sql`
- `supabase/migrations/009_api_system.sql`
- `supabase/migrations/010_extensions_and_views.sql`
- `supabase/migrations/011_auth_system.sql`
- `supabase/migrations/012_firewall_system.sql`
- `supabase/migrations/013_data_management.sql`
- `supabase/migrations/014_antibot_system.sql`
- `supabase/migrations/015_download_upload_security.sql`
- 额外还有：
  - `supabase/migrations/016_download_limits.sql`
  - `supabase/migrations/017_student_verification.sql`
  - 汇总文件 `supabase/migrations/all_new_migrations.sql`
  - 一次性全量版 `supabase/migrations/000_supabase_one_shot.sql`
  - 可重复执行版 `supabase/migrations/000_supabase_repeatable.sql`

### 2. 已修复的确定性 SQL 问题

以下问题已被修复：

- `supabase/migrations/013_data_management.sql`
  - 原先审计函数引用了不存在的 `profiles.email`
  - 已改为当前 schema 中存在的 `profiles.phone`

- `supabase/migrations/014_antibot_system.sql`
  - 原先脱敏规则引用了不存在的 `lawyer_profiles.license_number`
  - 已改为当前表内更合理的 `lawyer_profiles.bar_number`

- `supabase/migrations/all_new_migrations.sql`
  - 上述两个字段修复也同步到了汇总 SQL 中

### 3. 已生成并验证的 SQL 版本

#### `000_supabase_one_shot.sql`

- 适用场景：空库首次初始化
- 不适合在已经部分执行过的 Supabase 数据库中重跑
- 在非空库中会因为已存在 policy / trigger / seed 数据冲突

#### `000_supabase_repeatable.sql`

- 适用场景：已有库、可能已经跑过部分 SQL、需要重复执行
- 已做的处理包括：
  - 针对 `profiles_role_check` 做了兼容修复
  - 先将旧角色 `lawyer` 数据更新为 `creator`
  - 大量 `DROP POLICY IF EXISTS`
  - 大量 `DROP TRIGGER IF EXISTS`
  - 部分种子数据先删除再插入
  - `CREATE TABLE` 改为 `CREATE TABLE IF NOT EXISTS`
  - 对重载函数使用带签名的 `COMMENT ON FUNCTION ...(...)`
  - 补全了 `016/017` 中新增 policy 的 prelude 清理逻辑

## 已做的本地验证

### 1. 顺序迁移执行验证

已存在脚本：

- `scripts/run-db-migrations.mjs`

功能：

- 使用 `embedded-postgres` 拉起临时本地 PostgreSQL
- 预建 Supabase 兼容对象：
  - `pgcrypto`
  - `auth` schema
  - `auth.users`
  - `auth.uid()`
- 顺序执行 `001` 到 `015`

说明：

- 当前仓库里的根 `package.json` 目前 **没有** `db:migrate:local` script
- 但脚本文件本身存在，可以直接运行：

```bash
node /Users/wanghongfei/Desktop/律植项目/scripts/run-db-migrations.mjs
```

### 2. repeatable SQL 双跑验证

已存在脚本：

- `scripts/verify-repeatable-sql.mjs`

功能：

- 启动临时本地 PostgreSQL
- 加载 `supabase/migrations/000_supabase_repeatable.sql`
- 在同一个数据库上连续执行两次

最近一次验证结果：

- `run 1`
- `run 2`
- `repeatable sql ok twice`

可直接复现：

```bash
node /Users/wanghongfei/Desktop/律植项目/scripts/verify-repeatable-sql.mjs
```

## 用户侧已确认结果

- 用户在 Supabase 上执行过最终 `repeatable` 版本，并反馈“终于成功了”
- 后续再次复检时，我发现 `016/017` 追加内容带来了新的二次执行冲突
- 这些问题已经继续修正，并重新本地双跑通过

## 当前关键文件

- 可重复执行最终版：
  - `supabase/migrations/000_supabase_repeatable.sql`

- 一次性初始化版：
  - `supabase/migrations/000_supabase_one_shot.sql`

- 本地双跑校验脚本：
  - `scripts/verify-repeatable-sql.mjs`

- 本地顺序迁移脚本：
  - `scripts/run-db-migrations.mjs`

## 需要 Claude Code 注意的点

### 1. README 与实际 package.json 存在不一致

`README.md` 里写了：

```bash
npm run db:migrate:local
```

但根 `package.json` 当前实际只有：

- `dev:web`
- `dev:api`
- `dev`
- `build:web`
- `build:api`
- `typecheck`

也就是说，README 中数据库校验命令目前和实际脚本定义不一致。  
如果需要恢复一致性，可以把 `db:migrate:local` 重新加回根 `package.json`。

### 2. `.gitignore` 当前有未提交修改

执行 `git status --short` 时看到：

- `.gitignore` 有未提交变更

这不是本次交接里处理的内容，接手时请先确认是不是用户自己的改动。

### 3. `000_supabase_repeatable.sql` 体量很大

这是一个已经拼装好的“交付物 SQL”，适合直接用于 Supabase SQL Editor。  
如果后续要长期维护，建议把 repeatable 生成逻辑脚本化，不要长期手工维护单个超大 SQL 文件。

## 建议的下一步

1. 让根 `package.json` 与 `README.md` 对齐，补回 `db:migrate:local`
2. 如果 `016/017` 还会继续变化，考虑把 `000_supabase_repeatable.sql` 的生成流程脚本化
3. 增加一个检查脚本，自动验证：
   - one-shot 空库执行通过
   - repeatable 同库双跑通过
4. 如果要继续交付给 Supabase 使用，优先以 `000_supabase_repeatable.sql` 为准

## 最短交接口径

如果只给 Claude Code 一段最短说明，可以直接复制下面这段：

```text
当前项目的数据库工作重点在 Supabase 迁移。可直接关注 /Users/wanghongfei/Desktop/律植项目/supabase/migrations/000_supabase_repeatable.sql，它是给已有库/可重复执行场景准备的最终版。我已经修过 013 里 profiles.email 不存在、014 里 lawyer_profiles.license_number 不存在的问题，并补齐了 repeatable prelude 中对新增 policy/trigger 的清理。最近一次本地双跑校验脚本 /Users/wanghongfei/Desktop/律植项目/scripts/verify-repeatable-sql.mjs 已输出 repeatable sql ok twice。注意 README 里提到 npm run db:migrate:local，但根 package.json 当前没有这个 script，存在文档与实际不一致。
```
