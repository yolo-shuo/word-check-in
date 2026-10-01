'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const pathMap: Record<string, string> = {
  '/feed': '今日',
  '/checkin': '记录',
  '/discussion': '讨论',
  '/members': '搭子',
  '/stats/profile': '我的',
  '/stats/circle': '圈子统计',
  '/admin/audit': '审计日志',
  '/settings': '个人设置',
  '/settings/circle': '圈子设置',
  '/circle/create': '创建圈子',
  '/vocab': '资源',
  '/join': '加入圈子',
  '/notifications': '通知',
}

export function Breadcrumb() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const circleId = searchParams.get('circle')

  const items: { label: string; href?: string }[] = [{ label: '首页', href: '/feed' }]

  if (circleId) {
    items.push({ label: '圈子' })
  }

  // Add current page label
  const currentPath = pathname.split('/').filter(Boolean)[0] || ''
  const currentLabel = pathMap[`/${currentPath}`] || pathMap[pathname]
  if (currentLabel && currentLabel !== '首页') {
    items.push({ label: currentLabel })
  }

  // Special handling for sub-paths
  if (pathname.startsWith('/checkin/') && pathname !== '/checkin') {
    items.push({ label: '打卡详情' })
  }
  if (pathname.startsWith('/stats/')) {
    if (pathname.includes('profile')) items[items.length - 1] = { label: '个人统计' }
    if (pathname.includes('circle')) items[items.length - 1] = { label: '圈子统计' }
  }
  if (pathname.startsWith('/settings/')) {
    if (pathname.includes('circle')) items[items.length - 1] = { label: '圈子设置' }
    else items[items.length - 1] = { label: '个人设置' }
  }

  if (items.length <= 1) return null

  return (
    <nav aria-label="breadcrumb" className="border-b bg-background/50">
      <ol className="flex items-center gap-1 px-4 py-2 text-sm text-muted-foreground max-w-7xl mx-auto">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-center gap-1">
            {idx > 0 && <ChevronRight size={14} className="text-muted-foreground/50" />}
            {item.href ? (
              <Link href={item.href} className="hover:text-foreground transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-foreground">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
