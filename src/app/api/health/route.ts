import { NextResponse } from 'next/server'
import { prisma } from '@/server/prisma'
import { redis } from '@/server/redis'

export async function GET() {
  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`

    // Check Redis
    const redisPing = await redis.ping()

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      redis: redisPing === 'PONG' ? 'connected' : 'disconnected',
    })
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: 'Health check failed' },
      { status: 503 }
    )
  }
}
