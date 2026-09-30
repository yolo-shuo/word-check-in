'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useState } from 'react'
import { trpc } from '@/providers/trpc-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CircleSelector } from '@/components/circle-selector'
import { LoadingState, ErrorState } from '@/components/page-states'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

import { format } from 'date-fns'

function StatsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const circleId = searchParams.get('circle')
  const [view, setView] = useState<'summary' | 'calendar'>('summary')
  const [calMonth, setCalMonth] = useState(new Date().getMonth() + 1)
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [showMethodology, setShowMethodology] = useState(false)

  const { data: stats, isLoading, error } = trpc.stats.profile.useQuery(
    circleId ? { circleId } : undefined,
    { enabled: !!circleId }
  )

  const { data: calendar } = trpc.stats.calendar.useQuery(
    circleId ? { circleId, year: calYear, month: calMonth } : undefined,
    { enabled: !!circleId && view === 'calendar' }
  )

  if (!circleId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">个人统计</h1>
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">个人统计</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowMethodology(!showMethodology)}>
            统计说明
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push('/export')}>
            <Download className="mr-1" size={14} />
            导出
          </Button>
        </div>
      </div>

      {showMethodology && (
        <div className="mb-6 rounded-md bg-muted/50 p-4 text-sm">
          <p className="font-medium">📊 统计口径说明</p>
          <div className="mt-2 space-y-2 text-muted-foreground">
            <p><strong>连续打卡天数：</strong>从最早打卡日期到今天连续有打卡记录的天数，中断后重新计算。</p>
            <p><strong>总打卡天数：</strong>从最早打卡日期到今天的所有有打卡记录的天数。</p>
            <p><strong>学习时长：</strong>每次打卡填写的学习时长（分钟）之和。</p>
            <p><strong>学习词汇数：</strong>每次打卡填写的总单词数之和。</p>
            <p><strong>圈子排名：</strong>按总打卡天数在圈子内的排名，相同则按学习时长排序。</p>
          </div>
        </div>
      )}

      <div className="mb-6 flex gap-2">
        <Button variant={view === 'summary' ? 'default' : 'outline'} size="sm" onClick={() => setView('summary')}>
          概览
        </Button>
        <Button variant={view === 'calendar' ? 'default' : 'outline'} size="sm" onClick={() => setView('calendar')}>
          日历
        </Button>
      </div>

      {view === 'summary' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-primary">{stats.streakDays}</div>
                <div className="text-sm text-muted-foreground">连续打卡天数</div>
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
                <div className="text-3xl font-bold">{stats.totalMinutes}</div>
                <div className="text-sm text-muted-foreground">总学习时长（分钟）</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold">{stats.totalWords}</div>
                <div className="text-sm text-muted-foreground">总学习词汇数</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>最近打卡</CardTitle></CardHeader>
            <CardContent>
              {stats.recentCheckins && stats.recentCheckins.length > 0 ? (
                <div className="space-y-2">
                  {stats.recentCheckins.map((c) => (
                    <div key={c.id} className="flex items-center justify-between rounded-md bg-muted p-3">
                      <div>
                        <span className="font-medium">{c.wordCount} 个单词</span>
                        <span className="ml-2 text-sm text-muted-foreground">{c.minutes} 分钟</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{format(c.date, 'MM月dd日')}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">暂无打卡记录</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {view === 'calendar' && calendar && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{calYear}年{calMonth}月</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => {
                if (calMonth === 1) { setCalMonth(12); setCalYear(calYear - 1) }
                else setCalMonth(calMonth - 1)
              }}>上月</Button>
              <Button size="sm" variant="outline" onClick={() => {
                if (calMonth === 12) { setCalMonth(1); setCalYear(calYear + 1) }
                else setCalMonth(calMonth + 1)
              }}>下月</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {['日', '一', '二', '三', '四', '五', '六'].map((d) => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
              ))}
              {Array.from({ length: 31 }, (_, i) => {
                const date = new Date(calYear, calMonth - 1, i + 1)
                const dateStr = format(date, 'yyyy-MM-dd')
                const dayCheckin = calendar.days[dateStr]
                const isToday = format(new Date(), 'yyyy-MM-dd') === dateStr
                const inMonth = date.getMonth() === calMonth - 1
                return (
                  <div
                    key={i}
                    className={
                      'flex items-center justify-center rounded-md text-sm ' +
                      (dayCheckin ? 'bg-green-100 text-green-700 font-medium' : 'bg-muted/30 text-muted-foreground') +
                      (isToday ? ' ring-2 ring-primary' : '') +
                      (!inMonth ? ' opacity-30' : '')
                    }
                  >
                    {i + 1}
                  </div>
                )
              })}
            </div>
            <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded bg-green-100"></div>
                已打卡
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded bg-muted/30"></div>
                未打卡
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function StatsPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">加载中...</div>}>
      <StatsContent />
    </Suspense>
  )
}
