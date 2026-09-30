'use client'

import { TRPCProvider } from './trpc-provider'
import { NextAuthProvider } from './session-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthProvider>
      <TRPCProvider>{children}</TRPCProvider>
    </NextAuthProvider>
  )
}
