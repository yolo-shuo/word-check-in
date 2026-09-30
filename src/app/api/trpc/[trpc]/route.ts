import { appRouter } from '@/server/routers/_app'
import { prisma } from '@/server/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { callProcedure } from '@trpc/server'
import { TRPCError } from '@trpc/server'
import { getServerSession } from 'next-auth/next'
import { cookies, headers } from 'next/headers'
import { authOptions } from '@/server/auth'
import superjson from 'superjson'

const TRPC_ERROR_TO_HTTP_STATUS: Record<string, number> = {
  PARSE_ERROR: 400,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  TIMEOUT: 408,
  CONFLICT: 409,
  CLIENT_CLOSED_REQUEST: 499,
  PRECONDITION_FAILED: 412,
  PAYLOAD_TOO_LARGE: 413,
  METHOD_NOT_SUPPORTED: 405,
}

const createContext = async (req: NextRequest) => {
  // Try cookies() first (App Router), fallback to req.headers
  let cookieGet: (name: string) => string | undefined
  try {
    const cookieStore = cookies()
    cookieGet = (name: string) => cookieStore.get(name)?.value
  } catch {
    // Fallback to req headers
    const cookieHeader = req.headers.get('cookie') || ''
    const cookieMap: Record<string, string> = {}
    cookieHeader.split('; ').forEach(c => {
      const [k, v] = c.split('=')
      if (k) cookieMap[k] = decodeURIComponent(v || '')
    })
    cookieGet = (name: string) => cookieMap[name]
  }
  
  const session = await getServerSession({
    cookies: {
      get: cookieGet,
    },
    ...authOptions,
  } as any)

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
    req,
  }
}

export async function GET(req: NextRequest) {
  return handleRequest(req, 'query')
}

export async function POST(req: NextRequest) {
  return handleRequest(req, 'mutation')
}

function deserializeInput(payload: unknown): unknown {
  if (payload && typeof payload === 'object' && 'json' in (payload as any)) {
    const data = payload as any
    if (!data.meta || !data.meta.values || data.meta.values.length === 0) {
      return data.json
    }
    return superjson.deserialize(data)
  }
  return payload
}

async function handleRequest(req: NextRequest, type: 'query' | 'mutation') {
  try {
    const url = new URL(req.url)
    const path = url.pathname.replace('/api/trpc/', '')
    const isBatch = url.searchParams.has('batch') && url.searchParams.get('batch') === '1'
    
    let parsedInput: any = undefined
    
    if (type === 'mutation') {
      const body = await req.json()
      parsedInput = body
    } else {
      const searchParams = url.searchParams
      if (searchParams.has('input')) {
        const inputJson = searchParams.get('input')!
        parsedInput = JSON.parse(inputJson)
      }
    }
    
    const ctx = await createContext(req)
    
    // Handle batched request
    if (isBatch && path.includes(',')) {
      const procedures = path.split(',')
      const results: any[] = []
      
      for (let i = 0; i < procedures.length; i++) {
        const procPath = procedures[i]
        let procInput: unknown = undefined
        
        if (parsedInput && typeof parsedInput === 'object') {
          const inputItem = parsedInput[i] || parsedInput[String(i)]
          if (inputItem) {
            procInput = deserializeInput(inputItem)
          }
        }
        
        try {
          const result = await callProcedure({
            path: procPath,
            input: procInput,
            router: appRouter,
            ctx,
            type,
          })
          const serialized = superjson.serialize(result)
          results.push({ result: { type: 'json', data: serialized } })
        } catch (error) {
          if (error instanceof TRPCError) {
            const httpStatus = TRPC_ERROR_TO_HTTP_STATUS[error.code] ?? 500
            results.push({ error: { message: error.message, code: error.code } })
          } else {
            console.error('Error in batch procedure', procPath, error)
            results.push({ error: { message: 'Internal Server Error', code: 'INTERNAL_SERVER_ERROR' } })
          }
        }
      }
      
      return NextResponse.json(results)
    }
    
    // Single request
    let input: unknown = undefined
    if (parsedInput !== undefined) {
      input = deserializeInput(parsedInput)
    }
    
    const result = await callProcedure({
      path,
      input,
      router: appRouter,
      ctx,
      type,
    })
    
    const serialized = superjson.serialize(result)
    return NextResponse.json({
      result: {
        type: 'json',
        data: serialized,
      },
    })
  } catch (error) {
    if (error instanceof TRPCError) {
      return NextResponse.json({
        error: { message: error.message, code: error.code },
      })
    }
    
    console.error('Unhandled error:', error)
    
    return NextResponse.json({
      error: { message: 'Internal Server Error', code: 'INTERNAL_SERVER_ERROR' },
    })
  }
}