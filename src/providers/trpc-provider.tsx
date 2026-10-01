'use client'

import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createTRPCReact } from '@trpc/react-query'
import { httpBatchLink } from '@trpc/client'
import superjson from 'superjson'
import type { AppRouter } from '@/server/routers/_app'

export const trpc = createTRPCReact<AppRouter>()

function getBaseUrl() {
  if (typeof window !== 'undefined') return window.location.origin
  return process.env.NEXTAUTH_URL || 'http://localhost:3000'
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30 * 1000 },
        },
      }),
  )

  const trpcClient = trpc.createClient({
    links: [
      httpBatchLink({
        url: getBaseUrl() + '/api/trpc',
        transformer: superjson,
      }),
    ],
  })

  return (
    <QueryClientProvider client={queryClient}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        {children}
      </trpc.Provider>
    </QueryClientProvider>
  )
}
