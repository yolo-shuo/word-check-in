# AGENTS.md

> 本文件是给 AI 编码助手（Cursor / Copilot / Cline 等）的项目规范。
> 所有贡献者（包括 AI）必须遵守以下约定。

---

## 1. 项目概述

**社区单词打卡应用** — 面向 3-15 人熟人小圈子的学习记录工具。

- 首版聚焦：记录 → 发布 → 互动 → 反馈 → 统计
- 不做：测验、推荐、成就体系、公共广场、陌生人社交
- 部署：自托管 VPS + Docker Compose
- 语言：仅简体中文

---

## 2. 技术栈

| 层 | 技术 | 版本 |
|---|---|---|
| 前端 | Next.js App Router | 14+ |
| 通信 | tRPC | 10+ |
| ORM | Prisma | 5+ |
| 数据库 | PostgreSQL | 15+ |
| 缓存 | Redis | 7+ |
| 认证 | NextAuth v4 (credentials) | 4 |
| 密码哈希 | argon2 | - |
| 样式 | Tailwind CSS + shadcn/ui | 3 |
| 状态 | Zustand + React Query | - |
| 表单 | zod + react-hook-form | - |
| 测试 | Vitest + Playwright | - |
| 容器 | Docker + Compose | - |

---

## 3. 目录结构

```
word-check-in/
├── prisma/
│   ├── schema.prisma          # 数据库 schema
│   ├── migrations/            # 迁移文件
│   └── seed.ts                # 词库种子数据
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (circle)/
│   │   │   ├── feed/page.tsx
│   │   │   ├── checkin/page.tsx
│   │   │   ├── checkin/[id]/page.tsx
│   │   │   ├── members/page.tsx
│   │   │   ├── stats/circle/page.tsx
│   │   │   ├── stats/profile/page.tsx
│   │   │   ├── vocab/page.tsx
│   │   │   ├── vocab/[id]/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   ├── settings/circle/page.tsx
│   │   │   ├── notifications/page.tsx
│   │   │   └── admin/audit/page.tsx
│   │   ├── api/
│   │   │   └── trpc/[trpc]/route.ts
│   │   ├── layout.tsx
│   │   └── page.tsx           # 重定向到 /feed
│   ├── server/
│   │   ├── routers/
│   │   │   ├── _app.ts        # 根路由
│   │   │   ├── auth.ts        # 认证路由
│   │   │   ├── circle.ts      # 圈子路由
│   │   │   ├── checkin.ts     # 打卡路由
│   │   │   ├── feed.ts        # 动态路由
│   │   │   ├── stats.ts       # 统计路由
│   │   │   ├── vocab.ts       # 词库路由
│   │   │   ├── audit.ts       # 审计路由
│   │   │   ├── export.ts      # 导出路由
│   │   │   └── notification.ts # 通知路由
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── circle.service.ts
│   │   │   ├── checkin.service.ts
│   │   │   ├── stats.service.ts
│   │   │   ├── vocab.service.ts
│   │   │   └── notification.service.ts
│   │   ├── prisma.ts          # Prisma 客户端单例
│   │   ├── trpc.ts            # tRPC 初始化
│   │   ├── auth.ts            # NextAuth 配置
│   │   └── lib/
│   │       ├── date.ts        # 日期工具（时区处理）
│   │       ├── streak.ts      # 连续天数计算
│   │       ├── rate-limit.ts  # 限流
│   │       └── audit.ts       # 审计日志写入
│   ├── components/
│   │   ├── ui/                # shadcn/ui 组件
│   │   ├── checkin/           # 打卡相关组件
│   │   ├── feed/              # 动态相关组件
│   │   ├── stats/             # 统计相关组件
│   │   ├── vocab/             # 词库相关组件
│   │   └── shared/            # 通用组件
│   ├── lib/                   # 客户端工具
│   └── types/                 # 共享类型
├── public/
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── .env.local                 # 本地环境（不提交）
├── tsconfig.json
├── tailwind.config.ts
├── vitest.config.ts
└── package.json
```

---

## 4. 命名约定

| 类型 | 约定 | 示例 |
|---|---|---|
| 文件 | kebab-case | `checkin.service.ts` |
| React 组件 | PascalCase | `<CheckinForm />` |
| TypeScript 类型 | PascalCase | `type CheckinInput` |
| 数据库表 | snake_case（Prisma 默认） | `checkin_edits` |
| 数据库字段 | camelCase | `wordCount` |
| API 路由 | kebab-case（文件夹） | `routers/checkin.ts` |
| CSS 类 | Tailwind utility | `className="p-4 text-lg"` |
| 环境变量 | SCREAMING_SNAKE_CASE | `DATABASE_URL` |
| 枚举值 | SCREAMING_SNAKE_CASE | `PUBLISHED`, `WITHDRAWN` |

---

## 5. 代码规范

### 5.1 TypeScript

- **严格模式**：`strict: true`
- **类型导入**：使用 `import type` 导入类型
- **禁止 any**：必须使用 `unknown` 或明确类型
- **函数返回类型**：所有导出函数必须显式声明返回类型
- **空值处理**：使用 `??` 和 `?.` 操作符

```ts
// ✅ 正确
import type { CheckinInput } from '../types'

export function createCheckin(input: CheckinInput): Promise<Checkin> {
  return prisma.checkin.create({ data: input })
}

// ❌ 错误
import { CheckinInput } from '../types'  // 非类型导入
export async function createCheckin(input: any) { ... }  // 使用 any
```

### 5.2 React 组件

- **函数组件**：使用箭头函数
- **Props 类型**：定义 `interface` 而非 `type`
- **组件导出**：使用 `export default`
- **列表渲染**：必须提供 `key` 属性
- **副作用**：使用 `useEffect` 时确保依赖数组完整

```tsx
// ✅ 正确
interface CheckinFormProps {
  circleId: string
  onSuccess: () => void
}

export function CheckinForm({ circleId, onSuccess }: CheckinFormProps) {
  const { data, isLoading } = useQuery(...)
  // ...
}

// ❌ 错误
const CheckinForm = ({ circleId }: any) => { ... }  // 无类型
```

### 5.3 样式

- **Tailwind 优先**：使用 utility class
- **组件样式**：使用 `cn()` 合并类名
- **自定义 CSS**：仅在 `globals.css` 中，使用 CSS 变量
- **响应式断点**：使用 Tailwind 内置断点（sm, md, lg, xl）

```tsx
// ✅ 正确
<button className={cn('px-4 py-2', isActive ? 'bg-blue-500' : 'bg-gray-200')}>

// ❌ 错误
<button style={{ padding: '8px 16px', backgroundColor: 'blue' }}>
```

---

### 5.4 共享组件模式

为避免代码重复，以下组件必须通过共享组件引用，禁止在多处重复定义：

#### 必须使用共享组件的模式

| 重复模式 | 共享组件 | 路径 |
|---|---|---|
| 用户头像（img 或首字母 fallback） | `<UserAvatar />` | `@/components/user-avatar` |
| 圈子选择守卫（`if (!circleId)` 返回 CircleSelector） | `<CirclePageGuard />` | `@/components/circle-page-guard` |
| 加载状态（居中 Loader2 + 文字） | `<LoadingState />` | `@/components/page-states` |
| 错误状态（居中错误信息 + 重试按钮） | `<ErrorState />` | `@/components/page-states` |
| 空状态（居中图标 + 文字） | `<EmptyState />` | `@/components/page-states` |
| 词库级别映射 (CET4→四级 等) | `levelMap` | `@/lib/constants` |
| 词库级别颜色 | `levelColor` | `@/lib/constants` |
| 掌握程度映射 (NEW→新词 等) | `masteryMap` | `@/lib/constants` |
| 掌握程度颜色 | `masteryColor` | `@/lib/constants` |
| 角色映射 (OWNER→所有者 等) | `roleMap` | `@/lib/constants` |
| 通知类型映射 | `notificationTypeMap` | `@/lib/constants` |

#### 使用示例

```tsx
// ✅ 正确：使用共享组件
import { UserAvatar } from '@/components/user-avatar'
import { LoadingState } from '@/components/page-states'
import { levelMap } from '@/lib/constants'

<UserAvatar user={user} size="lg" />
<LoadingState text="加载中..." />
<span>{levelMap[version.level]}</span>

// ❌ 错误：重复定义头像组件
function Avatar({ user }: { user: User }) {
  return user.avatarUrl ? <img src={user.avatarUrl} /> : <div>{user.nickname[0]}</div>
}

// ❌ 错误：重复定义 levelMap
const levelMap = { CET4: '四级', CET6: '六级', ... }
```

#### UserAvatar Props

```tsx
interface UserAvatarProps {
  user: { nickname: string; avatarUrl: string | null }
  size?: 'sm' | 'md' | 'lg'  // sm: 24px, md: 32px, lg: 40px
  className?: string
}
```

#### CirclePageGuard Props

```tsx
interface CirclePageGuardProps {
  circleId: string | null
  title: string
  maxWidth?: '2xl' | '3xl'
}

// 使用方式：在页面顶部调用，如果返回 null 则继续渲染
const guard = <CirclePageGuard circleId={circleId} title="页面标题" />
if (guard) return guard
```

#### LoadingState / ErrorState / EmptyState Props

```tsx
// LoadingState
interface LoadingStateProps { text?: string; height?: string }

// ErrorState
interface ErrorStateProps { message: string; hint?: string; onRetry?: () => void; height?: string }

// EmptyState
interface EmptyStateProps { icon?: React.ReactNode; title: string; description?: string; height?: string }
```

#### 新增共享组件规则

1. 当同一逻辑在 **2 个以上文件** 中出现时，必须提取为共享组件
2. 共享组件放在 `src/components/` 或 `src/components/ui/` 下
3. 共享常量放在 `src/lib/constants.ts`
4. 修改共享组件后，所有引用处自动生效，无需逐一修改
5. 新增共享组件需在 `AGENTS.md` 中登记


## 6. API 设计规范

### 6.1 tRPC 路由结构

```ts
// src/server/routers/checkin.ts
import { router, protectedProcedure } from '../trpc'

export const checkinRouter = router({
  // 查询：获取打卡列表
  list: protectedProcedure
    .input(z.object({
      circleId: z.string(),
      skip: z.number().default(0),
      take: z.number().default(20),
    }))
    .query(async ({ input, ctx }) => {
      return ctx.prisma.checkin.findMany({
        where: {
          circleId: input.circleId,
          status: 'PUBLISHED',
          deletedAt: null,
        },
        skip: input.skip,
        take: input.take,
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      })
    }),

  // 创建：发布打卡
  create: protectedProcedure
    .input(z.object({
      circleId: z.string(),
      vocabVersionId: z.string(),
      wordCount: z.number().min(1).max(2000),
      minutes: z.number().min(1).max(720),
      note: z.string().max(300).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // 校验权限、检查重复、创建打卡、写审计
    }),

  // 修改：编辑打卡
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      wordCount: z.number().min(1).max(2000).optional(),
      minutes: z.number().min(1).max(720).optional(),
      note: z.string().max(300).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // 校验作者、校验时间、更新字段、写 CheckinEdit + audit
    }),

  // 撤回
  withdraw: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // 校验作者、改状态、写审计
    }),
})
```

### 6.2 输入验证

- 所有 `input` 必须使用 zod schema 验证
- 数字范围必须明确 `min` / `max`
- 字符串长度必须明确 `max`
- 可选字段使用 `.optional()`
- 必填字段默认 required

```ts
// ✅ 正确
z.object({
  wordCount: z.number().min(1).max(2000),
  minutes: z.number().min(1).max(720),
  note: z.string().max(300).optional(),
})

// ❌ 错误
z.object({
  wordCount: z.number(),
  note: z.string(),  // 无长度限制
})
```

### 6.3 错误处理

- 使用 tRPC 内置错误类型
- 业务错误使用 `TRPCError` 并设置 `code`
- 不暴露内部错误细节给前端

```ts
import { TRPCError } from '@trpc/server'

// ✅ 正确：业务错误
throw new TRPCError({
  code: 'CONFLICT',
  message: '今天已经打过卡了',
})

// ✅ 正确：权限错误
throw new TRPCError({
  code: 'FORBIDDEN',
  message: '没有权限执行此操作',
})

// ❌ 错误：暴露内部细节
throw new TRPCError({
  code: 'INTERNAL_SERVER_ERROR',
  message: error.message,  // 可能包含 SQL 细节
})
```

### 6.4 上下文（ctx）

tRPC 上下文包含：

```ts
interface Context {
  user: User | null        // 当前登录用户
  prisma: PrismaClient     // Prisma 客户端
  req: NextRequest         // 原始请求
}
```

- `user`：从 NextAuth session 获取
- `prisma`：从单例获取
- 需要登录的操作使用 `protectedProcedure`

---

## 7. 数据库规范

### 7.1 Prisma Schema 约定

- 所有 model 必须有 `id` 字段（cuid）
- 所有 model 必须有 `createdAt`（默认 `now()`）
- 可更新的 model 必须有 `updatedAt`（默认 `@updatedAt`）
- 可删除的实体必须有 `deletedAt` 字段（DateTime?）
- 枚举使用 `enum` 关键字，值使用 SCREAMING_SNAKE_CASE
- 关系必须使用 `@relation(fields: [...], references: [...])`

```prisma
// ✅ 正确
model Checkin {
  id        String        @id @default(cuid())
  circleId  String
  userId    String
  wordCount Int
  date      DateTime      @db.Date
  status    CheckinStatus @default(PUBLISHED)
  deletedAt DateTime?
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt

  circle Circle @relation(fields: [circleId], references: [id])
  user   User   @relation(fields: [userId], references: [id])

  @@unique([circleId, userId, date, status])
}
```

### 7.2 查询约定

- 永远使用 `findMany` 并明确 `where`、`orderBy`、`skip`、`take`
- 关联查询使用 `include` 或 `select`
- 批量操作使用 `createMany` 或 `updateMany`
- 事务操作使用 `prisma.$transaction()`

```ts
// ✅ 正确：明确条件
const checkins = await prisma.checkin.findMany({
  where: {
    circleId,
    status: 'PUBLISHED',
    deletedAt: null,
  },
  orderBy: { date: 'desc' },
  skip,
  take,
  include: { user: { select: { nickname: true, avatarUrl: true } } },
})

// ❌ 错误：无条件查询
const checkins = await prisma.checkin.findMany()
```

### 7.3 迁移规范

- 所有 schema 变更必须通过 `prisma migrate dev`
- 迁移文件命名：Prisma 自动生成，不要手动修改
- 生产迁移前：自动执行 pg_dump 备份
- 禁止在生产环境使用 `prisma db push`

---

## 8. 安全规范

### 8.1 认证与授权

- 所有需要登录的 API 使用 `protectedProcedure`
- 所有需要所有者权限的 API 额外校验 `role === 'OWNER'`
- 用户只能操作自己的资源（校验 `userId`）
- 成员只能访问所在圈子的资源（校验 `CircleMember` 关系）

```ts
// ✅ 正确：权限校验
async function assertCircleMember(userId: string, circleId: string) {
  const member = await prisma.circleMember.findFirst({
    where: { userId, circleId, leftAt: null },
  })
  if (!member) {
    throw new TRPCError({ code: 'FORBIDDEN', message: '没有权限' })
  }
  return member
}

// ✅ 正确：所有者校验
async function assertCircleOwner(userId: string, circleId: string) {
  const circle = await prisma.circle.findFirst({
    where: { id: circleId, ownerId: userId },
  })
  if (!circle) {
    throw new TRPCError({ code: 'FORBIDDEN', message: '没有权限' })
  }
}
```

### 8.2 输入校验

- 所有外部输入必须经过 zod 验证
- 不接受未验证的原始请求数据
- 文件上传限制大小和类型

### 8.3 数据隐私

- API 返回时过滤敏感字段（`email`, `passwordHash`）
- 不暴露内部错误信息
- 未授权访问返回通用错误，不暴露资源是否存在

```ts
// ✅ 正确：过滤敏感字段
return {
  nickname: user.nickname,
  avatarUrl: user.avatarUrl,
  // email, passwordHash 不返回
}

// ❌ 错误：暴露敏感字段
return user  // 包含 email, passwordHash
```

### 8.4 审计日志

以下操作必须写入 `audit_logs` 表：

| 操作 | eventType |
|---|---|
| 创建打卡 | CHECKIN_CREATE |
| 编辑打卡 | CHECKIN_EDIT |
| 撤回打卡 | CHECKIN_WITHDRAW |
| 重置密码 | PASSWORD_RESET |
| 移除成员 | MEMBER_REMOVE |
| 转移所有者 | OWNER_TRANSFER |
| 管理员移除内容 | ADMIN_REMOVE |
| 管理员修正记录 | ADMIN_CORRECTION |

```ts
// ✅ 正确：写审计日志
await prisma.auditLog.create({
  data: {
    eventType: 'PASSWORD_RESET',
    actorId: userId,
    targetId: targetUserId,
    targetTable: 'User',
    before: { passwordHash: oldHash },
    after: { passwordHash: newHash },
    ipAddress: req.ip,
  },
})
```

---

## 9. 日期与时区

### 9.1 时区处理

- 圈子时区：存储在 `Circle.timezone`，默认 `Asia/Shanghai`
- 打卡日期：存储在 `Checkin.date`，类型为 `DateTime @db.Date`
- 日期计算：使用 `date-fns` + `@date-fns/tz` 处理时区

```ts
import { format, parseISO, addDays } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

// ✅ 正确：获取圈子时区的本地日期
export function getLocalDate(date: Date, timezone: string): string {
  const zonedDate = toZonedTime(date, timezone)
  return format(zonedDate, 'yyyy-MM-dd')
}

// ✅ 正确：计算昨天日期（圈子时区）
export function getYesterdayDate(date: Date, timezone: string): string {
  const zonedDate = toZonedTime(date, timezone)
  return format(addDays(zonedDate, -1), 'yyyy-MM-dd')
}
```

### 9.2 连续天数计算

```ts
// ✅ 正确：连续天数算法
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
    if (diffDays === 1) {
      streak++
      currentDate = prevDate
    } else {
      break
    }
  }

  return streak
}
```

---

## 10. 测试规范

### 10.1 单元测试

- 使用 Vitest
- 每个 service 函数对应一个测试文件
- 使用 `vi.mock()` mock 外部依赖
- 每个测试文件命名：`*.test.ts`

```ts
// src/server/services/stats.service.test.ts
import { describe, it, expect, vi } from 'vitest'
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

### 10.2 集成测试

- 使用 Vitest + Prisma
- 测试数据库使用单独的测试数据库
- 每个测试前清空数据

```ts
// ✅ 正确：集成测试结构
describe('checkinRouter.create', () => {
  beforeEach(async () => {
    await prisma.$transaction([
      prisma.checkin.deleteMany(),
      prisma.user.deleteMany(),
    ])
  })

  it('should create a checkin successfully', async () => {
    // 创建测试数据
    const user = await prisma.user.create({ data: { ... } })
    const circle = await prisma.circle.create({ data: { ... } })

    // 执行操作
    const result = await checkinRouter.create({
      input: { circleId: circle.id, ... },
      ctx: { user, prisma },
    })

    // 断言
    expect(result).toBeDefined()
    expect(result.status).toBe('PUBLISHED')
  })
})
```

### 10.3 E2E 测试

- 使用 Playwright
- 测试关键路径：登录 → 建圈 → 打卡 → 点赞 → 评论 → 导出
- 测试文件位置：`tests/e2e/`
- 运行命令：`npx playwright test`

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

---

## 11. Git 工作流

### 11.1 分支策略

- `main`：生产分支，必须通过 CI
- `dev`：开发分支，日常开发
- `feature/*`：功能分支，从 `dev` 创建
- `fix/*`：修复分支

### 11.2 提交消息

使用 Conventional Commits：

```
feat: 添加打卡创建功能
fix: 修复连续天数计算 bug
docs: 更新 API 文档
style: 调整组件样式
refactor: 重构统计服务
test: 添加连续天数测试
chore: 更新依赖
```

### 11.3 PR 规范

- 标题：Conventional Commits 格式
- 描述：说明变更内容、测试结果
- 必须通过所有测试
- 至少 1 人 review

### 11.4 提交时机（开发后自动提交）

> 核心原则：**一个变更，一次提交。**
> 不允许多个变更在工作区里累积；"等会儿一起提交"不是默认行为，而是例外。
> 本节约束所有贡献者，AI 助手在无人类确认的情况下执行开发时同样适用。

#### 触发提交的时机

完成下列任一情形，**立即提交**，不要等待后续变更：

| 情形 | 示例 |
|---|---|
| 一个功能点闭环 | 新增一个 tRPC 路由及其对应页面 |
| 一个缺陷修复并验证通过 | 修好 bug 并确认不再复现 |
| 一次重构 | 提取共享组件、拆分文件、重命名 |
| 一次数据库变更 | 修改 `schema.prisma` 并生成迁移文件 |
| 一次规范或文档变更 | 修改 `项目基准/`、README、本文件 |

#### 提交前检查

- [ ] `pnpm typecheck` 通过
- [ ] 本次变更已在本地验证（运行相关页面或命令）
- [ ] 提交信息符合 §11.2 的 Conventional Commits 格式
- [ ] `git status` 中没有混入被忽略的文件（`.env*`、构建产物、日志）

#### 禁止行为

- **禁止** 把无关变更混进同一次提交（功能开发 + 格式化 + 重命名应拆开）
- **禁止** 使用 `update`、`fix`、`修改` 这类无信息量的提交信息
- **禁止** 提交 `console.log`、临时调试脚本、`.env*` 文件
- **禁止** 在一次连续开发结束时留下未提交改动而不做收尾提交

#### 收尾提交

一次连续开发告一段落时，若工作区仍有未提交改动，必须做一次收尾提交并说明范围：

```
chore: 收尾提交，清理临时代码与调试文件
```

---

## 12. 部署规范

### 12.1 本地开发

```bash
# 安装依赖
pnpm install

# 启动数据库
docker compose up -d db redis

# 运行迁移
pnpm prisma migrate dev

# 启动开发服务器
pnpm dev
```

### 12.2 生产部署

```bash
# 在 VPS 上
cd /var/www/word-check-in
git pull origin main
docker compose up -d --build

# 健康检查
curl http://localhost:3000/api/health

# 查看日志
docker compose logs -f app
```

### 12.3 回滚

```bash
# 回滚到上一个版本
git log --oneline -5
git checkout <previous-commit>
docker compose up -d --build
```

---

## 13. 常见陷阱

### 13.1 日期时区

```ts
// ❌ 错误：直接使用 new Date().toISOString()
const date = new Date().toISOString()  // UTC 时间

// ✅ 正确：使用圈子时区
const localDate = getLocalDate(new Date(), circle.timezone)
```

### 13.2 软删查询

```ts
// ❌ 错误：忘记过滤已删除数据
const checkins = await prisma.checkin.findMany({
  where: { circleId },
})

// ✅ 正确：过滤已删除
const checkins = await prisma.checkin.findMany({
  where: { circleId, deletedAt: null },
})
```

### 13.3 权限校验顺序

```ts
// ❌ 错误：先查数据再校验权限
const checkin = await prisma.checkin.findUnique({ where: { id } })
if (checkin.userId !== user.id) throw ...  // 暴露了 checkin 存在

// ✅ 正确：先校验权限
const member = await prisma.circleMember.findFirst({
  where: { userId: user.id, circleId: checkin.circleId },
})
if (!member) throw new TRPCError({ code: 'FORBIDDEN', message: '没有权限' })
```

### 13.4 事务处理

```ts
// ❌ 错误：不在事务中执行多步操作
await prisma.checkin.withdraw({ id })
await prisma.auditLog.create({ ... })  // 如果第二步失败，数据不一致

// ✅ 正确：使用事务
await prisma.$transaction([
  prisma.checkin.update({ where: { id }, data: { status: 'WITHDRAWN' } }),
  prisma.auditLog.create({ ... }),
])
```

### 13.5 并发控制

```ts
// ❌ 错误：先查后改，有并发风险
const existing = await prisma.checkin.findFirst({
  where: { userId, circleId, date, status: 'PUBLISHED' },
})
if (!existing) {
  await prisma.checkin.create({ ... })  // 另一个请求可能同时通过检查
}

// ✅ 正确：依赖唯一约束
try {
  await prisma.checkin.create({ ... })
} catch (e) {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
    throw new TRPCError({ code: 'CONFLICT', message: '今天已经打过卡了' })
  }
  throw e
}
```

---

## 14. 环境变量

`.env.example`：

```env
# 数据库
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/wordcheckin?schema=public

# Redis
REDIS_URL=redis://localhost:6379

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here

# Sentry
SENTRY_DSN=

# 应用
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 15. 检查清单

提交代码前确认：

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