import { router as createRouter, TRPCError } from '@trpc/server'
import { prisma } from './prisma'

export type Context = {
  user: any
  prisma: typeof prisma
  req: any
}

export const router = createRouter
