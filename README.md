# 律植（职）Web MVP

这是基于 `PRD V1.3` 启动的第一版 Web 端产品骨架，目标不是一次性实现全部能力，而是先把 MVP 的产品结构、角色模型和核心对象落地。

## 当前已落地

- Next.js App Router + TypeScript 基础工程
- 首页：展示产品定位、MVP 范围、角色模型、6 周启动路线
- Workspace 页面：展示账号最小管理主体、职位推荐、智能体市场、演示数据口径
- PRD 抽象数据层：角色、模块、路线图、首版 KPI

## 建议的下一步

1. 接入设计系统与真实组件规范
2. 建立 PostgreSQL 数据模型：账号、角色、职位、智能体、演示、订单
3. 增加登录/注册、角色切换、职位列表、智能体详情等真实页面
4. 接入后台 API 与演示事件埋点

## 本地启动

仓库根目录需存在 **`pnpm-workspace.yaml`**（声明 `apps/*`、`packages/*`），否则在根目录执行 `pnpm install` 时 **不会** 把 `apps/web` 的依赖（含 `next`）装全，`pnpm dev:web` 会报 `Cannot find module .../next/dist/bin/next`。修复后重新安装：

```bash
pnpm install
pnpm dev
```

安装成功的标志之一是终端出现 **`Scope: all 4 workspace projects`**，且 `apps/web/node_modules/next` 目录存在。

## 本地数据库迁移校验

项目内置了一个临时本地 PostgreSQL 迁移命令，可用于顺序执行 `supabase/migrations` 下的迁移并验证是否能跑通：

```bash
pnpm install
pnpm db:migrate:local
```

可选环境变量：

- `LOCAL_PG_PORT`：指定临时 PostgreSQL 端口，默认 `54329`
- `LOCAL_PG_DATA_DIR`：指定临时数据库数据目录，默认项目根目录下的 `.tmp-embedded-postgres`

该命令会在每次运行时重建临时数据库目录，适合做迁移可执行性校验，不适合存放需要保留的本地数据。
