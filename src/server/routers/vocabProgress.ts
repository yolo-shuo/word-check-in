import { z } from 'zod'
import { router, publicProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'

// Helper to check if user is logged in
function requireUser(ctx: any) {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })
  }
  return ctx.user
}

// Get words due for review
const getDueWordsProcedure = publicProcedure
  .input(z.object({
    versionId: z.string().nullish(),
    take: z.number().default(20),
  }))
  .query(async ({ input, ctx }) => {
    requireUser(ctx)

    const words = await ctx.prisma.wordProgress.findMany({
      where: {
        userId: ctx.user!.id,
        mastery: { in: ['LEARNING', 'KNOWN', 'REVIEWING'] },
        nextReviewAt: { lte: new Date() },
        ...(input.versionId && {
          entry: { versionId: input.versionId }
        })
      },
      include: {
        entry: true
      },
      orderBy: { nextReviewAt: 'asc' },
      take: input.take,
    })

    return words
  })

// Get learning progress stats
const getProgressStatsProcedure = publicProcedure
  .input(z.object({
    versionId: z.string().nullish(),
  }))
  .query(async ({ input, ctx }) => {
    requireUser(ctx)

    const where = {
      userId: ctx.user!.id,
      ...(input.versionId && {
        entry: { versionId: input.versionId }
      })
    }

    const [totalWords, byMastery] = await Promise.all([
      ctx.prisma.wordProgress.count({ where }),
      ctx.prisma.wordProgress.groupBy({
        by: ['mastery'],
        where,
        _count: { _all: true }
      })
    ])

    const masteryStats: Record<string, number> = {}
    for (const group of byMastery) {
      masteryStats[group.mastery] = group._count._all
    }

    return { totalWords, masteryStats }
  })

// Review a word (update SM-2 algorithm)
const reviewWordProcedure = publicProcedure
  .input(z.object({
    entryId: z.string(),
    quality: z.number().min(0).max(5),
  }))
  .mutation(async ({ input, ctx }) => {
    requireUser(ctx)

    const { entryId, quality } = input

    let progress = await ctx.prisma.wordProgress.findUnique({
      where: {
        userId_entryId: {
          userId: ctx.user!.id,
          entryId
        }
      }
    })

    if (!progress) {
      progress = await ctx.prisma.wordProgress.create({
        data: {
          userId: ctx.user!.id,
          entryId,
          mastery: 'NEW'
        }
      })
    }

    let { easeFactor, interval, reviewCount, lapses, mastery } = progress

    if (quality < 3) {
      lapses += 1
      interval = 0
      mastery = 'LEARNING'
    } else {
      reviewCount += 1
      if (reviewCount === 1) {
        interval = 1
        mastery = 'LEARNING'
      } else if (reviewCount === 2) {
        interval = 6
        mastery = 'KNOWN'
      } else {
        interval = Math.floor(interval * easeFactor)
        if (reviewCount >= 5) {
          mastery = 'MASTERED'
        }
      }
    }

    easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))

    const nextReviewAt = interval > 0 ? new Date(Date.now() + interval * 24 * 60 * 60 * 1000) : null

    const updated = await ctx.prisma.wordProgress.update({
      where: { id: progress.id },
      data: {
        easeFactor,
        interval,
        reviewCount,
        lapses,
        mastery,
        nextReviewAt
      }
    })

    return updated
  })

// Mark word as mastered (manual override)
const markMasteredProcedure = publicProcedure
  .input(z.object({
    entryId: z.string(),
  }))
  .mutation(async ({ input, ctx }) => {
    requireUser(ctx)

    return await ctx.prisma.wordProgress.upsert({
      where: {
        userId_entryId: {
          userId: ctx.user!.id,
          entryId: input.entryId
        }
      },
      update: {
        mastery: 'MASTERED',
        nextReviewAt: null
      },
      create: {
        userId: ctx.user!.id,
        entryId: input.entryId,
        mastery: 'MASTERED'
      }
    })
  })

// Get review queue (words to review today)
const getReviewQueueProcedure = publicProcedure
  .input(z.object({
    versionId: z.string().nullish(),
    take: z.number().default(50),
  }))
  .query(async ({ input, ctx }) => {
    requireUser(ctx)

    const now = new Date()

    const words = await ctx.prisma.wordProgress.findMany({
      where: {
        userId: ctx.user!.id,
        mastery: { in: ['LEARNING', 'KNOWN', 'REVIEWING'] },
        nextReviewAt: { lte: now },
        ...(input.versionId && {
          entry: { versionId: input.versionId }
        })
      },
      include: {
        entry: true
      },
      orderBy: [{ nextReviewAt: 'asc' }, { reviewCount: 'asc' }],
      take: input.take,
    })

    return words
  })

// Get all words with progress for a version
const getWordsWithProgressProcedure = publicProcedure
  .input(z.object({
    versionId: z.string(),
    skip: z.number().default(0),
    take: z.number().default(50),
    mastery: z.enum(['NEW', 'LEARNING', 'KNOWN', 'MASTERED', 'REVIEWING']).optional(),
  }))
  .query(async ({ input, ctx }) => {
    requireUser(ctx)

    const [entries, total] = await Promise.all([
      ctx.prisma.vocabEntry.findMany({
        where: { versionId: input.versionId },
        orderBy: [{ frequency: 'desc' }, { orderIndex: 'asc' }],
        skip: input.skip,
        take: input.take,
        select: {
          id: true,
          term: true,
          phonetic: true,
          definition: true,
          example: true,
          exampleCn: true,
          wordType: true,
          frequency: true,
          level: true,
          orderIndex: true,
          progress: {
            where: { userId: ctx.user!.id },
            select: { mastery: true, reviewCount: true, nextReviewAt: true }
          }
        }
      }),
      ctx.prisma.vocabEntry.count({
        where: {
          versionId: input.versionId,
          ...(input.mastery && {
            progress: {
              some: {
                userId: ctx.user!.id,
                mastery: input.mastery
              }
            }
          })
        }
      })
    ])

    return { entries, total }
  })

export const vocabProgressRouter = router({
  getDueWords: getDueWordsProcedure,
  getProgressStats: getProgressStatsProcedure,
  getReviewQueue: getReviewQueueProcedure,
  getWordsWithProgress: getWordsWithProgressProcedure,
  reviewWord: reviewWordProcedure,
  markMastered: markMasteredProcedure,
})