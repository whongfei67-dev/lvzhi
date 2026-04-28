# 律植项目 - 蓝图对照审计差异总表

> 审计时间: 2026-04-10
> 审计范围: 本地代码 + 线上服务器

---

## 差异总表

### ID 分类 | 模块/页面 | 蓝图要求 | 当前线上情况 | 当前本地代码 | 差异说明 | 影响用户 | 优先级 | 修复建议 | 修改文件 | 前端 | 后端 | 部署 | 验证方式 | 状态

---

### P0 - 高优先级（阻塞性问题）

---

**ID: P0-001**
| 字段 | 内容 |
|------|------|
| 分类 | N. 登录/注册 |
| 模块/页面 | /login |
| 蓝图要求 | 视觉系统必须统一为绿色系（温和、专业、清晰、植物感） |
| 当前线上情况 | 登录页使用蓝色 `#5C9EEB` 作为主色调 |
| 当前本地代码 | 同左，login/page.tsx 第 89、130、164 行使用蓝色 |
| 差异说明 | 登录页与首页/其他页面风格严重不一致 |
| 影响用户 | 所有登录用户 |
| 优先级 | P0 |
| 修复建议 | 将所有 `#5C9EEB` 替换为 `#284A3D`（深植绿） |
| 修改文件 | `apps/web/app/(auth)/login/page.tsx` |
| 前端 | ✅ |
| 后端 | ❌ |
| 部署 | ❌ |
| 验证方式 | 访问 /login 页面检查颜色 |
| 状态 | 未处理 |

---

**ID: P0-002**
| 字段 | 内容 |
|------|------|
| 分类 | N. 登录/注册 |
| 模块/页面 | /register |
| 蓝图要求 | 视觉系统必须统一为绿色系 |
| 当前线上情况 | 注册页使用蓝色 `#5C9EEB` 作为主色调 |
| 当前本地代码 | 同左，register/page.tsx 多处使用蓝色 |
| 差异说明 | 注册页与首页/其他页面风格严重不一致 |
| 影响用户 | 所有注册用户 |
| 优先级 | P0 |
| 修复建议 | 将所有蓝色替换为深植绿 `#284A3D` |
| 修改文件 | `apps/web/app/(auth)/register/page.tsx` |
| 前端 | ✅ |
| 后端 | ❌ |
| 部署 | ❌ |
| 验证方式 | 访问 /register 页面检查颜色 |
| 状态 | 未处理 |

---

**ID: P0-003**
| 字段 | 内容 |
|------|------|
| 分类 | A. 品牌与定位 |
| 模块/页面 | /login |
| 蓝图要求 | 文案必须使用新定位："面向法律行业的灵感与实践平台" |
| 当前线上情况 | 登录页使用旧文案 "中文法律智能体社区" |
| 当前本地代码 | 同左，login/page.tsx 第 85、94 行 |
| 差异说明 | 登录页仍使用旧定位，与新品牌不一致 |
| 影响用户 | 登录用户 |
| 优先级 | P0 |
| 修复建议 | 将 "中文法律智能体社区" 替换为 "面向法律行业的灵感与实践平台" |
| 修改文件 | `apps/web/app/(auth)/login/page.tsx` |
| 前端 | ✅ |
| 后端 | ❌ |
| 部署 | ❌ |
| 验证方式 | 检查登录页文案 |
| 状态 | 未处理 |

---

**ID: P0-004**
| 字段 | 内容 |
|------|------|
| 分类 | A. 品牌与定位 |
| 模块/页面 | /register |
| 蓝图要求 | 文案必须使用新定位 |
| 当前线上情况 | 注册页使用旧文案 "中文法律智能体社区"、"法律智能体" |
| 当前本地代码 | 同左，register/page.tsx 第 120、317、319、323 行 |
| 差异说明 | 注册页仍使用旧定位，与新品牌不一致 |
| 影响用户 | 注册用户 |
| 优先级 | P0 |
| 修复建议 | 将所有 "法律智能体" 相关文案替换为 "灵感与实践" 相关 |
| 修改文件 | `apps/web/app/(auth)/register/page.tsx` |
| 前端 | ✅ |
| 后端 | ❌ |
| 部署 | ❌ |
| 验证方式 | 检查注册页文案 |
| 状态 | 未处理 |

---

**ID: P0-005**
| 字段 | 内容 |
|------|------|
| 分类 | A. 品牌与定位 |
| 模块/页面 | /sms-login |
| 蓝图要求 | 文案必须使用新定位 |
| 当前线上情况 | 短信登录页使用旧文案 |
| 当前本地代码 | sms-login/page.tsx 第 87 行 |
| 差异说明 | 短信登录页仍使用旧定位 |
| 影响用户 | 使用短信登录的用户 |
| 优先级 | P0 |
| 修复建议 | 更新文案为新定位 |
| 修改文件 | `apps/web/app/(auth)/sms-login/page.tsx` |
| 前端 | ✅ |
| 后端 | ❌ |
| 部署 | ❌ |
| 验证方式 | 检查 /sms-login 页面 |
| 状态 | 未处理 |

---

### P1 - 中优先级（结构性问题）

---

**ID: P1-001**
| 字段 | 内容 |
|------|------|
| 分类 | O. 视觉系统 |
| 模块/页面 | tailwind.config.ts |
| 蓝图要求 | 不得保留蓝紫色旧配置 |
| 当前线上情况 | 配置中包含 `palette.navy` 和 `palette.blue` |
| 当前本地代码 | tailwind.config.ts 第 20-30 行包含旧蓝色配置 |
| 差异说明 | 配置文件包含旧蓝色变量，可能导致样式冲突 |
| 影响用户 | 开发时可能引用旧颜色 |
| 优先级 | P1 |
| 修复建议 | 移除 `brand` 和 `cta` 的蓝色配置，替换为绿色系 |
| 修改文件 | `apps/web/tailwind.config.ts` |
| 前端 | ✅ |
| 后端 | ❌ |
| 部署 | ❌ |
| 验证方式 | 检查配置文件 |
| 状态 | 未处理 |

---

**ID: P1-002**
| 字段 | 内容 |
|------|------|
| 分类 | O. 视觉系统 |
| 模块/页面 | 多个页面 |
| 蓝图要求 | 所有页面必须使用绿色系 |
| 当前线上情况 | 多个页面使用 `bg-blue-*` 旧样式 |
| 当前本地代码 | 约 10 个文件使用蓝色样式 |
| 差异说明 | 部分页面仍使用蓝色，与新风格不一致 |
| 影响用户 | 访问这些页面的用户 |
| 优先级 | P1 |
| 修复建议 | 将 `bg-blue-*` 替换为 `bg-[#284A3D]` 或 `bg-emerald-*` |
| 修改文件 | 多个文件（见问题文件列表） |
| 前端 | ✅ |
| 后端 | ❌ |
| 部署 | ❌ |
| 验证方式 | 全局搜索 `bg-blue` |
| 状态 | 未处理 |

---

**ID: P1-003**
| 字段 | 内容 |
|------|------|
| 分类 | O. 视觉系统 |
| 模块/页面 | 组件库 |
| 蓝图要求 | badge 组件应使用绿色系状态色 |
| 当前线上情况 | badge.tsx 保留 `paid: "bg-blue-100 text-blue-700"` |
| 当前本地代码 | `apps/web/components/ui/badge.tsx` |
| 差异说明 | paid 状态使用蓝色而非绿色 |
| 影响用户 | 使用 badge 组件的页面 |
| 优先级 | P1 |
| 修复建议 | 将 `bg-blue-100 text-blue-700` 替换为绿色系 |
| 修改文件 | `apps/web/components/ui/badge.tsx` |
| 前端 | ✅ |
| 后端 | ❌ |
| 部署 | ❌ |
| 验证方式 | 检查 badge 组件 |
| 状态 | 未处理 |

---

**ID: P1-004**
| 字段 | 内容 |
|------|------|
| 分类 | C. 导航与路由 |
| 模块/页面 | middleware |
| 蓝图要求 | 中间件配置正确 |
| 当前线上情况 | 存在 `middleware 2.ts` 重复文件 |
| 当前本地代码 | 根目录有两个 middleware 文件 |
| 差异说明 | 重复文件可能导致混淆 |
| 影响用户 | 路由保护逻辑 |
| 优先级 | P1 |
| 修复建议 | 删除 `middleware 2.ts`，保留一个 |
| 修改文件 | `middleware 2.ts` |
| 前端 | ✅ |
| 后端 | ❌ |
| 部署 | ❌ |
| 验证方式 | 检查文件列表 |
| 状态 | 未处理 |

---

**ID: P1-005**
| 字段 | 内容 |
|------|------|
| 分类 | M. Workspace/Creator/Admin |
| 模块/页面 | /login 登录后跳转 |
| 蓝图要求 | client 登录后进入 /workspace，creator 进入 /workspace 和 /creator |
| 当前线上情况 | 登录成功后统一跳转到 /dashboard |
| 当前本地代码 | login/page.tsx 第 27 行 |
| 差异说明 | 登录后跳转逻辑不符合蓝图要求 |
| 影响用户 | 登录用户 |
| 优先级 | P1 |
| 修复建议 | 根据用户角色动态跳转 |
| 修改文件 | `apps/web/app/(auth)/login/page.tsx` |
| 前端 | ✅ |
| 后端 | 需确认角色判断逻辑 |
| 部署 | ❌ |
| 验证方式 | 使用不同角色登录测试 |
| 状态 | 未处理 |

---

### P2 - 低优先级（优化项）

---

**ID: P2-001**
| 字段 | 内容 |
|------|------|
| 分类 | A. 品牌与定位 |
| 模块/页面 | /register 统计数字 |
| 蓝图要求 | 统计数字应真实或可更新 |
| 当前线上情况 | 使用硬编码的 "12,000+ 已发布智能体" 等 |
| 当前本地代码 | register/page.tsx 第 97-102 行 |
| 差异说明 | 数据可能过时 |
| 影响用户 | 注册用户 |
| 优先级 | P2 |
| 修复建议 | 使用真实数据或移除具体数字 |
| 修改文件 | `apps/web/app/(auth)/register/page.tsx` |
| 前端 | ✅ |
| 后端 | ❌ |
| 部署 | ❌ |
| 验证方式 | 检查页面显示 |
| 状态 | 未处理 |

---

**ID: P2-002**
| 字段 | 内容 |
|------|------|
| 分类 | R. 部署/环境 |
| 模块/页面 | 数据库迁移 |
| 蓝图要求 | 数据库应包含完整 schema |
| 当前线上情况 | 需确认迁移状态 |
| 当前本地代码 | 有迁移文件 |
| 差异说明 | 线上数据库可能与本地不一致 |
| 影响用户 | 所有用户 |
| 优先级 | P2 |
| 修复建议 | 检查线上数据库迁移状态 |
| 修改文件 | N/A |
| 前端 | ❌ |
| 后端 | ✅ |
| 部署 | ✅ |
| 验证方式 | 连接线上数据库检查 |
| 状态 | 未验证 |

---

## 问题文件详细列表

### 需要修改颜色的文件（P0/P1）

| 文件路径 | 问题 |
|----------|------|
| `apps/web/app/(auth)/login/page.tsx` | 使用 `#5C9EEB` 蓝色 |
| `apps/web/app/(auth)/register/page.tsx` | 使用 `#5C9EEB` 蓝色 |
| `apps/web/app/(auth)/sms-login/page.tsx` | 使用蓝色 |
| `apps/web/app/(admin)/admin/admins/page.tsx` | 使用 `bg-blue` |
| `apps/web/app/(dashboard)/workspace/page.tsx` | 使用 `bg-blue` |
| `apps/web/app/(marketing)/opportunities/city/[city]/page.tsx` | 使用 `bg-blue` |
| `apps/web/app/(marketing)/opportunities/type/[type]/page.tsx` | 使用 `bg-blue` |
| `apps/web/app/(marketing)/opportunities/[slug]/page.tsx` | 使用 `bg-blue` |
| `apps/web/app/(marketing)/lawyers/category/[category]/page.tsx` | 使用 `bg-blue` |
| `apps/web/app/(marketing)/inspiration/category/[category]/page.tsx` | 使用 `bg-blue` |
| `apps/web/components/ui/badge.tsx` | `paid` 使用蓝色 |
| `apps/web/components/creator/creator-card.tsx` | 使用蓝色 |
| `apps/web/components/creator/creator-program-section.tsx` | 使用蓝色 |
| `apps/web/components/creator/earnings-panel.tsx` | 使用蓝色 |
| `apps/web/components/agent/agent-card.tsx` | 使用蓝色 |
| `apps/web/components/agent/agent-price-card.tsx` | 使用蓝色 |

### 需要修改文案的文件（P0）

| 文件路径 | 问题 |
|----------|------|
| `apps/web/app/(auth)/login/page.tsx` | "中文法律智能体社区" |
| `apps/web/app/(auth)/register/page.tsx` | "法律智能体" 多处 |
| `apps/web/app/(auth)/sms-login/page.tsx` | "中文法律智能体社区" |

---

## 差异统计

| 优先级 | 数量 | 说明 |
|--------|------|------|
| P0 | 5 | 必须立即修复 |
| P1 | 5 | 需要尽快修复 |
| P2 | 2 | 可后续处理 |
| **总计** | **12** | |

---

## 修复计划

### 第一阶段：P0 修复（登录/注册页）

1. `apps/web/app/(auth)/login/page.tsx`
   - 颜色：`#5C9EEB` → `#284A3D`
   - 文案："中文法律智能体社区" → "面向法律行业的灵感与实践平台"

2. `apps/web/app/(auth)/register/page.tsx`
   - 颜色：`#5C9EEB` → `#284A3D`
   - 文案：所有 "法律智能体" → "灵感与实践"

3. `apps/web/app/(auth)/sms-login/page.tsx`
   - 文案更新

### 第二阶段：P1 修复

1. `tailwind.config.ts` - 移除旧蓝色配置
2. `badge.tsx` - 更新 paid 状态颜色
3. `middleware 2.ts` - 删除重复文件
4. `/login` 登录后跳转逻辑

### 第三阶段：P2 及其他页面

1. 更新其他使用蓝色的页面
2. 验证数据库迁移状态

---

*报告生成时间: 2026-04-10*
*下一步: 按优先级开始修复 P0 问题*