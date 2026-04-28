# 律植项目信息架构与路由重构 - 工作记录

## 项目背景

将律植项目从"法律智能体平台"重构为"面向法律行业的灵感与实践平台"。

**新定位**：灵感 → 成果 → 服务

**工作流程**：
1. 部署到阿里云 → 公网地址 https://www.lvxzhi.com/
2. GPT 访问公网分析网页特点
3. 根据分析结果给出调整提示词
4. 根据提示词修改代码
5. 重新部署
6. 重复直到满意

---

## 阶段一：信息架构与路由重构

### 任务状态：已完成

### 目标导航结构

| 导航项 | 定位 | 路由 |
|--------|------|------|
| 首页 | 品牌入口 | `/` |
| 灵感广场 | Discovery + Marketplace | `/inspiration` |
| 社区 | 互动/讨论 | `/community` |
| 合作机会 | 招聘/项目/商务 | `/opportunities` |
| 创作指南 | 新手指南 | `/creator-guide` |
| 认证律师 | 可信服务入口 | `/lawyers` |
| 登录 | - | `/login` |
| 注册 | - | `/register` |

---

## 已完成的工作

### 1. 新建页面文件

#### 灵感广场 `/inspiration`
| 文件 | 说明 |
|------|------|
| `inspiration/page.tsx` | 灵感广场首页 |
| `inspiration/[slug]/page.tsx` | 灵感详情页 |
| `inspiration/category/[category]/page.tsx` | 分类页 |
| `inspiration/tag/[tag]/page.tsx` | 标签页 |
| `inspiration/featured/page.tsx` | 精选页 |
| `inspiration/my-items/page.tsx` | 我的发布 |
| `inspiration/purchased/page.tsx` | 已购买 |
| `inspiration/favorites/page.tsx` | 我的收藏 |

#### 合作机会 `/opportunities`
| 文件 | 说明 |
|------|------|
| `opportunities/page.tsx` | 合作机会首页 |
| `opportunities/[slug]/page.tsx` | 机会详情页 |
| `opportunities/category/[category]/page.tsx` | 分类页 |
| `opportunities/create/page.tsx` | 发布机会 |
| `opportunities/my-posts/page.tsx` | 我的发布 |

#### 创作指南 `/creator-guide`
| 文件 | 说明 |
|------|------|
| `creator-guide/page.tsx` | 创作指南首页 |
| `creator-guide/getting-started/page.tsx` | 新手指南 |
| `creator-guide/policies/page.tsx` | 平台规则 |
| `creator-guide/tutorials/page.tsx` | 教程视频 |
| `creator-guide/faq/page.tsx` | 常见问题 |

#### 社区 `/community` (新增路由)
| 文件 | 说明 |
|------|------|
| `community/create/page.tsx` | 发布帖子 |
| `community/post/[slug]/page.tsx` | 帖子详情 |
| `community/tag/[tag]/page.tsx` | 标签页 |
| `community/my-posts/page.tsx` | 我的帖子 |

#### 律师 `/lawyers` (新增路由)
| 文件 | 说明 |
|------|------|
| `lawyers/featured/page.tsx` | 推荐律师 |
| `lawyers/city/[city]/page.tsx` | 城市筛选 |
| `lawyers/category/[category]/page.tsx` | 专业领域 |

### 2. 路由重定向配置

已创建 `middleware.ts`，配置了以下重定向规则：

#### Agents → Inspiration
| 旧路由 | 新路由 |
|--------|--------|
| `/agents` | `/inspiration` |
| `/agents/featured` | `/inspiration/featured` |
| `/agents/category/[slug]` | `/inspiration/category/[category]` |
| `/agents/topic/[slug]` | `/inspiration/tag/[tag]` |
| `/agents/:id` | `/inspiration/:id` |

#### Jobs → Opportunities
| 旧路由 | 新路由 |
|--------|--------|
| `/jobs` | `/opportunities` |
| `/jobs/:id` | `/opportunities/:id` |
| `/jobs/category/[slug]` | `/opportunities/:category/[category]` |

#### Classroom → Creator Guide
| 旧路由 | 新路由 |
|--------|--------|
| `/classroom` | `/creator-guide` |
| `/classroom/:slug` | `/creator-guide/:slug` |

#### Lawyers
| 旧路由 | 新路由 |
|--------|--------|
| `/find-lawyer` | `/lawyers` |
| `/lawyers/verified` | `/lawyers/featured` |
| `/lawyers/domain/:practiceArea` | `/lawyers/category/:category` |

#### Community
| 旧路由 | 新路由 |
|--------|--------|
| `/community/new` | `/community/create` |
| `/community/topic/[slug]` | `/community/tag/[tag]` |

#### Legacy Pages
| 旧路由 | 新路由 |
|--------|--------|
| `/enterprise` | `/inspiration` |
| `/marketplace` | `/inspiration` |
| `/academy` | `/creator-guide` |
| `/cooperation` | `/opportunities` |

### 3. 导航配置更新

#### 顶部导航 `top-nav-client.tsx`
- 更新 NAV_ITEMS 路由映射
- 更新用户菜单链接
- 更新"成为创作者"按钮链接

#### 底部导航 `footer.tsx`
- 重构为：发现 / 创作 / 机会 / 平台
- 更新所有链接到新路由

---

## 待处理（下一阶段）

### 遗留页面处理（谨慎处理）
以下页面暂时保留，通过 middleware 重定向确保用户体验：

| 页面 | 说明 |
|------|------|
| `/agents/*` | 通过 middleware 重定向 |
| `/jobs/*` | 通过 middleware 重定向 |
| `/classroom/*` | 通过 middleware 重定向 |
| `/find-lawyer/*` | 通过 middleware 重定向 |
| `/creators/*` | 部分通过 middleware 重定向 |
| `/cooperation/*` | 通过 middleware 重定向 |
| `/enterprise` | 通过 middleware 重定向 |
| `/marketplace` | 通过 middleware 重定向 |
| `/academy` | 通过 middleware 重定向 |
| `/creator-center/*` | 通过 middleware 重定向 |

---

## 修改记录

### 2026-04-08

**完成**：
- [x] 创建新路由目录结构 (inspiration, opportunities, creator-guide)
- [x] 创建新的页面文件（26个新页面）
- [x] 配置 Next.js 路由重定向 (middleware.ts)
- [x] 更新顶部导航配置
- [x] 更新底部导航配置
- [x] 更新用户菜单配置

**备注**：
- 遗留页面暂不删除，通过 middleware 重定向确保用户体验
- 不修改视觉样式和炫酷效果，只做架构重构

---

## 下一步工作

1. 测试所有新路由是否正常工作
2. 测试 middleware 重定向是否生效
3. 测试导航链接是否正确
4. 部署到阿里云进行公网测试

---

*最后更新：2026-04-08*
