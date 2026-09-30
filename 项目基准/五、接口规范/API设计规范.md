# API 设计规范

> 状态：已确认

## 目的
规范 tRPC 路由的设计方式，确保 API 结构清晰、可维护。

## 适用范围
所有 tRPC 路由模块。

## 规范内容

### 路由结构
- 路由文件位置：`src/server/routers/`
- 文件命名：kebab-case（如 `checkin.ts`）
- 根路由：`_app.ts` 聚合所有子路由

### 路由定义模式
```tsx
import { router, protectedProcedure } from '../trpc'
import { z } from 'zod'

export const checkinRouter = router({
  // 查询
  list: protectedProcedure
    .input(z.object({
      circleId: z.string(),
      skip: z.number().default(0),
      take: z.number().default(20),
    }))
    .query(async ({ input, ctx }) => {
      return ctx.prisma.checkin.findMany({
        where: { circleId: input.circleId, status: 'PUBLISHED', deletedAt: null },
        skip: input.skip,
        take: input.take,
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      })
    }),

  // 创建
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
})
```

### 命名约定
- 查询：动词（`list`, `get`, `find`, `search`）
- 创建：`create`
- 更新：`update`
- 删除：`delete` / `remove`
- 撤回：`withdraw`
- 登录：`login`
- 登出：`logout`

### 输入验证
- 所有 `input` 必须使用 zod schema
- 数字范围必须明确 `min` / `max`
- 字符串长度必须明确 `max`
- 可选字段使用 `.optional()`
- 必填字段默认 required

### 上下文（ctx）
```tsx
interface Context {
  user: User | null
  prisma: PrismaClient
  req: NextRequest
}
```

## 禁止事项
- 禁止在 input 中使用 `any`
- 禁止返回未过滤的完整模型（如 passwordHash）
- 禁止在路由中直接操作数据库（使用 service 层）
- 禁止返回内部错误详情给前端

## 关联规范
- [API路由尾部斜杠规范.md](./API路由尾部斜杠规范.md)
- [请求与响应结构规范.md](./请求与响应结构规范.md)
- [错误码规范.md](./错误码规范.md)
- [认证与权限规范.md](./认证与权限规范.md)

## 变更记录
| 日期 | 变更内容 | 修改人 |
|---|---|---|
| 2026-09-30 | 初始规范 | - |
