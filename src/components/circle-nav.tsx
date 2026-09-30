'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { trpc } from '@/providers/trpc-provider'
import { cn } from '@/lib/utils'

export function CircleNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const circleId = searchParams.get('circle')
  const { data: session } = useSession()

  const { data: circles } = trpc.circle.myCircles.useQuery(undefined, {
    enabled: !!session?.user
  })

  const currentCircle = circles?.find(c => c.id === circleId)

  if (!currentCircle) {
    return null
  }

  const navItems = [
    { href: '/feed', label: '动态', active: pathname === '/feed' },
    { href: '/checkin', label: '今日打卡', active: pathname === '/checkin' },
    { href: '/discussion', label: '讨论', active: pathname === '/discussion' },
    { href: '/members', label: '成员', active: pathname === '/members' },
    { href: '/settings/circle', label: '设置', active: pathname === '/settings/circle' },
  ]

  return (
    <div className="border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4">
        <span className="mb-2 mr-3 whitespace-nowrap rounded-md bg-primary/10 px-2 py-1 text-sm font-semibold text-primary">
          {currentCircle.name}
        </span>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={`${item.href}?circle=${circleId}`}
            className={cn(
              'mb-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors',
              item.active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
