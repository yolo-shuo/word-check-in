import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router } from '../trpc'
import { prisma } from '../prisma'

const createProcedure = {
  input: z.object({
    name: z.string().min(1, '请输入圈子名称').max(50, '圈子名称不能超过50个字符'),
    description: z.string().max(200).optional(),
    timezone: z.string().optional(),
    studyDirection: z.string().optional(),
    examType: z.string().optional(),
    circleType: z.enum(['PUBLIC', 'PRIVATE', 'INVITE_ONLY']).optional(),
    maxMembers: z.number().min(2).max(500).optional(),
    allowMemberInvite: z.boolean().optional(),
    allowLeaderboard: z.boolean().optional(),
  }),
  resolve: async ({ input, ctx }: any) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })
    }

    const circle = await ctx.prisma.circle.create({
      data: {
        name: input.name,
        description: input.description,
        timezone: input.timezone || 'Asia/Shanghai',
        studyDirection: input.studyDirection,
        examType: input.examType,
        circleType: input.circleType || 'PRIVATE',
        maxMembers: input.maxMembers || 50,
        allowMemberInvite: input.allowMemberInvite ?? true,
        allowLeaderboard: input.allowLeaderboard ?? true,
        ownerId: ctx.user.id,
      },
    })

    await ctx.prisma.circleMember.create({
      data: {
        circleId: circle.id,
        userId: ctx.user.id,
        role: 'OWNER',
      },
    })

    return { id: circle.id, name: circle.name }
  }
}

const updateProcedure = {
  input: z.object({
    circleId: z.string(),
    name: z.string().min(1).max(50).optional(),
    description: z.string().max(200).optional(),
    studyDirection: z.string().optional(),
    examType: z.string().optional(),
    circleType: z.enum(['PUBLIC', 'PRIVATE', 'INVITE_ONLY']).optional(),
    maxMembers: z.number().min(2).max(500).optional(),
    allowMemberInvite: z.boolean().optional(),
    allowLeaderboard: z.boolean().optional(),
  }),
  resolve: async ({ input, ctx }: any) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })

    await assertCircleOwner(ctx, input.circleId)

    const { circleId, ...data } = input
    const updated = await ctx.prisma.circle.update({
      where: { id: circleId },
      data,
    })

    return { id: updated.id, name: updated.name }
  }
}

const joinProcedure = {
  input: z.object({
    inviteCode: z.string(),
  }),
  resolve: async ({ input, ctx }: any) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })
    }

    const invite = await ctx.prisma.inviteCode.findUnique({
      where: { code: input.inviteCode },
    })

    if (!invite) {
      throw new TRPCError({ code: 'NOT_FOUND', message: '邀请码无效' })
    }

    // Check if circle is at max capacity
    const circle = await ctx.prisma.circle.findUnique({ where: { id: invite.circleId } })
    if (circle) {
      const memberCount = await ctx.prisma.circleMember.count({
        where: { circleId: invite.circleId, leftAt: null },
      })
      if (memberCount >= circle.maxMembers) {
        throw new TRPCError({ code: 'CONFLICT', message: '圈子已满，无法加入' })
      }
    }

    // Check for existing membership
    const existing = await ctx.prisma.circleMember.findFirst({
      where: { circleId: invite.circleId, userId: ctx.user.id, leftAt: null },
    })
    if (existing) {
      throw new TRPCError({ code: 'CONFLICT', message: '你已经是该圈子的成员' })
    }

    await ctx.prisma.circleMember.create({
      data: {
        circleId: invite.circleId,
        userId: ctx.user.id,
        role: 'MEMBER',
      },
    })

    // Increment invite code usage
    await ctx.prisma.inviteCode.update({
      where: { id: invite.id },
      data: { usedCount: { increment: 1 } },
    })

    return { circleId: invite.circleId }
  }
}

const myCirclesProcedure = {
  resolve: async ({ ctx }: any) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })
    }

    const memberships = await ctx.prisma.circleMember.findMany({
      where: { userId: ctx.user.id, leftAt: null },
      include: {
        circle: { select: { id: true, name: true, timezone: true, ownerId: true, description: true, circleType: true } },
      },
    })

    return memberships.map((m) => ({
      ...m.circle,
      role: m.role,
      isOwner: m.circle.ownerId === ctx.user.id,
    }))
  }
}

const getProcedure = {
  input: z.object({
    circleId: z.string(),
  }),
  resolve: async ({ input, ctx }: any) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })
    }

    const member = await ctx.prisma.circleMember.findFirst({
      where: { circleId: input.circleId, userId: ctx.user.id, leftAt: null },
    })

    if (!member) {
      throw new TRPCError({ code: 'FORBIDDEN', message: '没有权限' })
    }

    const circle = await ctx.prisma.circle.findUnique({
      where: { id: input.circleId },
      include: {
        _count: { select: { members: { where: { leftAt: null } } } },
      },
    })

    return {
      ...circle,
      role: member.role,
      memberCount: circle._count.members,
    }
  }
}

const assertCircleOwner = async (ctx: any, circleId: string) => {
  const circle = await ctx.prisma.circle.findUnique({ where: { id: circleId } })
  if (!circle || circle.ownerId !== ctx.user.id) {
    throw new TRPCError({ code: 'FORBIDDEN', message: '没有权限，只有圈主可以执行此操作' })
  }
}

const assertCircleAdmin = async (ctx: any, circleId: string) => {
  const member = await ctx.prisma.circleMember.findFirst({
    where: { circleId, userId: ctx.user.id, leftAt: null },
  })
  if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
    throw new TRPCError({ code: 'FORBIDDEN', message: '没有权限，只有管理员可以执行此操作' })
  }
}

const listMembersProcedure = {
  input: z.object({ circleId: z.string() }),
  resolve: async ({ input, ctx }: any) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })

    const member = await ctx.prisma.circleMember.findFirst({
      where: { circleId: input.circleId, userId: ctx.user.id, leftAt: null },
    })
    if (!member) throw new TRPCError({ code: 'FORBIDDEN', message: '没有权限' })

    return ctx.prisma.circleMember.findMany({
      where: { circleId: input.circleId, leftAt: null },
      include: {
        user: { select: { id: true, nickname: true, avatarUrl: true } },
      },
      orderBy: { joinedAt: 'asc' },
    })
  },
}

const listInviteCodesProcedure = {
  input: z.object({ circleId: z.string() }),
  resolve: async ({ input, ctx }: any) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })

    const member = await ctx.prisma.circleMember.findFirst({
      where: { circleId: input.circleId, userId: ctx.user.id, leftAt: null },
    })
    if (!member) throw new TRPCError({ code: 'FORBIDDEN', message: '没有权限' })

    return ctx.prisma.inviteCode.findMany({
      where: { circleId: input.circleId },
      orderBy: { createdAt: 'desc' },
    })
  },
}

const createInviteCodeProcedure = {
  input: z.object({
    circleId: z.string(),
    maxUses: z.number().optional(),
    expiresAt: z.coerce.date().optional(),
  }),
  resolve: async ({ input, ctx }: any) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })

    const circle = await ctx.prisma.circle.findUnique({ where: { id: input.circleId } })
    if (!circle) throw new TRPCError({ code: 'NOT_FOUND', message: '圈子不存在' })

    const member = await ctx.prisma.circleMember.findFirst({
      where: { circleId: input.circleId, userId: ctx.user.id, leftAt: null },
    })
    if (!member) throw new TRPCError({ code: 'FORBIDDEN', message: '没有权限' })

    // Check if member is allowed to create invite codes
    if (!circle.allowMemberInvite && member.role !== 'OWNER') {
      throw new TRPCError({ code: 'FORBIDDEN', message: '该圈子不允许成员生成邀请码' })
    }

    // Generate a unique invite code
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]
    }

    let existing = await ctx.prisma.inviteCode.findUnique({ where: { code } })
    while (existing) {
      code = ''
      for (let i = 0; i < 6; i++) {
        code += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]
      }
      existing = await ctx.prisma.inviteCode.findUnique({ where: { code } })
    }

    return ctx.prisma.inviteCode.create({
      data: {
        circleId: input.circleId,
        code,
        maxUses: input.maxUses,
        expiresAt: input.expiresAt,
      },
    })
  },
}

const revokeInviteCodeProcedure = {
  input: z.object({
    circleId: z.string(),
    codeId: z.string(),
  }),
  resolve: async ({ input, ctx }: any) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })

    await assertCircleOwner(ctx, input.circleId)

    const code = await ctx.prisma.inviteCode.findUnique({ where: { id: input.codeId } })
    if (!code || code.circleId !== input.circleId) {
      throw new TRPCError({ code: 'NOT_FOUND', message: '邀请码不存在' })
    }

    return ctx.prisma.inviteCode.update({
      where: { id: input.codeId },
      data: { revokedAt: new Date() },
    })
  },
}

const removeMemberProcedure = {
  input: z.object({
    circleId: z.string(),
    userId: z.string(),
    reason: z.string().optional(),
  }),
  resolve: async ({ input, ctx }: any) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })

    await assertCircleAdmin(ctx, input.circleId)

    const member = await ctx.prisma.circleMember.findFirst({
      where: { circleId: input.circleId, userId: input.userId, leftAt: null },
    })
    if (!member) throw new TRPCError({ code: 'NOT_FOUND', message: '成员不存在' })

    if (member.role === 'OWNER') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: '不能移除圈主，请先转移所有权' })
    }

    await ctx.prisma.$transaction([
      ctx.prisma.circleMember.update({
        where: { id: member.id },
        data: { leftAt: new Date() },
      }),
      ctx.prisma.auditLog.create({
        data: {
          eventType: 'MEMBER_REMOVE',
          actorId: ctx.user.id,
          targetId: input.userId,
          targetTable: 'CircleMember',
          reason: input.reason,
          ipAddress: ctx.req?.ip,
        },
      }),
    ])

    return { id: member.id, leftAt: new Date() }
  },
}

const setAdminProcedure = {
  input: z.object({
    circleId: z.string(),
    userId: z.string(),
    isAdmin: z.boolean(),
  }),
  resolve: async ({ input, ctx }: any) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })

    await assertCircleOwner(ctx, input.circleId)

    const member = await ctx.prisma.circleMember.findFirst({
      where: { circleId: input.circleId, userId: input.userId, leftAt: null },
    })
    if (!member) throw new TRPCError({ code: 'NOT_FOUND', message: '成员不存在' })

    if (member.role === 'OWNER') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: '不能修改圈主角色' })
    }

    const newRole = input.isAdmin ? 'ADMIN' : 'MEMBER'

    const updated = await ctx.prisma.circleMember.update({
      where: { id: member.id },
      data: { role: newRole },
    })

    await ctx.prisma.auditLog.create({
      data: {
        eventType: 'MEMBER_ROLE_CHANGE',
        actorId: ctx.user.id,
        targetId: input.userId,
        targetTable: 'CircleMember',
        before: { role: member.role },
        after: { role: newRole },
        ipAddress: ctx.req?.ip,
      },
    })

    return updated
  },
}

const muteMemberProcedure = {
  input: z.object({
    circleId: z.string(),
    userId: z.string(),
    muted: z.boolean(),
  }),
  resolve: async ({ input, ctx }: any) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })

    await assertCircleAdmin(ctx, input.circleId)

    const member = await ctx.prisma.circleMember.findFirst({
      where: { circleId: input.circleId, userId: input.userId, leftAt: null },
    })
    if (!member) throw new TRPCError({ code: 'NOT_FOUND', message: '成员不存在' })

    if (member.role === 'OWNER') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: '不能禁言圈主' })
    }

    const updated = await ctx.prisma.circleMember.update({
      where: { id: member.id },
      data: { mutedAt: input.muted ? new Date() : null },
    })

    await ctx.prisma.auditLog.create({
      data: {
        eventType: input.muted ? 'MEMBER_MUTE' : 'MEMBER_UNMUTE',
        actorId: ctx.user.id,
        targetId: input.userId,
        targetTable: 'CircleMember',
        ipAddress: ctx.req?.ip,
      },
    })

    return updated
  },
}

const transferOwnerProcedure = {
  input: z.object({
    circleId: z.string(),
    newOwnerId: z.string(),
  }),
  resolve: async ({ input, ctx }: any) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })

    await assertCircleOwner(ctx, input.circleId)

    const newOwner = await ctx.prisma.circleMember.findFirst({
      where: { circleId: input.circleId, userId: input.newOwnerId, leftAt: null },
    })
    if (!newOwner) throw new TRPCError({ code: 'NOT_FOUND', message: '新所有者不在圈子中' })

    if (input.newOwnerId === ctx.user.id) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: '不能转移给自己' })
    }

    await ctx.prisma.$transaction([
      ctx.prisma.circle.update({
        where: { id: input.circleId },
        data: { ownerId: input.newOwnerId },
      }),
      ctx.prisma.circleMember.update({
        where: { id: newOwner.id },
        data: { role: 'OWNER' },
      }),
      ctx.prisma.circleMember.update({
        where: { circleId_userId: { circleId: input.circleId, userId: ctx.user.id } },
        data: { role: 'MEMBER' },
      }),
      ctx.prisma.auditLog.create({
        data: {
          eventType: 'OWNER_TRANSFER',
          actorId: ctx.user.id,
          targetId: input.newOwnerId,
          targetTable: 'Circle',
          after: { newOwnerId: input.newOwnerId },
          ipAddress: ctx.req?.ip,
        },
      }),
    ])

    return { success: true }
  },
}

const dissolveProcedure = {
  input: z.object({
    circleId: z.string(),
  }),
  resolve: async ({ input, ctx }: any) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })

    await assertCircleOwner(ctx, input.circleId)

    const circle = await ctx.prisma.circle.findUnique({ where: { id: input.circleId } })
    if (!circle) throw new TRPCError({ code: 'NOT_FOUND', message: '圈子不存在' })

    // Remove all members
    await ctx.prisma.circleMember.updateMany({
      where: { circleId: input.circleId, leftAt: null },
      data: { leftAt: new Date() },
    })

    // Mark circle as dissolved (soft delete)
    await ctx.prisma.circle.update({
      where: { id: input.circleId },
      data: {
        name: circle.name + ' (已解散)',
        allowMemberInvite: false,
      },
    })

    await ctx.prisma.auditLog.create({
      data: {
        eventType: 'CIRCLE_DISSOLVE',
        actorId: ctx.user.id,
        targetId: input.circleId,
        targetTable: 'Circle',
        ipAddress: ctx.req?.ip,
      },
    })

    return { success: true }
  },
}

const leaveProcedure = {
  input: z.object({ circleId: z.string() }),
  resolve: async ({ input, ctx }: any) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })

    const circle = await ctx.prisma.circle.findUnique({ where: { id: input.circleId } })
    if (!circle) throw new TRPCError({ code: 'NOT_FOUND', message: '圈子不存在' })

    if (circle.ownerId === ctx.user.id) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: '所有者不能退出圈子，请先转移所有权' })
    }

    const member = await ctx.prisma.circleMember.findFirst({
      where: { circleId: input.circleId, userId: ctx.user.id, leftAt: null },
    })
    if (!member) throw new TRPCError({ code: 'NOT_FOUND', message: '你已不在该圈子' })

    await ctx.prisma.$transaction([
      ctx.prisma.circleMember.update({
        where: { id: member.id },
        data: { leftAt: new Date() },
      }),
      ctx.prisma.auditLog.create({
        data: {
          eventType: 'MEMBER_LEAVE',
          actorId: ctx.user.id,
          targetId: ctx.user.id,
          targetTable: 'CircleMember',
          ipAddress: ctx.req?.ip,
        },
      }),
    ])

    return { left: true }
  },
}

export const circleRouter = router()
  .mutation('create', createProcedure)
  .mutation('update', updateProcedure)
  .mutation('join', joinProcedure)
  .query('myCircles', myCirclesProcedure)
  .query('get', getProcedure)
  .query('listMembers', listMembersProcedure)
  .query('listInviteCodes', listInviteCodesProcedure)
  .mutation('createInviteCode', createInviteCodeProcedure)
  .mutation('revokeInviteCode', revokeInviteCodeProcedure)
  .mutation('removeMember', removeMemberProcedure)
  .mutation('setAdmin', setAdminProcedure)
  .mutation('muteMember', muteMemberProcedure)
  .mutation('transferOwner', transferOwnerProcedure)
  .mutation('dissolve', dissolveProcedure)
  .mutation('leave', leaveProcedure)
