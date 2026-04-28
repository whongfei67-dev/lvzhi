# Phase 3 Execution Issue Log

更新时间：2026-04-25

## 执行概览

- `API_BASE_URL=http://127.0.0.1:4000 pnpm test:flows`
  - 结果：`23 通过 / 0 失败 / 1 跳过`
  - 状态：通过（仅 1 个环境性跳过）

- `API_BASE_URL=http://127.0.0.1:4000 pnpm test:admin`
  - 结果：`10 通过 / 0 失败 / 0 跳过`
  - 状态：通过

- `API_BASE_URL=http://127.0.0.1:4000 pnpm test:rbac`
  - 结果：`33/33 用例通过`
  - 状态：通过（存在环境角色配置问题，见下方）

## 已处理问题（本轮修复）

- `test-flows` 登出 400
  - 原因：空 body 仍发送 `Content-Type: application/json`
  - 处理：请求工具改为“仅 body 存在时才发 JSON Content-Type”
  - 结果：`用户登出` 转绿

- Creator 流程创建智能体失败（校验不匹配）
  - 原因：测试账号非 creator、分类枚举值不合法、更新描述过短
  - 处理：注册显式 `role=creator`、分类改 `consultation`、更新描述满足最小长度
  - 结果：Creator 全链路转绿

- 支付流程 500（订单字段不兼容）
  - 原因：历史库 `orders.order_type` 非空约束，旧写入 SQL 缺该列
  - 处理：创建订单补 `order_type='purchase'`
  - 结果：创建订单/查询订单转绿

- 订单列表 500（历史库字段缺失）
  - 原因：`products.credits` 在当前库不存在
  - 处理：查询语句去掉 `p.credits`
  - 结果：订单列表转绿

- 智能体相关 500（历史库字段缺失）
  - 原因：`agents` 表在部分环境缺多个字段
  - 处理：`agents` 路由增加自动补列兼容
  - 结果：admin 与 flow 中智能体链路稳定

## 当前遗留问题（待你回来后处理）

- **超管 e2e 账号角色不正确**
  - 现状：`lvzhi-e2e-superadmin@example.com` 实际角色是 `client`
  - 影响：无法做“superadmin 正向成功”回归，只能做拒绝校验
  - 建议（任选其一）：
    - 配置 `DATABASE_URL` 后执行：`pnpm test:accounts`
    - 或手动 SQL：
      - `UPDATE profiles SET role = 'superadmin' WHERE email = 'lvzhi-e2e-superadmin@example.com';`

- **AI 对话流程跳过（非失败）**
  - 现状：`test-flows` 中 AI 流程显示“无可用智能体”
  - 影响：不影响主链路验收，但 AI 对话正向未覆盖
  - 建议：准备至少一个可用公开智能体数据，再重跑 `pnpm test:flows`

## 建议下一步（你回来后可直接执行）

- 修正超管角色后执行：
  - `API_BASE_URL=http://127.0.0.1:4000 pnpm test:rbac`
- 准备可用 AI 智能体后执行：
  - `API_BASE_URL=http://127.0.0.1:4000 pnpm test:flows`
