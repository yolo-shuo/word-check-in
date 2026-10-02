'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useState, useEffect } from 'react'
import { trpc } from '@/providers/trpc-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CircleSelector } from '@/components/circle-selector'
import { useConfirm } from '@/components/confirm-dialog'
import { Download, BarChart3, Shield } from 'lucide-react'

import toast from 'react-hot-toast'
import { skipToken } from '@tanstack/react-query'

function CircleSettingsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const circleId = searchParams.get('circle')
  const { confirm: showConfirm, Dialog: ConfirmDialog } = useConfirm()
  const utils = trpc.useUtils()

  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [showEdit, setShowEdit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [reminderTime, setReminderTime] = useState('21:00')
  const [savingReminder, setSavingReminder] = useState(false)

  const { data: circle, isPending: loadingCircle, error: circleError } = trpc.circle.get.useQuery(
    circleId ? { circleId } : skipToken,
    { enabled: !!circleId }
  )

  // 初始化提醒时间
  useEffect(() => {
    if (circle?.reminderTime) {
      setReminderTime(circle.reminderTime)
    }
  }, [circle?.reminderTime])

  // 讨论区设置
  const { data: discussionSettings } = trpc.discussion.getSettings.useQuery(
    circleId ? { circleId } : skipToken,
    { enabled: !!circleId }
  )

  const { mutate: updateDiscussionSettings } = trpc.discussion.updateSettings.useMutation({
    onSuccess: () => toast.success('讨论区设置已更新'),
    onError: (error) => toast.error(error.message),
  })

  const { mutate: updateCircle, isPending: updating } = trpc.circle.update.useMutation({
    onSuccess: () => {
      toast.success('圈子信息已更新')
      setShowEdit(false)
    },
    onError: (error) => toast.error(error.message),
  })

  const { mutate: updateReminderTime, isPending: updatingReminder } = trpc.circle.update.useMutation({
    onSuccess: () => {
      toast.success('提醒时间已更新')
      utils.circle.get.invalidate()
    },
    onError: (error) => toast.error(error.message),
  })

  const { mutate: transferOwner, isPending: transferring } = trpc.circle.transferOwner.useMutation({
    onSuccess: () => {
      toast.success('所有权转移成功')
      router.push('/feed')
    },
    onError: (error) => toast.error(error.message),
  })

  const { mutate: dissolve, isPending: dissolving } = trpc.circle.dissolve.useMutation({
    onSuccess: () => {
      toast.success('圈子已解散')
      router.push('/feed')
    },
    onError: (error) => toast.error(error.message),
  })

  const { mutate: leave, isPending: leaving } = trpc.circle.leave.useMutation({
    onSuccess: () => {
      toast.success('已退出圈子')
      router.push('/feed')
    },
    onError: (error) => toast.error(error.message),
  })

  if (!circleId) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">圈子设置</h1>
        <CircleSelector />
      </div>
    )
  }

  if (circleError) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-3">
        <p className="text-red-500">加载失败：{circleError.message}</p>
        <p className="text-sm text-muted-foreground">请确保已登录并选择正确的圈子</p>
        <Button variant="outline" onClick={() => {
          utils.circle.get.invalidate({ circleId })
        }}>
          重试
        </Button>
      </div>
    )
  }

  if (loadingCircle || !circle) {
    return <div className="flex h-40 items-center justify-center text-muted-foreground">加载中...</div>
  }

  const isOwner = circle.role === 'OWNER'

  const handleLeaveConfirm = () => {
    showConfirm({
      title: '确认退出圈子？',
      description: '退出后你将无法再访问此圈子的动态、讨论和成员信息。你在此圈子的历史打卡记录将被保留但不再显示在圈子中。如需重新加入，需要新的邀请码。',
      confirmText: '退出圈子',
      variant: 'destructive',
      onConfirm: () => {
        leave({ circleId })
      },
    })
  }

  const handleExport = () => {
    const data = JSON.stringify({ circle, discussionSettings }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `circle-${circle.name}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('数据已导出')
  }

  const handleSaveEdit = () => {
    if (!circleId) return
    setSaving(true)
    updateCircle({
      circleId,
      name: editName,
      description: editDesc || undefined,
    })
  }

  return (
    <>
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">圈子设置</h1>

        {/* 圈子信息 */}
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">圈子信息</CardTitle>
            {isOwner && (
              <Button variant="outline" size="sm" onClick={() => { setEditName(circle.name || ''); setEditDesc(''); setShowEdit(!showEdit) }}>
                {showEdit ? '取消编辑' : '编辑'}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {showEdit ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="circleName">圈子名称</Label>
                  <Input id="circleName" value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={50} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="circleDesc">圈子描述</Label>
                  <Input id="circleDesc" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} maxLength={200} placeholder="圈子简介（可选）" />
                </div>
                <Button onClick={handleSaveEdit} disabled={saving || !editName.trim()}>
                  {saving ? '保存中...' : '保存修改'}
                </Button>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <div><span className="text-muted-foreground">名称：</span>{circle.name}</div>
                <div><span className="text-muted-foreground">时区：</span>{circle.timezone}</div>
                <div><span className="text-muted-foreground">角色：</span>{isOwner ? '所有者' : '成员'}</div>
                {circle.description && <div><span className="text-muted-foreground">描述：</span>{circle.description}</div>}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 讨论区设置 */}
        {isOwner && discussionSettings && (
          <Card className="mb-6">
            <CardHeader><CardTitle className="text-lg">讨论区设置</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">讨论区</div>
                  <div className="text-sm text-muted-foreground">是否允许成员发送消息</div>
                </div>
                <Button
                  size="sm"
                  variant={discussionSettings.enabled ? 'default' : 'outline'}
                  onClick={() => updateDiscussionSettings({ circleId, enabled: !discussionSettings.enabled })}
                >
                  {discussionSettings.enabled ? '已开启' : '已关闭'}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">打卡引用</div>
                  <div className="text-sm text-muted-foreground">是否允许在讨论中引用打卡记录</div>
                </div>
                <Button
                  size="sm"
                  variant={discussionSettings.allowCheckinRef ? 'default' : 'outline'}
                  onClick={() => updateDiscussionSettings({ circleId, allowCheckinRef: !discussionSettings.allowCheckinRef })}
                >
                  {discussionSettings.allowCheckinRef ? '已开启' : '已关闭'}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">单词引用</div>
                  <div className="text-sm text-muted-foreground">是否允许在讨论中分享单词</div>
                </div>
                <Button
                  size="sm"
                  variant={discussionSettings.allowWordRef ? 'default' : 'outline'}
                  onClick={() => updateDiscussionSettings({ circleId, allowWordRef: !discussionSettings.allowWordRef })}
                >
                  {discussionSettings.allowWordRef ? '已开启' : '已关闭'}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">图片消息</div>
                  <div className="text-sm text-muted-foreground">是否允许发送图片</div>
                </div>
                <Button
                  size="sm"
                  variant={discussionSettings.allowImages ? 'default' : 'outline'}
                  onClick={() => updateDiscussionSettings({ circleId, allowImages: !discussionSettings.allowImages })}
                >
                  {discussionSettings.allowImages ? '已开启' : '已关闭'}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">敏感词过滤</div>
                  <div className="text-sm text-muted-foreground">自动过滤敏感词</div>
                </div>
                <Button
                  size="sm"
                  variant={discussionSettings.sensitiveWordFilter ? 'default' : 'outline'}
                  onClick={() => updateDiscussionSettings({ circleId, sensitiveWordFilter: !discussionSettings.sensitiveWordFilter })}
                >
                  {discussionSettings.sensitiveWordFilter ? '已开启' : '已关闭'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 打卡提醒 */}
        {isOwner && (
          <Card className="mb-6">
            <CardHeader><CardTitle className="text-lg">打卡提醒</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reminderTime">每日提醒时间</Label>
                <div className="flex gap-2">
                  <Input
                    id="reminderTime"
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => {
                      if (!circleId) return
                      updateReminderTime({ circleId, reminderTime })
                    }}
                    disabled={updatingReminder}
                  >
                    {updatingReminder ? '保存中...' : '保存'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">到了该时间，如果还有搭子没打卡，可以在动态页提醒他们</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 数据导出 */}
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-lg">数据导出</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">导出圈子信息到 JSON 文件</p>
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-1" size={14} />
              导出圈子数据
            </Button>
          </CardContent>
        </Card>

        {/* 更多功能 */}
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-lg">更多功能</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start" onClick={() => router.push(`/stats/circle?circle=${circleId}`)}>
              <BarChart3 className="mr-2 h-4 w-4" />
              圈子统计
              <span className="ml-auto text-xs text-muted-foreground">查看打卡排行和学习数据</span>
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => router.push(`/admin/audit?circle=${circleId}`)}>
              <Shield className="mr-2 h-4 w-4" />
              审计日志
              <span className="ml-auto text-xs text-muted-foreground">查看操作记录</span>
            </Button>
          </CardContent>
        </Card>

        {/* 危险区域 */}
        <Card className="border-red-200">
          <CardHeader><CardTitle className="text-lg text-red-600">危险区域</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Button variant="outline" className="w-full" onClick={() => router.push('/members?circle=' + circleId)}>
                成员管理
              </Button>
              <p className="mt-1 text-xs text-muted-foreground">管理成员权限、禁言和移除</p>
            </div>
            {isOwner && (
              <>
                <div>
                  <Button variant="outline" className="w-full" disabled={transferring} onClick={() => {
                    const newOwnerId = prompt('请输入新所有者的用户ID（可在成员列表中查看）')
                    if (newOwnerId) transferOwner({ circleId, newOwnerId })
                  }}>
                    {transferring ? '转移中...' : '转移所有者'}
                  </Button>
                  <p className="mt-1 text-xs text-muted-foreground">将圈子所有权转移给其他成员，转移后你将变为普通成员</p>
                </div>
                <div>
                  <Button variant="outline" className="w-full" disabled={dissolving} onClick={() => {
                    if (confirm('确定要解散这个圈子吗？解散后所有成员将被移除，此操作不可撤销。')) {
                      dissolve({ circleId })
                    }
                  }}>
                    {dissolving ? '解散中...' : '解散圈子'}
                  </Button>
                  <p className="mt-1 text-xs text-muted-foreground">解散后所有成员将被移除，打卡数据将保留在个人历史中但不再属于任何圈子</p>
                </div>
              </>
            )}
            <div>
              <Button variant={isOwner ? 'destructive' : 'outline'} className="w-full" onClick={handleLeaveConfirm} disabled={leaving}>
                {leaving ? '退出中...' : '退出圈子'}
              </Button>
              {isOwner && (
                <p className="mt-1 text-xs text-muted-foreground">退出前请先转移所有者权限</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">退出后你的历史打卡记录将保留，但不再显示在圈子中</p>
            </div>
          </CardContent>
        </Card>
      </div>
      {ConfirmDialog}
    </>
  )
}

export default function CircleSettingsPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">加载中...</div>}>
      <CircleSettingsContent />
    </Suspense>
  )
}
