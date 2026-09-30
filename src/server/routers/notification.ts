import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router } from '../trpc'

const listProcedure = {
  input: z.object({
    skip: z.number().default(0),
    take: z.number().default(20),
  }),
  resolve: async ({ input, ctx }: any) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })

    return ctx.prisma.notification.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: 'desc' },
      skip: input.skip,
      take: input.take,
    })
  },
}

const unreadCountProcedure = {
  input: z.object({}).optional(),
  resolve: async ({ ctx }: any) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })

    const count = await ctx.prisma.notification.count({
      where: { userId: ctx.user.id, isRead: false },
    })

    return { count }
  },
}

const markReadProcedure = {
  input: z.object({ id: z.string() }),
  resolve: async ({ input, ctx }: any) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })

    return ctx.prisma.notification.update({
      where: { id: input.id },
      data: { isRead: true },
    })
  },
}

const markAllReadProcedure = {
  input: z.object({}).optional(),
  resolve: async ({ ctx }: any) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })

    await ctx.prisma.notification.updateMany({
      where: { userId: ctx.user.id, isRead: false },
      data: { isRead: true },
    })

    return { ok: true }
  },
}

export const notificationRouter = router()
  .query('list', listProcedure)
  .query('unreadCount', unreadCountProcedure)
  .mutation('markRead', markReadProcedure)
  .mutation('markAllRead', markAllReadProcedure)
