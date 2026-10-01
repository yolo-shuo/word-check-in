import { z } from 'zod'
import { router, publicProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import { prisma } from '../prisma'

// 敏感词列表
const SENSITIVE_WORDS = ['垃圾', '傻子', '笨蛋', '混蛋', '去死', '滚', 'fuck', 'shit', 'bitch']

// 过滤敏感词
function filterSensitiveWords(text: string): string {
  let filtered = text
  for (const word of SENSITIVE_WORDS) {
    filtered = filtered.replace(new RegExp(word, 'gi'), '***')
  }
  return filtered
}

// 快捷激励消息
const QUICK_MESSAGES = [
  '今天也要加油哦！',
  '坚持就是胜利！',
  '你已经很棒了！',
  '一起努力吧！',
  '明天见！',
  '今天别断！',
  '连续打卡第N天啦！',
]

const getSettingsProcedure = publicProcedure
  .input(z.object({
    circleId: z.string(),
  }))
  .query(async ({ input, ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })
    }

    const settings = await prisma.circleDiscussionSettings.findUnique({
      where: { circleId: input.circleId },
    })

    return settings || {
      id: '',
      circleId: input.circleId,
      enabled: true,
      allowCheckinRef: true,
      allowWordRef: true,
      allowImages: true,
      allowGuestView: false,
      archiveAtMidnight: false,
      sensitiveWordFilter: true,
    }
  })

const updateSettingsProcedure = publicProcedure
  .input(z.object({
    circleId: z.string(),
    enabled: z.boolean().optional(),
    allowCheckinRef: z.boolean().optional(),
    allowWordRef: z.boolean().optional(),
    allowImages: z.boolean().optional(),
    allowGuestView: z.boolean().optional(),
    archiveAtMidnight: z.boolean().optional(),
    sensitiveWordFilter: z.boolean().optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })
    }

    const circle = await prisma.circle.findUnique({
      where: { id: input.circleId },
    })

    if (!circle || circle.ownerId !== ctx.user.id) {
      throw new TRPCError({ code: 'FORBIDDEN', message: '只有圈主可以修改设置' })
    }

    const settings = await prisma.circleDiscussionSettings.upsert({
      where: { circleId: input.circleId },
      update: {
        enabled: input.enabled,
        allowCheckinRef: input.allowCheckinRef,
        allowWordRef: input.allowWordRef,
        allowImages: input.allowImages,
        allowGuestView: input.allowGuestView,
        archiveAtMidnight: input.archiveAtMidnight,
        sensitiveWordFilter: input.sensitiveWordFilter,
      },
      create: {
        circleId: input.circleId,
        enabled: input.enabled ?? true,
        allowCheckinRef: input.allowCheckinRef ?? true,
        allowWordRef: input.allowWordRef ?? true,
        allowImages: input.allowImages ?? true,
        allowGuestView: input.allowGuestView ?? false,
        archiveAtMidnight: input.archiveAtMidnight ?? false,
        sensitiveWordFilter: input.sensitiveWordFilter ?? true,
      },
    })

    return settings
  })

const listProcedure = publicProcedure
  .input(z.object({
    circleId: z.string(),
    skip: z.number().default(0),
    take: z.number().default(50),
  }))
  .query(async ({ input, ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })
    }

    const member = await prisma.circleMember.findFirst({
      where: { circleId: input.circleId, userId: ctx.user.id, leftAt: null },
    })

    if (!member) {
      throw new TRPCError({ code: 'FORBIDDEN', message: '没有权限' })
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { circleId: input.circleId, isDeleted: false },
        orderBy: { createdAt: 'desc' },
        skip: input.skip,
        take: input.take,
        include: {
          user: { select: { nickname: true, avatarUrl: true } },
          checkin: { select: { id: true, wordCount: true, minutes: true, vocabVersion: { select: { name: true, level: true, version: true } } } },
          entry: { select: { id: true, term: true, phonetic: true, definition: true, wordType: true } },
          parent: { select: { id: true, content: true, user: { select: { nickname: true } } } },
        },
      }),
      prisma.message.count({ where: { circleId: input.circleId, isDeleted: false } }),
    ])

    return { messages, total }
  })

const sendProcedure = publicProcedure
  .input(z.object({
    circleId: z.string(),
    type: z.enum(['TEXT', 'IMAGE', 'CHECKIN', 'WORD', 'SYSTEM', 'MILESTONE', 'TIP', 'REPLY']).default('TEXT'),
    content: z.string().max(1000).optional(),
    imageUrl: z.string().optional(),
    checkinId: z.string().optional(),
    entryId: z.string().optional(),
    parentId: z.string().optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })
    }

    const member = await prisma.circleMember.findFirst({
      where: { circleId: input.circleId, userId: ctx.user.id, leftAt: null },
    })

    if (!member) {
      throw new TRPCError({ code: 'FORBIDDEN', message: '没有权限' })
    }

    if (member.mutedAt && input.type === 'TEXT') {
      throw new TRPCError({ code: 'FORBIDDEN', message: '你已被禁言，无法发送消息' })
    }

    const settings = await prisma.circleDiscussionSettings.findUnique({
      where: { circleId: input.circleId },
    })

    const allowCheckinRef = settings?.allowCheckinRef ?? true
    const allowWordRef = settings?.allowWordRef ?? true
    const allowImages = settings?.allowImages ?? true
    const sensitiveWordFilter = settings?.sensitiveWordFilter ?? true

    if (input.checkinId && !allowCheckinRef) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: '该圈子不允许引用打卡' })
    }

    if (input.entryId && !allowWordRef) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: '该圈子不允许引用单词' })
    }

    if (input.imageUrl && !allowImages) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: '该圈子不允许发送图片' })
    }

    let content = input.content
    if (content && sensitiveWordFilter) {
      content = filterSensitiveWords(content)
    }

    const message = await prisma.message.create({
      data: {
        circleId: input.circleId,
        userId: ctx.user.id,
        type: input.type,
        content,
        imageUrl: input.imageUrl,
        checkinId: input.checkinId,
        entryId: input.entryId,
        parentId: input.parentId,
      },
      include: {
        user: { select: { nickname: true, avatarUrl: true } },
      },
    })

    return message
  })

const deleteProcedure = publicProcedure
  .input(z.object({
    messageId: z.string(),
  }))
  .mutation(async ({ input, ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })
    }

    const message = await prisma.message.findUnique({
      where: { id: input.messageId },
    })

    if (!message || message.isDeleted) {
      throw new TRPCError({ code: 'NOT_FOUND', message: '消息不存在' })
    }

    if (message.userId !== ctx.user.id) {
      const circle = await prisma.circle.findUnique({
        where: { id: message.circleId },
      })

      if (!circle || circle.ownerId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: '没有权限删除' })
      }
    }

    const updated = await prisma.message.update({
      where: { id: input.messageId },
      data: { isDeleted: true, deletedAt: new Date() },
    })

    return updated
  })

const unreadCountProcedure = publicProcedure
  .input(z.object({
    circleId: z.string(),
  }))
  .query(async ({ input, ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })
    }

    const readRecord = await prisma.messageRead.findUnique({
      where: {
        circleId_userId: {
          circleId: input.circleId,
          userId: ctx.user.id,
        },
      },
    })

    if (!readRecord) {
      const total = await prisma.message.count({
        where: { circleId: input.circleId, isDeleted: false },
      })
      return { count: total }
    }

    const unreadCount = await prisma.message.count({
      where: {
        circleId: input.circleId,
        isDeleted: false,
        createdAt: { gt: readRecord.lastReadAt },
      },
    })

    return { count: unreadCount }
  })

const markReadProcedure = publicProcedure
  .input(z.object({
    circleId: z.string(),
    messageId: z.string().optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })
    }

    const updated = await prisma.messageRead.upsert({
      where: {
        circleId_userId: {
          circleId: input.circleId,
          userId: ctx.user.id,
        },
      },
      update: {
        lastReadId: input.messageId,
        lastReadAt: new Date(),
      },
      create: {
        circleId: input.circleId,
        userId: ctx.user.id,
        lastReadId: input.messageId,
        lastReadAt: new Date(),
      },
    })

    return updated
  })

const quickMessagesProcedure = publicProcedure
  .query(async () => {
    return QUICK_MESSAGES
  })

const getCheckinRefProcedure = publicProcedure
  .input(z.object({
    checkinId: z.string(),
  }))
  .query(async ({ input, ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })
    }

    const checkin = await prisma.checkin.findUnique({
      where: { id: input.checkinId },
      include: {
        user: { select: { nickname: true } },
        vocabVersion: { select: { name: true, level: true, version: true } },
      },
    })

    if (!checkin) {
      throw new TRPCError({ code: 'NOT_FOUND', message: '打卡不存在' })
    }

    return checkin
  })

const getWordRefProcedure = publicProcedure
  .input(z.object({
    entryId: z.string(),
  }))
  .query(async ({ input, ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })
    }

    const entry = await prisma.vocabEntry.findUnique({
      where: { id: input.entryId },
      include: {
        version: { select: { name: true, level: true } },
      },
    })

    if (!entry) {
      throw new TRPCError({ code: 'NOT_FOUND', message: '单词不存在' })
    }

    return entry
  })

export const discussionRouter = router({
  getSettings: getSettingsProcedure,
  updateSettings: updateSettingsProcedure,
  list: listProcedure,
  send: sendProcedure,
  delete: deleteProcedure,
  unreadCount: unreadCountProcedure,
  markRead: markReadProcedure,
  quickMessages: quickMessagesProcedure,
  getCheckinRef: getCheckinRefProcedure,
  getWordRef: getWordRefProcedure,
})
