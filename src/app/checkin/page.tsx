'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useState, useEffect, useMemo } from 'react'
import { trpc } from '@/providers/trpc-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CircleSelector } from '@/components/circle-selector'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import { skipToken } from '@tanstack/react-query'

function CheckinContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const circleId = searchParams.get('circle')
  const { data: session } = useSession()

  const [wordCount, setWordCount] = useState(50)
  const [minutes, setMinutes] = useState(30)
  const [note, setNote] = useState('')
  const [vocabVersionId, setVocabVersionId] = useState('')
  const [loading, setLoading] = useState(false)
  const [makeupMode, setMakeupMode] = useState(false)

  const utils = trpc.useUtils()
  const { data: vocabVersions, isPending: loadingVocab } = trpc.vocab.listVersions.useQuery({ isActive: true })
  const { data: studyCounts } = trpc.vocabProgress.getStudyCounts.useQuery(
    vocabVersionId ? { versionId: vocabVersionId } : skipToken,
    { enabled: !!vocabVersionId }
  )

  const autoWordCount = useMemo(() => {
    const count = Math.max(studyCounts?.totalWordCount || 0, 1)
    return Math.min(Math.max(count, 1), 2000)
  }, [studyCounts?.totalWordCount])

  useEffect(() => {
    setWordCount(autoWordCount)
  }, [autoWordCount])

  const { data: todayCheckin, isPending: loadingToday } = trpc.checkin.getToday.useQuery(
    circleId ? { circleId } : skipToken
  )

  // 自动选中唯一词库
  useEffect(() => {
    if (vocabVersions && vocabVersions.length === 1 && !vocabVersionId) {
      setVocabVersionId(vocabVersions[0].id)
    }
  }, [vocabVersions, vocabVersionId])

  const { mutate: createCheckin, isPending: createLoading } = trpc.checkin.create.useMutation({
    onSuccess: async (data) => {
      toast.success(data.isMakeup ? '补卡成功！' : '打卡成功！')
      setMinutes(30)
      setNote('')
      setMakeupMode(false)
      // 刷新今日页、个人统计、成员状态等依赖数据
      await Promise.all([
        utils.feed.list.invalidate(),
        utils.stats.profile.invalidate(),
        utils.stats.circle.invalidate(),
        utils.stats.calendar.invalidate(),
        utils.checkin.list.invalidate(),
        utils.checkin.getToday.invalidate(),
        utils.circle.listMembers.invalidate(),
      ])
      // 跳转回动态页查看打卡结果
      if (circleId) {
        router.push(`/feed?circle=${circleId}`)
      }
    },
    onError: (error: any) => {
      toast.error(error?.message || '打卡失败，请重试')
    },
    onSettled: () => setLoading(false),
  })
  const { mutate: saveDraft, isPending: draftLoading } = trpc.checkin.saveDraft.useMutation({
    onSuccess: () => {
      toast.success('草稿已保存，下次可以恢复继续填写')
    },
    onError: (error: any) => {
      toast.error(error?.message || '保存失败，请重试')
    },
  })

  if (!circleId) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">今日打卡</h1>
        <CircleSelector />
      </div>
    )
  }

  const hasCheckin = todayCheckin?.hasCheckin
  const hasWithdrawn = todayCheckin?.hasWithdrawn

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">{makeupMode ? '补打卡' : '今日打卡'}</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {makeupMode ? '为昨天补打卡，补卡仅限一次机会' : '打卡将在当前圈子内可见，每位成员每天最多打卡 1 次'}
      </p>

      {todayCheckin?.canMakeup && !hasCheckin && (
        <Card className="mb-4 border-purple-200 bg-purple-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-700">
                <span className="text-xl">🌙</span>
                <div>
                  <span className="font-medium">昨天忘记打卡？</span>
                  <p className="text-xs text-purple-600">可以补昨天一次卡，补卡后连续天数不会中断</p>
                </div>
              </div>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={makeupMode}
                  onChange={(e) => setMakeupMode(e.target.checked)}
                  className="h-4 w-4 rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-purple-700">{makeupMode ? '正在补昨天' : '补昨天卡'}</span>
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {hasCheckin && (
        <Card className="mb-4 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-700">
              <span className="text-xl">✅</span>
              <span className="font-medium">今天已经打过卡了！</span>
            </div>
            {todayCheckin?.checkin && (
              <div className="mt-2 text-sm text-green-600">
                {todayCheckin.checkin.wordCount} 个单词 · {todayCheckin.checkin.minutes} 分钟
                {todayCheckin.checkin.note && ` · 笔记：${todayCheckin.checkin.note}`}
              </div>
            )}
            <p className="mt-2 text-xs text-green-600">
              打卡修改将记录在修改历史中，最多可修改 3 次
            </p>
          </CardContent>
        </Card>
      )}

      {hasWithdrawn && !hasCheckin && (
        <Card className="mb-4 border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-700">
              <span className="text-xl">⚠️</span>
              <span>今天有已撤回的打卡，可重新发布</span>
            </div>
          </CardContent>
        </Card>
      )}

      {(!vocabVersions || vocabVersions.length === 0) ? (
        <Card className="mb-4 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-blue-700">
              <span className="text-xl">📚</span>
              <span className="font-medium">还没有词库</span>
            </div>
            <p className="mt-2 text-sm text-blue-600">
              请先在词库页面选择一个词库开始学习，然后回来打卡记录学习情况
            </p>
            <Button className="mt-3" onClick={() => router.push('/vocab')}>
              前往词库
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>记录学习情况</CardTitle>
            <p className="text-sm text-muted-foreground">
              填写今天的学习数据，打卡后会在圈子动态中展示给所有成员
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vocab">词库版本</Label>
              <select
                id="vocab"
                value={vocabVersionId}
                onChange={(e) => setVocabVersionId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                {vocabVersions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} v{v.version}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3 rounded-md bg-muted/50 p-3">
              <div>
                <p className="text-xs text-muted-foreground">总单词数</p>
                <p className="text-lg font-bold">{wordCount}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">新学</p>
                <p className="text-lg font-bold">{studyCounts?.newWordCount ?? 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">复习</p>
                <p className="text-lg font-bold">{studyCounts?.reviewWordCount ?? 0}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minutes">学习时长（分钟）</Label>
              <Input
                id="minutes"
                type="number"
                min={1}
                max={720}
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
                disabled={loading || createLoading}
              />
              <p className="text-xs text-muted-foreground">今天背单词花了多少分钟（1-720）</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">学习笔记（可选）</Label>
              <textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={300}
                placeholder="记录今天的学习感受、方法或困难...（支持换行和表情符号，不支持图片）"
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                rows={3}
                disabled={loading || createLoading}
              />
              <p className="text-xs text-muted-foreground">
                {note.length}/300 字 · 笔记仅自己可见，发布到动态后其他成员也能看到
              </p>
            </div>

            <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
              <p className="font-medium">📝 打卡规则说明：</p>
              <ul className="mt-1 list-inside list-disc space-y-0.5">
                <li>每位成员每个圈子每天最多打卡 1 次</li>
                <li>忘记打卡？可以补昨天一次卡（补卡不影响连续天数）</li>
                <li>打卡后连续天数 +1，中断后重新计算</li>
                <li>打卡修改记录在修改历史中，最多可修改 3 次</li>
                <li>打卡发布到当前圈子，所有圈子成员可见</li>
              </ul>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => {
                  setLoading(true)
                  createCheckin({
                    circleId,
                    vocabVersionId,
                    wordCount,
                    minutes,
                    note: note || undefined,
                    date: makeupMode ? todayCheckin?.yesterdayStr : undefined,
                  })
                }}
                disabled={createLoading || !vocabVersionId || hasCheckin}
              >
                {createLoading ? '发布中...' : makeupMode ? '发布补卡' : '发布打卡'}
              </Button>
              <Button
                variant="outline"
                onClick={() => saveDraft({ circleId, vocabVersionId: vocabVersionId || undefined, wordCount, minutes, note: note || undefined })}
                disabled={draftLoading || hasCheckin}
              >
                {draftLoading ? '保存中...' : '保存草稿'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              「发布打卡」立即发布到圈子动态；「保存草稿」仅保存进度，不发布，下次可恢复
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function CheckinPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">加载中...</div>}>
      <CheckinContent />
    </Suspense>
  )
}