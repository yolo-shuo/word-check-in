'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { trpc } from '@/providers/trpc-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CircleSelector } from '@/components/circle-selector'
import { LoadingState, ErrorState } from '@/components/page-states'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

function CircleStatsContent() {
  const searchParams = useSearchParams()
  const circleId = searchParams.get('circle')
  const [showMethodology, setShowMethodology] = useState(false)

  const { data: stats, isLoading, error } = trpc.stats.circle.useQuery(
    circleId ? { circleId } : undefined,
    { enabled: !!circleId }
  )

  if (!circleId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">圈子统计</h1>
        <CircleSelector />
      </div>
    )
  }

  if (error) {
    return <ErrorState message="加载失败：" + error.message onRetry={() => location.reload()} />
  }

  if (isLoading) {
    return <LoadingState />
  }

  if (!stats) {
    return <LoadingState />
  }

  const memberCount = stats.members?.length || 0
  const avgCheckins = memberCount > 0 ? (stats.totalCheckins / memberCount).toFixed(1) : 0
  const avgWords = memberCount > 0 ? Math.round(stats.totalWords / memberCount) : 0

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">圈子统计</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowMethodology(!showMethodology)}>
            统计说明
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/export'}>
            <Download className="mr-1" size={14} />
            导出
          </Button>
        </div>
      </div>

      {showMethodology && (
        <div className="mb-6 rounded-md bg-muted/50 p-4 text-sm">
          <p className="font-medium">📊 统计口径说明</p>
          <div className="mt-2 space-y-2 text-muted-foreground">
            <p><strong>圈子活跃率：</strong>本周有打卡记录的天数占总天数的比例。</p>
            <p><strong>平均打卡天数：</strong>所有成员总打卡次数除以成员数。</p>
            <p><strong>平均学习词汇：</strong>所有成员总学习词汇数除以成员数。</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-primary">{memberCount}</div>
              <div className="text-sm text-muted-foreground">成员数</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold">{stats.totalCheckins}</div>
              <div className="text-sm text-muted-foreground">总打卡次数</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold">{avgCheckins}</div>
              <div className="text-sm text-muted-foreground">人均打卡次数</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold">{avgWords}</div>
              <div className="text-sm text-muted-foreground">人均学习词汇</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>成员排名</CardTitle></CardHeader>
          <CardContent>
            {stats.members && stats.members.length > 0 ? (
              <div className="space-y-2">
                {stats.members.map((m, idx) => (
                  <div key={m.userId} className="flex items-center justify-between rounded-md bg-muted p-3">
                    <div className="flex items-center gap-3">
                      <span className={'text-lg font-bold ' + (idx < 3 ? 'text-yellow-500' : 'text-muted-foreground')}>
                        {idx + 1}
                      </span>
                      <span className="font-medium">{m.nickname}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {m.checkinCount} 次 · {m.totalMinutes} 分钟 · {m.totalWords} 词
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">暂无数据</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function CircleStatsPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">加载中...</div>}>
      <CircleStatsContent />
    </Suspense>
  )
}
