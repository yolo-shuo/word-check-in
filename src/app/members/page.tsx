'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { trpc } from '@/providers/trpc-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CircleSelector } from '@/components/circle-selector'
import { useSession } from 'next-auth/react'
import { useConfirm } from '@/components/confirm-dialog'
import { Search, Users, CheckCircle2, XCircle } from 'lucide-react'

import toast from 'react-hot-toast'

function MembersContent() {
  const searchParams = useSearchParams()
  const circleId = searchParams.get('circle')
  const { data: session } = useSession()
  const [searchText, setSearchText] = useState('')
  const { confirm: showConfirm, Dialog: ConfirmDialog } = useConfirm()

  const { data: members, isLoading, error: membersError, refetch: refetchMembers } = trpc.circle.listMembers.useQuery(
    circleId ? { circleId } : undefined,
    { enabled: !!circleId }
  )

  const { data: inviteCodes } = trpc.circle.listInviteCodes.useQuery(
    circleId ? { circleId } : undefined,
    { enabled: !!circleId }
  )

  const { data: circleStats } = trpc.stats.circle.useQuery(
    circleId ? { circleId } : undefined,
    { enabled: !!circleId, staleTime: 30000 }
  )

  const todayCheckedMap = new Map<string, boolean>()
  if (circleStats?.members) {
    for (const m of circleStats.members) {
      todayCheckedMap.set(m.userId, m.hasCheckedToday)
    }
  }

  const { mutate: createInviteCode } = trpc.circle.createInviteCode.useMutation({
    onSuccess: () => toast.success('邀请码生成成功')
  })

  const { mutate: removeMember, isLoading: removing } = trpc.circle.removeMember.useMutation({
    onSuccess: () => toast.success('成员已移除')
  })

  const { mutate: setAdmin, isLoading: settingAdmin } = trpc.circle.setAdmin.useMutation({
    onSuccess: () => toast.success('管理员权限已更新')
  })

  const { mutate: muteMember, isLoading: muting } = trpc.circle.muteMember.useMutation({
    onSuccess: () => toast.success('禁言状态已更新')
  })

  if (!circleId) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">成员管理</h1>
        <CircleSelector />
      </div>
    )
  }

  if (membersError) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-3">
        <p className="text-red-500">加载失败：{membersError?.message || '未知错误'}</p>
        <p className="text-sm text-muted-foreground">请确保已登录并选择正确的圈子</p>
        <Button variant="outline" onClick={() => refetchMembers()}>
          重试
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 h-8 w-32 animate-pulse rounded bg-muted" />
        <div className="h-20 animate-pulse rounded-lg bg-muted" />
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  const isOwner = members?.some(m => m.userId === session?.user?.id && m.role === 'OWNER')

  const filteredMembers = members?.filter(m =>
    !searchText || m.nickname.toLowerCase().includes(searchText.toLowerCase())
  )

  const roleMap: Record<string, { label: string; className: string }> = {
    OWNER: { label: '所有者', className: 'bg-yellow-100 text-yellow-800' },
    ADMIN: { label: '管理员', className: 'bg-blue-100 text-blue-800' },
    MEMBER: { label: '成员', className: 'bg-gray-100 text-gray-600' },
  }

  const handleRemove = (userId: string, nickname: string) => {
    showConfirm({
      title: `确认移除 ${nickname}？`,
      description: '移除后该成员将无法再访问此圈子，其历史打卡记录将保留但不再显示在圈子中。',
      confirmText: '移除',
      variant: 'destructive',
      onConfirm: () => {
        removeMember({ circleId, userId, reason: '管理员移除' })
      },
    })
  }

  return (
    <>
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-4 text-2xl font-bold">成员</h1>

        {/* 今日打卡概况 */}
        <Card className="mb-6">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">今日打卡情况</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {circleStats ? `${circleStats.members?.filter((m: any) => m.hasCheckedToday).length}/${members?.length || 0} 人已打卡` : '加载中...'}
                </p>
              </div>
              <div className="flex gap-2">
                <div className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-bold">{circleStats?.members?.filter((m: any) => m.hasCheckedToday).length || 0}</span>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-gray-600">
                  <XCircle className="h-4 w-4" />
                  <span className="text-sm font-bold">{(members?.length || 0) - (circleStats?.members?.filter((m: any) => m.hasCheckedToday).length || 0)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {isOwner && (
          <Card className="mb-6">
            <CardHeader><CardTitle className="text-lg">邀请码</CardTitle></CardHeader>
            <CardContent>
              <Button onClick={() => createInviteCode({ circleId })}>生成新邀请码</Button>
              <div className="mt-3 space-y-2">
                {inviteCodes?.map((code) => (
                  <div key={code.id} className="flex items-center justify-between rounded-md bg-muted p-3">
                    <div>
                      <span className="font-mono font-bold">{code.code}</span>
                      <span className="ml-2 text-xs text-muted-foreground">已用 {code.usedCount}{code.maxUses ? '/' + code.maxUses : ''} 次</span>
                    </div>
                    {code.revokedAt ? <span className="text-xs text-red-500">已撤销</span> : <span className="text-xs text-green-500">有效</span>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">成员列表</CardTitle>
            <span className="text-sm text-muted-foreground">{filteredMembers?.length || 0} 人</span>
          </CardHeader>
          <CardContent>
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索成员..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="space-y-2">
              {filteredMembers && filteredMembers.length > 0 ? (
                filteredMembers.map((m) => {
                  const role = roleMap[m.role] || roleMap.MEMBER
                  return (
                    <div key={m.id} className="flex items-center justify-between rounded-md p-3">
                      <div className="flex items-center gap-3">
                        {m.avatarUrl ? <img src={m.avatarUrl} alt={m.nickname} className="h-10 w-10 rounded-full" /> : <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">{m.nickname[0]}</div>}
                        <div>
                          <div className="font-medium">{m.nickname}</div>
                          <div className="text-xs text-muted-foreground">
                            加入于 {new Date(m.joinedAt).toLocaleDateString('zh-CN')}
                            {m.lastActiveAt && ` · 最后活跃 ${new Date(m.lastActiveAt).toLocaleDateString('zh-CN')}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${role.className}`}>
                          {role.label}
                        </span>
                        {todayCheckedMap.get(m.userId) ? (
                          <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
                            <CheckCircle2 className="h-3 w-3" />
                            已打卡
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">
                            <XCircle className="h-3 w-3" />
                            未打卡
                          </span>
                        )}
                        {m.mutedAt && (
                          <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-600">已禁言</span>
                        )}
                        {isOwner && m.role !== 'OWNER' && m.userId !== session?.user?.id && (
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant={m.role === 'ADMIN' ? 'default' : 'outline'}
                              onClick={() => setAdmin({ circleId, userId: m.userId, isAdmin: m.role !== 'ADMIN' })}
                              disabled={settingAdmin}
                            >
                              {m.role === 'ADMIN' ? '取消管理员' : '设为管理员'}
                            </Button>
                            <Button
                              size="sm"
                              variant={m.mutedAt ? 'default' : 'outline'}
                              onClick={() => muteMember({ circleId, userId: m.userId, muted: !m.mutedAt })}
                              disabled={muting}
                            >
                              {m.mutedAt ? '取消禁言' : '禁言'}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRemove(m.userId, m.nickname)}
                              disabled={removing}
                            >
                              移除
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Users size={32} className="mb-2 opacity-50" />
                  <p>暂无成员</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      {ConfirmDialog}
    </>
  )
}

export default function MembersPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">加载中...</div>}>
      <MembersContent />
    </Suspense>
  )
}