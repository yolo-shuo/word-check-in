'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useConfirm } from '@/components/confirm-dialog'
import { useState } from 'react'

const navItems = [
  { href: '/feed', label: '动态' },
  { href: '/checkin', label: '打卡' },
  { href: '/stats/profile', label: '统计' },
  { href: '/vocab', label: '词库' },
]

export function Navbar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const circleId = searchParams.get('circle')
  const { data: session, status } = useSession()
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)

  const { confirm: showConfirm, Dialog: ConfirmDialog } = useConfirm()

  const handleLogoutClick = () => {
    showConfirm({
      title: '确认退出登录？',
      description: '退出后需要重新登录才能访问你的数据和圈子。',
      confirmText: '退出登录',
      variant: 'destructive',
      onConfirm: async () => {
        await signOut({ redirect: false })
        window.location.href = '/login'
      },
    })
  }

  const withCircle = (href: string) => {
    if (circleId && href !== '/vocab') return `${href}?circle=${circleId}`
    return href
  }

  const isGuest = status === 'unauthenticated'

  return (
    <>
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href={withCircle('/feed')} className="flex items-center gap-2">
            <span className="text-lg font-bold text-primary">单词打卡</span>
            {isGuest && (
              <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800">
                游客模式
              </span>
            )}
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={withCircle(item.href)}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {status === 'authenticated' && session.user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {session.user.name || session.user.email}
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogoutClick}>
                退出登录
              </Button>
            </div>
          ) : status === 'unauthenticated' ? (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">登录</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">注册</Link>
              </Button>
            </div>
          ) : null}
        </div>
      </header>
      {ConfirmDialog}
    </>
  )
}
