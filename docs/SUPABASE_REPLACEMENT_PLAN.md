# Supabase 功能替换方案

> 创建时间：2026-03-29
> 目标：数据必须存储在中国大陆境内，最小化前端代码改动

---

## 概述

当前使用 Supabase 的核心功能：

| 功能 | 当前使用 | 替换方案 |
|------|----------|----------|
| **Auth** | Supabase Auth (邮箱/第三方) | 自建 JWT Auth + 阿里云 SMS |
| **Database** | Supabase PostgreSQL | 阿里云 PolarDB ✅ 已完成 |
| **Storage** | Supabase Storage | 阿里云 OSS |
| **Realtime** | Supabase Realtime | WebSocket + Redis pub/sub |

---

## 1. Auth 替换方案（任务 15, 21-29）

### 推荐方案：自建 JWT Auth

**理由**：
- 完全可控，无供应商锁定
- 与阿里云生态深度集成
- 支持中国大陆必备的登录方式（手机号、微信、支付宝）

### 实现架构

```
┌─────────────────────────────────────────────────────────────┐
│                      前端 (Next.js)                          │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│   │邮箱登录 │  │手机登录 │  │微信登录 │  │支付宝登录│       │
│   └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘       │
└────────┼───────────┼───────────┼───────────┼──────────────┘
         │           │           │           │
         └───────────┴─────┬─────┴───────────┘
                           │
                    ┌──────▼──────┐
                    │  Fastify    │
                    │  API Server │
                    │  /api/auth/*│
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────▼────┐     ┌──────▼──────┐    ┌─────▼─────┐
    │ 阿里云   │     │  PostgreSQL │    │  Redis     │
    │ SMS API  │     │ (JWT 存储)  │    │ (会话缓存) │
    └─────────┘     └─────────────┘    └───────────┘
```

### 登录方式实现

| 登录方式 | 优先级 | 状态 | 备注 |
|----------|--------|------|------|
| 手机号 + 短信验证码 | P0 | 🔴 待实现 | 中国大陆核心 |
| 微信授权登录 | P0 | 🔴 待实现 | 需要微信开放平台 |
| 支付宝快捷登录 | P1 | 🔴 待实现 | 需要支付宝开放平台 |
| 邮箱 + 密码 | P1 | 🔴 待实现 | 保留给海外用户 |

### 关键技术点

1. **JWT Token 结构**
   - Access Token: 15分钟有效期
   - Refresh Token: 7天有效期
   - 存储在 HttpOnly Cookie 或 LocalStorage

2. **密码安全**
   - bcrypt 哈希（cost factor: 12）
   - 登录失败锁定（5次/15分钟）

3. **用户迁移**
   - 用户 ID 映射表（supabase_id → new_id）
   - 密码需要用户重新设置

---

## 2. Storage 替换方案（任务 30-37）

### 推荐方案：阿里云 OSS

**理由**：
- 与 PolarDB 同生态，网络延迟最低
- 按量计费，大陆区域覆盖广
- 支持 CDN 加速

### 实现架构

```
┌─────────────────────────────────────────────────────────────┐
│                      前端 (Next.js)                          │
│   ┌─────────────────────────────────────────────┐           │
│   │  OSS 上传组件                                │           │
│   │  - 文件类型验证                              │           │
│   │  - 大小限制 (50MB)                           │           │
│   │  - 进度显示                                  │           │
│   └─────────────────────┬───────────────────────┘           │
└────────────────────────┼────────────────────────────────────┘
                         │
                    ┌────▼────┐
                    │ 阿里云   │
                    │   OSS   │
                    └────┬────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼────┐    ┌─────▼─────┐   ┌─────▼─────┐
    │ 头像桶   │    │  文件桶   │   │  CDN 加速 │
    │ avatars │    │  assets   │   │           │
    └─────────┘    └───────────┘   └───────────┘
```

### Bucket 配置

| Bucket | 用途 | 访问权限 | CDN |
|--------|------|----------|-----|
| lvzhi-avatars | 用户头像 | 公开读 | 是 |
| lvzhi-assets | 上传文件 | 私有写/公开读 | 是 |
| lvzhi-backups | 数据库备份 | 私有 | 否 |

### 前端集成

```typescript
// 使用预签名 URL 上传
// 1. 前端请求后端获取预签名 URL
// 2. 前端直接上传到 OSS
// 3. 上传成功后保存 URL 到数据库
```

---

## 3. Realtime 替换方案（任务 38-41）

### 推荐方案：WebSocket + Redis pub/sub

**理由**：
- AI 对话流式输出必需
- 可复用阿里云 Redis 实例

### 实现架构

```
┌─────────────────────────────────────────────────────────────┐
│                      前端 (Next.js)                          │
│   ┌─────────────────┐                                       │
│   │  WebSocket Client │                                      │
│   │  - AI 对话流      │                                      │
│   │  - 通知推送       │                                      │
│   └────────┬─────────┘                                       │
└───────────┼──────────────────────────────────────────────────┘
            │
     ┌──────▼──────┐
     │   Nginx     │
     │ (WebSocket) │
     └──────┬──────┘
            │
     ┌──────▼──────┐
     │  Fastify     │
     │  WebSocket   │
     │   Server     │
     └──────┬──────┘
            │
     ┌──────▼──────┐
     │   Redis     │
     │  pub/sub    │
     └─────────────┘
```

### 降级方案

如果 WebSocket 不可用：
- 轮询 API（5秒间隔）
- Server-Sent Events (SSE)

---

## 4. 数据层适配器（任务 18-20）

### 目标

最小化前端代码改动，保持 Supabase SDK 的调用方式。

### 实现策略

```typescript
// 方案 A：创建兼容层（推荐）
// lib/supabase-adapter.ts

import { createClient as createSupabaseClient } from './custom-supabase';

// 使用方式与原 Supabase 相同
const supabase = createSupabaseClient(url, key);
const { data, error } = await supabase.from('profiles').select('*');

// 方案 B：环境变量切换
// .env.local
NEXT_PUBLIC_SUPABASE_URL=http://localhost:3000/api
NEXT_PUBLIC_SUPABASE_ANON_KEY=local-anon-key
```

### 兼容性矩阵

| Supabase 功能 | 适配器支持 | 实现方式 |
|---------------|------------|----------|
| `from(table).select()` | ✅ | 直接 SQL 查询 |
| `from(table).insert()` | ✅ | POST /api/xxx |
| `from(table).update()` | ✅ | PATCH /api/xxx |
| `from(table).delete()` | ✅ | DELETE /api/xxx |
| `auth.signIn()` | ✅ | POST /api/auth/login |
| `auth.signUp()` | ✅ | POST /api/auth/register |
| `auth.signOut()` | ✅ | POST /api/auth/logout |
| `storage.from().upload()` | ✅ | 阿里云 OSS 预签名 |
| `storage.from().download()` | ✅ | CDN URL |
| `channel.subscribe()` | ⚠️ | WebSocket 需单独处理 |

---

## 5. 环境变量更新（任务 19）

### 新环境变量配置

```bash
# .env.production

# 数据库（已切换到阿里云）
DATABASE_URL=postgresql://user:pass@pgm-xxx.pg.rds.aliyuncs.com:5432/lvzhi

# Auth（自建）
JWT_SECRET=your-32-char-secret-key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# SMS（阿里云）
ALIYUN_SMS_ACCESS_KEY_ID=xxx
ALIYUN_SMS_ACCESS_KEY_SECRET=xxx
ALIYUN_SMS_SIGN_NAME=律植
ALIYUN_SMS_TEMPLATE_CODE=SMS_xxxxxxx

# Storage（阿里云 OSS）
OSS_ENDPOINT=oss-cn-shanghai.aliyuncs.com
OSS_BUCKET=lvzhi-assets
OSS_ACCESS_KEY_ID=xxx
OSS_ACCESS_KEY_SECRET=xxx

# Redis（阿里云）
REDIS_HOST=redis.aliyuncs.com
REDIS_PORT=6379
REDIS_PASSWORD=xxx
```

---

## 6. 实施计划

### 阶段一：基础适配器（1-2天）

1. 创建 `lib/supabase-adapter.ts` 适配器
2. 实现基本的 CRUD 操作
3. 实现 JWT Auth 基础流程
4. 配置阿里云 OSS 预签名上传

### 阶段二：完整功能（2-3天）

1. 实现所有登录方式（手机号、微信、支付宝）
2. 实现 WebSocket 实时通信
3. 数据迁移脚本完善
4. 灰度切换测试

### 阶段三：上线准备（1-2天）

1. 全量功能测试
2. 性能基准测试
3. 监控告警配置
4. 回滚预案准备

---

## 更新日志

| 日期 | 更新人 | 更新内容 |
|------|--------|----------|
| 2026-03-29 | AI助手 | 初始创建 Supabase 替换方案文档 |
