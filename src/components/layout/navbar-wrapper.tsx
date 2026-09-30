'use client'

import { Suspense } from 'react'
import { Navbar } from '@/components/layout/navbar'
import { usePathname } from 'next/navigation'

function NavbarFallback() {
  return (
    <header className="sticky top-0 z-50 h-16 border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto h-full max-w-7xl px-4" />
    </header>
  )
}

export function NavbarWrapper() {
  const pathname = usePathname()

  // Hide Navbar on auth pages
  const isAuthPage = pathname === '/login' || pathname === '/register'

  if (isAuthPage) {
    return null
  }

  return (
    <Suspense fallback={<NavbarFallback />}>
      <Navbar />
    </Suspense>
  )
}
