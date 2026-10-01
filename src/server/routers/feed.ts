import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, publicProcedure } from '../trpc'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

function getLocalDate(date: Date, timezone: string): string {
  const zonedDate = toZonedTime(date, timezone)
  return format(zonedDate, 'yyyy-MM-dd')
}

const listProcedure = publicProcedure
  .input(z.object({
    circleId: z.string(),
    skip: z.number().default(0),
    take: z.number().default(20),
  }))
  .query(async ({ input, ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })

    // Check membership
    const member = await ctx.prisma.circleMember.findFirst({
      where: { circleId: input.circleId, userId: ctx.user.id, leftAt: null },
    })
    if (!member) {
      throw new TRPCError({ code: 'FORBIDDEN', message: '没有权限' })
    }

    const circle = await ctx.prisma.circle.findUnique({ where: { id: input.circleId } })
    const todayStr = circle ? getLocalDate(new Date(), circle.timezone) : getLocalDate(new Date(), 'Asia/Shanghai')

    const checkins = await ctx.prisma.checkin.findMany({
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
        likes: { select: { userId: true } },
        comments: { where: { deletedAt: null }, select: { id: true } },
      },
    })

    return checkins.map((c) => ({
      id: c.id,
      wordCount: c.wordCount,
      minutes: c.minutes,
      note: c.note,
      date: format(c.date, 'yyyy-MM-dd'),
      createdAt: c.createdAt,
      user: c.user,
      vocabVersion: c.vocabVersion,
      likeCount: c.likes.length,
      commentCount: c.comments.length,
      hasLiked: c.likes.some((l) => l.userId === ctx.user?.id),
      isToday: format(c.date, 'yyyy-MM-dd') === todayStr,
    }))
  })

const likeProcedure = publicProcedure
  .input(z.object({
    checkinId: z.string(),
  }))
  .mutation(async ({ input, ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })

    const checkin = await ctx.prisma.checkin.findUnique({
      where: { id: input.checkinId },
      include: { likes: { where: { userId: ctx.user.id } } },
    })

    if (!checkin) throw new TRPCError({ code: 'NOT_FOUND', message: '打卡不存在' })

    // Check membership
    const member = await ctx.prisma.circleMember.findFirst({
      where: { circleId: checkin.circleId, userId: ctx.user.id, leftAt: null },
    })
    if (!member) {
      throw new TRPCError({ code: 'FORBIDDEN', message: '没有权限' })
    }

    if (checkin.likes.length > 0) {
      // Unlike
      await ctx.prisma.like.deleteMany({
        where: { checkinId: input.checkinId, userId: ctx.user.id },
      })
    } else {
      // Like
      try {
        await ctx.prisma.like.create({
          data: { checkinId: input.checkinId, userId: ctx.user?.id },
        })
      } catch (e) {
        if (typeof e === 'object' && e !== null && 'code' in e && e.code === 'P2002') {
          // Already liked, unlike
          await ctx.prisma.like.deleteMany({
            where: { checkinId: input.checkinId, userId: ctx.user?.id },
          })
        } else {
          throw e
        }
      }
    }

    // Notify the checkin author
    if (checkin.userId !== ctx.user?.id) {
      await ctx.prisma.notification.create({
        data: {
          userId: checkin.userId,
          type: 'LIKE',
          title: '收到点赞',
          body: `${ctx.user.nickname || '用户'} 赞了你的打卡`,
        },
      })
    }

    return { ok: true }
  })

const addCommentProcedure = publicProcedure
  .input(z.object({
    checkinId: z.string(),
    content: z.string().min(1).max(500),
  }))
  .mutation(async ({ input, ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })

    const checkin = await ctx.prisma.checkin.findUnique({
      where: { id: input.checkinId },
    })

    if (!checkin) throw new TRPCError({ code: 'NOT_FOUND', message: '打卡不存在' })

    // Check membership
    const member = await ctx.prisma.circleMember.findFirst({
      where: { circleId: checkin.circleId, userId: ctx.user.id, leftAt: null },
    })
    if (!member) {
      throw new TRPCError({ code: 'FORBIDDEN', message: '没有权限' })
    }

    const comment = await ctx.prisma.comment.create({
      data: {
        checkinId: input.checkinId,
        userId: ctx.user.id,
        content: input.content,
      },
      include: {
        user: { select: { nickname: true, avatarUrl: true } },
      },
    })

    // Notify the checkin author
    if (checkin.userId !== ctx.user.id) {
      await ctx.prisma.notification.create({
        data: {
          userId: checkin.userId,
          type: 'COMMENT',
          title: '收到评论',
          body: `${ctx.user.nickname || '用户'} 评论了你的打卡`,
        },
      })
    }

    return comment
  })

export const feedRouter = router({
  list : listProcedure,
  like : likeProcedure,
  addComment : addCommentProcedure
})