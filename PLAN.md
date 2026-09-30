# 社区单词打卡应用 · 开发计划 v2.0

> 基于产品功能计划 + 36 项关键决策确认后生成。
> 首版聚焦：记录 → 发布 → 互动 → 反馈 → 统计 闭环。
> 适用规模：3–15 人熟人小圈子，自托管部署。

---

## 一、项目概述

### 1.1 产品定位

面向熟人的小圈子学习激励工具，帮助成员记录今天学了什么、让朋友看见彼此进度、通过轻量互动增强坚持动力。

**核心不是**：判断"是否掌握单词"、学习证明、测验、智能推荐、复杂成就体系。

**核心是**：记录学习记录、发布动态、社交互动、统计反馈。

### 1.2 适用场景

- 用户：相互认识的同学、同事或备考伙伴（3–15 人）
- 典型流程：背词 → 打开网页 → 选词库 → 填词量/时长/笔记 → 发布 → 看朋友打卡 → 点赞评论 → 看统计

### 1.3 核心原则（从产品计划提取）

| 原则 | 实现要求 |
|---|---|
| 打卡≠掌握 | 界面明确写"学习记录"，不写"已掌握" |
| 每天一次 | 同一用户同一圈子同一本地日仅一条 PUBLISHED 打卡 |
| 私密圈子 | 仅成员可见；邀请制加入；非成员无法访问 |
| 轻竞争 | 周榜同时展示打卡天数和单词量，不以单一数字评价 |
| 真实坚持 | 不追求复杂防作弊；靠熟人关系+每日限制+修改留痕+异常提示 |

---

## 二、技术选型

| 维度 | 选型 | 决策编号 |
|---|---|---|
| 前端框架 | Next.js 14+ App Router | q01 |
| 通信层 | tRPC v10+ | q01 |
| ORM | Prisma v5+ | q01 |
| 数据库 | PostgreSQL 15+ | q01 |
| 缓存 | Redis 7+ | q02 |
| 认证 | NextAuth v4 (credentials) + argon2 | q09 |
| 密码找回 | 所有者后台重置 + 审计 + 通知 | q13, q29b |
| 样式 | Tailwind CSS 3 + shadcn/ui | q01 |
| 移动适配 | 响应式 CSS + 底部 tab | q07 |
| 状态管理 | Zustand + React Query | q01 |
| 表单验证 | zod + react-hook-form | q01 |
| 部署 | VPS + Docker Compose | q02 |
| 部署流程 | GitHub push → SSH → docker compose up -d | q18 |
| 错误监控 | Sentry 自托管 + 日志轮转 30 天 | q25 |
| 国际化 | 仅简体中文 | q24 |
| SEO | robots.txt 全站 noindex | q24 |
| 用户协议 | 不展示 | q23 |

---

## 三、系统架构

```
┌─────────────────────────────────────────────────────────────┐
│  客户端（浏览器 / 手机浏览器）                                  │
│  Next.js SSR + 客户端水合 + Tailwind + shadcn/ui               │
│  底部 tab 导航（首页 / 打卡 / 统计 / 我的）                     │
└─────────────────────┬───────────────────────────────────────┘
                      │ tRPC（HTTP）
┌─────────────────────┴───────────────────────────────────────┐
│  应用层（Next.js Route Handlers）                              │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │   Auth   │ │  Circle  │ │  Checkin │ │   Feed   │       │
│  │ 注册/登录 │ │ 圈子/邀请 │ │ 打卡/草稿 │ │ 动态/互动 │       │
│  │ 重置密码  │ │ 成员管理  │ │ 撤回/编辑 │ │ 点赞/评论 │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │  Stats   │ │  Vocab   │ │ Audit    │ │  Export  │       │
│  │ 个人/圈子 │ │ 词库/搜索 │ │ 审计日志  │ │ 数据导出  │       │
│  │ 周榜/日历 │ │ 版本管理  │ │          │ │ JSON/CSV │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                              │
│  ┌──────────┐                                                │
│  │ Notif.   │ 站内通知 + 偏好设置                              │
│  └──────────┘                                                │
└─────────────────────┬───────────────────────────────────────┘
                      │ Prisma
┌─────────────────────┴───────────────────────────────────────┐
│  数据层                                                        │
│  PostgreSQL（主库） + Redis（限流/缓存）                        │
│                                                              │
│  users / circles / circle_members / checkins / checkin_drafts │
│  comments / likes / notifications / vocab_versions /          │
│  vocab_entries / audit_logs / weekly_snapshots /              │
│  invite_codes / exports                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 四、数据模型

### 4.1 完整 Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ===== 枚举 =====

enum UserStatus {
  ACTIVE
  DEACTIVATED
}

enum Role {
  OWNER
  MEMBER
}

enum CheckinStatus {
  DRAFT
  PUBLISHED
  WITHDRAWN
}

enum VocabLevel {
  CET4
  CET6
  COMBINED
  CUSTOM
}

enum NotificationType {
  LIKE
  COMMENT
  INVITE
  JOIN
  REMOVED
  PASSWORD_RESET
  ADMIN_ACTION
}

// ===== 用户 =====

model User {
  id           String     @id @default(cuid())
  email        String     @unique
  passwordHash String
  nickname     String
  avatarUrl    String?
  status       UserStatus @default(ACTIVE)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  deletedAt    DateTime?

  circlesOwned     Circle[]         @relation("CircleOwner")
  memberships      CircleMember[]
  checkins         Checkin[]
  drafts           CheckinDraft[]
  comments         Comment[]
  likes            Like[]
  notifications    Notification[]
  auditLogs        AuditLog[]       @relation("AuditActor")
  auditTargets     AuditLog[]       @relation("AuditTarget")
  notificationPrefs NotificationPreference[]

  @@index([email])
  @@index([status])
}

// ===== 圈子 =====

model Circle {
  id        String   @id @default(cuid())
  name      String
  timezone  String   @default("Asia/Shanghai")
  ownerId   String
  owner     User     @relation("CircleOwner", fields: [ownerId], references: [id])
  createdAt DateTime @default(now())

  members     CircleMember[]
  checkins    Checkin[]
  drafts      CheckinDraft[]
  comments    Comment[]
  likes       Like[]
  snapshots   WeeklySnapshot[]
  inviteCodes InviteCode[]
  exports     Export[]

  @@index([ownerId])
}

// ===== 圈子成员 =====

model CircleMember {
  id       String   @id @default(cuid())
  circleId String
  userId   String
  role     Role     @default(MEMBER)
  joinedAt DateTime @default(now())
  leftAt   DateTime?

  circle   Circle    @relation(fields: [circleId], references: [id])
  user     User      @relation(fields: [userId], references: [id])

  @@unique([circleId, userId])
  @@index([userId])
}

// ===== 邀请码 =====

model InviteCode {
  id        String    @id @default(cuid())
  circleId  String
  code      String    @unique
  maxUses   Int?
  usedCount Int       @default(0)
  expiresAt DateTime?
  revokedAt DateTime?
  createdAt DateTime  @default(now())

  circle Circle @relation(fields: [circleId], references: [id])

  @@index([circleId])
  @@index([code])
}

// ===== 打卡记录 =====

model Checkin {
  id             String        @id @default(cuid())
  circleId       String
  userId         String
  vocabVersionId String
  wordCount      Int
  minutes        Int
  note           String?
  date           DateTime      @db.Date
  status         CheckinStatus @default(PUBLISHED)
  withdrawnAt    DateTime?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  deletedAt      DateTime?

  circle     Circle        @relation(fields: [circleId], references: [id])
  user       User          @relation(fields: [userId], references: [id])
  vocabVersion VocabVersion @relation(fields: [vocabVersionId], references: [id])
  comments   Comment[]
  likes      Like[]
  edits      CheckinEdit[]

  @@unique([circleId, userId, date, status])
  @@index([circleId, date])
  @@index([userId, date])
  @@index([status])
}

// ===== 打卡编辑历史 =====

model CheckinEdit {
  id        String   @id @default(cuid())
  checkinId String
  userId    String
  field     String
  oldValue  String?
  newValue  String?
  createdAt DateTime @default(now())

  checkin Checkin @relation(fields: [checkinId], references: [id])

  @@index([checkinId])
}

// ===== 草稿 =====

model CheckinDraft {
  id             String  @id @default(cuid())
  circleId       String
  userId         String
  vocabVersionId String?
  wordCount      Int?
  minutes        Int?
  note           String?
  updatedAt      DateTime @updatedAt

  circle     Circle        @relation(fields: [circleId], references: [id])
  user       User          @relation(fields: [userId], references: [id])
  vocabVersion VocabVersion? @relation(fields: [vocabVersionId], references: [id])

  @@unique([circleId, userId])
}

// ===== 点赞 =====

model Like {
  id        String   @id @default(cuid())
  checkinId String
  userId    String
  createdAt DateTime @default(now())

  checkin Checkin @relation(fields: [checkinId], references: [id])
  user    User    @relation(fields: [userId], references: [id])

  @@unique([checkinId, userId])
  @@index([checkinId])
}

// ===== 评论 =====

model Comment {
  id        String    @id @default(cuid())
  checkinId String
  userId    String
  content   String    @db.VarChar(500)
  createdAt DateTime  @default(now())
  deletedAt DateTime?

  checkin Checkin @relation(fields: [checkinId], references: [id])
  user    User    @relation(fields: [userId], references: [id])

  @@index([checkinId])
  @@index([userId])
}

// ===== 通知 =====

model Notification {
  id        String           @id @default(cuid())
  userId    String
  type      NotificationType
  title     String
  body      String
  isRead    Boolean          @default(false)
  createdAt DateTime         @default(now())

  user User @relation(fields: [userId], references: [id])

  @@index([userId, isRead])
  @@index([userId, createdAt])
}

// ===== 通知偏好 =====

model NotificationPreference {
  id       String   @id @default(cuid())
  userId   String
  type     NotificationType
  enabled  Boolean  @default(true)

  user User @relation(fields: [userId], references: [id])

  @@unique([userId, type])
}

// ===== 词库版本 =====

model VocabVersion {
  id         String     @id @default(cuid())
  name       String
  level      VocabLevel
  version    String
  source     String
  importDate DateTime
  isActive   Boolean    @default(true)
  entryCount Int
  createdAt  DateTime   @default(now())

  entries  VocabEntry[]
  checkins Checkin[]
  drafts   CheckinDraft[]

  @@index([level])
  @@index([isActive])
}

// ===== 词库词条 =====

model VocabEntry {
  id         String     @id @default(cuid())
  versionId  String
  term       String
  level      VocabLevel
  isCet6     Boolean    @default(false)
  orderIndex Int
  extra      Json?

  version VocabVersion @relation(fields: [versionId], references: [id])

  @@unique([versionId, term])
  @@index([term])
  @@index([level])
}

// ===== 审计日志 =====

model AuditLog {
  id          String   @id @default(cuid())
  eventType   String
  actorId     String
  targetId    String?
  targetTable String?
  before      Json?
  after       Json?
  reason      String?
  ipAddress   String?
  createdAt   DateTime @default(now())

  actor  User?  @relation("AuditActor", fields: [actorId], references: [id])
  target User?  @relation("AuditTarget", fields: [targetId], references: [id])

  @@index([eventType])
  @@index([actorId])
  @@index([targetId])
  @@index([createdAt])
}

// ===== 周榜快照 =====

model WeeklySnapshot {
  id          String   @id @default(cuid())
  circleId    String
  weekStart   DateTime @db.Date
  weekEnd     DateTime @db.Date
  generatedAt DateTime
  data        Json

  circle Circle @relation(fields: [circleId], references: [id])

  @@unique([circleId, weekStart])
  @@index([circleId])
}

// ===== 数据导出记录 =====

model Export {
  id        String   @id @default(cuid())
  circleId  String?
  userId    String
  format    String
  content   Json
  createdAt DateTime @default(now())

  circle Circle? @relation(fields: [circleId], references: [id])
  user   User    @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([circleId])
}
```

### 4.2 关键约束说明

| 约束 | 实现方式 | 对应规则 |
|---|---|---|
| 每天一次打卡 | `@@unique([circleId, userId, date, status])` | 产品七节"每天一次" |
| 草稿唯一 | `@@unique([circleId, userId])` | 一个用户同圈子仅一份草稿 |
| 点赞唯一 | `@@unique([checkinId, userId])` | 一次打卡只能点赞一次 |
| 成员唯一 | `@@unique([circleId, userId])` | 一个用户同圈子仅一个成员关系 |
| 词库版本+词条唯一 | `@@unique([versionId, term])` | 同一版本内词条不重复 |
| 邀请码唯一 | `@unique` on code | 全局唯一邀请码 |
| 软删 | `deletedAt` 字段 | 所有可删除实体 |
| 审计 append-only | 应用层禁止 UPDATE/DELETE | 审计日志不可篡改 |

---

## 五、页面结构

对应产品计划第四节"页面与信息结构"：

| # | 页面 | 路由 | 所属模块 | 优先级 |
|---|---|---|---|---|
| 1 | 登录 | /login | Auth | P0 |
| 2 | 注册 | /register | Auth | P0 |
| 3 | 接受邀请 | /join?code=xxx | Circle | P0 |
| 4 | 首页（动态流） | /feed | Feed | P0 |
| 5 | 今日打卡 | /checkin | Checkin | P0 |
| 6 | 打卡详情 | /checkin/[id] | Checkin | P0 |
| 7 | 成员页 | /members | Circle | P1 |
| 8 | 圈子统计 | /stats/circle | Stats | P1 |
| 9 | 个人统计 | /stats/profile | Stats | P1 |
| 10 | 词库页 | /vocab | Vocab | P1 |
| 11 | 词库详情 | /vocab/[id] | Vocab | P1 |
| 12 | 个人设置 | /settings | Auth | P1 |
| 13 | 圈子设置 | /settings/circle | Circle | P1 |
| 14 | 通知中心 | /notifications | Notif | P1 |
| 15 | 审计日志 | /admin/audit | Audit | P2 |

---

## 六、功能模块详细规范

### 6.1 认证模块

#### 注册
- 输入：邮箱（必填，唯一）、昵称（必填，≤20字）、密码（必填，≥10位，含大小写+数字+特殊字符）
- 不做邮箱验证（ADR-001）
- 注册后自动登录
- 返回：user 对象

#### 登录
- 输入：邮箱 + 密码
- NextAuth credentials provider
- 密码哈希：argon2
- 会话：JWT cookie，有效期 7 天
- 登录限流：5 次失败/5 分钟（Redis 计数器）

#### 退出
- 清除 JWT cookie
- 退出登录状态

#### 忘记密码
- 用户进入"忘记密码"页面，输入邮箱
- 系统检查该邮箱是否在某个圈子中
- 如果是：提示"请联系该圈子所有者重置密码"
- 如果不是：返回通用错误信息（不暴露邮箱是否存在）

#### 所有者重置密码
- 所有者在成员管理页面，选择成员，点击"重置密码"
- 输入新密码（≥10位，含大小写+数字+特殊字符）
- 写 audit_logs（eventType=PASSWORD_RESET, actor=owner, target=user, ipAddress）
- 创建 notification（type=PASSWORD_RESET, 通知目标用户）
- 更新用户 passwordHash

### 6.2 圈子模块

#### 创建圈子
- 输入：圈子名称（必填，≤50字）、时区（默认 Asia/Shanghai）
- 创建者自动成为 OWNER
- 创建默认邀请码（8位随机）

#### 邀请码管理
- 生成：8位随机字符（A-Z, 0-9），全局唯一
- 可设置：最大使用次数（可选）、过期时间（可选）
- 可撤销：revokedAt 字段
- 邀请码列表：所有者可查看所有邀请码及使用情况

#### 加入圈子
- 输入：邀请码
- 校验：邀请码有效（未撤销、未过期、未达上限）
- 创建 CircleMember（role=MEMBER）
- 创建 notification（type=JOIN，通知所有现有成员）
- 邀请码 usedCount += 1

#### 成员管理（所有者）
- 查看成员列表：头像、昵称、角色、加入时间
- 移除成员：写 audit_logs（eventType=MEMBER_REMOVE）
- 转移所有者：写 audit_logs（eventType=OWNER_TRANSFER）
- 所有者注销：必须先转移所有者，否则拒绝注销

#### 退出圈子
- 成员可自行退出
- leftAt 字段记录退出时间
- 不删除历史打卡（保留数据完整性）

### 6.3 词库模块

#### 官方词库导入
- 来源：CET 官方 PDF / 教育部大纲
- 手动整理为 JSON 格式
- 保存原始资料、规范化词条、级别、六级标识、原始顺序、来源
- 创建 VocabVersion + VocabEntry 记录

#### 词库版本管理
- 版本号：语义化版本（如 1.2.0）
- 生效状态：isActive 字段
- 历史版本保留：不删除旧版本，仅标记 isActive=false
- 发布新版本：创建新 VocabVersion，isActive=true

#### 词库搜索
- 模糊搜索：LIKE %term%
- 级别筛选：CET4 / CET6 / COMBINED / CUSTOM
- 排序：按 orderIndex
- 性能：5400 词量级，LIKE 查询无压力

#### 词库详情
- 展示：词条名称、级别、六级标识、补充释义（extra 字段）
- 数据来源：source 字段
- 来源版本：version 字段

#### 历史打卡显示
- 始终显示发布时的词库版本名（如"四六级综合词库 v1.2"）
- 词库更新不影响历史打卡显示

### 6.4 打卡模块

#### 创建打卡
- 输入：词库版本（必填）、词量（1-2000）、时长（1-720分钟）、笔记（≤300字，可选）
- 校验：同一用户同圈子同一天只能有一条 PUBLISHED 打卡
- 状态：PUBLISHED
- 写入 date 字段（圈子时区的本地日期）
- 创建审计记录（eventType=CHECKIN_CREATE）

#### 保存草稿
- 输入：同创建打卡（但词库版本可选）
- 同一用户同圈子仅一份草稿（@@unique）
- 草稿不进入动态和统计
- 草稿无限保存，不自动清除

#### 编辑打卡
- 时间：当天 0-23:59:59（圈子时区）
- 可编辑字段：词量、时长、笔记
- 不可编辑字段：词库版本、日期、状态
- 每次编辑写入 CheckinEdit（field, oldValue, newValue）
- 写 audit_logs（eventType=CHECKIN_EDIT, before/after JSON）

#### 撤回打卡
- 撤回 = 状态改为 WITHDRAWN
- 写 withdrawnAt 字段
- 写 audit_logs（eventType=CHECKIN_WITHDRAW）
- 撤回后：
  - 不再计入动态流
  - 不再计入连续天数
  - 不再计入排行榜
  - 同一天只能再发 1 次（新打卡，不是编辑）

#### 打卡详情页
- 展示：完整打卡信息 + 评论列表 + 点赞列表 + 修改历史
- 修改历史：从 CheckinEdit 表读取
- 权限：同圈子成员可查看

#### 连续天数计算
- 公式：连续天数 = 从最近一次打卡日期开始，连续有打卡的天数
- 算法：
  1. 查询用户最近 365 天的所有 PUBLISHED 打卡
  2. 从最新打卡开始向前遍历
  3. 如果连续每一天都有打卡，计数+1
  4. 如果遇到断档，停止
- 缓存：Redis，TTL 24 小时

### 6.5 动态与互动模块

#### 动态流
- 展示：当前圈子的所有 PUBLISHED 打卡
- 排序：按 date DESC, createdAt DESC
- 优先显示：今天的打卡
- 分页：滚动加载，每页 20 条
- 卡片内容：头像、昵称、打卡时间、相对时间、词库名+级别、词量、时长、笔记、连续天数、点赞数、评论数、是否已点赞

#### 点赞
- 一个用户对一个打卡只能点赞一次
- 支持取消点赞
- 写 audit_logs（eventType=LIKE / UNLIKE）
- 创建 notification（type=LIKE，通知打卡作者）

#### 评论
- 单层评论，不做楼中楼
- 输入：内容（1-500字）
- 删除：仅作者可删除自己的评论
- 管理员删除：所有者可删除圈子内任何评论，写 audit_logs
- 创建 notification（type=COMMENT，通知打卡作者）

#### 管理员移除内容
- 所有者可移除违规打卡（改为 WITHDRAWN）
- 所有者可移除违规评论（软删 deletedAt）
- 写 audit_logs（eventType=ADMIN_REMOVE, reason 必填）
- 创建 notification（通知被移除者）

### 6.6 统计模块

#### 个人统计
- 累计打卡次数：COUNT(checkins WHERE status=PUBLISHED)
- 累计背词量：SUM(wordCount)
- 累计学习分钟：SUM(minutes)
- 当前连续天数：算法同 6.4
- 历史最长连续天数：算法同 6.4，遍历所有历史打卡
- 本周打卡天数：本周（周一到周日）的 PUBLISHED 打卡数
- 本周单词量：本周的 SUM(wordCount)
- 最近打卡记录：最近 10 条打卡
- 打卡日历：月历视图，标记打卡状态

#### 圈子统计
- 成员总打卡次数：COUNT(checkins WHERE status=PUBLISHED AND circleId=?)
- 成员累计单词量：SUM(wordCount)
- 成员累计学习分钟：SUM(minutes)
- 本周打卡天数榜：本周打卡天数排行
- 本周单词量榜：本周单词量排行
- 当前连续天数榜：所有成员的当前连续天数排行
- 历史最长连续榜：所有成员的历史最长连续天数排行
- 各成员最近打卡时间
- 今天已完成打卡的成员

#### 周榜快照
- 生成时间：每周日 23:59（圈子时区）
- 生成内容：本周所有成员的打卡天数、单词量、连续天数
- 保存：weekly_snapshots 表
- 展示：圈子统计页展示最新快照 + 实时排行
- 历史：可查看所有历史周榜快照

#### 同分规则
1. 打卡天数相同，比较累计单词量
2. 仍相同，比较连续天数
3. 仍相同，按用户 ID 排序（稳定排序）

### 6.7 通知模块

#### 通知类型
| 类型 | 触发场景 | 是否可关闭 |
|---|---|---|
| LIKE | 打卡被点赞 | 可 |
| COMMENT | 打卡被评论 | 可 |
| INVITE | 收到加入圈子邀请 | 可 |
| JOIN | 有人加入圈子 | 可 |
| REMOVED | 打卡/评论被移除 | 不可 |
| PASSWORD_RESET | 密码被重置 | 不可 |
| ADMIN_ACTION | 管理员操作 | 不可 |

#### 通知偏好
- 用户可单独关闭各类通知（除不可关闭类型）
- 默认全部开启
- 存储在 notification_preferences 表

#### 通知展示
- 前端 30 秒轮询
- 未读通知数角标
- 点击通知跳转到相关内容
- 标记已读：单条 / 全部

### 6.8 数据导出模块

#### 个人数据导出
- 格式：JSON + CSV
- 内容：
  - 账号资料（昵称、邮箱、注册时间）
  - 打卡记录（词库、词量、时长、笔记、日期、状态）
  - 使用的词库版本
  - 评论记录
  - 点赞记录
- 触发：用户点击"导出数据"
- 下载：直接下载文件
- 记录：写入 exports 表

#### 圈子汇总导出（所有者）
- 格式：JSON + CSV
- 内容：
  - 所有成员列表
  - 所有打卡记录
  - 统计汇总
- 不包含：私人登录信息

---

## 七、业务规则清单

从产品计划第十五节提取，逐条实现：

### 7.1 打卡创建规则

| 规则 | 实现 |
|---|---|
| 必须选择词库 | vocabVersionId 必填 |
| 必须填写单词数量 | wordCount 必填，1-2000 |
| 必须填写学习分钟数 | minutes 必填，1-720 |
| 笔记可以为空 | note 可选，≤300字 |
| 同一本地日只能有一条有效发布打卡 | @@unique([circleId, userId, date, status]) |
| 发布后进入圈子动态 | status=PUBLISHED，动态流查询 |
| 未发布的草稿不进入统计和排行榜 | status=DRAFT，统计排除 |

### 7.2 修改规则

| 规则 | 实现 |
|---|---|
| 作者可以修改自己的打卡内容 | 校验 userId，当天可无限编辑 |
| 作者可以撤回自己的打卡 | 校验 userId，状态改 WITHDRAWN |
| 修改后保留历史记录 | CheckinEdit 表 + audit_logs |
| 撤回后的打卡不再计入动态、连续和排行榜 | 查询条件排除 WITHDRAWN |
| 每天只允许一次有意义的重新发布 | 撤回后同天只能创建 1 条新打卡 |
| 管理员可以修正记录，必须说明原因 | reason 字段必填，写 audit_logs |

### 7.3 删除规则

| 规则 | 实现 |
|---|---|
| 用户可以删除自己的评论 | 校验 userId，软删 deletedAt |
| 用户可以撤回自己的打卡 | 校验 userId，状态改 WITHDRAWN |
| 管理员可以移除违规打卡或评论 | 所有者操作，写 audit_logs |
| 删除或移除应保留操作原因和审计痕迹 | audit_logs 表 |

### 7.4 隐私规则

| 规则 | 实现 |
|---|---|
| 邮箱地址不向其他成员公开 | API 返回时过滤 email 字段 |
| 登录记录、设备信息和密码信息不公开 | 不存储设备信息；登录记录仅在 audit_logs |
| 圈子内容只对成员可见 | API 层校验 CircleMember 关系 |
| 个人统计只对本人及所在圈子成员开放 | API 层校验 |
| 没有权限的用户不应通过错误提示判断圈子和成员是否存在 | 返回通用错误信息 |

---

## 八、开发阶段规划

### 阶段一：核心闭环（预计 3-4 周）

**目标**：让几个人能完成"背词—打卡—发布—互动—查看统计"。

| 周次 | 任务 | 交付物 | 对应页面 |
|---|---|---|---|
| W1 | 项目脚手架 + Prisma schema + Docker Compose + 认证模块 | 可运行的 Next.js 项目 + 登录/注册页面 | #1, #2 |
| W2 | 圈子模块 + 邀请码 + 词库导入 | 圈子创建/邀请/成员列表 + 词库版本表 | #3, #7 |
| W3 | 打卡创建 + 动态流 + 点赞 + 评论 | 打卡表单 + 首页动态 + 互动功能 | #4, #5 |
| W4 | 连续天数 + 个人统计 + 基础 UI | 统计页 + 响应式适配 | #8, #9 |

**验收标准**：
- 3 名用户能注册、建圈、邀请、打卡、点赞、评论
- 连续天数计算正确
- 同一天不能发布第二条打卡
- 个人累计数据与实际打卡一致

### 阶段二：数据可信（预计 2-3 周）

**目标**：补充草稿、撤回、修改留痕、审计、限流。

| 任务 | 交付物 | 对应规则 |
|---|---|---|
| 草稿功能 | 草稿保存/编辑/删除 + 撤回后回到草稿 | 7.1, 7.2 |
| 撤回打卡 | 撤回=作废 + 审计 + 同天只能再发 1 次 | 7.2, 7.3 |
| 修改留痕 | CheckinEdit 表 + 审计 diff | 7.2 |
| 管理员修正 | owner 可修正异常，reason 必填 | 7.2, 7.3 |
| 限流中间件 | 登录防暴力 + 打卡幂等 + 评论点赞限流 | - |
| 审计日志查询 | owner 可查看审计日志 | 7.3 |

### 阶段三：统计与反馈（预计 2 周）

**目标**：完善周榜、圈子统计、打卡日历、数据导出、通知。

| 任务 | 交付物 | 对应页面 |
|---|---|---|
| 周榜快照 | 每周日 23:59 生成 + 展示历史快照 | #8 |
| 圈子统计页 | 成员排行 + 实时 + 快照 | #8 |
| 打卡日历 | 月历视图 | #9 |
| 数据导出 | JSON + CSV 导出 | #12 |
| 通知系统 | 站内通知 + 偏好设置 | #14 |

### 阶段四：体验优化（预计 2 周）

**目标**：词库搜索、词条反馈、移动端优化、Sentry 接入。

| 任务 | 交付物 | 对应页面 |
|---|---|---|
| 词库搜索 | 模糊搜索 + 级别筛选 | #10, #11 |
| 词条反馈 | 提交错别字/释义错误 | #11 |
| 移动端优化 | 底部 tab + 触控优化 + safe-area | 全部 |
| Sentry 接入 | 前后端错误监控 | - |
| 部署自动化 | SSH 部署脚本 + 健康检查 + 回滚 | - |

---

## 九、测试与验收

### 9.1 测试策略

| 类型 | 范围 | 工具 | 覆盖 |
|---|---|---|---|
| 单元测试 | 连续天数计算、周榜统计、限流逻辑、日期处理 | Vitest | 核心算法 |
| 集成测试 | 打卡创建、撤回、编辑、点赞、评论流程 | Vitest + Prisma | API 层 |
| E2E 测试 | 登录、注册、建圈、打卡、点赞、评论、导出 | Playwright | 关键路径 |
| 手动测试 | 所有者重置密码、转移所有者、注销、词库导入 | 手动执行 | 特殊场景 |

### 9.2 验收场景（3 名用户，7 天试用）

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

### 9.3 验收指标

| 指标 | 目标 |
|---|---|
| 打卡成功率 | 100% |
| 重复打卡 | 0 |
| 连续天数计算 | 正确 |
| 周榜与原始数据一致 | 100% |
| 未授权访问 | 0 |
| 敏感操作审计 | 100% |

---

## 十、风险与应对

| 风险 | 影响 | 应对措施 | 状态 |
|---|---|---|---|
| VPS 磁盘故障 | 灾难性 | 每日 pg_dump + 定期手动拷贝异地 | 已缓解 |
| 所有者滥用重置密码 | 中 | 审计 + 站内通知目标用户 | 已缓解 |
| 草稿数据堆积 | 低 | 草稿量小，影响有限 | 接受 |
| 跨时区成员体验差 | 低 | 圈子时区统一 | 接受 |
| 无邮箱验证 | 低 | 熟人场景影响小 | 接受 |
| 无用户协议 | 低 | 自托管场景概率极低 | 接受 |
| 快速部署无自动化检查 | 中 | 本地自查 + Sentry 监控 | 已缓解 |
| 词库解析错误 | 中 | 逐层校验 + 人工抽查 | 待实施 |

---

## 十一、ADR 决策记录

### ADR-001: 不做邮箱验证
- **决策**：账号密码即可，不做邮箱验证；忘记密码走所有者重置
- **理由**：简化运维，减少 SMTP 依赖
- **影响**：邮箱必须唯一但不强制验证

### ADR-002: 不做用户协议展示
- **决策**：不展示任何协议
- **理由**：最小化合规成本
- **影响**：被举报时无挡箭牌

### ADR-003: 快速部署优先于 CI 流水线
- **决策**：GitHub push → SSH → git pull && docker compose up -d
- **理由**：无需 GitHub Actions；本地 HMR 即时热更新
- **影响**：无自动 lint/typecheck

### ADR-004: 备份策略
- **决策**：迁移前 pg_dump + 每日凌晨 pg_dump + 保留 7 天
- **理由**：兼顾迁移保护和日常备份
- **影响**：RPO≤24h

### ADR-005: 草稿无限保存
- **决策**：草稿仅作者可见，不进动态和统计，不自动清除
- **理由**：用户友好
- **影响**：数据会堆积但量小

### ADR-006: 圆圈时区统一
- **决策**：圈子级统一时区（默认 Asia/Shanghai），禁止事后修改
- **理由**：规则简单、历史不可篡改
- **影响**：跨时区成员按圈子时区判断

---

## 十二、下一步行动

1. 初始化 Next.js + Prisma + Docker Compose 项目
2. 编写完整 Prisma schema（按本文第四章）
3. 实现认证模块（注册、登录、重置密码）
4. 实现圈子模块（创建、邀请、成员管理）
5. 导入四六级词库（手动整理 JSON）
6. 实现打卡模块（创建、编辑、撤回、草稿）
7. 实现动态与互动（动态流、点赞、评论）
8. 实现统计模块（个人统计、周榜、打卡日历）
9. 实现通知模块（站内通知 + 偏好设置）
10. 实现导出模块（JSON + CSV）
11. 部署到 VPS（Docker Compose + 健康检查）
12. 邀请 3 名用户试用（7 天验收）
