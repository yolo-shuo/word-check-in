'use client'

import { useMemo, useState } from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { createReactQueryHooks } from '@trpc/react'
import { httpBatchLink } from '@trpc/client/links/httpBatchLink'
import superjson from 'superjson'
import type { AppRouter } from '@/server/routers/_app'

// tRPC v9 React client: create base hooks, then wrap with proxy for namespaced access
const baseTrpc = createReactQueryHooks<AppRouter>()

// Cache for procedure hooks to avoid creating new objects on every access
const hookCache = new Map<string, any>()

// Cache for router proxies to avoid creating new proxies on every access
const routerCache = new Map<string, any>()

function getCachedHook(path: string) {
  if (!hookCache.has(path)) {
    hookCache.set(path, {
      useQuery: (input?: any, options?: any) => {
        return baseTrpc.useQuery([path, input], options)
      },
      useMutation: (options?: any) => {
        return baseTrpc.useMutation(path, options)
      },
    })
  }
  return hookCache.get(path)
}

function getCachedRouter(routerName: string) {
  if (!routerCache.has(routerName)) {
    routerCache.set(routerName, new Proxy({}, {
      get(_, procedureName: string) {
        return getCachedHook(routerName + '.' + procedureName)
      },
    }))
  }
  return routerCache.get(routerName)
}

// Export trpc object that supports namespaced access
// e.g., trpc.auth.register.useMutation()
export const trpc = new Proxy({}, {
  get(_, name: string) {
    if (name === 'useContext') {
      return () => baseTrpc.useContext()
    }
    if (name === 'useQueryClient') {
      return () => {
        const trpcClient = baseTrpc.useContext()
        return trpcClient.queryClient
      }
    }
    return getCachedRouter(name)
  },
})

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
      baseTrpc.createClient({
        links: [
          httpBatchLink({
            url: getBaseUrl() + '/api/trpc',
            transformer: superjson,
          }),
        ],
      }),
    [],
  )

  return (
    <QueryClientProvider client={queryClient}>
      <baseTrpc.Provider client={trpcClient} queryClient={queryClient}>
        {children}
      </baseTrpc.Provider>
    </QueryClientProvider>
  )
}
