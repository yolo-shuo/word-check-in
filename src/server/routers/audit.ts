import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, publicProcedure } from '../trpc'

const listProcedure = publicProcedure
  .input(z.object({
    circleId: z.string(),
    skip: z.number().default(0),
    take: z.number().default(100),
  }))
  .query(async ({ input, ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })

    const member = await ctx.prisma.circleMember.findFirst({
      where: { circleId: input.circleId, userId: ctx.user.id, leftAt: null },
    })
    if (!member) throw new TRPCError({ code: 'FORBIDDEN', message: '没有权限' })

    const circleMembers = await ctx.prisma.circleMember.findMany({
      where: { circleId: input.circleId, leftAt: null },
      select: { userId: true },
    })
    const memberIds = circleMembers.map((m) => m.userId)

    const logs = await ctx.prisma.auditLog.findMany({
      where: {
        OR: [
          { actorId: { in: memberIds } },
          { targetId: { in: memberIds } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      skip: input.skip,
      take: input.take,
      include: {
        actor: { select: { id: true, nickname: true } },
        target: { select: { id: true, nickname: true } },
      },
    })

    return logs
  })

export const auditRouter = router({
  list: listProcedure,
})
