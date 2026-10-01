import { initTRPC } from '@trpc/server'
import superjson from 'superjson'
import type { NextRequest } from 'next/server'
import { prisma } from './prisma'

/** 登录用户的精简信息（不含 passwordHash 等敏感字段） */
export type SessionUser = {
  id: string
  email: string
  nickname: string
  avatarUrl: string | null
}

export type Context = {
  user: SessionUser | null
  prisma: typeof prisma
  req: NextRequest
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
})


export const router = t.router
export const publicProcedure = t.procedure
