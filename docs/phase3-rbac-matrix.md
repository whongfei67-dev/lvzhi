# Phase 3 RBAC Matrix (Admin Console)

更新时间：2026-04-25

## 页面权限矩阵

- `apps/admin/app/(console)/layout.tsx`
  - 未登录用户：重定向到 `/login?next=/review`
  - 已登录且角色非 `admin/superadmin`：重定向到 `/login?next=/review`
  - `admin`：允许访问控制台页面
  - `superadmin`：允许访问控制台页面

- 控制台导航页（由布局统一保护）
  - `/review` 社区审核台：`admin`/`superadmin`
  - `/verification` 认证审批台：`admin`/`superadmin`
  - `/withdraw` 提现审批台：`admin`/`superadmin`
  - `/settlement` 结算审批台：`admin`/`superadmin`
  - `/policies` 策略配置：页面可进入，但写操作由接口层 `superadmin` 限制

## API 权限矩阵（核心后台）

- 管理员可访问（`authenticateAdmin`）
  - `GET /api/admin/users`
  - `GET /api/admin/actions`
  - `GET /api/admin/community/posts`
  - `PATCH /api/admin/community/posts/:id/moderate`
  - `POST /api/admin/community/posts/batch-moderate`
  - `GET /api/admin/verification/lawyer`
  - `PUT /api/admin/verification/lawyer/:id`
  - `POST /api/admin/verification/lawyer/batch-review`
  - `GET /api/admin/withdrawals`
  - `PATCH /api/admin/withdrawals/:id`
  - `POST /api/admin/withdrawals/batch-review`
  - `GET /api/admin/settlements`
  - `PATCH /api/admin/settlements/:id`
  - `POST /api/admin/settlements/batch-review`
  - `GET /api/admin/policies`
  - `GET /api/admin/policies/history`
  - `GET /api/admin/stats`

- 超管专属（`authenticateSuperAdmin`）
  - `PUT /api/admin/policies/:key`
  - `POST /api/admin/policies/:key/rollback`

## 自动化校验标准（脚本 `test:rbac`）

- admin 接口（如 `/api/admin/users`）：
  - `guest` 预期 `401`
  - `client` 预期 `403`
  - `admin` 预期 `200`

- superadmin 接口（如 `/api/admin/policies/:key`）：
  - `guest` 预期 `401`
  - `client` 预期 `403`
  - `admin` 预期 `403`
  - `superadmin` 预期可穿透鉴权（脚本用非法参数验证，预期 `400`）

## 本轮兼容性补丁（为稳定回归）

- `apps/api/src/routes/agents.ts`
  - 启动时补齐历史库可能缺失字段：
    - `trial_quota`
    - `avatar_url`
    - `config`
    - `tags`
    - `updated_at`
    - `favorite_count`
    - `rating`
    - `rating_count`
    - `view_count`
    - `trial_count`
  - 创建智能体状态统一为 `pending_review`

- `apps/api/src/routes/balance.ts`
  - 订单写入补齐 `order_type='purchase'`
  - 订单查询移除对历史库缺失列 `products.credits` 的依赖
