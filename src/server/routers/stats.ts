import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, publicProcedure } from '../trpc'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, isAfter, isBefore } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

function getLocalDate(date: Date, timezone: string): string {
  const zonedDate = toZonedTime(date, timezone)
  return format(zonedDate, 'yyyy-MM-dd')
}

function calculateStreak(dates: Set<string>): number {
  if (dates.size === 0) return 0

  const sortedDates = [...dates].sort((a, b) => b.localeCompare(a))
  let streak = 1
  let currentDate = new Date(sortedDates[0] + 'T00:00:00.000Z')

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i] + 'T00:00:00.000Z')
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

const assertCircleMember = async (ctx: any, circleId: string) => {
  const member = await ctx.prisma.circleMember.findFirst({
    where: { circleId, userId: ctx.user.id, leftAt: null },
  })
  if (!member) {
    throw new TRPCError({ code: 'FORBIDDEN', message: '没有权限' })
  }
  return member
}

const profileProcedure = publicProcedure
  .input(z.object({ circleId: z.string() }))
  .query(async ({ input, ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })

    await assertCircleMember(ctx, input.circleId)

    const circle = await ctx.prisma.circle.findUnique({ where: { id: input.circleId } })
    const timezone = circle?.timezone || 'Asia/Shanghai'

    const checkins = await ctx.prisma.checkin.findMany({
      where: {
        circleId: input.circleId,
        userId: ctx.user.id,
        status: 'PUBLISHED',
        deletedAt: null,
      },
      select: {
        date: true,
        wordCount: true,
        minutes: true,
      },
    })

    const totalCheckins = checkins.length
    const totalWords = checkins.reduce((sum, c) => sum + c.wordCount, 0)
    const totalMinutes = checkins.reduce((sum, c) => sum + c.minutes, 0)

    const dateSet = new Set(checkins.map((c) => format(c.date, 'yyyy-MM-dd')))
    const currentStreak = calculateStreak(dateSet)

    // Calculate longest streak
    const sortedDates = [...dateSet].sort((a, b) => a.localeCompare(b))
    let longestStreak = 0
    let currentRun = 0
    let prevDateStr: string | null = null

    for (const dateStr of sortedDates) {
      if (prevDateStr) {
        const prev = new Date(prevDateStr + 'T00:00:00.000Z')
        const curr = new Date(dateStr + 'T00:00:00.000Z')
        const diff = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24))
        if (diff === 1) {
          currentRun++
        } else {
          currentRun = 1
        }
      } else {
        currentRun = 1
      }
      longestStreak = Math.max(longestStreak, currentRun)
      prevDateStr = dateStr
    }

    // Week checkins
    const now = new Date()
    const todayStr = getLocalDate(now, timezone)
    const zonedNow = toZonedTime(now, timezone)
    const weekStart = startOfWeek(zonedNow, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(zonedNow, { weekStartsOn: 1 })

    const weekCheckins = checkins.filter((c) => {
      const dateStr = format(c.date, 'yyyy-MM-dd')
      const weekStartStr = format(weekStart, 'yyyy-MM-dd')
      const weekEndStr = format(weekEnd, 'yyyy-MM-dd')
      return dateStr >= weekStartStr && dateStr <= weekEndStr
    }).length

    return {
      totalCheckins,
      totalWords,
      totalMinutes,
      currentStreak,
      longestStreak,
      weekCheckins,
    }
  })

const circleProcedure = publicProcedure
  .input(z.object({ circleId: z.string() }))
  .query(async ({ input, ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })

    await assertCircleMember(ctx, input.circleId)

    const circle = await ctx.prisma.circle.findUnique({ where: { id: input.circleId } })
    const timezone = circle?.timezone || 'Asia/Shanghai'

    const checkins = await ctx.prisma.checkin.findMany({
      where: {
        circleId: input.circleId,
        status: 'PUBLISHED',
        deletedAt: null,
      },
      select: {
        date: true,
        userId: true,
        wordCount: true,
        minutes: true,
      },
    })

    const totalCheckins = checkins.length
    const totalWords = checkins.reduce((sum, c) => sum + c.wordCount, 0)
    const totalMinutes = checkins.reduce((sum, c) => sum + c.minutes, 0)

    // Week stats per member
    const now = new Date()
    const zonedNow = toZonedTime(now, timezone)
    const weekStart = startOfWeek(zonedNow, { weekStartsOn: 1 })
    const weekStartStr = format(weekStart, 'yyyy-MM-dd')
    const weekEnd = endOfWeek(zonedNow, { weekStartsOn: 1 })
    const weekEndStr = format(weekEnd, 'yyyy-MM-dd')

    const todayStr = getLocalDate(now, timezone)

    const memberIds = new Set(checkins.map((c) => c.userId))

    const members = await ctx.prisma.circleMember.findMany({
      where: { circleId: input.circleId, leftAt: null },
      include: {
        user: { select: { id: true, nickname: true, avatarUrl: true } },
      },
    })

    const memberStats = await Promise.all(
      members.map(async (m) => {
        const userCheckins = checkins.filter((c) => c.userId === m.userId)
        const weekCheckins = userCheckins.filter((c) => {
          const dateStr = format(c.date, 'yyyy-MM-dd')
          return dateStr >= weekStartStr && dateStr <= weekEndStr
        })
        const weekWords = weekCheckins.reduce((sum, c) => sum + c.wordCount, 0)
        const hasCheckedToday = userCheckins.some((c) => format(c.date, 'yyyy-MM-dd') === todayStr)

        return {
          userId: m.userId,
          nickname: m.user.nickname,
          avatarUrl: m.user.avatarUrl,
          weekCheckins: weekCheckins.length,
          weekWords,
          hasCheckedToday,
        }
      })
    )

    const byCheckins = [...memberStats].sort((a, b) => b.weekCheckins - a.weekCheckins).slice(0, 10)
    const byWords = [...memberStats].sort((a, b) => b.weekWords - a.weekWords).slice(0, 10)

    return {
      totalCheckins,
      totalWords,
      totalMinutes,
      leaderboard: {
        byCheckins,
        byWords,
      },
      members: memberStats,
    }
  })

const calendarProcedure = publicProcedure
  .input(z.object({
    circleId: z.string(),
    year: z.number(),
    month: z.number().min(1).max(12),
  }))
  .query(async ({ input, ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })

    await assertCircleMember(ctx, input.circleId)

    const monthStart = new Date(input.year, input.month - 1, 1)
    const monthEnd = new Date(input.year, input.month, 0, 23, 59, 59)

    const checkins = await ctx.prisma.checkin.findMany({
      where: {
        circleId: input.circleId,
        userId: ctx.user.id,
        status: 'PUBLISHED',
        deletedAt: null,
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      select: { date: true },
    })

    return {
      checkins: checkins.map((c) => ({
        date: format(c.date, 'yyyy-MM-dd'),
      })),
    }
  })

export const statsRouter = router({
  profile : profileProcedure,
  circle : circleProcedure,
  calendar : calendarProcedure
})