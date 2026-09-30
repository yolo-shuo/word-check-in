import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router } from '../trpc'

const exportProfileProcedure = {
  input: z.object({
    format: z.enum(['JSON', 'CSV']).optional(),
  }),
  resolve: async ({ input, ctx }: any) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })

    const memberships = await ctx.prisma.circleMember.findMany({
      where: { userId: ctx.user.id, leftAt: null },
      include: {
        circle: { select: { id: true, name: true } },
      },
    })

    const allCheckins = await ctx.prisma.checkin.findMany({
      where: {
        userId: ctx.user.id,
        status: 'PUBLISHED',
        deletedAt: null,
      },
      include: {
        circle: { select: { name: true } },
        vocabVersion: { select: { name: true, level: true, version: true } },
      },
      orderBy: { date: 'desc' },
    })

    const data = {
      user: {
        id: ctx.user.id,
        nickname: ctx.user.nickname,
        email: ctx.user.email,
      },
      circles: memberships.map((m) => m.circle),
      checkins: allCheckins.map((c) => ({
        id: c.id,
        circleName: c.circle.name,
        vocabVersion: c.vocabVersion,
        wordCount: c.wordCount,
        minutes: c.minutes,
        note: c.note,
        date: c.date.toISOString().slice(0, 10),
        createdAt: c.createdAt.toISOString(),
      })),
      exportedAt: new Date().toISOString(),
    }

    if (input.format === 'CSV') {
      const header = 'id,circle,vocab,wordCount,minutes,date,note\n'
      const rows = allCheckins.map((c) =>
        [
          c.id,
          c.circle.name,
          `${c.vocabVersion.name} ${c.vocabVersion.level} v${c.vocabVersion.version}`,
          c.wordCount,
          c.minutes,
          c.date.toISOString().slice(0, 10),
          (c.note || '').replace(/"/g, '""'),
        ].join(',')
      ).join('\n')

      return { format: 'CSV', content: header + rows }
    }

    return { format: 'JSON', content: JSON.stringify(data, null, 2) }
  },
}

export const exportRouter = router()
  .query('exportProfile', exportProfileProcedure)
