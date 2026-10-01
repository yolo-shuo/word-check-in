'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { trpc } from '@/providers/trpc-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CircleSelector } from '@/components/circle-selector'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { skipToken } from '@tanstack/react-query'

function CircleStatsContent() {
  const searchParams = useSearchParams()
  const circleId = searchParams.get('circle')
  const [showMethodology, setShowMethodology] = useState(false)

  const { data: stats, isLoading, error } = trpc.stats.circle.useQuery(
    circleId ? { circleId } : skipToken,
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
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2">
        <p className="text-red-500">加载失败：{error?.message || '未知错误'}</p>
        <Button variant="outline" onClick={() => location.reload()}>重试</Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 h-8 w-32 animate-pulse rounded bg-muted" />
        <div className="h-32 animate-pulse rounded-lg bg-muted" />
      </div>
    )
  }

  if (!stats) {
    return <div className="flex h-40 items-center justify-center text-muted-foreground">加载失败</div>
  }

  const memberCount = stats.members?.length || 0
  const avgCheckins = memberCount > 0 ? (stats.totalCheckins / memberCount).toFixed(1) : 0
  const avgWords = memberCount > 0 ? Math.round(stats.totalWords / memberCount) : 0

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold">圈子统计</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowMethodology(!showMethodology)}>
            统计说明
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            const data = JSON.stringify(stats, null, 2)
            const blob = new Blob([data], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'stats-circle.json'
            a.click()
            URL.revokeObjectURL(url)
          }}>
            <Download className="mr-1" size={14} />
            导出
          </Button>
        </div>
      </div>

      {showMethodology && (
        <div className="mb-4 rounded-md bg-muted/50 p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">📊 统计口径说明</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>总打卡：圈子内所有成员的成功打卡总次数（不含草稿和已撤回）</li>
            <li>总单词：所有打卡记录的单词数量总和，按打卡记录统计</li>
            <li>总时长：所有打卡记录的学习分钟数总和</li>
            <li>本周排行榜：按本周一（00:00）至今的数据统计</li>
            <li>数据仅统计当前圈子内的打卡，删除打卡后统计会自动更新</li>
          </ul>
          <button onClick={() => setShowMethodology(false)} className="mt-2 text-primary hover:underline">关闭</button>
        </div>
      )}

      <div className="mb-6 grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">总打卡</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{stats.totalCheckins}</div><div className="text-xs text-muted-foreground">次</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">总单词</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{stats.totalWords}</div><div className="text-xs text-muted-foreground">个</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">总时长</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{stats.totalMinutes}</div><div className="text-xs text-muted-foreground">分钟</div></CardContent>
        </Card>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">成员数</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{memberCount}</div><div className="text-xs text-muted-foreground">人</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">人均打卡</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{avgCheckins}</div><div className="text-xs text-muted-foreground">次/人</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">人均单词</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{avgWords}</div><div className="text-xs text-muted-foreground">个/人</div></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-lg">本周打卡天数榜</CardTitle></CardHeader>
          <CardContent>
            {stats.leaderboard.byCheckins.length === 0 ? (
              <p className="text-muted-foreground">暂无数据</p>
            ) : (
              <div className="space-y-2">
                {stats.leaderboard.byCheckins.map((m: any, idx: number) => (
                  <div key={m.userId} className="flex items-center gap-3 rounded-md bg-muted p-2">
                    <span className="font-bold text-primary">{idx + 1}</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">{m.nickname[0]}</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{m.nickname}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{m.weekCheckins}</div>
                      <div className="text-xs text-muted-foreground">天</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">本周单词量榜</CardTitle></CardHeader>
          <CardContent>
            {stats.leaderboard.byWords.length === 0 ? (
              <p className="text-muted-foreground">暂无数据</p>
            ) : (
              <div className="space-y-2">
                {stats.leaderboard.byWords.map((m: any, idx: number) => (
                  <div key={m.userId} className="flex items-center gap-3 rounded-md bg-muted p-2">
                    <span className="font-bold text-primary">{idx + 1}</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">{m.nickname[0]}</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{m.nickname}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{m.weekWords}</div>
                      <div className="text-xs text-muted-foreground">词</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">今日打卡情况</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.members.map((m: any) => (
              <div key={m.userId} className="flex items-center justify-between rounded-md p-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">{m.nickname[0]}</div>
                  <span className="text-sm">{m.nickname}</span>
                </div>
                {m.hasCheckedToday ? <span className="text-green-500">✅ 已打卡</span> : <span className="text-muted-foreground">未打卡</span>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
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
