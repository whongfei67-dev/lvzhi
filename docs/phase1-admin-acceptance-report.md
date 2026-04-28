# 独立后台 Phase 1 验收记录

## 验收时间
- 2026-04-25

## 验收范围
- 后台登录与硬鉴权（禁止 visitor 回退）
- 社区审核链路（列表、处置、理由必填）
- 认证审批链路（待审列表、审批动作、理由）
- 后台动作审计（`admin_actions`）

## 验收环境
- API: `http://127.0.0.1:4000`
- Admin: `http://127.0.0.1:3100`（验收临时端口）

## 验收结果

### 1) 未登录拦截
- `GET /api/admin/community/posts` -> `401`
- `GET /review` -> `307`，`location: /login?next=/review`

结果：通过

### 2) 社区审核
- `GET /api/admin/community/posts?status=all&page=1&pageSize=5` -> `200`
- `PATCH /api/admin/community/posts/:id/moderate`（无 reason）-> `400`，`reason is required`
- `PATCH /api/admin/community/posts/:id/moderate`（`take_down` + reason）-> `200`
- `PATCH /api/admin/community/posts/:id/moderate`（`restore` + reason）-> `200`

结果：通过

### 3) 认证审批
- `POST /api/verification/lawyer` 创建申请 -> `201`
- `GET /api/admin/verification/lawyer?status=pending&page=1&pageSize=5` -> `200`
- `PUT /api/admin/verification/lawyer/:id`（`approve` + reason）-> `200`

结果：通过

### 4) 审计日志
- `GET /api/admin/actions?target_type=community_post&limit=5` 可查询到 `community_take_down` / `community_restore`
- `GET /api/admin/actions?target_type=lawyer_verification&limit=5` 可查询到 `verification_approve`

结果：通过

## 验收期间修复
- 兼容旧库缺字段：`lawyer_verification_applications.reviewed_by` 等字段缺失导致 500  
  处理：在认证路由中增加 `ADD COLUMN IF NOT EXISTS` 兜底。
- 兼容历史触发器：`community_posts` 缺少 `updated_at` 导致审核更新失败  
  处理：为 `community_posts` 增加 `updated_at` 字段并在审核更新写入 `updated_at = NOW()`。

## 结论
- Phase 1 验收通过，可进入 Phase 2（结算/提现审批、超管策略配置、细粒度 RBAC）。
