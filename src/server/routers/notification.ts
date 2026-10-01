import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, publicProcedure } from '../trpc'

const listProcedure = publicProcedure
  .input(z.object({
    skip: z.number().default(0),
    take: z.number().default(20),
  }))
  .query(async ({ input, ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })

    return ctx.prisma.notification.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: 'desc' },
      skip: input.skip,
      take: input.take,
    })
  })

const unreadCountProcedure = publicProcedure
  .input(z.object({}).optional())
  .query(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })

    const count = await ctx.prisma.notification.count({
      where: { userId: ctx.user.id, isRead: false },
    })

    return { count }
  })

const markReadProcedure = publicProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ input, ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })

    return ctx.prisma.notification.update({
      where: { id: input.id },
      data: { isRead: true },
    })
  })

const markAllReadProcedure = publicProcedure
  .input(z.object({}).optional())
  .mutation(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })

    await ctx.prisma.notification.updateMany({
      where: { userId: ctx.user.id, isRead: false },
      data: { isRead: true },
    })

    return { ok: true }
  })

export const notificationRouter = router({
  list : listProcedure,
  unreadCount : unreadCountProcedure,
  markRead : markReadProcedure,
  markAllRead : markAllReadProcedure
})