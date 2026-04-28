# PolarDB 数据完整性检查报告

**检查时间**: 2026-04-06
**数据库**: lvzhi-prod.pg.polardb.rds.aliyuncs.com:5432/data01

---

## 1. 连接状态

| 项目 | 状态 |
|------|------|
| 连接测试 | ✅ 成功 |
| 表数量 | 77 个 |

---

## 2. 核心表存在性检查

| 表名 | 状态 |
|------|------|
| profiles | ✅ |
| agents | ✅ |
| agent_demos | ✅ |
| agent_favorites | ✅ |
| agent_ratings | ✅ |
| jobs | ✅ |
| applications | ✅ |
| lawyer_profiles | ✅ |
| community_posts | ✅ |
| comments | ✅ |
| likes | ✅ |
| orders | ✅ |
| user_balances | ✅ |
| user_follows | ✅ |
| api_credentials | ✅ |
| api_usage_stats | ✅ |
| coupons | ✅ |
| user_coupons | ✅ |
| subscriptions | ✅ |
| uploaded_files | ❌ 缺失 |

---

## 3. 数据量统计

| 表名 | 数据量 |
|------|--------|
| profiles | 9 |
| user_balances | 6 |
| agents | 4 |
| agent_demos | 1 |
| jobs | 1 |
| applications | 1 |
| community_posts | 1 |
| agent_favorites | 0 |
| agent_ratings | 0 |
| lawyer_profiles | 0 |
| comments | 0 |
| likes | 0 |
| orders | 0 |
| user_follows | 0 |
| api_credentials | 0 |
| api_usage_stats | 0 |
| coupons | 0 |
| user_coupons | 0 |
| subscriptions | 0 |

---

## 4. 用户角色分布

| 角色 | 数量 |
|------|------|
| seeker | 5 人 |
| admin | 2 人 |
| creator | 1 人 |
| recruiter | 1 人 |

---

## 5. 智能体状态分布

| 状态 | 数量 |
|------|------|
| rejected | 4 个 |

---

## 6. 问题汇总

### 6.1 缺失的表
- `uploaded_files` - 上传文件记录表

### 6.2 字段不完整的表
| 表名 | 缺失字段 |
|------|----------|
| agent_demos | demo_content, created_at |
| agent_ratings | rating |
| community_posts | user_id, category, status |
| api_credentials | daily_limit, used_today |
| api_usage_stats | success_calls, failed_calls |
| coupons | type, value, min_amount, status |
| user_coupons | order_id |
| subscriptions | plan, started_at, expires_at |

### 6.3 数据量问题
- **总用户数仅 9 人** - 数据可能未完全迁移
- **智能体仅 4 个** - 且全部被拒绝
- **律师记录 0 条** - 未同步认证律师数据

---

## 7. 结论

| 维度 | 评估 |
|------|------|
| 表结构 | ⚠️ 基本完整，但有缺失字段 |
| 数据量 | ❌ 明显不足，可能迁移不完整 |
| 关联完整性 | ✅ 智能体-创作者关联正常 |

---

## 8. 建议

1. **补充迁移数据** - 再次从 Supabase 导出完整数据
2. **修复字段缺失** - 执行 migration 脚本补全字段
3. **验证用户数据** - 确认 9 个用户是否包含所有测试账号

---

## 9. 下一步行动

- [ ] 对比 Supabase 和 PolarDB 的实际数据量
- [ ] 检查 uploaded_files 表是否需要创建
- [ ] 确认用户角色是否符合新体系 (visitor/client/creator/admin/superadmin)