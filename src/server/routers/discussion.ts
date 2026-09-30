import { z } from 'zod'
import { router } from '../trpc'
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

export const discussionRouter = router()
  // 获取讨论区设置
  .query('getSettings', {
    input: z.object({
      circleId: z.string(),
    }),
    resolve: async ({ input, ctx }) => {
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
    },
  })

  // 更新讨论区设置
  .mutation('updateSettings', {
    input: z.object({
      circleId: z.string(),
      enabled: z.boolean().optional(),
      allowCheckinRef: z.boolean().optional(),
      allowWordRef: z.boolean().optional(),
      allowImages: z.boolean().optional(),
      allowGuestView: z.boolean().optional(),
      archiveAtMidnight: z.boolean().optional(),
      sensitiveWordFilter: z.boolean().optional(),
    }),
    resolve: async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })
      }

      // 检查是否是圈主
      const circle = await prisma.circle.findUnique({
        where: { id: input.circleId },
      })

      if (!circle || circle.ownerId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: '只有圈主可以修改设置' })
      }

      // 更新或创建设置
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
    },
  })

  // 获取消息列表
  .query('list', {
    input: z.object({
      circleId: z.string(),
      skip: z.number().default(0),
      take: z.number().default(50),
    }),
    resolve: async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })
      }

      // 检查是否是圈子成员
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
    },
  })

  // 发送消息
  .mutation('send', {
    input: z.object({
      circleId: z.string(),
      type: z.enum(['TEXT', 'IMAGE', 'CHECKIN', 'WORD', 'SYSTEM', 'MILESTONE', 'TIP', 'REPLY']).default('TEXT'),
      content: z.string().max(1000).optional(),
      imageUrl: z.string().optional(),
      checkinId: z.string().optional(),
      entryId: z.string().optional(),
      parentId: z.string().optional(),
    }),
    resolve: async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })
      }

      // 检查是否是圈子成员
      const member = await prisma.circleMember.findFirst({
        where: { circleId: input.circleId, userId: ctx.user.id, leftAt: null },
      })

      if (!member) {
        throw new TRPCError({ code: 'FORBIDDEN', message: '没有权限' })
      }

      // 检查是否被禁言
      if (member.mutedAt && input.type === 'TEXT') {
        throw new TRPCError({ code: 'FORBIDDEN', message: '你已被禁言，无法发送消息' })
      }

      // 获取设置
      const settings = await prisma.circleDiscussionSettings.findUnique({
        where: { circleId: input.circleId },
      })

      const allowCheckinRef = settings?.allowCheckinRef ?? true
      const allowWordRef = settings?.allowWordRef ?? true
      const allowImages = settings?.allowImages ?? true
      const sensitiveWordFilter = settings?.sensitiveWordFilter ?? true

      // 验证引用权限
      if (input.checkinId && !allowCheckinRef) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: '该圈子不允许引用打卡' })
      }

      if (input.entryId && !allowWordRef) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: '该圈子不允许引用单词' })
      }

      if (input.imageUrl && !allowImages) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: '该圈子不允许发送图片' })
      }

      // 过滤敏感词
      let content = input.content
      if (content && sensitiveWordFilter) {
        content = filterSensitiveWords(content)
      }

      // 创建消息
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
    },
  })

  // 删除消息
  .mutation('delete', {
    input: z.object({
      messageId: z.string(),
    }),
    resolve: async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })
      }

      // 查找消息
      const message = await prisma.message.findUnique({
        where: { id: input.messageId },
      })

      if (!message || message.isDeleted) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '消息不存在' })
      }

      // 检查权限：只有作者或圈主可以删除
      if (message.userId !== ctx.user.id) {
        const circle = await prisma.circle.findUnique({
          where: { id: message.circleId },
        })

        if (!circle || circle.ownerId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: '没有权限删除' })
        }
      }

      // 软删除
      const updated = await prisma.message.update({
        where: { id: input.messageId },
        data: { isDeleted: true, deletedAt: new Date() },
      })

      return updated
    },
  })

  // 获取未读消息数量
  .query('unreadCount', {
    input: z.object({
      circleId: z.string(),
    }),
    resolve: async ({ input, ctx }) => {
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
        // 如果没有读记录，返回所有消息数量
        const total = await prisma.message.count({
          where: { circleId: input.circleId, isDeleted: false },
        })
        return { count: total }
      }

      // 计算未读数量
      const unreadCount = await prisma.message.count({
        where: {
          circleId: input.circleId,
          isDeleted: false,
          createdAt: { gt: readRecord.lastReadAt },
        },
      })

      return { count: unreadCount }
    },
  })

  // 标记已读
  .mutation('markRead', {
    input: z.object({
      circleId: z.string(),
      messageId: z.string().optional(),
    }),
    resolve: async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })
      }

      // 更新或创建已读记录
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
    },
  })

  // 获取快捷消息
  .query('quickMessages', {
    input: z.object({}).optional(),
    resolve: async ({ input }) => {
      return QUICK_MESSAGES
    },
  })

  // 获取引用打卡信息
  .query('getCheckinRef', {
    input: z.object({
      checkinId: z.string(),
    }),
    resolve: async ({ input, ctx }) => {
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
    },
  })

  // 获取引用单词信息
  .query('getWordRef', {
    input: z.object({
      entryId: z.string(),
    }),
    resolve: async ({ input, ctx }) => {
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
    },
  })