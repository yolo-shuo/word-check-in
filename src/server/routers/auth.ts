import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router } from '../trpc'
import argon2 from 'argon2'

const registerProcedure = {
  input: z.object({
    email: z.string().email('请输入有效的邮箱地址'),
    nickname: z.string().min(1, '请输入昵称').max(20, '昵称不能超过20个字符'),
    password: z.string().min(10, '密码至少10个字符'),
  }),
  resolve: async ({ input, ctx }: any) => {
    const existing = await ctx.prisma.user.findUnique({
      where: { email: input.email },
    })
    if (existing) {
      throw new TRPCError({ code: 'CONFLICT', message: '该邮箱已被注册' })
    }

    const passwordHash = await argon2.hash(input.password)

    const user = await ctx.prisma.user.create({
      data: {
        email: input.email,
        nickname: input.nickname,
        passwordHash,
      },
    })

    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
    }
  }
}

const meProcedure = {
  resolve: async ({ ctx }: any) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })
    }
    return {
      id: ctx.user.id,
      email: ctx.user.email,
      nickname: ctx.user.nickname,
      avatarUrl: ctx.user.avatarUrl,
    }
  }
}

const updateProfileProcedure = {
  input: z.object({
    nickname: z.string().min(1).max(20).optional(),
    avatarUrl: z.string().url().optional(),
  }),
  resolve: async ({ input, ctx }: any) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })
    }
    const updatedUser = await ctx.prisma.user.update({
      where: { id: ctx.user.id },
      data: {
        ...(input.nickname && { nickname: input.nickname }),
        ...(input.avatarUrl && { avatarUrl: input.avatarUrl }),
      },
    })

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      nickname: updatedUser.nickname,
      avatarUrl: updatedUser.avatarUrl,
    }
  }
}

const deactivateProcedure = {
  resolve: async ({ ctx }: any) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })
    }

    const ownedCircles = await ctx.prisma.circle.findMany({
      where: { ownerId: ctx.user.id },
    })

    if (ownedCircles.length > 0) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: '请先转移所有圈子的所有者权限',
      })
    }

    await ctx.prisma.user.update({
      where: { id: ctx.user.id },
      data: {
        status: 'DEACTIVATED',
        deletedAt: new Date(),
      },
    })

    await ctx.prisma.auditLog.create({
      data: {
        eventType: 'ACCOUNT_DEACTIVATED',
        actorId: ctx.user.id,
        targetId: ctx.user.id,
        targetTable: 'User',
      },
    })

    return { success: true }
  }
}

const changePasswordProcedure = {
  input: z.object({
    oldPassword: z.string().min(1, '请输入当前密码'),
    newPassword: z.string().min(10, '新密码至少10个字符').max(100, '密码不能超过100个字符'),
  }),
  resolve: async ({ input, ctx }: any) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })
    }

    const user = await ctx.prisma.user.findUnique({ where: { id: ctx.user.id } })
    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: '用户不存在' })
    }

    // Verify old password
    const isPasswordValid = await argon2.verify(user.passwordHash, input.oldPassword)
    if (!isPasswordValid) {
      throw new TRPCError({ code: 'FORBIDDEN', message: '当前密码不正确' })
    }

    // Hash new password
    const passwordHash = await argon2.hash(input.newPassword)

    await ctx.prisma.$transaction([
      ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: { passwordHash },
      }),
      ctx.prisma.auditLog.create({
        data: {
          eventType: 'PASSWORD_RESET',
          actorId: ctx.user.id,
          targetId: ctx.user.id,
          targetTable: 'User',
          ipAddress: ctx.req?.ip,
        },
      }),
    ])

    return { success: true }
  }
}

const updateProfileExtendedProcedure = {
  input: z.object({
    nickname: z.string().min(1).max(20).optional(),
    avatarUrl: z.string().url().optional(),
    phone: z.string().optional(),
  }),
  resolve: async ({ input, ctx }: any) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' })
    }
    const updatedUser = await ctx.prisma.user.update({
      where: { id: ctx.user.id },
      data: {
        ...(input.nickname && { nickname: input.nickname }),
        ...(input.avatarUrl && { avatarUrl: input.avatarUrl }),
        ...(input.phone && { phone: input.phone }),
      },
    })

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      nickname: updatedUser.nickname,
      avatarUrl: updatedUser.avatarUrl,
    }
  }
}

export const authRouter = router()
  .mutation('register', registerProcedure)
  .query('me', meProcedure)
  .mutation('updateProfile', updateProfileProcedure)
  .mutation('updateProfileExtended', updateProfileExtendedProcedure)
  .mutation('changePassword', changePasswordProcedure)
  .mutation('deactivate', deactivateProcedure)