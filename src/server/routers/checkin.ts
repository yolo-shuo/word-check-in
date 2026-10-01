import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, publicProcedure } from '../trpc'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

function getLocalDate(date: Date, timezone: string): string {
  const zonedDate = toZonedTime(date, timezone)
  return format(zonedDate, 'yyyy-MM-dd')
}

const assertCircleMember = async (ctx: any, circleId: string) => {
  const member = await ctx.prisma.circleMember.findFirst({
    where: { circleId, userId: ctx.user.id, leftAt: null },
  })
  if (!member) {
    throw new TRPCError({ code: 'FORBIDDEN', message: '没有权限' })
  }
  return member
}

const createProcedure = publicProcedure
  .input(z.object({
    circleId: z.string(),
    vocabVersionId: z.string(),
    wordCount: z.number().min(1).max(2000),
    minutes: z.number().min(1).max(720),
    note: z.string().max(300).optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })

    await assertCircleMember(ctx, input.circleId)

    const circle = await ctx.prisma.circle.findUnique({ where: { id: input.circleId } })
    if (!circle) throw new TRPCError({ code: 'NOT_FOUND', message: '圈子不存在' })

    const todayStr = getLocalDate(new Date(), circle.timezone)
    const today = new Date(todayStr + 'T00:00:00.000Z')

    // Check for existing published checkin today
    const existing = await ctx.prisma.checkin.findFirst({
      where: {
        circleId: input.circleId,
        userId: ctx.user.id,
        date: today,
        status: 'PUBLISHED',
        deletedAt: null,
      },
    })
    if (existing) {
      throw new TRPCError({ code: 'CONFLICT', message: '今天已经打过卡了' })
    }

    // Check for existing withdrawn checkin today - update it instead of creating new
    const withdrawn = await ctx.prisma.checkin.findFirst({
      where: {
        circleId: input.circleId,
        userId: ctx.user.id,
        date: today,
        status: 'WITHDRAWN',
        deletedAt: null,
      },
    })
    if (withdrawn) {
      const updated = await ctx.prisma.checkin.update({
        where: { id: withdrawn.id },
        data: {
          wordCount: input.wordCount,
          minutes: input.minutes,
          note: input.note,
          vocabVersionId: input.vocabVersionId,
          status: 'PUBLISHED',
          withdrawnAt: null,
        },
        include: {
          user: { select: { nickname: true, avatarUrl: true } },
          vocabVersion: { select: { name: true, level: true, version: true } },
        },
      })

      await ctx.prisma.checkinDraft.deleteMany({
        where: { circleId: input.circleId, userId: ctx.user.id },
      })

      return updated
    }

    try {
      const checkin = await ctx.prisma.checkin.create({
        data: {
          circleId: input.circleId,
          userId: ctx.user.id,
          vocabVersionId: input.vocabVersionId,
          wordCount: input.wordCount,
          minutes: input.minutes,
          note: input.note,
          date: today,
          status: 'PUBLISHED',
        },
        include: {
          user: { select: { nickname: true, avatarUrl: true } },
          vocabVersion: { select: { name: true, level: true, version: true } },
        },
      })

      // Delete draft if exists
      await ctx.prisma.checkinDraft.deleteMany({
        where: { circleId: input.circleId, userId: ctx.user.id },
      })

      // Audit log
      await ctx.prisma.auditLog.create({
        data: {
          eventType: 'CHECKIN_CREATE',
          actorId: ctx.user.id,
          targetId: null,
          targetTable: 'Checkin',
          after: { checkinId: checkin.id, wordCount: input.wordCount, minutes: input.minutes },
          ipAddress: ctx.req?.ip,
        },
      })

      return checkin
    } catch (e) {
      if (e instanceof TRPCError) throw e
      if (typeof e === 'object' && e !== null && 'code' in e && e.code === 'P2002') {
        throw new TRPCError({ code: 'CONFLICT', message: '今天已经打过卡了' })
      }
      throw e
    }
  })

const getTodayProcedure = publicProcedure
  .input(z.object({ circleId: z.string() }))
  .query(async ({ input, ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })

    const circle = await ctx.prisma.circle.findUnique({ where: { id: input.circleId } })
    if (!circle) throw new TRPCError({ code: 'NOT_FOUND', message: '圈子不存在' })

    const todayStr = getLocalDate(new Date(), circle.timezone)
    const today = new Date(todayStr + 'T00:00:00.000Z')

    const checkin = await ctx.prisma.checkin.findFirst({
      where: {
        circleId: input.circleId,
        userId: ctx.user.id,
        date: today,
        deletedAt: null,
      },
      include: {
        user: { select: { nickname: true, avatarUrl: true } },
        vocabVersion: { select: { name: true, level: true, version: true } },
      },
    })

    return {
      hasCheckin: checkin?.status === 'PUBLISHED',
      hasWithdrawn: checkin?.status === 'WITHDRAWN',
      checkin: checkin?.status === 'PUBLISHED' ? checkin : null,
    }
  })

const saveDraftProcedure = publicProcedure
  .input(z.object({
    circleId: z.string(),
    vocabVersionId: z.string().optional(),
    wordCount: z.number().min(1).max(2000).optional(),
    minutes: z.number().min(1).max(720).optional(),
    note: z.string().max(300).optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })

    await assertCircleMember(ctx, input.circleId)

    const draft = await ctx.prisma.checkinDraft.upsert({
      where: {
        circleId_userId: { circleId: input.circleId, userId: ctx.user.id },
      },
      update: {
        vocabVersionId: input.vocabVersionId,
        wordCount: input.wordCount,
        minutes: input.minutes,
        note: input.note,
      },
      create: {
        circleId: input.circleId,
        userId: ctx.user.id,
        vocabVersionId: input.vocabVersionId,
        wordCount: input.wordCount,
        minutes: input.minutes,
        note: input.note,
      },
    })

    return draft
  })

const getDraftProcedure = publicProcedure
  .input(z.object({ circleId: z.string() }))
  .query(async ({ input, ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })

    const draft = await ctx.prisma.checkinDraft.findUnique({
      where: {
        circleId_userId: { circleId: input.circleId, userId: ctx.user.id },
      },
    })

    return draft
  })

const getProcedure = publicProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ input, ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })

    const checkin = await ctx.prisma.checkin.findUnique({
      where: { id: input.id },
      include: {
        user: { select: { nickname: true, avatarUrl: true } },
        vocabVersion: { select: { name: true, level: true, version: true } },
        likes: { include: { user: { select: { nickname: true, avatarUrl: true } } } },
        edits: { orderBy: { createdAt: 'desc' } },
        comments: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
          include: { user: { select: { nickname: true, avatarUrl: true } } },
        },
      },
    })

    if (!checkin) throw new TRPCError({ code: 'NOT_FOUND', message: '打卡不存在' })

    const hasLiked = checkin.likes.some((l) => l.userId === ctx.user?.id)

    return {
      ...checkin,
      hasLiked,
      likeCount: checkin.likes.length,
      commentCount: checkin.comments.length,
    }
  })

const listProcedure = publicProcedure
  .input(z.object({
    circleId: z.string(),
    skip: z.number().default(0),
    take: z.number().default(20),
  }))
  .query(async ({ input, ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })

    await assertCircleMember(ctx, input.circleId)

    return ctx.prisma.checkin.findMany({
      where: {
        circleId: input.circleId,
        status: 'PUBLISHED',
        deletedAt: null,
      },
      skip: input.skip,
      take: input.take,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      include: {
        user: { select: { nickname: true, avatarUrl: true } },
        vocabVersion: { select: { name: true, level: true, version: true } },
      },
    })
  })

const updateProcedure = publicProcedure
  .input(z.object({
    id: z.string(),
    wordCount: z.number().min(1).max(2000).optional(),
    minutes: z.number().min(1).max(720).optional(),
    note: z.string().max(300).optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })

    const checkin = await ctx.prisma.checkin.findUnique({ where: { id: input.id } })
    if (!checkin) throw new TRPCError({ code: 'NOT_FOUND', message: '打卡不存在' })
    if (checkin.userId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN', message: '没有权限' })
    if (checkin.status === 'WITHDRAWN') throw new TRPCError({ code: 'BAD_REQUEST', message: '已撤回的打卡无法编辑' })

    const edits: any[] = []
    if (input.wordCount !== undefined && input.wordCount !== checkin.wordCount) {
      edits.push({
        checkinId: checkin.id,
        userId: ctx.user.id,
        field: 'wordCount',
        oldValue: String(checkin.wordCount),
        newValue: String(input.wordCount),
      })
    }
    if (input.minutes !== undefined && input.minutes !== checkin.minutes) {
      edits.push({
        checkinId: checkin.id,
        userId: ctx.user.id,
        field: 'minutes',
        oldValue: String(checkin.minutes),
        newValue: String(input.minutes),
      })
    }
    if (input.note !== undefined && input.note !== checkin.note) {
      edits.push({
        checkinId: checkin.id,
        userId: ctx.user.id,
        field: 'note',
        oldValue: checkin.note,
        newValue: input.note,
      })
    }

    await ctx.prisma.$transaction([
      ctx.prisma.checkin.update({
        where: { id: input.id },
        data: {
          wordCount: input.wordCount ?? checkin.wordCount,
          minutes: input.minutes ?? checkin.minutes,
          note: input.note ?? checkin.note,
        },
      }),
      ...edits.map((e) => ctx.prisma.checkinEdit.create({ data: e })),
    ])

    await ctx.prisma.auditLog.create({
      data: {
        eventType: 'CHECKIN_EDIT',
        actorId: ctx.user.id,
        targetId: null,
        targetTable: 'Checkin',
        before: { checkinId: checkin.id, wordCount: checkin.wordCount, minutes: checkin.minutes, note: checkin.note },
        after: { checkinId: checkin.id, wordCount: input.wordCount, minutes: input.minutes, note: input.note },
        ipAddress: ctx.req?.ip,
      },
    })

    return ctx.prisma.checkin.findUnique({
      where: { id: input.id },
      include: {
        user: { select: { nickname: true, avatarUrl: true } },
        vocabVersion: { select: { name: true, level: true, version: true } },
        likes: true,
        edits: { orderBy: { createdAt: 'desc' } },
        comments: true,
      },
    })
  })

const withdrawProcedure = publicProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ input, ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })

    const checkin = await ctx.prisma.checkin.findUnique({ where: { id: input.id } })
    if (!checkin) throw new TRPCError({ code: 'NOT_FOUND', message: '打卡不存在' })
    if (checkin.userId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN', message: '没有权限' })

    await ctx.prisma.$transaction([
      ctx.prisma.checkin.update({
        where: { id: input.id },
        data: { status: 'WITHDRAWN', withdrawnAt: new Date() },
      }),
    ])

    await ctx.prisma.auditLog.create({
      data: {
        eventType: 'CHECKIN_WITHDRAW',
        actorId: ctx.user.id,
        targetId: null,
        targetTable: 'Checkin',
        before: { checkinId: checkin.id, status: checkin.status },
        after: { checkinId: checkin.id, status: 'WITHDRAWN' },
        ipAddress: ctx.req?.ip,
      },
    })

    return { id: checkin.id, status: 'WITHDRAWN' }
  })

export const checkinRouter = router({
  create : createProcedure,
  getToday : getTodayProcedure,
  saveDraft : saveDraftProcedure,
  getDraft : getDraftProcedure,
  get : getProcedure,
  list : listProcedure,
  update : updateProcedure,
  withdraw : withdrawProcedure
})