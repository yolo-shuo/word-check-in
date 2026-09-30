'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { trpc } from '@/providers/trpc-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UserAvatar } from '@/components/user-avatar'
import { roleMap } from '@/lib/constants'
import { CircleSelector } from '@/components/circle-selector'
import { LoadingState, EmptyState } from '@/components/page-states'
import { useSession } from 'next-auth/react'
import { useConfirm } from '@/components/confirm-dialog'
import { Search, Users } from 'lucide-react'

import toast from 'react-hot-toast'

function MembersContent() {
  const searchParams = useSearchParams()
  const circleId = searchParams.get('circle')
  const { data: session } = useSession()
  const [searchText, setSearchText] = useState('')
  const { confirm: showConfirm, Dialog: ConfirmDialog } = useConfirm()

  const { data: members, isLoading } = trpc.circle.listMembers.useQuery(
    circleId ? { circleId } : undefined,
    { enabled: !!circleId }
  )

  const { data: inviteCodes } = trpc.circle.listInviteCodes.useQuery(
    circleId ? { circleId } : undefined,
    { enabled: !!circleId }
  )

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

  if (isLoading) {
    return <LoadingState />
  }

  const isOwner = members?.some(m => m.userId === session?.user?.id && m.role === 'OWNER')

  const filteredMembers = members?.filter(m =>
    !searchText || m.nickname.toLowerCase().includes(searchText.toLowerCase())
  )

  const handleRemove = (userId: string, nickname: string) => {
    showConfirm({
      title: '确认移除 ' + nickname + '？',
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
        <h1 className="mb-6 text-2xl font-bold">成员管理</h1>

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
                        <UserAvatar user={m} size="lg" />
                        <div>
                          <div className="font-medium">{m.nickname}</div>
                          <div className="text-xs text-muted-foreground">
                            加入于 {new Date(m.joinedAt).toLocaleDateString('zh-CN')}
                            {m.lastActiveAt && ' · 最后活跃 ' + new Date(m.lastActiveAt).toLocaleDateString('zh-CN')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={'rounded-full px-2 py-1 text-xs font-medium ' + role.className}>
                          {role.label}
                        </span>
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
                <EmptyState icon={<Users size={32} className="opacity-50 mb-2" />} title="暂无成员" />
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
