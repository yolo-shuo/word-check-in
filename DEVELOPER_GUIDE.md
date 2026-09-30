# 单词打卡 · 开发者说明

> 本文档面向开发者，覆盖本地开发、架构、API、数据模型、安全、测试和部署的全貌。
> 更多代码规范请参阅 `AGENTS.md`。

---

## 一、项目概览

### 1.1 产品定位

面向 **3–15 人熟人小圈子** 的学习记录工具。首版聚焦 **记录 → 发布 → 互动 → 反馈 → 统计** 闭环。

- ✅ 做：学习记录、发布动态、社交互动、统计反馈
- ❌ 不做：测验、智能推荐、成就体系、公共广场、陌生人社交
- 🌐 语言：仅简体中文
- 🔐 部署：自托管 VPS + Docker Compose

### 1.2 技术栈

| 层 | 技术 | 版本 |
|---|---|---|
| 前端框架 | Next.js (App Router) | 14+ |
| 通信层 | tRPC | 9+ |
| ORM | Prisma | 5+ |
| 数据库 | PostgreSQL | 15+ |
| 缓存/限流 | Redis (ioredis) | 7+ |
| 认证 | NextAuth v4 (credentials) | 4 |
| 密码哈希 | argon2 | - |
| 样式 | Tailwind CSS 3 + shadcn/ui | 3 |
| 状态管理 | Zustand + React Query (@tanstack/react-query) | 4+ |
| 表单 | zod + react-hook-form | - |
| 日期工具 | date-fns + date-fns-tz | 3 |
| 通知 | react-hot-toast | 2 |
| 错误监控 | Sentry (@sentry/nextjs) | 8 |
| 测试 | Vitest + Playwright | - |
| 容器 | Docker + Compose | - |

### 1.3 目录结构

```
word-check-in/
├── prisma/
│   ├── schema.prisma          # 数据库 schema（唯一真实来源）
│   ├── migrations/            # 迁移文件
│   └── seed.ts                # 词库种子数据
├── src/
│   ├── app/                   # Next.js App Router 页面
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx         # 登录
│   │   │   └── register/page.tsx      # 注册
│   │   ├── circle/
│   │   │   └── create/page.tsx        # 创建圈子
│   │   ├── join/page.tsx              # 加入圈子（邀请码）
│   │   ├── feed/page.tsx              # 动态流
│   │   ├── checkin/
│   │   │   ├── page.tsx               # 打卡
│   │   │   └── [id]/page.tsx          # 打卡详情
│   │   ├── vocab/page.tsx             # 词库浏览/搜索
│   │   ├── stats/
│   │   │   ├── profile/page.tsx       # 个人统计
│   │   │   └── circle/page.tsx        # 圈子统计
│   │   ├── members/page.tsx           # 成员管理
│   │   ├── settings/
│   │   │   ├── page.tsx               # 个人设置
│   │   │   └── circle/page.tsx        # 圈子设置
│   │   ├── notifications/page.tsx     # 通知中心
│   │   ├── admin/audit/page.tsx       # 审计日志（所有者）
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts  # NextAuth API
│   │   │   └── health/route.ts                # 健康检查
│   │   ├── layout.tsx
│   │   └── page.tsx                   # 根页面（重定向 /feed）
│   ├── components/
│   │   ├── ui/                        # shadcn/ui 组件
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   └── label.tsx
│   │   ├── layout/
│   │   │   └── navbar.tsx             # 顶部导航
│   │   ├── feed/
│   │   │   └── checkin-card.tsx       # 打卡卡片
│   │   ├── circle-selector.tsx        # 圈子选择器
│   ├── server/
│   │   ├── routers/
│   │   │   ├── _app.ts        # 根路由聚合
│   │   │   ├── auth.ts       # 认证路由
│   │   │   ├── circle.ts     # 圈子路由
│   │   │   ├── checkin.ts    # 打卡路由
│   │   │   ├── feed.ts       # 动态路由
│   │   │   ├── stats.ts      # 统计路由
│   │   │   ├── vocab.ts      # 词库路由
│   │   │   ├── audit.ts      # 审计路由
│   │   │   ├── export.ts     # 导出路由
│   │   │   └── notification.ts # 通知路由
│   │   ├── services/           # 业务逻辑服务层
│   │   ├── lib/                # 工具函数（日期、限流、审计等）
│   │   ├── prisma.ts           # Prisma 单例
│   │   ├── redis.ts            # Redis 单例
│   │   ├── trpc.ts             # tRPC 初始化
│   │   └── auth.ts             # NextAuth 配置
│   ├── providers/
│   │   ├── index.tsx           # Provider 根组件
│   │   ├── session-provider.tsx
│   │   └── trpc-provider.tsx
│   ├── lib/
│   │   ├── trpc.ts             # 客户端 tRPC
│   │   └── utils.ts            # 客户端工具函数
│   └── types/                  # 共享类型
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── .env.local                   # 本地环境（不提交）
├── tsconfig.json
├── tailwind.config.ts
├── vitest.config.ts
├── next.config.mjs
├── package.json
├── AGENTS.md                    # AI 编码助手规范
├── DEVELOPMENT_PLAN.md          # 开发计划 v1.0
├── PLAN.md                      # 开发计划 v2.0
├── USER_GUIDE.md                # 用户使用说明
└── DEVELOPER_GUIDE.md           # ← 你在这里
```

---

## 二、快速开始

### 2.1 前置要求

| 工具 | 版本 |
|---|---|
| Node.js | 20+ |
| pnpm | 9+ |
| Docker + Docker Compose | 最新版本 |

### 2.2 本地开发

```bash
# 1. 克隆仓库
git clone <repo-url> && cd word-check-in

# 2. 安装依赖
corepack enable
pnpm install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，设置 NEXTAUTH_SECRET 等

# 4. 启动数据库和 Redis
docker compose up -d db redis

# 5. 运行数据库迁移
pnpm prisma migrate dev

# 6. 导入词库种子数据（可选）
pnpm prisma seed

# 7. 启动开发服务器
pnpm dev
```

访问 `http://localhost:3000` 即可。

### 2.3 常用命令

| 命令 | 说明 |
|---|---|
| `pnpm dev` | 启动开发服务器（HMR 热更新） |
| `pnpm build` | 生产构建 |
| `pnpm start` | 启动生产服务器 |
| `pnpm lint` | ESLint 检查 |
| `pnpm typecheck` | TypeScript 类型检查 |
| `pnpm test` | 运行单元测试（Vitest） |
| `pnpm test:watch` | 测试监听模式 |
| `pnpm e2e` | 运行 E2E 测试（Playwright） |
| `pnpm prisma:migrate` | 开发环境迁移 |
| `pnpm prisma:deploy` | 生产环境迁移 |
| `pnpm prisma:studio` | Prisma Studio（数据库 GUI） |
| `pnpm prisma:generate` | 重新生成 Prisma Client |

---

## 三、环境变量

`.env.local`（本地开发，不提交到 Git）：

```env
# ===== 数据库 =====
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/wordcheckin?schema=public
POSTGRES_PASSWORD=postgres
POSTGRES_DB=wordcheckin
DB_PORT=5432

# ===== Redis =====
REDIS_URL=redis://localhost:6379
REDIS_PORT=6379

# ===== NextAuth =====
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=change-this-to-a-long-random-string  # ← 必须修改

# ===== Sentry =====
SENTRY_DSN=

# ===== 应用 =====
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_PORT=3000
```

### 环境变量说明

| 变量 | 必填 | 说明 |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL 连接字符串 |
| `POSTGRES_PASSWORD` | ✅ | Docker Compose 数据库密码 |
| `POSTGRES_DB` | ✅ | Docker Compose 数据库名 |
| `REDIS_URL` | ✅ | Redis 连接字符串 |
| `NEXTAUTH_URL` | ✅ | NextAuth 回调地址 |
| `NEXTAUTH_SECRET` | ✅ | NextAuth 签名密钥（必须使用长随机字符串） |
| `SENTRY_DSN` | ❌ | Sentry 错误上报地址 |
| `NEXT_PUBLIC_APP_URL` | ✅ | 前端暴露的应用 URL |

---

## 四、数据库设计

### 4.1 数据模型概览

详见 `prisma/schema.prisma`。核心表如下：

```
User ──1:1── Circle (owner)
  │
  ├── CircleMember (N:M via circle_members)
  │
  ├── Checkin (N:1) ── VocabVersion (N:1)
  │     ├── CheckinEdit (1:N)  # 编辑历史
  │     ├── Comment (1:N)
  │     └── Like (1:N)
  │
  ├── CheckinDraft (1:1)        # 每个圈子一份草稿
  ├── Comment (N:1)
  ├── Like (N:1)
  ├── Notification (1:N)
  └── AuditLog (actor/target)

InviteCode ── Circle (1:N)
WeeklySnapshot ── Circle (1:N)
Export ── User / Circle
VocabVersion ── VocabEntry (1:N)
```

### 4.2 关键约束

| 约束 | 实现 | 说明 |
|---|---|---|
| 每天一次打卡 | `@@unique([circleId, userId, date, status])` | 同圈子同天只能一条 PUBLISHED |
| 草稿唯一 | `@@unique([circleId, userId])` | 一个用户每圈子仅一份草稿 |
| 点赞唯一 | `@@unique([checkinId, userId])` | 一条打卡只能点赞一次 |
| 成员唯一 | `@@unique([circleId, userId])` | 一个用户同圈子仅一个成员关系 |
| 邀请码唯一 | `@unique` on code | 全局唯一 |
| 软删 | `deletedAt` 字段 | 所有可删除实体 |

### 4.3 枚举

```prisma
enum UserStatus    { ACTIVE, DEACTIVATED }
enum Role          { OWNER, MEMBER }
enum CheckinStatus { DRAFT, PUBLISHED, WITHDRAWN }
enum VocabLevel    { CET4, CET6, COMBINED, CUSTOM }
enum NotificationType {
  LIKE, COMMENT, INVITE, JOIN,
  REMOVED, PASSWORD_RESET, ADMIN_ACTION
}
```

### 4.4 审计日志 (audit_logs)

所有敏感操作写入 `audit_logs` 表，采用 append-only 策略（应用层禁止 UPDATE/DELETE）：

| eventType | 触发场景 |
|---|---|
| `CHECKIN_CREATE` | 创建打卡 |
| `CHECKIN_EDIT` | 编辑打卡 |
| `CHECKIN_WITHDRAW` | 撤回打卡 |
| `PASSWORD_RESET` | 重置密码 |
| `MEMBER_REMOVE` | 移除成员 |
| `OWNER_TRANSFER` | 转移所有者 |
| `ADMIN_REMOVE` | 管理员移除内容 |
| `ADMIN_CORRECTION` | 管理员修正记录 |

---

## 五、API 设计（tRPC）

### 5.1 路由结构

根路由聚合在 `src/server/routers/_app.ts`：

```ts
// _app.ts
export const appRouter = router({
  auth: authRouter,
  circle: circleRouter,
  checkin: checkinRouter,
  feed: feedRouter,
  stats: statsRouter,
  vocab: vocabRouter,
  audit: auditRouter,
  export: exportRouter,
  notification: notificationRouter,
})
```

### 5.2 路由一览

| 路由 | 类型 | 说明 | 认证 |
|---|---|---|---|
| `auth.register` | mutation | 用户注册 | 公开 |
| `auth.updateProfile` | mutation | 更新昵称 | ✅ |
| `auth.deactivate` | mutation | 注销账号 | ✅ |
| `circle.create` | mutation | 创建圈子 | ✅ |
| `circle.join` | mutation | 通过邀请码加入 | ✅ |
| `circle.get` | query | 获取圈子信息 | ✅ |
| `circle.listMembers` | query | 成员列表 | ✅ |
| `circle.listInviteCodes` | query | 邀请码列表 | ✅ |
| `circle.createInviteCode` | mutation | 生成邀请码 | ✅ |
| `circle.removeMember` | mutation | 移除成员 | ✅ (所有者) |
| `circle.leave` | mutation | 退出圈子 | ✅ |
| `checkin.create` | mutation | 创建打卡 | ✅ |
| `checkin.saveDraft` | mutation | 保存草稿 | ✅ |
| `checkin.getToday` | query | 获取今天打卡状态 | ✅ |
| `checkin.get` | query | 打卡详情 | ✅ |
| `checkin.list` | query | 打卡列表 | ✅ |
| `checkin.update` | mutation | 编辑打卡 | ✅ (作者) |
| `checkin.withdraw` | mutation | 撤回打卡 | ✅ (作者) |
| `feed.list` | query | 动态流 | ✅ |
| `feed.like` | mutation | 点赞/取消点赞 | ✅ |
| `feed.addComment` | mutation | 添加评论 | ✅ |
| `stats.profile` | query | 个人统计 | ✅ |
| `stats.calendar` | query | 打卡日历 | ✅ |
| `stats.circle` | query | 圈子统计 | ✅ |
| `vocab.listVersions` | query | 词库版本列表 | 公开 |
| `vocab.getEntries` | query | 词条列表 | 公开 |
| `vocab.search` | query | 搜索词条 | 公开 |
| `audit.list` | query | 审计日志 | ✅ (所有者) |
| `export.exportProfile` | query | 导出个人数据 | ✅ |
| `notification.list` | query | 通知列表 | ✅ |
| `notification.unreadCount` | query | 未读通知数 | ✅ |
| `notification.markRead` | mutation | 标记单条已读 | ✅ |
| `notification.markAllRead` | mutation | 全部标记已读 | ✅ |

### 5.3 上下文（ctx）

```ts
interface Context {
  user: User | null        // 当前登录用户（从 NextAuth session）
  prisma: PrismaClient     // Prisma 客户端
  req: NextRequest         // 原始 HTTP 请求
}
```

### 5.4 输入验证

所有输入必须使用 zod schema 验证：

```ts
checkinRouter.create: z.object({
  circleId: z.string(),
  vocabVersionId: z.string(),
  wordCount: z.number().min(1).max(2000),
  minutes: z.number().min(1).max(720),
  note: z.string().max(300).optional(),
})
```

### 5.5 错误处理

```ts
// 业务错误
throw new TRPCError({
  code: 'CONFLICT',
  message: '今天已经打过卡了',
})

// 权限错误
throw new TRPCError({
  code: 'FORBIDDEN',
  message: '没有权限执行此操作',
})

// ⚠️ 不暴露内部错误细节
// throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
```

### 5.6 健康检查

`GET /api/health` 返回 `{ status: 'ok', timestamp: ... }`。

---

## 六、核心业务规则

### 6.1 打卡

| 规则 | 实现 |
|---|---|
| 每天一次 | 数据库唯一约束 + 应用层检查 |
| 发布后进入动态 | status = PUBLISHED |
| 草稿不进动态和统计 | status = DRAFT |
| 撤回 = 整条作废 | status → WITHDRAWN，不计入动态/连续/排行榜 |
| 撤回后同天可重发 1 次 | 撤回记录与新记录互不冲突（unique 含 status） |
| 编辑仅当天 | 编辑需检查 date 是否为圈子时区的今天 |
| 编辑可无限次 | 不限制次数，每次写 CheckinEdit + AuditLog |
| 不可编辑字段 | 词库版本、日期、状态 |
| 词量范围 | 1–2000 |
| 时长范围 | 1–720 分钟 |
| 笔记长度 | ≤300 字 |

### 6.2 连续天数

```ts
export function calculateStreak(dates: Set<string>): number {
  if (dates.size === 0) return 0
  const sortedDates = [...dates].sort((a, b) => b.localeCompare(a))
  let streak = 1
  let currentDate = new Date(sortedDates[0])
  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i])
    const diffDays = Math.round(
      (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    if (diffDays === 1) { streak++; currentDate = prevDate }
    else break
  }
  return streak
}
```

### 6.3 时区处理

- 圈子时区存储在 `Circle.timezone`，默认 `Asia/Shanghai`
- 打卡日期存储在 `Checkin.date`，类型 `DateTime @db.Date`
- 使用 `date-fns` + `date-fns-tz` 处理时区

```ts
import { format, addDays } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

export function getLocalDate(date: Date, timezone: string): string {
  return format(toZonedTime(date, timezone), 'yyyy-MM-dd')
}
```

### 6.4 邀请码

- 8 位随机字符（A-Z, 0-9），全局唯一
- 可设置最大使用次数（可选）和过期时间（可选）
- 可撤销（revokedAt）
- 加入时校验：未撤销 + 未过期 + 未达上限

### 6.5 密码规则

- 长度 ≥ 10
- 包含大写字母、小写字母、数字、特殊字符
- 哈希算法：argon2
- 会话：JWT cookie，有效期 7 天

### 6.6 排行榜规则

同分时依次比较：

1. 打卡天数
2. 累计单词量
3. 连续天数
4. 按用户 ID 排序（稳定排序）

---

## 七、安全规范

### 7.1 认证与授权

```ts
// 需要登录：使用 protectedProcedure
export const checkinRouter = router({
  create: protectedProcedure
    .input(z.object({ ... }))
    .mutation(async ({ input, ctx }) => {
      // ctx.user 保证非 null
    })
})

// 需要所有者：额外校验 role === 'OWNER'
async function assertCircleOwner(userId: string, circleId: string) {
  const circle = await prisma.circle.findFirst({
    where: { id: circleId, ownerId: userId },
  })
  if (!circle) {
    throw new TRPCError({ code: 'FORBIDDEN', message: '没有权限' })
  }
}
```

### 7.2 权限校验顺序

```ts
// ✅ 正确：先校验权限再查数据
const member = await prisma.circleMember.findFirst({
  where: { userId, circleId, leftAt: null },
})
if (!member) throw new TRPCError({ code: 'FORBIDDEN', message: '没有权限' })

// ❌ 错误：先查数据再校验（暴露资源是否存在）
const checkin = await prisma.checkin.findUnique({ where: { id } })
if (checkin.userId !== user.id) throw ...
```

### 7.3 数据隐私

- API 返回时过滤 `email`、`passwordHash` 等敏感字段
- 不暴露内部错误信息
- 未授权访问返回通用错误，不暴露资源是否存在

### 7.4 限流

Redis 计数器实现：

- 登录：5 次失败 / 5 分钟
- 打卡：幂等性（通过数据库唯一约束）
- 评论/点赞：合理频率限制

### 7.5 审计日志

以下操作**必须**写入 `audit_logs`：

- 创建/编辑/撤回打卡
- 重置密码
- 移除成员
- 转移所有者
- 管理员移除内容
- 管理员修正记录

---

## 八、测试

### 8.1 单元测试（Vitest）

```ts
// src/server/services/stats.service.test.ts
import { describe, it, expect } from 'vitest'
import { calculateStreak } from './stats.service'

describe('calculateStreak', () => {
  it('should return 0 for empty dates', () => {
    expect(calculateStreak(new Set())).toBe(0)
  })
  it('should return 1 for single day', () => {
    expect(calculateStreak(new Set(['2024-01-01']))).toBe(1)
  })
  it('should return 3 for three consecutive days', () => {
    expect(calculateStreak(new Set(['2024-01-01', '2024-01-02', '2024-01-03']))).toBe(3)
  })
  it('should return 1 when streak is broken', () => {
    expect(calculateStreak(new Set(['2024-01-01', '2024-01-03']))).toBe(1)
  })
})
```

### 8.2 集成测试（Vitest + Prisma）

```ts
describe('checkinRouter.create', () => {
  beforeEach(async () => {
    await prisma.$transaction([
      prisma.checkin.deleteMany(),
      prisma.user.deleteMany(),
    ])
  })

  it('should create a checkin successfully', async () => {
    // 创建测试数据 → 执行操作 → 断言
  })
})
```

### 8.3 E2E 测试（Playwright）

```ts
// tests/e2e/checkin.spec.ts
import { test, expect } from '@playwright/test'

test('user can create a checkin', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[type=email]', 'test@example.com')
  await page.fill('input[type=password]', 'Test12345!@#')
  await page.click('button[type=submit]')

  await page.goto('/checkin')
  await page.selectOption('select[name=vocabVersion]', 'v1')
  await page.fill('input[name=wordCount]', '50')
  await page.fill('input[name=minutes]', '30')
  await page.click('button[type=submit]')

  await expect(page.locator('.success-message')).toBeVisible()
})
```

### 8.4 运行测试

```bash
pnpm test          # 所有单元测试
pnpm test:watch    # 监听模式
pnpm e2e           # E2E 测试
```

---

## 九、部署

### 9.1 Docker Compose

`docker-compose.yml` 定义三个服务：

| 服务 | 镜像 | 端口 |
|---|---|---|
| db | postgres:15-alpine | 5432 |
| redis | redis:7-alpine | 6379 |
| app | 构建自 Dockerfile | 3000 |

```yaml
services:
  db:
    image: postgres:15-alpine
    ports:
      - "${DB_PORT:-5432}:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d wordcheckin"]

  redis:
    image: redis:7-alpine
    ports:
      - "${REDIS_PORT:-6379}:6379"
    volumes:
      - redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]

  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "${APP_PORT:-3000}:3000"
    depends_on:
      db: { condition: service_healthy }
      redis: { condition: service_healthy }
```

### 9.2 Dockerfile（多阶段构建）

```
# Stage 1: Build
node:20-alpine → pnpm install → prisma generate → next build

# Stage 2: Runner
node:20-alpine → 复制 standalone 产物 → 非 root 用户运行
```

### 9.3 VPS 部署

```bash
# 在 VPS 上
cd /var/www/word-check-in
git pull origin main

# 设置环境变量
cat > .env << 'EOF'
DATABASE_URL=postgresql://postgres:CHANGE_ME@db:5432/wordcheckin?schema=public
POSTGRES_PASSWORD=CHANGE_ME
POSTGRES_DB=wordcheckin
DB_PORT=5432
REDIS_URL=redis://redis:6379
REDIS_PORT=6379
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=GENERATE_A_LONG_RANDOM_STRING
SENTRY_DSN=
NEXT_PUBLIC_APP_URL=https://your-domain.com
APP_PORT=3000
EOF

# 构建并启动
docker compose up -d --build

# 首次启动时运行迁移
docker compose exec app npx prisma migrate deploy

# 健康检查
curl http://localhost:3000/api/health

# 查看日志
docker compose logs -f app
```

### 9.4 更新部署

```bash
git pull origin main
docker compose up -d --build
docker compose exec app npx prisma migrate deploy
```

### 9.5 回滚

```bash
# 回滚代码
git log --oneline -5
git checkout <previous-commit>

# 重建
docker compose up -d --build

# 回滚数据库（如有需要）
# 需要手动执行逆向迁移
```

### 9.6 备份策略

| 场景 | 方法 | 频率 |
|---|---|---|
| 迁移前自动备份 | 应用启动时 `pg_dump` | 每次部署 |
| 每日定时备份 | `crontab` + `pg_dump` | 每日凌晨 |
| 异地手动备份 | 拷贝 dump 文件到异地 | 定期 |

```bash
# crontab 示例
0 2 * * * cd /var/www/word-check-in && docker compose exec -T db pg_dump -U postgres wordcheckin > backup_$(date +\%Y\%m\%d).sql
```

保留最近 7 天备份，RPO ≤ 24 小时。

---

## 十、开发规范摘要

> 完整规范请参阅 `AGENTS.md`，以下为要点。

### 10.1 TypeScript

- ✅ 严格模式：`strict: true`
- ✅ 类型导入使用 `import type`
- ✅ 禁止 `any`，使用 `unknown` 或明确类型
- ✅ 所有导出函数必须显式声明返回类型
- ✅ 空值处理使用 `??` 和 `?.`

### 10.2 React

- ✅ 函数组件使用箭头函数
- ✅ Props 类型使用 `interface`
- ✅ 组件导出使用 `export default`（页面）或命名导出（组件）
- ✅ 列表渲染必须提供 `key`
- ✅ `useEffect` 确保依赖数组完整

### 10.3 样式

- ✅ Tailwind utility class 优先
- ✅ 组件样式使用 `cn()` 合并类名
- ✅ 自定义 CSS 仅在 `globals.css`，使用 CSS 变量
- ✅ 使用 Tailwind 内置断点（sm, md, lg, xl）

### 10.4 命名约定

| 类型 | 约定 | 示例 |
|---|---|---|
| 文件 | kebab-case | `checkin.service.ts` |
| React 组件 | PascalCase | `<CheckinForm />` |
| TypeScript 类型 | PascalCase | `type CheckinInput` |
| 数据库表 | snake_case | `checkin_edits` |
| 数据库字段 | camelCase | `wordCount` |
| 环境变量 | SCREAMING_SNAKE_CASE | `DATABASE_URL` |
| 枚举值 | SCREAMING_SNAKE_CASE | `PUBLISHED` |

### 10.5 常见陷阱

| 陷阱 | 错误示例 | 正确做法 |
|---|---|---|
| 日期时区 | `new Date().toISOString()` | 使用 `getLocalDate(date, timezone)` |
| 软删查询 | 忘记过滤 `deletedAt` | `where: { deletedAt: null }` |
| 权限校验顺序 | 先查数据再校验 | 先校验权限再查数据 |
| 事务处理 | 多步操作不用事务 | `prisma.$transaction([...])` |
| 并发控制 | 先查后改 | 依赖数据库唯一约束 |

---

## 十一、Git 工作流

### 11.1 分支策略

| 分支 | 说明 |
|---|---|
| `main` | 生产分支，必须通过所有检查 |
| `dev` | 开发分支，日常开发 |
| `feature/*` | 功能分支，从 `dev` 创建 |
| `fix/*` | 修复分支 |

### 11.2 提交消息

Conventional Commits：

```
feat: 添加打卡创建功能
fix: 修复连续天数计算 bug
docs: 更新 API 文档
style: 调整组件样式
refactor: 重构统计服务
test: 添加连续天数测试
chore: 更新依赖
```

### 11.3 PR 检查清单

- [ ] TypeScript 编译无错误（`pnpm typecheck`）
- [ ] 单元测试通过（`pnpm test`）
- [ ] 没有 `any` 类型
- [ ] 所有 API 输入有 zod 验证
- [ ] 所有权限操作有权限校验
- [ ] 所有敏感操作有审计日志
- [ ] 所有查询过滤了已删除数据
- [ ] 日期处理考虑了时区
- [ ] 错误信息不暴露内部细节
- [ ] 新增的数据库变更有迁移文件
- [ ] 新增的功能有对应的测试

---

## 十二、ADR 决策记录

| 编号 | 决策 | 理由 |
|---|---|---|
| ADR-001 | 不做邮箱验证 | 简化运维，减少 SMTP 依赖；熟人场景可信 |
| ADR-002 | 不做用户协议展示 | 最小化合规成本；自托管场景 |
| ADR-003 | 快速部署优先于 CI 流水线 | GitHub push → SSH → git pull && docker compose up -d |
| ADR-004 | 备份策略：迁移前 pg_dump + 每日定时 | 兼顾迁移保护和日常备份，RPO ≤ 24h |
| ADR-005 | 草稿无限保存，不自动清除 | 用户友好 |
| ADR-006 | 圈子时区统一，禁止事后修改 | 规则简单、历史不可篡改 |

---

## 十三、架构示意

```
┌─────────────────────────────────────────────────────────┐
│  客户端（浏览器 / 手机浏览器）                              │
│  Next.js SSR + 客户端水合 + Tailwind + shadcn/ui          │
└─────────────────────┬───────────────────────────────────┘
                      │ tRPC（HTTP）
┌─────────────────────┴───────────────────────────────────┐
│  应用层（Next.js Route Handlers）                          │
│  Auth │ Circle │ Checkin │ Feed │ Stats │ Vocab          │
│  Audit │ Export │ Notification                              │
└─────────────────────┬───────────────────────────────────┘
                      │ Prisma
┌─────────────────────┴───────────────────────────────────┐
│  数据层                                                    │
│  PostgreSQL（主库） + Redis（限流/缓存）                    │
│  users │ circles │ checkins │ comments │ likes            │
│  notifications │ vocab_versions │ audit_logs             │
│  weekly_snapshots │ exports                                  │
└─────────────────────────────────────────────────────────┘
```

---

## 十四、故障排查

| 问题 | 排查方法 |
|---|---|
| 数据库连接失败 | `docker compose logs db`，检查 `DATABASE_URL` |
| Redis 连接失败 | `docker compose logs redis`，检查 `REDIS_URL` |
| 登录失败 | 检查 `NEXTAUTH_SECRET` 是否设置，查看应用日志 |
| 迁移失败 | `docker compose exec app npx prisma migrate status` |
| 端口冲突 | 修改 `.env` 中 `APP_PORT` / `DB_PORT` |
| 健康检查失败 | `curl http://localhost:3000/api/health` |
| Sentry 错误 | 查看 Sentry Dashboard |

---

*文档版本：2.0 · 最后更新：2026-07-10*
