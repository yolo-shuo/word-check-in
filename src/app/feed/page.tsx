'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import { trpc } from '@/providers/trpc-provider'
import { CircleSelector } from '@/components/circle-selector'
import { CheckinCard } from '@/components/feed/checkin-card'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Flame, Plus, Users, BookOpen, Loader2 } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { skipToken } from '@tanstack/react-query'
import toast from 'react-hot-toast'

function FeedContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const circleId = searchParams.get('circle')
  const { data: session, status: sessionStatus } = useSession()

  // 只在 circleId 存在时加载数据
  const { data: feed, isLoading: loadingFeed } = trpc.feed.list.useQuery(
    circleId ? { circleId, skip: 0, take: 20 } : skipToken,
    { enabled: !!circleId, staleTime: 30000 }
  )

  const { data: todayCheckin } = trpc.checkin.getToday.useQuery(
    circleId ? { circleId } : skipToken,
    { enabled: !!circleId, staleTime: 30000 }
  )

  const { data: reminderStatus } = trpc.circle.getReminderStatus.useQuery(
    circleId ? { circleId } : skipToken,
    { enabled: !!circleId, staleTime: 30000 }
  )

  const { mutate: sendReminder, isPending: sendingReminder } = trpc.circle.sendReminder.useMutation({
    onSuccess: () => {
      toast.success('已提醒所有未打卡的搭子')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const { data: stats } = trpc.stats.profile.useQuery(
    circleId ? { circleId } : skipToken,
    { enabled: !!circleId, staleTime: 30000 }
  )

  const { data: circleStats } = trpc.stats.circle.useQuery(
    circleId ? { circleId } : skipToken,
    { enabled: !!circleId, staleTime: 30000 }
  )

  // 未选择圈子时显示选择器
  if (!circleId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">动态</h1>
        <CircleSelector />
      </div>
    )
  }

  const memberCount = circleStats?.members?.length || 0
  const todayCheckedCount = circleStats?.members?.filter((m: any) => m.hasCheckedToday).length || 0
  const isLoading = loadingFeed && !feed

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold">圈子动态</h1>

      {/* 今日任务卡片 */}
      <Card className="mb-6 border-primary/20 bg-gradient-to-br from-primary/5 to-blue-50">
        <CardContent className="pt-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-primary">今日学习</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {todayCheckin?.hasCheckin
                  ? '✅ 今天已经打过卡了，继续保持！'
                  : '📖 今天还没有打卡，开始学习吧！'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-orange-700">
                <Flame className="h-4 w-4" />
                <span className="text-sm font-bold">{stats?.currentStreak || 0}</span>
                <span className="text-xs">天连续</span>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-blue-700">
                <Users className="h-4 w-4" />
                <span className="text-sm font-bold">{todayCheckedCount}/{memberCount}</span>
                <span className="text-xs">已打卡</span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            {todayCheckin?.hasCheckin ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/vocab?circle=${circleId}`)}
              >
                <BookOpen className="mr-1 h-4 w-4" />
                继续学习
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => router.push(`/checkin?circle=${circleId}`)}
              >
                <Plus className="mr-1 h-4 w-4" />
                去打卡
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/members?circle=${circleId}`)}
            >
              <Users className="mr-1 h-4 w-4" />
              成员状态
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 打卡提醒横幅 */}
      {reminderStatus?.isPastReminderTime && reminderStatus?.uncheckedCount > 0 && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⏰</span>
                <div>
                  <p className="font-medium text-orange-800">
                    还有 {reminderStatus.uncheckedCount} 位搭子今天没打卡
                  </p>
                  <p className="text-xs text-orange-600">
                    提醒时间：{reminderStatus.reminderTime}
                  </p>
                </div>
              </div>
              {reminderStatus.hasReminded ? (
                <Button variant="outline" size="sm" disabled>
                  已提醒
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => sendReminder({ circleId })}
                  disabled={sendingReminder}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {sendingReminder ? '提醒中...' : '提醒搭子'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 动态列表 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">打卡动态</h2>
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            加载中...
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : feed && feed.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-xl bg-muted/30 p-8">
          <div className="text-5xl">📚</div>
          <div className="text-center">
            <p className="text-lg font-medium text-foreground">还没有人打卡</p>
            <p className="text-sm text-muted-foreground">快来成为第一个吧！</p>
          </div>
          <Button size="lg" onClick={() => router.push(`/checkin?circle=${circleId}`)}>
            立即打卡
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {feed?.map((item) => (
            <CheckinCard key={item.id} checkin={item} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function FeedPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    }>
      <FeedContent />
    </Suspense>
  )
}
