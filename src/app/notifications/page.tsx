'use client'

import { trpc } from '@/providers/trpc-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'

import { getRelativeTime } from '@/lib/utils'

const typeMap: Record<string, string> = {
  LIKE: '👍 点赞',
  COMMENT: '💬 评论',
  INVITE: '📨 邀请',
  JOIN: '👥 加入',
  REMOVED: '⚠️ 移除',
  PASSWORD_RESET: '🔑 密码重置',
  ADMIN_ACTION: '🛡️ 管理员操作',
}

export default function NotificationsPage() {
  const { data: notifications, isLoading, error, refetch } = trpc.notification.list.useQuery({ skip: 0, take: 50 })

  const { data: unread } = trpc.notification.unreadCount.useQuery()

  const { mutate: markRead } = trpc.notification.markRead.useMutation()
  const { mutate: markAllRead } = trpc.notification.markAllRead.useMutation()

  if (isLoading) return <div className="flex h-40 items-center justify-center text-muted-foreground">加载中...</div>

  if (error) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <p className="text-red-500">加载失败：{error.message}</p>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="mr-1 h-4 w-4" />
          重试
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">通知</h1>
        {unread && unread.count > 0 && (
          <Button size="sm" variant="outline" onClick={() => markAllRead({})}>全部标记已读</Button>
        )}
      </div>

      {notifications && notifications.length === 0 ? (
        <Card><CardContent className="pt-10 text-center text-muted-foreground">暂无通知</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {notifications?.map((n) => (
            <Card key={n.id} className={!n.isRead ? 'border-primary' : ''}>
              <CardContent className="flex items-start gap-3 p-4">
                <span className="text-lg">{typeMap[n.type] || n.type}</span>
                <div className="flex-1">
                  <p className={n.isRead ? 'text-muted-foreground' : 'font-medium'}>{n.title}</p>
                  <p className="text-sm text-muted-foreground">{n.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{getRelativeTime(n.createdAt)}</p>
                </div>
                {!n.isRead && (
                  <Button size="sm" variant="ghost" onClick={() => markRead({ id: n.id })}>标记已读</Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
