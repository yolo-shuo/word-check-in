'use client'

import { useMemo, useState } from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { createTRPCReact } from '@trpc/react'
import { httpBatchLink } from '@trpc/client/links/httpBatchLink'
import superjson from 'superjson'
import type { AppRouter } from '@/server/routers/_app'

// Canonical tRPC v9 React client: typed, namespaced hooks.
//   trpc.auth.register.useMutation({ ... })
//   trpc.circle.listMembers.useQuery(input, { enabled })
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

  const trpcClient = useMemo(
    () =>
      trpc.createClient({
        transformer: superjson,
        links: [httpBatchLink({ url: getBaseUrl() + '/api/trpc' })],
      }),
    [],
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  )
}
