# 社区单词打卡应用 · 开发计划 v1.0

> 本文基于 36 项关键决策提问确认后生成，所有技术选型、产品规则、边界条件均已锁定。
> 适用规模：3–15 人熟人小圈子，自托管部署，首版聚焦"记录—发布—互动—反馈—统计"闭环。

---

## 一、技术选型总览

| 维度 | 选型 | 决策依据 |
|---|---|---|
| 前端框架 | Next.js 14+ App Router | SSR 首屏快、TypeScript 贯穿、生态成熟 |
| 前后端通信 | tRPC v10+ | 端到端类型安全，避免手写 schema |
| ORM | Prisma v5+ | 迁移文件化、类型安全、社区活跃 |
| 数据库 | PostgreSQL 15+ | JSONB 支持、行级安全、扩展性 |
| 缓存/限流 | Redis 7+ | 登录防暴力、限流计数器、会话缓存 |
| 认证 | NextAuth v4（credentials provider）+ argon2 哈希 | 无邮箱验证，简化运维 |
| 密码找回 | 所有者后台重置 + 审计 + 站内通知 | 零邮箱依赖，熟人场景可信 |
| 样式 | Tailwind CSS 3 + shadcn/ui | 响应式、组件化、移动优先 |
| 移动适配 | 响应式 CSS + 底部 tab 导航 | 成本最低、覆盖最广 |
| 状态管理 | Zustand（客户端）+ React Query（服务端缓存） | 轻量、灵活、缓存策略清晰 |
| 表单验证 | zod + react-hook-form | 类型安全、前后端复用 |
| 部署 | VPS + Docker Compose（app + db + redis + nginx） | 自托管、单机、可移植 |
| CI/CD | GitHub push → SSH → git pull && docker compose up -d | 快速重部署、立即生效 |
| 错误监控 | Sentry 自托管 + 日志轮转 30 天 | 覆盖前后端错误 |
| 国际化 | 仅简体中文 | 熟人小圈子 |
| SEO | robots.txt 全站 noindex | 私密工具不需要收录 |
| 用户协议 | 不展示 | 自托管场景合规最小化 |

---

## 二、系统架构

```
┌─────────────────────────────────────────────────────────┐
│  客户端（浏览器 / 手机浏览器）                              │
│  Next.js SSR + 客户端水合 + Tailwind + shadcn/ui          │
└─────────────────────┬───────────────────────────────────┘
                      │ tRPC（HTTP + WebSocket 可选）
┌─────────────────────┴───────────────────────────────────┐
│  应用层（Next.js API Routes）                              │
│  ├─ Auth（注册/登录/重置密码）                              │
│  ├─ Circle（圈子 CRUD/邀请/成员管理）                       │
│  ├─ Checkin（打卡 CRUD/草稿/撤回）                         │
│  ├─ Feed（动态流/点赞/评论）                               │
│  ├─ Stats（个人/圈子统计/排行榜）                           │
│  ├─ Vocab（词库版本/搜索/反馈）                             │
│  ├─ Audit（审计日志查询）                                  │
│  └─ Export（数据导出）                                     │
└─────────────────────┬───────────────────────────────────┘
                      │ Prisma
┌─────────────────────┴───────────────────────────────────┐
│  数据层                                                    │
│  PostgreSQL（主库） + Redis（缓存/限流）                    │
│  ├─ users / circles / circle_members                      │
│  ├─ checkins / comments / likes                            │
│  ├─ vocab_versions / vocab_entries                         │
│  ├─ audit_logs / notifications                             │
│  └─ weekly_snapshots                                       │
└─────────────────────────────────────────────────────────┘
```

### 目录结构（建议）

```
word-check-in/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (circle)/
│   │   ├── api/
│   │   └── layout.tsx
│   ├── server/
│   │   ├── routers/
│   │   ├── services/
│   │   ├── prisma.ts
│   │   └── trpc.ts
│   ├── components/
│   ├── lib/
│   └── types/
├── docker-compose.yml
├── Dockerfile
├── .env.example
└── package.json
```

---

## 三、数据模型设计

### 3.1 核心表结构

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String
  nickname      String
  avatarUrl     String?
  status        UserStatus @default(ACTIVE)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime?
}

model Circle {
  id           String    @id @default(cuid())
  name         String
  timezone     String    @default("Asia/Shanghai")
  ownerId      String
  owner        User      @relation(fields: [ownerId], references: [id])
  createdAt    DateTime  @default(now())
  members      CircleMember[]
}

model CircleMember {
  id        String   @id @default(cuid())
  circleId  String
  userId    String
  role      Role     @default(MEMBER)
  joinedAt  DateTime @default(now())
  circle    Circle   @relation(fields: [circleId], references: [id])
  user      User     @relation(fields: [userId], references: [id])
  @@unique([circleId, userId])
}

model Checkin {
  id            String       @id @default(cuid())
  circleId      String
  userId        String
  vocabVersionId String
  wordCount     Int
  minutes       Int
  note          String?
  date          DateTime     @db.Date
  status        CheckinStatus @default(PUBLISHED)
  withdrawnAt   DateTime?
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  deletedAt     DateTime?
  @@unique([circleId, userId, date, status])
}

model CheckinDraft {
  id            String  @id @default(cuid())
  circleId      String
  userId        String
  vocabVersionId String?
  wordCount     Int?
  minutes       Int?
  note          String?
  updatedAt     DateTime @updatedAt
  @@unique([circleId, userId])
}

model Like {
  id        String   @id @default(cuid())
  checkinId String
  userId    String
  createdAt DateTime @default(now())
  @@unique([checkinId, userId])
}

model Comment {
  id        String   @id @default(cuid())
  checkinId String
  userId    String
  content   String   @maxLength(500)
  createdAt DateTime @default(now())
  deletedAt DateTime?
}

model Notification {
  id        String   @id @default(cuid())
  userId    String
  type      String
  title     String
  body      String
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())
}

model VocabVersion {
  id          String  @id @default(cuid())
  name        String
  level       VocabLevel
  version     String
  source      String
  importDate  DateTime
  isActive    Boolean   @default(true)
  entryCount  Int
  createdAt   DateTime  @default(now())
}

model VocabEntry {
  id         String  @id @default(cuid())
  versionId  String
  term       String
  level      VocabLevel
  isCet6     Boolean  @default(false)
  orderIndex Int
  extra      Json?
  @@unique([versionId, term])
}

model AuditLog {
  id        String   @id @default(cuid())
  eventType String
  actorId   String
  targetId  String?
  targetTable String?
  before    Json?
  after     Json?
  reason    String?
  ipAddress String?
  createdAt DateTime @default(now())
}

model WeeklySnapshot {
  id        String   @id @default(cuid())
  circleId  String
  weekStart DateTime  @db.Date
  weekEnd   DateTime  @db.Date
  generatedAt DateTime
  data      Json
}
```

### 3.2 关键约束

- **每天一次打卡**：`@@unique([circleId, userId, date, status])` 保证同一用户同一天只有一条 PUBLISHED 状态打卡
- **草稿唯一性**：`@@unique([circleId, userId])` 保证同一用户同圈子只有一份草稿
- **点赞唯一性**：`@@unique([checkinId, userId])` 保证一个用户只能点赞一条打卡一次
- **软删**：所有可删除实体均有 `deletedAt` 字段
- **审计 append-only**：AuditLog 表禁止 UPDATE/DELETE（通过应用层控制）

---

## 四、功能模块拆解

### 4.1 认证模块（M1）

| 功能 | 说明 | 状态 |
|---|---|---|
| 注册 | 邮箱+昵称+密码，无邮箱验证 | ✅ 首版 |
| 登录 | credentials provider + argon2 验证 | ✅ 首版 |
| 退出 | 清除 session | ✅ 首版 |
| 忘记密码 | 联系圈子所有者，所有者在后台重置 | ✅ 首版 |
| 重置密码审计 | 写 audit_logs + 站内通知目标用户 | ✅ 首版 |
| 密码强度 | ≥10 位，含大小写+数字+特殊字符 | ✅ 首版 |

### 4.2 圈子模块（M2）

| 功能 | 说明 | 状态 |
|---|---|---|
| 创建圈子 | 名称 + 时区（默认 Asia/Shanghai） | ✅ 首版 |
| 邀请码 | 8 位随机、可撤销、可设过期日、可限次 | ✅ 首版 |
| 加入圈子 | 输入邀请码或邮件直链 | ✅ 首版 |
| 成员列表 | 头像 + 昵称 + 角色 + 加入时间 | ✅ 首版 |
| 移除成员 | 仅 owner 可操作，写审计 | ✅ 首版 |
| 转移所有者 | 仅 owner 可操作，写审计 | ✅ 首版 |
| 退出圈子 | 成员可自行退出 | ✅ 首版 |
| 所有者注销 | 必须先转移所有者，否则不可注销 | ✅ 首版 |
| 解散日子 | 二阶段功能 | ❌ 延后 |

### 4.3 词库模块（M3）

| 功能 | 说明 | 状态 |
|---|---|---|
| 官方词库导入 | 手动整理 JSON，标注来源与导入日期 | ✅ 首版 |
| 词库版本管理 | 版本号 + 生效状态 + 历史版本保留 | ✅ 首版 |
| 词库搜索 | 按词条模糊搜索 + 按级别筛选 | ✅ 首版 |
| 词库详情 | 词条名称 + 级别 + 六级标识 + 补充释义 | ✅ 首版 |
| 自定义词库 | 用户自行上传 | ❌ 二阶段 |
| 词库反馈 | 提交错别字/重复/释义错误 | ❌ 二阶段 |
| 历史打卡显示 | 始终显示发布时的词库版本名 | ✅ 首版 |

### 4.4 打卡模块（M4）

| 功能 | 说明 | 状态 |
|---|---|---|
| 创建打卡 | 选择词库 + 词量(1-2000) + 时长(1-720) + 笔记(≤300字) | ✅ 首版 |
| 保存草稿 | 无限保存，仅作者可见 | ✅ 首版 |
| 编辑打卡 | 当天 0-23:59 可无限次编辑词量/时长/笔记 | ✅ 首版 |
| 撤回打卡 | 撤回=整条作废，写审计 | ✅ 首版 |
| 撤回后重发 | 撤回后同天只能再发 1 次 | ✅ 首版 |
| 打卡详情页 | 完整信息 + 评论 + 点赞 + 修改历史 | ✅ 首版 |
| 打卡日历 | 月历视图，标记打卡状态 | ✅ 首版 |
| 连续天数计算 | 昨天打卡+今天打卡=+1；中断=清零 | ✅ 首版 |

### 4.5 动态与互动模块（M5）

| 功能 | 说明 | 状态 |
|---|---|---|
| 动态流 | 按时间倒序，优先显示今天 | ✅ 首版 |
| 点赞 | 一次打卡只能点赞一次，可取消 | ✅ 首版 |
| 评论 | 单层评论，1-500 字，仅作者可删除 | ✅ 首版 |
| 评论点赞 | 二阶段功能 | ❌ 延后 |
| 管理员移除内容 | 仅 owner 可操作，写审计 | ✅ 首版 |
| 分页加载 | 滚动加载，每页 20 条 | ✅ 首版 |

### 4.6 统计模块（M6）

| 功能 | 说明 | 状态 |
|---|---|---|
| 个人累计统计 | 打卡次数 + 单词量 + 学习分钟 + 连续天数 | ✅ 首版 |
| 当前/历史最长连续 | 实时计算 | ✅ 首版 |
| 本周打卡天数/单词量 | 实时计算 | ✅ 首版 |
| 圈子统计 | 成员总打卡 + 累计单词量 + 周榜 | ✅ 首版 |
| 周榜快照 | 每周日 23:59 生成，保存历史 | ✅ 首版 |
| 实时排行 + 快照展示 | 圈子统计页同时展示 | ✅ 首版 |
| 词库分布 | 使用的词库分布统计 | ❌ 二阶段 |

### 4.7 通知模块（M7）

| 功能 | 说明 | 状态 |
|---|---|---|
| 站内通知 | notifications 表 + 前端 30s 轮询 | ✅ 首版 |
| 通知类型 | 点赞/评论/邀请/加入/被移除/密码重置 | ✅ 首版 |
| 已读/未读 | 支持标记已读、全部标记已读 | ✅ 首版 |
| 通知偏好 | 用户可单独关闭各类通知 | ✅ 首版 |
| SSE 实时推送 | 可选升级 | ❌ 二阶段 |
| Web Push | ❌ 二阶段 |

### 4.8 数据导出模块（M8）

| 功能 | 说明 | 状态 |
|---|---|---|
| 个人数据导出 | JSON + CSV，包含打卡/评论/点赞 | ✅ 首版 |
| 圈子汇总导出 | 仅 owner 可操作 | ✅ 首版 |
| 导出记录 | 保留下载记录 | ✅ 首版 |
| 数据迁移到其他实例 | ❌ 二阶段 |

---

## 五、开发阶段规划

### 阶段一：核心闭环（预计 3-4 周）

**目标**：让几个人能完成"背词—打卡—发布—互动—查看统计"。

| 周次 | 任务 | 交付物 |
|---|---|---|
| W1 | 项目脚手架 + 数据库 schema + 认证模块 | Next.js 项目 + Prisma schema + 登录注册页面 |
| W2 | 圈子模块 + 词库导入 + 打卡创建 | 圈子 CRUD + 词库版本表 + 打卡表单 |
| W3 | 动态流 + 点赞 + 评论 + 连续天数 | 首页动态 + 互动功能 + 连续天数计算 |
| W4 | 个人统计 + 基础 UI 打磨 | 个人统计页 + 响应式适配 |

**验收标准**：
- 3 名用户能注册、建圈、邀请、打卡、点赞、评论
- 连续天数计算正确
- 同一天不能发布第二条打卡
- 个人累计数据与实际打卡一致

### 阶段二：数据可信（预计 2-3 周）

**目标**：补充草稿、撤回、修改留痕、审计、限流。

| 任务 | 交付物 |
|---|---|
| 草稿功能 | 草稿保存/编辑/删除 + 撤回后回到草稿 |
| 撤回打卡 | 撤回=作废 + 审计 + 同天只能再发 1 次 |
| 修改留痕 | 打卡修改写审计 diff |
| 管理员修正 | owner 可修正异常，写审计 |
| 限流中间件 | 登录防暴力 + 打卡幂等 + 评论点赞限流 |
| 审计日志查询 | owner 可查看审计日志 |

### 阶段三：统计与反馈（预计 2 周）

**目标**：完善周榜、圈子统计、打卡日历、数据导出、通知。

| 任务 | 交付物 |
|---|---|
| 周榜快照 | 每周日 23:59 生成 + 展示历史快照 |
| 圈子统计页 | 成员排行 + 实时 + 快照 |
| 打卡日历 | 月历视图 |
| 数据导出 | JSON + CSV 导出 |
| 通知系统 | 站内通知 + 偏好设置 |

### 阶段四：体验优化（预计 2 周）

**目标**：词库搜索、词条反馈、移动端优化、Sentry 接入。

| 任务 | 交付物 |
|---|---|
| 词库搜索 | 模糊搜索 + 级别筛选 |
| 词条反馈 | 提交错别字/释义错误 |
| 移动端优化 | 底部 tab + 触控优化 + safe-area |
| Sentry 接入 | 前后端错误监控 |
| 部署自动化 | SSH 部署脚本 + 健康检查 + 回滚 |

---

## 六、关键技术决策记录（ADR）

### ADR-001: 不做邮箱验证

- **背景**：熟人小圈子，3-15 人，自托管部署
- **决策**：账号密码即可，不做邮箱验证；忘记密码走所有者重置
- **理由**：简化运维，减少 SMTP 依赖；熟人场景下所有者可信
- **影响**：邮箱必须唯一但不强制验证；注册时无法确认邮箱真实性

### ADR-002: 不做用户协议展示

- **背景**：自托管场景，用户协议法律意义有限
- **决策**：不展示任何协议
- **理由**：最小化合规成本；熟人圈子无法律纠纷预期
- **影响**：被举报时无挡箭牌；但小圈子场景概率极低

### ADR-003: 快速部署优先于 CI 流水线

- **背景**：用户要求"修改后重部署立即生效、周期不复杂"
- **决策**：GitHub push → SSH → git pull && docker compose up -d
- **理由**：无需 GitHub Actions 配置；本地 dev 用 Next.js HMR 即时热更新
- **影响**：无自动 lint/typecheck；依赖开发者本地自查

### ADR-004: 备份策略（迁移前 + 每日定时）

- **背景**：q17 与 q19 存在冲突
- **决策**：迁移前 pg_dump（应用启动时自动）+ 每日凌晨 pg_dump 定时任务 + 保留 7 天
- **理由**：兼顾迁移保护和日常备份；成本极低（crontab 一行）
- **影响**：RPO≤24h；VPS 磁盘故障时数据丢失风险仍存在

### ADR-005: 草稿无限保存

- **背景**：q12 用户选择"草稿无限保存，永不自动清除"
- **决策**：草稿仅作者可见，不进动态和统计，不自动清除
- **理由**：用户友好；草稿可能包含未公开笔记，不应被自动删除
- **影响**：数据会堆积；但草稿量小，影响有限

### ADR-006: 圆圈时区统一

- **背景**：跨时区成员场景
- **决策**：圈子级统一时区（默认 Asia/Shanghai），禁止事后修改
- **理由**：规则简单、历史不可篡改
- **影响**：跨时区成员按圈子时区判断自然日；不满足极端个性化需求

---

## 七、风险与问题清单

### 7.1 已识别风险

| 风险 | 影响 | 缓解措施 |
|---|---|---|
| VPS 磁盘故障导致数据全丢 | 灾难性 | 每日 pg_dump + 定期手动拷贝到异地 |
| 所有者滥用重置密码权限 | 中 | 审计 + 站内通知目标用户 |
| 草稿无限保存导致数据堆积 | 低 | 草稿量小，影响有限 |
| 跨时区成员体验差 | 低 | 圈子时区统一，规则简单 |
| 无邮箱验证导致邮箱虚假 | 低 | 熟人场景下影响小 |
| 无用户协议导致合规风险 | 低 | 自托管场景法律追责范围有限 |
| 快速部署无自动化检查 | 中 | 依赖开发者本地自查 + Sentry 线上监控 |

### 7.2 已修正的冲突

| 原冲突 | 修正方案 |
|---|---|
| q17（迁移前 pg_dump）vs q19（不做自动备份） | 保留迁移前 pg_dump + 增加每日定时 pg_dump |
| 产品文档"邮箱验证" vs 用户选择"不做邮箱验证" | 以用户选择为准，ADR-001 记录 |
| 产品文档"每天一次" vs 用户选择"撤回后只能再发 1 次" | 兼容：撤回=作废，同天只能再发 1 次 |

### 7.3 遗漏问题（已补充）

| 问题 | 决策 |
|---|---|
| 忘记密码流程 | 所有者重置 + 审计 + 通知 |
| 圈子解散/所有者注销 | 必须先转移所有者 |
| 用户注销后数据处理 | 软删 + 30 天后物理清除 |
| 通知偏好 | 用户可单独关闭 |
| 周榜快照时间 | 每周日 23:59 |
| 打卡详情页内容 | 完整信息 + 评论 + 点赞 + 修改历史 |
| 词库搜索 | 模糊搜索 + 级别筛选 |
| 草稿权限 | 仅作者可编辑/删除 |

---

## 八、测试与验收

### 8.1 测试策略

| 类型 | 范围 | 工具 |
|---|---|---|
| 单元测试 | 连续天数计算、周榜统计、限流逻辑 | Vitest |
| 集成测试 | 打卡创建、撤回、编辑流程 | Vitest + Prisma |
| E2E 测试 | 登录、打卡、点赞、评论、导出 | Playwright |
| 手动测试 | 所有者重置密码、转移所有者、注销 | 手动执行 |

### 8.2 验收场景（3 名用户，7 天试用）

1. 用户 A 注册、建圈、邀请 B 和 C
2. B 和 C 接受邀请加入圈子
3. A/B/C 各自完成 7 天打卡
4. A 撤回第 3 天打卡，重新发布
5. B 点赞 A 的打卡，A 评论 B 的打卡
6. A 修改第 5 天打卡的笔记
7. A 在后台重置 B 的密码，B 收到通知
8. A 转移所有者给 B，然后注销账号
9. 检查连续天数、周榜、统计数据是否正确
10. 导出 A/B/C 的数据（JSON + CSV）

### 8.3 验收指标

- 打卡成功率 100%
- 无重复打卡
- 连续天数计算正确
- 周榜与原始打卡数据一致
- 未授权用户不能读取圈子数据
- 所有敏感操作有审计记录

---

## 九、下一步行动

1. **初始化项目**：创建 Next.js + Prisma + Docker Compose 脚手架
2. **编写数据库 schema**：按本文 3.1 节实现所有表
3. **实现认证模块**：注册、登录、重置密码
4. **实现圈子模块**：创建、邀请、成员管理
5. **导入词库**：手动整理四六级词表为 JSON
6. **实现打卡模块**：创建、编辑、撤回、草稿
7. **实现动态与互动**：动态流、点赞、评论
8. **实现统计模块**：个人统计、周榜、打卡日历
9. **实现通知模块**：站内通知 + 偏好设置
10. **实现导出模块**：JSON + CSV 导出
11. **部署到 VPS**：Docker Compose + 健康检查
12. **邀请 3 名用户试用**：7 天验收

---

*本文档基于 36 项关键决策提问确认后生成。所有技术选型、产品规则、边界条件均已锁定。*
