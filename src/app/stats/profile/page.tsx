'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useState } from 'react'
import { trpc } from '@/providers/trpc-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CircleSelector } from '@/components/circle-selector'
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
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  if (!stats || stats.totalCheckins === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">个人统计</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-lg text-muted-foreground">还没有打卡记录</p>
            <p className="mt-1 text-sm text-muted-foreground">完成第一次打卡后，这里会显示你的学习统计</p>
            <Button className="mt-4" onClick={() => router.push(`/checkin?circle=${circleId}`)}>
              去打卡
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const avgDailyWords = stats.totalCheckins > 0 ? Math.round(stats.totalWords / stats.totalCheckins) : 0

  const renderCalendar = () => {
    const firstDay = new Date(calYear, calMonth - 1, 1).getDay()
    const daysInMonth = new Date(calYear, calMonth, 0).getDate()
    const checkinDates = new Set(calendar?.checkins.map((c: any) => c.date) || [])
    const cells: (string | null)[] = Array(firstDay).fill(null)
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = calYear + '-' + String(calMonth).padStart(2, '0') + '-' + String(i).padStart(2, '0')
      cells.push(dateStr)
    }
    return cells.map((date, idx) => {
      if (!date) return <div key={idx} />
      const hasCheckin = checkinDates.has(date)
      return (
        <div key={idx} className={'flex h-10 w-10 items-center justify-center rounded-md text-sm ' + (hasCheckin ? 'bg-green-200 text-green-800 font-medium' : 'text-muted-foreground')}>
          {parseInt(date.split('-')[2])}
        </div>
      )
    })
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold">个人统计</h1>
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
            a.download = 'stats-profile.json'
            a.click()
            URL.revokeObjectURL(url)
          }}>
            <Download className="mr-1" size={14} />
            导出
          </Button>
        </div>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">当前圈子：{searchParams.get('circle')}</p>

      {showMethodology && (
        <div className="mb-4 rounded-md bg-muted/50 p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">📊 统计口径说明</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>累计打卡：从你加入圈子起的所有成功打卡次数（不含草稿和已撤回的打卡）</li>
            <li>累计单词：所有打卡记录的单词数量总和，按打卡记录统计，同一单词在不同打卡中会被重复计算</li>
            <li>累计时长：所有打卡记录的学习分钟数总和</li>
            <li>连续天数：从最近一次打卡开始，连续每天都有打卡的天数。中断后重新计算</li>
            <li>历史最长：历史上最长的连续打卡天数记录</li>
            <li>本周打卡：本周一（00:00）至今的打卡天数</li>
            <li>数据范围：仅统计当前圈子内的打卡数据，删除打卡后统计会自动更新</li>
          </ul>
          <button onClick={() => setShowMethodology(false)} className="mt-2 text-primary hover:underline">关闭</button>
        </div>
      )}

      <div className="mb-4 flex gap-2">
        <button onClick={() => setView('summary')} className={'rounded-md px-4 py-2 text-sm font-medium ' + (view === 'summary' ? 'bg-primary text-primary-foreground' : 'bg-secondary')}>概览</button>
        <button onClick={() => setView('calendar')} className={'rounded-md px-4 py-2 text-sm font-medium ' + (view === 'calendar' ? 'bg-primary text-primary-foreground' : 'bg-secondary')}>日历</button>
      </div>

      {view === 'summary' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">累计打卡</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{stats.totalCheckins}</div><div className="text-xs text-muted-foreground">次</div></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">累计单词</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{stats.totalWords}</div><div className="text-xs text-muted-foreground">个</div></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">累计时长</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{stats.totalMinutes}</div><div className="text-xs text-muted-foreground">分钟</div></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">当前连续</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{stats.currentStreak}</div><div className="text-xs text-muted-foreground">天</div></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">历史最长</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{stats.longestStreak}</div><div className="text-xs text-muted-foreground">天</div></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">本周打卡</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{stats.weekCheckins}</div><div className="text-xs text-muted-foreground">天</div></CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-lg">更多数据</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">平均每日单词</div>
                  <div className="text-2xl font-bold">{avgDailyWords} 个</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">平均每日时长</div>
                  <div className="text-2xl font-bold">{stats.totalCheckins > 0 ? Math.round(stats.totalMinutes / stats.totalCheckins) : 0} 分钟</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">🎯 继续加油</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                你已经连续打卡 {stats.currentStreak} 天！保持每天的学习习惯，坚持就是胜利。
                {stats.currentStreak >= 7 && ' 🎉'}
                {stats.currentStreak >= 30 && ' 🏆'}
                {stats.currentStreak >= 100 && ' 👑'}
              </p>
              <Button className="mt-3" onClick={() => router.push(`/checkin?circle=${circleId}`)}>
                今天也要打卡
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {view === 'calendar' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">{calYear}年{calMonth}月</CardTitle>
            <div className="flex gap-2">
              <button onClick={() => { if (calMonth === 1) { setCalMonth(12); setCalYear(calYear - 1) } else { setCalMonth(calMonth - 1) } }} className="rounded-md p-2 hover:bg-accent">←</button>
              <button onClick={() => { if (calMonth === 12) { setCalMonth(1); setCalYear(calYear + 1) } else { setCalMonth(calMonth + 1) } }} className="rounded-md p-2 hover:bg-accent">→</button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {['日', '一', '二', '三', '四', '五', '六'].map((d) => <div key={d} className="font-medium text-muted-foreground">{d}</div>)}
              {renderCalendar()}
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="h-4 w-4 rounded bg-green-200"></div>
                <span>已打卡</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-4 w-4 rounded bg-gray-100"></div>
                <span>未打卡</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function StatsProfilePage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">加载中...</div>}>
      <StatsContent />
    </Suspense>
  )
}
