import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { getServerSession } from 'next-auth/next'
import type { NextRequest } from 'next/server'

import { authOptions } from '@/server/auth'
import { appRouter } from '@/server/routers/_app'
import { prisma } from '@/server/prisma'
import type { Context } from '@/server/trpc'

export const runtime = 'nodejs'

async function createContext(req: NextRequest): Promise<Context> {
  const session = await getServerSession(authOptions)

  const user = session?.user
    ? {
        id: session.user.id as string,
        email: session.user.email as string,
        nickname: session.user.name || '',
        avatarUrl: session.user.image || null,
      }
    : null

  return {
    user,
    prisma,
    req: req as unknown as Context['req'],
  }
}

async function handler(req: NextRequest) {
  return fetchRequestHandler({
    req,
    router: appRouter,
    endpoint: '/api/trpc',
    createContext: async () => createContext(req),
  })
}


export async function GET(req: NextRequest) {
  return handler(req)
}

export async function POST(req: NextRequest) {
  return handler(req)
}
