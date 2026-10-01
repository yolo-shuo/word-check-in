import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, publicProcedure } from '../trpc'

const listVersionsProcedure = publicProcedure
  .input(z.object({
    level: z.enum(['CET4', 'CET6', 'COMBINED', 'CUSTOM']).optional(),
    isActive: z.boolean().default(true),
  }))
  .query(async ({ input, ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })
    }

    const versions = await ctx.prisma.vocabVersion.findMany({
      where: {
        ...(input.level && { level: input.level }),
        isActive: input.isActive ?? true,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { entries: true } }
      }
    })

    return versions
  })

const getEntriesProcedure = publicProcedure
  .input(z.object({
    versionId: z.string(),
    skip: z.number().default(0),
    take: z.number().default(50),
  }))
  .query(async ({ input, ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })
    }

    const [entries, total] = await Promise.all([
      ctx.prisma.vocabEntry.findMany({
        where: { versionId: input.versionId },
        orderBy: [{ frequency: 'desc' }, { orderIndex: 'asc' }],
        skip: input.skip,
        take: input.take,
      }),
      ctx.prisma.vocabEntry.count({
        where: { versionId: input.versionId },
      }),
    ])

    return { entries, total }
  })

const searchProcedure = publicProcedure
  .input(z.object({
    term: z.string(),
    level: z.enum(['CET4', 'CET6', 'COMBINED', 'CUSTOM']).optional(),
    skip: z.number().default(0),
    take: z.number().default(50),
  }))
  .query(async ({ input, ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })
    }

    const [entries, total] = await Promise.all([
      ctx.prisma.vocabEntry.findMany({
        where: {
          term: input.term ? { startsWith: input.term.toLowerCase(), mode: 'insensitive' as const } : undefined,
          ...(input.level && { version: { level: input.level } }),
        },
        orderBy: [{ frequency: 'desc' }, { term: 'asc' }],
        skip: input.skip,
        take: input.take,
      }),
      ctx.prisma.vocabEntry.count({
        where: {
          term: input.term ? { startsWith: input.term.toLowerCase(), mode: 'insensitive' as const } : undefined,
          ...(input.level && { version: { level: input.level } }),
        },
      }),
    ])

    return { entries, total }
  })

export const vocabRouter = router({
  listVersions: listVersionsProcedure,
  getEntries: getEntriesProcedure,
  search: searchProcedure,
})