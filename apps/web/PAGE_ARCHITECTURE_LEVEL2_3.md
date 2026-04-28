# 律植 (Lvzhi) 二级与三级页面架构规划

> 生成时间: 2026年4月9日
> 阶段: 第五阶段 - 页面结构统一
> 定位: 基于已确定的一级页面架构，继续拆解二级、三级页面
> 版本: v2.0

---

## 一、设计原则回顾

### 1.1 核心设计原则

| 原则 | 说明 |
|------|------|
| **品牌一致性** | 一级、二级、三级页面使用同一套视觉系统和组件 |
| **层级清晰** | 一级做入口、二级做聚合、三级做深入 |
| **游客友好** | 受限浏览 → 登录解锁 的统一模式 |
| **功能密度递增** | 一级轻展示、二级中功能、三级重操作 |

### 1.2 已确定的视觉系统

**配色系统**：
- 主色：`#284A3D`（深植绿）
- 浅绿背景：`#EEF4EF`、`#DDEAE1`
- 正文：`#2E3430`、`#5A6560`
- 边框：`#D9DED7`

**组件规范**：
- 卡片圆角：`rounded-xl`（12px）
- 按钮圆角：`rounded-xl`
- 阴影：`shadow-sm` → hover `shadow-md`
- 间距系统：统一 `gap-*` 间距

---

## 二、页面层级定义

```
┌─────────────────────────────────────────────────────┐
│                    一级页面                          │
│  (品牌入口 · 模块入口 · 核心分流 · 搜索与聚合)        │
├─────────────────────────────────────────────────────┤
│                    二级页面                          │
│  (列表页 · 分类页 · 榜单页 · 聚合页 · 模块内分发)     │
├─────────────────────────────────────────────────────┤
│                    三级页面                          │
│  (详情页 · 操作页 · 我的页 · 管理页 · 深层流程页)     │
└─────────────────────────────────────────────────────┘
```

---

## 三、所有二级页面清单

### 3.1 灵感广场 /inspiration（二级页）

| 路由 | 说明 | 权限 |
|------|------|------|
| `/inspiration/skills` | Skills 列表页 | 全部 |
| `/inspiration/skills/category/[slug]` | Skills 分类页 | 全部 |
| `/inspiration/skills/tag/[slug]` | Skills 标签页 | 全部 |
| `/inspiration/agents` | 智能体列表页 | 全部 |
| `/inspiration/agents/category/[slug]` | 智能体分类页 | 全部 |
| `/inspiration/agents/tag/[slug]` | 智能体标签页 | 全部 |
| `/inspiration/rankings` | 灵感榜单聚合页 | 全部 |
| `/inspiration/featured` | 精选推荐页 | 全部 |
| `/inspiration/my-items` | 我的发布（创作者） | 登录后 |

**二级页结构要素**：
1. 页面头部说明
2. 搜索栏
3. Tab 切换（Skills / 智能体）
4. 分类筛选
5. 标签筛选
6. 排序选择
7. 列表内容
8. 分页 / 加载更多
9. 游客登录引导

---

### 3.2 社区 /community（二级页）

| 路由 | 说明 | 权限 |
|------|------|------|
| `/community/topic/[slug]` | 话题页 | 全部 |
| `/community/latest` | 最新帖子页 | 全部 |
| `/community/hot` | 热门帖子页 | 全部 |
| `/community/following` | 关注动态页 | 登录后 |
| `/community/my` | 我的帖子页 | 登录后 |
| `/community/my/replies` | 我的回复页 | 登录后 |
| `/community/my/following` | 我的关注页 | 登录后 |
| `/community/my/followers` | 我的粉丝页 | 登录后 |

**二级页结构要素**：
1. 页面说明
2. 话题导航
3. 帖子流
4. 排序切换（最新 / 热门 / 关注）
5. 发帖 CTA（登录后）
6. 游客登录提示

---

### 3.3 合作机会 /opportunities（二级页）

| 路由 | 说明 | 权限 |
|------|------|------|
| `/opportunities/type/[type]` | 类型筛选页 | 全部 |
| `/opportunities/city/[city]` | 城市筛选页 | 全部 |
| `/opportunities/my` | 我发布的（登录后） | 登录后 |
| `/opportunities/published` | 已发布列表 | 登录后 |
| `/opportunities/saved` | 收藏的机会（后期） | 登录后 |

**二级页结构要素**：
1. 页面说明
2. 搜索栏
3. 类型筛选（招聘 / 合作 / 项目 / 服务）
4. 城市筛选
5. 列表
6. 发布机会入口（登录后）
7. 游客预览与登录引导

---

### 3.4 创作指南 /creator-guide（二级页）

| 路由 | 说明 | 权限 |
|------|------|------|
| `/creator-guide/getting-started` | 新手入门分区 | 全部 |
| `/creator-guide/rules` | 平台规则分区 | 全部 |
| `/creator-guide/tutorials` | 教程视频分区 | 全部 |
| `/creator-guide/faq` | 常见问题分区 | 全部 |

**二级页结构要素**：
1. 分区标题
2. 分区介绍
3. 内容列表
4. 推荐内容
5. 成为创作者 CTA（登录后）

---

### 3.5 认证律师 /lawyers（二级页）

| 路由 | 说明 | 权限 |
|------|------|------|
| `/lawyers/rankings` | 律师榜单聚合页 | 全部 |
| `/lawyers/city/[city]` | 城市筛选页 | 全部 |
| `/lawyers/expertise/[slug]` | 领域筛选页 | 全部 |
| `/lawyers/featured` | 精选律师页 | 全部 |
| `/lawyers/verified` | 已认证律师页 | 全部 |
| `/lawyers/domain/[practiceArea]` | 执业领域页 | 全部 |

**二级页结构要素**：
1. 搜索栏
2. 地区筛选
3. 领域筛选
4. 榜单切换
5. 律师列表
6. 游客受限浏览提示

---

## 四、所有三级页面清单

### 4.1 灵感广场 /inspiration（三级页）

| 路由 | 说明 | 权限 |
|------|------|------|
| `/inspiration/[slug]` | 灵感详情页 | 全部（受限） |
| `/inspiration/[slug]/review` | 评价页 | 登录后 |
| `/inspiration/[slug]/versions` | 版本历史 | 登录后 |

**三级页结构要素**：
1. 标题区
2. 摘要 / 介绍
3. 标签与分类
4. 创作者信息（游客可受限）
5. 收藏 / 购买 / 使用 CTA
6. 评价 / 评论区（游客可受限）
7. 相关推荐
8. 登录后解锁的深层信息

---

### 4.2 社区 /community（三级页）

| 路由 | 说明 | 权限 |
|------|------|------|
| `/community/posts/[slug]` | 帖子详情页 | 全部（受限） |
| `/community/[id]` | 帖子详情页（别名） | 全部（受限） |
| `/community/creators/[slug]` | 创作者主页 | 全部 |

**三级页结构要素**：
1. 帖子标题
2. 作者信息
3. 正文
4. 相关话题
5. 评论区
6. 回复区
7. 点赞 / 收藏 / 关注 / 回复 CTA
8. 游客仅可预览，登录后参与互动

---

### 4.3 合作机会 /opportunities（三级页）

| 路由 | 说明 | 权限 |
|------|------|------|
| `/opportunities/[slug]` | 机会详情页 | 全部（受限） |
| `/opportunities/[slug]/apply` | 申请页 | 登录后 |

**三级页结构要素**：
1. 标题
2. 类型
3. 地区
4. 简述
5. 详情正文（游客受限）
6. 发布者信息（游客受限）
7. 相关机会推荐
8. CTA：登录后查看完整信息 / 发起合作

---

### 4.4 创作指南 /creator-guide（三级页）

| 路由 | 说明 | 权限 |
|------|------|------|
| `/creator-guide/[slug]` | 文章详情页 | 全部 |
| `/creator-guide/[category]/[slug]` | 分类文章详情 | 全部 |

**三级页结构要素**：
1. 标题
2. 摘要
3. 正文
4. 关联文章
5. 上一篇 / 下一篇
6. 成为创作者入口（登录后）

---

### 4.5 认证律师 /lawyers（三级页）

| 路由 | 说明 | 权限 |
|------|------|------|
| `/lawyers/[slug]` | 律师详情页 | 全部（受限） |
| `/lawyers/[id]/contact-access` | 联系方式（登录解锁） | 登录后 |

**三级页结构要素**：
1. 基础资料
2. 平台认证信息
3. 擅长领域
4. 用户评论
5. 律师创作的产品
6. 创作影响力信息
7. CTA（登录后进一步操作）

---

### 4.6 创作者中心 /creator（三级页）

| 路由 | 说明 | 权限 |
|------|------|------|
| `/creator` | 创作者概览 | 创作者 |
| `/creator/skills` | Skills 管理 | 创作者 |
| `/creator/skills/new` | 创建 Skills | 创作者 |
| `/creator/skills/[id]/edit` | 编辑 Skills | 创作者 |
| `/creator/skills/[id]/stats` | Skills 数据分析 | 创作者 |
| `/creator/agents` | 智能体管理 | 创作者 |
| `/creator/agents/new` | 创建智能体 | 创作者 |
| `/creator/agents/[id]/edit` | 编辑智能体 | 创作者 |
| `/creator/agents/[id]/stats` | 智能体数据分析 | 创作者 |
| `/creator/earnings` | 收益概览 | 创作者 |
| `/creator/earnings/withdraw` | 提现申请 | 创作者 |
| `/creator/earnings/history` | 提现记录 | 创作者 |
| `/creator/invitations` | 收到的邀请 | 创作者 |
| `/creator/invitations/[id]` | 邀请详情 | 创作者 |
| `/creator/trials` | 试用邀请管理 | 创作者 |
| `/creator/trials/new` | 发起试用邀请 | 创作者 |
| `/creator/trials/responses` | 试用响应管理 | 创作者 |
| `/creator/verification` | 认证申请 | 创作者 |
| `/creator/ip` | 知识产权申请 | 创作者 |
| `/creator/ip/new` | 新建知产申请 | 创作者 |
| `/creator/stats` | 数据分析 | 创作者 |

**三级页结构要素**：
1. 左侧导航 / 顶部导航
2. 页面标题
3. 数据概览
4. 列表 / 表格 / 卡片内容
5. 空状态
6. 操作按钮

---

### 4.7 客户工作台 /workspace（三级页）

| 路由 | 说明 | 权限 |
|------|------|------|
| `/workspace` | 工作台概览 | 登录后 |
| `/workspace/purchased` | 已购 Skills | 登录后 |
| `/workspace/favorites` | 我的收藏 | 登录后 |
| `/workspace/invitations` | 合作邀请 | 登录后 |
| `/workspace/invitations/sent` | 我发出的 | 登录后 |
| `/workspace/invitations/received` | 我收到的 | 登录后 |
| `/workspace/community` | 我的社区 | 登录后 |
| `/workspace/notifications` | 通知中心 | 登录后 |
| `/workspace/profile` | 个人资料 | 登录后 |
| `/workspace/settings` | 账号设置 | 登录后 |

**三级页结构要素**：
1. 左侧导航 / 顶部导航
2. 页面标题
3. 数据概览
4. 列表 / 卡片内容
5. 空状态
6. 操作按钮

---

### 4.8 管理后台 /admin（三级页）

| 路由 | 说明 | 权限 |
|------|------|------|
| `/admin` | 管理员概览 | admin/superadmin |
| `/admin/users` | 用户管理 | admin/superadmin |
| `/admin/users/[id]` | 用户详情 | admin/superadmin |
| `/admin/skills` | Skills 审核 | admin/superadmin |
| `/admin/agents` | 智能体审核 | admin/superadmin |
| `/admin/community` | 社区管理 | admin/superadmin |
| `/admin/orders` | 订单管理 | admin/superadmin |
| `/admin/withdraw` | 提现审批 | admin/superadmin |
| `/admin/verification` | 认证审核 | admin/superadmin |
| `/admin/verification/lawyer` | 律师认证 | admin/superadmin |
| `/admin/verification/creator` | 创作者等级 | admin/superadmin |
| `/admin/ip` | 知识产权审核 | admin/superadmin |
| `/admin/opportunities` | 机会管理 | admin/superadmin |
| `/admin/data` | 数据中心 | superadmin |
| `/admin/admins` | 管理员管理 | superadmin |
| `/admin/blackhouse` | 小黑屋 | superadmin |
| `/admin/settings` | 系统配置 | superadmin |

**三级页结构要素**：
1. 后台导航侧边栏
2. 顶部管理栏
3. 页面标题
4. 数据区 / 筛选区 / 表格区
5. 操作区
6. 状态区

---

## 五、模板体系划分

### 5.1 二级页面模板类型

#### 模板 A：列表页模板

适用页面：
- Skills 列表 `/inspiration/skills`
- 智能体列表 `/inspiration/agents`
- 律师列表 `/lawyers`
- 合作机会列表 `/opportunities`

结构：
```
┌─────────────────────────────────────────┐
│  Hero 区域                              │
│  - 页面标题                              │
│  - 页面说明                              │
│  - 搜索栏                                │
├─────────────────────────────────────────┤
│  筛选区                                  │
│  - 分类筛选（Tab / 按钮）                 │
│  - 标签筛选                              │
│  - 排序选择                              │
├─────────────────────────────────────────┤
│  内容列表区                             │
│  - 卡片网格 / 列表                       │
│  - 分页 / 加载更多                        │
├─────────────────────────────────────────┤
│  游客引导区（可选）                       │
│  - 登录提示                              │
│  - CTA                                  │
└─────────────────────────────────────────┘
```

#### 模板 B：话题/分区页模板

适用页面：
- 社区话题页 `/community/topic/[slug]`
- 创作指南分区页 `/creator-guide/getting-started`

结构：
```
┌─────────────────────────────────────────┐
│  分区头部                                │
│  - 分区标题                              │
│  - 分区介绍                              │
│  - 快速入口                              │
├─────────────────────────────────────────┤
│  内容流                                  │
│  - 帖子列表 / 文章列表                    │
│  - 排序切换                              │
├─────────────────────────────────────────┤
│  底部 CTA                               │
│  - 发帖入口 / 成为创作者入口              │
└─────────────────────────────────────────┘
```

#### 模板 C：榜单/聚合页模板

适用页面：
- 律师榜单 `/lawyers/rankings`
- 灵感榜单 `/inspiration/rankings`

结构：
```
┌─────────────────────────────────────────┐
│  榜单切换 Tab                           │
│  - 综合 / 地区 / 领域 / 影响力            │
├─────────────────────────────────────────┤
│  榜单内容                                │
│  - 排名列表                              │
│  - 卡片展示                              │
├─────────────────────────────────────────┤
│  更多入口                                │
└─────────────────────────────────────────┘
```

---

### 5.2 三级页面模板类型

#### 模板 D：详情页模板

适用页面：
- Skills 详情 `/inspiration/[slug]`
- 智能体详情
- 合作机会详情 `/opportunities/[slug]`
- 律师详情 `/lawyers/[slug]`
- 帖子详情 `/community/posts/[slug]`

结构：
```
┌─────────────────────────────────────────┐
│  详情 Hero                              │
│  - 返回链接                              │
│  - 标题 / 标签 / 作者信息                 │
│  - 核心数据（评分/使用量/价格）            │
├───────────────────────┬─────────────────┤
│  主内容区              │  操作侧边栏      │
│  - 摘要/介绍           │  - 价格/状态     │
│  - 详细正文           │  - 主要 CTA     │
│  - 功能特点           │  - 次要操作     │
│  - 评论区（受限）     │  - 创作者信息   │
│                       │  - 相关推荐     │
└───────────────────────┴─────────────────┘
│  游客受限提示（可选）                     │
│  - 登录解锁                              │
└─────────────────────────────────────────┘
```

#### 模板 E：个人中心模板

适用页面：
- `/workspace/*`
- `/creator/*`

结构：
```
┌─────────────────────────────────────────┐
│  页面标题 + 操作入口                      │
├──────────┬──────────────────────────────┤
│  侧边导航 │  内容区                      │
│  - 概览   │  - 数据卡片                  │
│  - 列表   │  - 内容列表                  │
│  - 设置   │  - 操作表格                  │
│          │  - 分页                      │
└──────────┴──────────────────────────────┘
```

#### 模板 F：管理后台模板

适用页面：
- `/admin/*`

结构：
```
┌─────────────────────────────────────────┐
│  顶部工具栏（面包屑 + 搜索 + 通知）        │
├──────────┬──────────────────────────────┤
│  侧边导航 │  页面内容                    │
│  - 功能模块  │  - 页面标题                │
│  - 设置   │  - 数据筛选区                │
│          │  - 操作表格                  │
│          │  - 分页                      │
└──────────┴──────────────────────────────┘
```

---

## 六、角色可见差异

### 6.1 二级页面角色差异

| 页面类型 | 游客 | 客户 | 创作者 | 管理员 | 超管 |
|---------|:----:|:----:|:------:|:------:|:----:|
| 列表页浏览 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 收藏功能 | ❌ | ✅ | ✅ | ✅ | ✅ |
| 发帖/发布入口 | ❌ | ✅ | ✅ | ✅ | ✅ |
| 数据筛选 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 导出功能 | ❌ | ❌ | ❌ | ✅ | ✅ |

### 6.2 三级页面角色差异

| 页面类型 | 游客 | 客户 | 创作者 | 管理员 | 超管 |
|---------|:----:|:----:|:------:|:------:|:----:|
| 详情页预览 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 联系方式查看 | ❌ | ✅ | ✅ | ✅ | ✅ |
| 深度内容查看 | ❌ | ✅ | ✅ | ✅ | ✅ |
| 发表评论 | ❌ | ✅ | ✅ | ✅ | ✅ |
| 管理操作 | ❌ | ❌ | ❌ | ✅ | ✅ |
| 审核操作 | ❌ | ❌ | ❌ | ✅ | ✅ |
| 系统配置 | ❌ | ❌ | ❌ | ❌ | ✅ |

### 6.3 工作台角色差异

| 功能 | /workspace | /creator | /admin |
|------|:-----------:|:--------:|:------:|
| 适用角色 | 客户/创作者 | 创作者 | 管理员/超管 |
| 已购内容 | ✅ | ✅ | ❌ |
| 我的收藏 | ✅ | ✅ | ❌ |
| 收益管理 | ❌ | ✅ | ❌ |
| 产品管理 | ❌ | ✅ | ❌ |
| 用户管理 | ❌ | ❌ | ✅ |
| 系统配置 | ❌ | ❌ | ✅（超管） |

---

## 七、游客受限浏览策略（统一模式）

### 7.1 受限模式组件

```tsx
// components/common/GuestGate.tsx
interface GuestGateProps {
  children: React.ReactNode;
  action?: string;  // 如"收藏"、"购买"、"查看联系方式"
  fallback?: React.ReactNode;
}
```

### 7.2 受限内容类型

| 内容类型 | 受限程度 | 解锁方式 |
|---------|---------|---------|
| 联系方式 | 完全隐藏 | 登录 |
| 深度正文 | 部分模糊 | 登录 |
| 评论区 | 部分隐藏 | 登录 |
| 价格信息 | 可见 | - |
| 创作者信息 | 基础可见 | 登录查看完整 |
| 相关推荐 | 可见 | - |

### 7.3 受限状态样式

```css
/* 完全受限 */
.guest-locked {
  filter: blur(4px);
  opacity: 0.5;
  pointer-events: none;
  user-select: none;
}

/* 部分受限 */
.guest-partial {
  position: relative;
}

.guest-partial::after {
  content: "登录后解锁";
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.8);
  backdrop-filter: blur(2px);
}
```

---

## 八、共用组件清单

### 8.1 页面结构组件

| 组件 | 用途 | 位置 |
|------|------|------|
| `PageContainer` | 页面容器 | `components/layout/` |
| `PageHeader` | 页面头部（标题+说明+操作） | `components/layout/` |
| `PageHero` | 页面 Hero 区域 | `components/layout/` |

### 8.2 筛选组件

| 组件 | 用途 | 位置 |
|------|------|------|
| `SearchBar` | 搜索框 | `components/common/` |
| `FilterBar` | 筛选按钮组 | `components/common/` |
| `FilterDropdown` | 筛选下拉菜单 | `components/common/` |
| `SortSelect` | 排序选择器 | `components/common/` |
| `CategoryTabs` | 分类 Tab 切换 | `components/common/` |

### 8.3 列表组件

| 组件 | 用途 | 位置 |
|------|------|------|
| `CardGrid` | 卡片网格容器 | `components/common/` |
| `ListView` | 列表视图容器 | `components/common/` |
| `Pagination` | 分页器 | `components/common/` |
| `LoadMore` | 加载更多 | `components/common/` |

### 8.4 内容展示组件

| 组件 | 用途 | 位置 |
|------|------|------|
| `ItemCard` | 通用内容卡片 | `components/common/` |
| `ProfileCard` | 用户/创作者卡片 | `components/common/` |
| `StatCard` | 数据统计卡片 | `components/common/` |
| `AuthorBadge` | 作者标识 | `components/common/` |
| `PriceTag` | 价格标签 | `components/common/` |

### 8.5 交互组件

| 组件 | 用途 | 位置 |
|------|------|------|
| `GuestGate` | 游客受限门 | `components/common/` |
| `LoginPrompt` | 登录引导 | `components/common/` |
| `EmptyState` | 空状态 | `components/common/` |
| `LoadingSpinner` | 加载状态 | `components/common/` |
| `ActionButton` | 操作按钮组 | `components/common/` |

### 8.6 侧边导航组件

| 组件 | 用途 | 位置 |
|------|------|------|
| `SideNav` | 通用侧边导航 | `components/layout/` |
| `DashboardNav` | 工作台导航 | `components/layout/` |
| `AdminSidebar` | 管理后台侧边栏 | `components/admin/` |

---

## 九、路由结构总览

```
/
├── (marketing)                           # 营销页
│   ├── page.tsx                         # 首页
│   ├── inspiration/                     # 灵感广场
│   │   ├── page.tsx                     # 一级页
│   │   ├── [slug]/page.tsx              # 三级页 - 详情
│   │   ├── skills/                      # 二级页 - Skills
│   │   │   ├── page.tsx
│   │   │   ├── category/[slug]/page.tsx
│   │   │   └── tag/[slug]/page.tsx
│   │   ├── agents/                      # 二级页 - 智能体
│   │   │   ├── page.tsx
│   │   │   ├── category/[slug]/page.tsx
│   │   │   └── tag/[slug]/page.tsx
│   │   ├── rankings/page.tsx            # 二级页 - 榜单
│   │   └── featured/page.tsx            # 二级页 - 精选
│   ├── community/                       # 社区
│   │   ├── page.tsx                     # 一级页
│   │   ├── posts/[slug]/page.tsx        # 三级页 - 帖子详情
│   │   ├── topic/[slug]/page.tsx        # 二级页 - 话题
│   │   ├── latest/page.tsx              # 二级页 - 最新
│   │   ├── hot/page.tsx                 # 二级页 - 热门
│   │   ├── following/page.tsx           # 二级页 - 关注（登录后）
│   │   └── my/                          # 二级页 - 我的（登录后）
│   ├── opportunities/                   # 合作机会
│   │   ├── page.tsx                     # 一级页
│   │   ├── [slug]/page.tsx              # 三级页 - 详情
│   │   ├── type/[type]/page.tsx         # 二级页 - 类型筛选
│   │   └── city/[city]/page.tsx         # 二级页 - 城市筛选
│   ├── creator-guide/                   # 创作指南
│   │   ├── page.tsx                     # 一级页
│   │   ├── [slug]/page.tsx              # 三级页 - 文章详情
│   │   ├── getting-started/page.tsx     # 二级页 - 入门
│   │   ├── rules/page.tsx               # 二级页 - 规则
│   │   ├── tutorials/page.tsx           # 二级页 - 教程
│   │   └── faq/page.tsx                 # 二级页 - FAQ
│   └── lawyers/                         # 认证律师
│       ├── page.tsx                     # 一级页
│       ├── [slug]/page.tsx              # 三级页 - 律师详情
│       ├── rankings/page.tsx             # 二级页 - 榜单
│       ├── city/[city]/page.tsx         # 二级页 - 城市筛选
│       ├── expertise/[slug]/page.tsx    # 二级页 - 领域筛选
│       ├── featured/page.tsx            # 二级页 - 精选
│       └── verified/page.tsx            # 二级页 - 已认证
│
├── workspace/                           # 客户工作台
│   ├── page.tsx                         # 概览
│   ├── purchased/page.tsx               # 已购 Skills
│   ├── favorites/page.tsx              # 我的收藏
│   ├── invitations/                    # 合作邀请
│   │   ├── page.tsx
│   │   ├── sent/page.tsx
│   │   └── received/page.tsx
│   ├── community/page.tsx              # 我的社区
│   ├── notifications/page.tsx          # 通知中心
│   ├── profile/page.tsx                # 个人资料
│   └── settings/page.tsx               # 账号设置
│
├── creator/                            # 创作者中心
│   ├── page.tsx                         # 概览
│   ├── skills/                         # Skills 管理
│   │   ├── page.tsx
│   │   ├── new/page.tsx
│   │   └── [id]/edit/page.tsx
│   ├── agents/                         # 智能体管理
│   │   ├── page.tsx
│   │   ├── new/page.tsx
│   │   └── [id]/edit/page.tsx
│   ├── earnings/                       # 收益管理
│   │   ├── page.tsx
│   │   └── withdraw/page.tsx
│   ├── invitations/page.tsx            # 收到的邀请
│   ├── trials/                         # 试用邀请
│   │   ├── page.tsx
│   │   └── new/page.tsx
│   ├── verification/page.tsx           # 认证申请
│   ├── ip/page.tsx                    # 知识产权
│   └── stats/page.tsx                  # 数据分析
│
├── admin/                              # 管理后台
│   ├── page.tsx                        # 概览
│   ├── users/                          # 用户管理
│   ├── skills/                         # Skills 审核
│   ├── agents/                         # 智能体审核
│   ├── community/                     # 社区管理
│   ├── orders/                         # 订单管理
│   ├── withdraw/                       # 提现审批
│   ├── verification/                   # 认证审核
│   ├── ip/                            # 知识产权审核
│   ├── data/                          # 数据中心（超管）
│   ├── admins/                        # 管理员管理（超管）
│   ├── blackhouse/                    # 小黑屋（超管）
│   └── settings/                      # 系统配置（超管）
│
└── (auth)/                             # 认证页
    ├── login/page.tsx
    ├── register/page.tsx
    └── forgot-password/page.tsx
```

---

## 十、文件命名规范

### 10.1 页面文件

```
app/
├── (marketing)/
│   ├── page.tsx                        # 一级页
│   ├── inspiration/
│   │   ├── page.tsx                   # 一级页
│   │   ├── [slug]/
│   │   │   └── page.tsx               # 三级页
│   │   ├── skills/
│   │   │   ├── page.tsx               # 二级页
│   │   │   └── category/
│   │   │       └── [slug]/
│   │   │           └── page.tsx      # 二级页
```

### 10.2 组件文件

```
components/
├── layout/
│   ├── page-header.tsx
│   ├── page-hero.tsx
│   ├── side-nav.tsx
│   └── dashboard-nav.tsx
├── common/
│   ├── search-bar.tsx
│   ├── filter-bar.tsx
│   ├── filter-dropdown.tsx
│   ├── sort-select.tsx
│   ├── category-tabs.tsx
│   ├── card-grid.tsx
│   ├── pagination.tsx
│   ├── guest-gate.tsx
│   ├── login-prompt.tsx
│   ├── empty-state.tsx
│   ├── item-card.tsx
│   ├── author-badge.tsx
│   └── price-tag.tsx
├── inspiration/
│   ├── skills-list.tsx
│   ├── agents-list.tsx
│   ├── skill-card.tsx
│   ├── agent-card.tsx
│   └── inspiration-detail.tsx
├── community/
│   ├── post-list.tsx
│   ├── post-card.tsx
│   ├── post-detail.tsx
│   └── comment-section.tsx
├── opportunities/
│   ├── opportunity-list.tsx
│   ├── opportunity-card.tsx
│   └── opportunity-detail.tsx
├── lawyers/
│   ├── lawyer-list.tsx
│   ├── lawyer-card.tsx
│   └── lawyer-detail.tsx
├── creator/
│   ├── creator-nav.tsx
│   ├── earnings-panel.tsx
│   └── stats-chart.tsx
├── workspace/
│   ├── workspace-nav.tsx
│   └── purchase-card.tsx
└── admin/
    ├── admin-sidebar.tsx
    ├── admin-header.tsx
    └── admin-table.tsx
```

---

## 十一、实现优先级

### 第一批（核心模板）

1. **统一 GuestGate 组件**
2. **创建 PageHeader 组件**
3. **创建 FilterBar 组件（绿色主题）**
4. **重构 Skills 列表页（模板 A）**
5. **重构 Skills 详情页（模板 D）**
6. **重构律师列表页（模板 A）**
7. **重构律师详情页（模板 D）**

### 第二批（二级页面）

1. **重构智能体列表页**
2. **重构社区话题页（模板 B）**
3. **重构合作机会列表页**
4. **重构合作机会详情页**
5. **重构创作指南分区页**

### 第三批（个人中心）

1. **统一 Workspace 导航**
2. **统一 Creator 导航**
3. **统一 Admin 侧边栏**
4. **完善工作台各子页面**
5. **完善创作者中心各子页面**

### 第四批（完善）

1. **完善管理后台各子页面**
2. **统一空状态组件**
3. **统一加载状态组件**
4. **统一错误状态组件**
5. **移动端适配**

---

## 十二、注意事项

1. **保持视觉一致性**：所有页面必须使用同一套配色、字体、间距、圆角
2. **组件复用**：优先使用现有组件，避免重复造轮子
3. **渐进增强**：先保证功能可用，再优化交互体验
4. **响应式设计**：移动端优先考虑关键功能
5. **类型安全**：所有组件和页面必须有完整的 TypeScript 类型
6. **无障碍**：遵循 WCAG 2.1 规范

---

## 十三、统一的 CSS 类名规范

### 13.1 背景色

| Token | 色值 | 用途 |
|-------|------|------|
| `bg-[#F7F7F3]` | warmWhite | 页面背景 |
| `bg-white` | cardWhite | 卡片背景 |
| `bg-[#EEF4EF]` | mintLight | 浅绿背景、标签背景 |
| `bg-[#DDEAE1]` | mint | 情绪强调背景 |
| `bg-[#284A3D]` | forest | 主按钮、深色区块背景 |
| `bg-[#18261F]` | forestDeep | 最深背景 |

### 13.2 边框色

| Token | 色值 | 用途 |
|-------|------|------|
| `border-[#D9DED7]` | borderGreen | 默认边框 |
| `border-[#C4DBCB]` | mintBorder | 强调边框 |
| `border-[#284A3D]` | forest | 激活边框 |

### 13.3 文字色

| Token | 色值 | 用途 |
|-------|------|------|
| `text-[#2E3430]` | textPrimary | 主标题、正文 |
| `text-[#5A6560]` | textSecondary | 副标题、说明 |
| `text-[#9AA59D]` | textWeak | 占位符、时间戳 |
| `text-[#284A3D]` | forest | 品牌强调色 |
| `text-white` | - | 深色背景上的文字 |

### 13.4 圆角规范

| 类名 | 像素值 | 用途 |
|------|--------|------|
| `rounded-xl` | 12px | 卡片、按钮 |
| `rounded-2xl` | 16px | 大卡片、面板 |
| `rounded-full` | 9999px | 标签、小按钮 |

### 13.5 阴影规范

| 类名 | 用途 |
|------|------|
| `shadow-sm` | 默认卡片阴影 |
| `hover:shadow-md` | 卡片悬停阴影 |
| `shadow-lg` | 弹窗、浮层 |

---

## 十四、模板详细设计

### 14.1 列表页模板（Template A）

```
┌────────────────────────────────────────────────────────────┐
│  [PageHero]                                                │
│  - 返回链接（可选）                                         │
│  - 页面标题 H1                                              │
│  - 页面副标题/说明                                          │
│  - 搜索框（可选）                                           │
├────────────────────────────────────────────────────────────┤
│  [FilterBar]                                               │
│  - 分类筛选按钮组（横向排列）                                │
│  - 标签筛选下拉（可选）                                      │
│  - 排序选择下拉（可选）                                      │
├────────────────────────────────────────────────────────────┤
│  [FeaturedSection]（可选）                                   │
│  - 精选内容横幅                                             │
├────────────────────────────────────────────────────────────┤
│  [ContentList]                                              │
│  - 卡片网格/列表                                            │
│  - 加载状态（骨架屏）                                        │
│  - 空状态                                                   │
├────────────────────────────────────────────────────────────┤
│  [Pagination] / [LoadMore]                                  │
├────────────────────────────────────────────────────────────┤
│  [GuestGate]（可选）                                         │
│  - 登录引导区域                                             │
└────────────────────────────────────────────────────────────┘
```

### 14.2 详情页模板（Template D）

```
┌────────────────────────────────────────────────────────────┐
│  [Breadcrumb] 返回链接                                      │
├────────────────────────────────────────────────────────────┤
│  [DetailHeader]                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  [HeaderBadge] 类型标签                               │  │
│  │  [Title] 标题                                        │  │
│  │  [MetaInfo] 作者 · 分类 · 标签 · 时间                  │  │
│  │  [Rating/Stats] 评分 · 使用量 · 收藏量                  │  │
│  └──────────────────────────────────────────────────────┘  │
├─────────────────────────────┬────────────────────────────────┤
│  [MainContent]              │  [ActionSidebar]              │
│  ┌────────────────────────┐ │  ┌──────────────────────────┐ │
│  │ [Summary] 摘要/简介     │ │  │ [PriceCard] 价格卡片     │ │
│  │ [Body] 详细正文         │ │  │ [PrimaryCTA] 主操作按钮 │ │
│  │ [Features] 功能特点     │ │  │ [SecondaryCTA] 次要操作 │ │
│  │ [UsageGuide] 使用说明   │ │  ├──────────────────────────┤ │
│  │ [Reviews] 评论区(受限)  │ │  │ [CreatorCard] 创作者信息│ │
│  └────────────────────────┘ │  ├──────────────────────────┤ │
│                            │  │ [RelatedItems] 相关推荐   │ │
│                            │  └──────────────────────────┘ │
├─────────────────────────────┴────────────────────────────────┤
│  [GuestGate]（可选）- 深层内容解锁提示                        │
└────────────────────────────────────────────────────────────┘
```

### 14.3 个人中心模板（Template E）

```
┌────────────────────────────────────────────────────────────┐
│  [DashboardHeader]                                          │
│  - 用户欢迎信息                                              │
│  - 快捷统计卡片                                              │
├──────────────┬───────────────────────────────────────────────┤
│  [SideNav]   │  [PageContent]                               │
│  - 概览      │  ┌─────────────────────────────────────────┐ │
│  - 功能菜单  │  │ [SectionHeader]                          │ │
│  - 设置入口  │  │ - 页面标题 · 操作按钮                    │ │
│              │  ├─────────────────────────────────────────┤ │
│              │  │ [DataCards] / [Table] / [List]          │ │
│              │  │ - 数据卡片网格/数据表格/列表             │ │
│              │  ├─────────────────────────────────────────┤ │
│              │  │ [Pagination]                             │ │
│              │  │ - 分页控制                               │ │
│              │  └─────────────────────────────────────────┘ │
├──────────────┴───────────────────────────────────────────────┤
│  [EmptyState]（当无数据时）                                   │
└────────────────────────────────────────────────────────────┘
```

### 14.4 管理后台模板（Template F）

```
┌────────────────────────────────────────────────────────────┐
│  [AdminTopBar]                                              │
│  - 面包屑导航                                               │
│  - 搜索框                                                   │
│  - 通知/用户菜单                                             │
├──────────────┬───────────────────────────────────────────────┤
│  [Sidebar]   │  [AdminContent]                              │
│  - 模块导航   │  ┌─────────────────────────────────────────┐ │
│  - 设置       │  │ [PageHeader]                              │ │
│              │  │ - 页面标题 · 描述                          │ │
│  【admin】    │  │ - 筛选/操作按钮                           │ │
│  - 用户管理   │  ├─────────────────────────────────────────┤ │
│  - 内容审核   │  │ [FilterSection]                          │ │
│  - 订单管理   │  │ - 状态筛选 · 日期筛选 · 搜索             │ │
│  - ...       │  ├─────────────────────────────────────────┤ │
│              │  │ [DataTable]                               │ │
│  【superadmin】│ │ - 表格列表                               │ │
│  - 数据中心   │  │ - 批量操作                                │ │
│  - 系统配置   │  ├─────────────────────────────────────────┤ │
│  - ...       │  │ [Pagination]                              │ │
│              │  └─────────────────────────────────────────┘ │
└──────────────┴───────────────────────────────────────────────┘
```

---

## 十五、页面过渡动画规范

### 15.1 卡片悬停动画

```css
.card-hover {
  transition: all 0.2s ease-out;
}
.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px -5px rgb(40 74 61 / 0.1);
  border-color: #284A3D;
}
```

### 15.2 按钮点击反馈

```css
.btn-press:active {
  transform: scale(0.98);
}
```

### 15.3 页面加载骨架屏

所有列表页和详情页在加载时显示骨架屏，避免布局抖动。

---

## 十六、响应式断点

| 断点 | 宽度 | 用途 |
|------|------|------|
| `sm` | 640px | 小屏幕手机横屏 |
| `md` | 768px | 平板竖屏 |
| `lg` | 1024px | 平板横屏、小笔记本 |
| `xl` | 1280px | 标准笔记本 |
| `2xl` | 1536px | 大屏幕显示器 |

### 16.1 栅格系统

- 列表页内容：`lg:grid-cols-3` → `sm:grid-cols-2` → `grid-cols-1`
- 详情页布局：`lg:grid-cols-[1fr_380px]` → 单列堆叠
- 管理后台：`xl:grid-cols-[0.24fr_0.76fr]` → 侧边栏折叠

---

## 十七、状态设计

### 17.1 加载状态

- 使用品牌绿色 spinner：`border-4 border-[#284A3D] border-t-transparent`
- 骨架屏使用渐变动画：`animate-pulse bg-gradient-to-r from-slate-100 to-slate-50`

### 17.2 空状态

- 图标：使用 Lucide 图标，尺寸 48px，颜色 `#9AA59D`
- 标题：18px 粗体，颜色 `#2E3430`
- 描述：14px，颜色 `#5A6560`
- 操作按钮：品牌绿色 CTA

### 17.3 错误状态

- 背景：`bg-red-50`
- 文字：`text-red-600`
- 提供重试按钮

### 17.4 成功状态

- Toast 提示：品牌绿色背景，白色文字
- 持续时间：3 秒

---

## 十八、游客受限状态详细设计

### 18.1 受限内容类型

| 内容类型 | 显示方式 | 解锁条件 |
|----------|----------|----------|
| 联系方式 | 完全隐藏，显示解锁按钮 | 登录 |
| 详细正文 | 前 20% 可见，后续模糊处理 | 登录 |
| 评论区 | 显示前 3 条，后续锁定 | 登录 |
| 下载功能 | 显示预览，解锁下载按钮 | 购买/登录 |
| 价格信息 | 始终可见 | - |
| 创作者信息 | 基础信息可见 | 登录查看全部 |

### 18.2 GuestGate 组件变体

```tsx
// 基础版本
<GuestGate action="收藏">
  <FavoriteButton />
</GuestGate>

// 内容遮罩版本
<GuestGate mode="blur" action="查看完整内容">
  <LockedContent />
</GuestGate>

// 完全隐藏版本
<GuestGate mode="hidden" action="查看联系方式">
  <ContactInfo />
</GuestGate>
```

---

## 十九、组件文件结构

```
components/
├── layout/
│   ├── page-header.tsx          # 页面头部（标题+描述+操作）
│   ├── page-hero.tsx            # Hero 区域
│   ├── page-container.tsx        # 页面容器
│   ├── side-nav.tsx              # 通用侧边导航
│   ├── dashboard-nav.tsx         # 工作台导航
│   └── admin-sidebar.tsx         # 管理后台侧边栏
│
├── common/
│   ├── search-bar.tsx            # 搜索框
│   ├── filter-bar.tsx             # 筛选按钮组
│   ├── filter-dropdown.tsx        # 筛选下拉菜单
│   ├── sort-select.tsx            # 排序选择器
│   ├── category-tabs.tsx          # 分类 Tab 切换
│   ├── card-grid.tsx              # 卡片网格容器
│   ├── pagination.tsx             # 分页器
│   ├── guest-gate.tsx             # 游客受限门
│   ├── login-prompt.tsx           # 登录引导
│   ├── empty-state.tsx            # 空状态
│   ├── loading-skeleton.tsx       # 加载骨架屏
│   └── item-card.tsx              # 通用内容卡片
│
├── inspiration/
│   ├── skills-list.tsx            # Skills 列表
│   ├── agents-list.tsx             # 智能体列表
│   ├── skill-card.tsx              # Skill 卡片
│   ├── agent-card.tsx              # 智能体卡片
│   ├── skill-detail.tsx            # Skill 详情
│   └── agent-detail.tsx            # 智能体详情
│
├── community/
│   ├── post-list.tsx               # 帖子列表
│   ├── post-card.tsx               # 帖子卡片
│   ├── post-detail.tsx             # 帖子详情
│   └── comment-section.tsx         # 评论区
│
├── opportunities/
│   ├── opportunity-list.tsx        # 机会列表
│   ├── opportunity-card.tsx        # 机会卡片
│   └── opportunity-detail.tsx      # 机会详情
│
├── lawyers/
│   ├── lawyer-list.tsx             # 律师列表
│   ├── lawyer-card.tsx             # 律师卡片
│   ├── lawyer-detail.tsx           # 律师详情
│   └── lawyer-rankings.tsx         # 律师榜单
│
├── creator/
│   ├── creator-nav.tsx             # 创作者导航
│   ├── earnings-panel.tsx          # 收益面板
│   └── stats-chart.tsx             # 统计图表
│
├── workspace/
│   ├── workspace-nav.tsx           # 工作台导航
│   └── purchase-card.tsx           # 购买记录卡片
│
└── admin/
    ├── admin-sidebar.tsx            # 管理员侧边栏
    ├── admin-header.tsx            # 管理员顶部栏
    └── admin-table.tsx              # 管理表格
```

---

## 二十、路由与文件对照表

### 20.1 灵感广场路由

| 路由 | 文件路径 | 模板类型 |
|------|----------|----------|
| `/inspiration` | `(marketing)/inspiration/page.tsx` | 一级页 |
| `/inspiration/skills` | `(marketing)/inspiration/skills/page.tsx` | 模板A |
| `/inspiration/skills/category/[slug]` | `(marketing)/inspiration/skills/category/[slug]/page.tsx` | 模板A |
| `/inspiration/skills/tag/[slug]` | `(marketing)/inspiration/skills/tag/[slug]/page.tsx` | 模板A |
| `/inspiration/agents` | `(marketing)/inspiration/agents/page.tsx` | 模板A |
| `/inspiration/agents/category/[slug]` | `(marketing)/inspiration/agents/category/[slug]/page.tsx` | 模板A |
| `/inspiration/agents/tag/[slug]` | `(marketing)/inspiration/agents/tag/[slug]/page.tsx` | 模板A |
| `/inspiration/rankings` | `(marketing)/inspiration/rankings/page.tsx` | 模板C |
| `/inspiration/[slug]` | `(marketing)/inspiration/[slug]/page.tsx` | 模板D |

### 20.2 社区路由

| 路由 | 文件路径 | 模板类型 |
|------|----------|----------|
| `/community` | `(marketing)/community/page.tsx` | 一级页 |
| `/community/topic/[slug]` | `(marketing)/community/topic/[slug]/page.tsx` | 模板B |
| `/community/latest` | `(marketing)/community/latest/page.tsx` | 模板B |
| `/community/hot` | `(marketing)/community/hot/page.tsx` | 模板B |
| `/community/following` | `(marketing)/community/following/page.tsx` | 模板B |
| `/community/[id]` | `(marketing)/community/[id]/page.tsx` | 模板D |

### 20.3 工作台路由

| 路由 | 文件路径 | 模板类型 |
|------|----------|----------|
| `/workspace` | `(dashboard)/workspace/page.tsx` | 模板E |
| `/workspace/purchased` | `(dashboard)/workspace/purchased/page.tsx` | 模板E |
| `/workspace/favorites` | `(dashboard)/workspace/favorites/page.tsx` | 模板E |
| `/workspace/invitations` | `(dashboard)/workspace/invitations/page.tsx` | 模板E |
| `/workspace/notifications` | `(dashboard)/workspace/notifications/page.tsx` | 模板E |

### 20.4 创作者中心路由

| 路由 | 文件路径 | 模板类型 |
|------|----------|----------|
| `/creator` | `(dashboard)/creator/page.tsx` | 模板E |
| `/creator/skills` | `(dashboard)/creator/skills/page.tsx` | 模板E |
| `/creator/agents` | `(dashboard)/creator/agents/page.tsx` | 模板E |
| `/creator/earnings` | `(dashboard)/creator/earnings/page.tsx` | 模板E |
| `/creator/verification` | `(dashboard)/creator/verification/page.tsx` | 模板E |

### 20.5 管理后台路由

| 路由 | 文件路径 | 模板类型 |
|------|----------|----------|
| `/admin` | `(admin)/admin/page.tsx` | 模板F |
| `/admin/users` | `(admin)/admin/users/page.tsx` | 模板F |
| `/admin/review` | `(admin)/admin/review/page.tsx` | 模板F |
| `/admin/orders` | `(admin)/admin/orders/page.tsx` | 模板F |
| `/admin/verification` | `(admin)/admin/verification/page.tsx` | 模板F |

---

*本文档为律植项目二级与三级页面架构规划*
*版本: v2.0*
*更新时间: 2026-04-09*
