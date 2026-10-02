'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { trpc } from '@/providers/trpc-provider'
import { Plus, Users, UserCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const roleMap: Record<string, { label: string; className: string }> = {
  OWNER: { label: '所有者', className: 'bg-yellow-100 text-yellow-800' },
  ADMIN: { label: '管理员', className: 'bg-blue-100 text-blue-800' },
  MEMBER: { label: '成员', className: 'bg-gray-100 text-gray-600' },
}

export function CircleSelector() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)

  const utils = trpc.useContext()

  const { data: circles, isLoading } = trpc.circle.myCircles.useQuery(undefined, {
    enabled: sessionStatus === 'authenticated'
  })

  const { mutate: joinCircle, isPending: joinLoading } = trpc.circle.join.useMutation({
    onSuccess: () => {
      toast.success('加入成功！')
      setShowJoinModal(false)
      setInviteCode('')
      utils.circle.myCircles.invalidate()
    },
    onError: (error: any) => {
      toast.error(error?.message || '加入失败，请重试')
    },
  })

  // Session loading
  if (sessionStatus === 'loading') {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-muted-foreground">加载中...</p>
      </div>
    )
  }

  // Not authenticated - redirect to login
  if (sessionStatus === 'unauthenticated') {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-4 p-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <Users size={32} className="text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="text-lg font-medium">请先登录</p>
          <p className="mt-1 text-sm text-muted-foreground">登录后即可创建或加入学习圈子</p>
        </div>
        <Button onClick={() => router.push('/login')}>
          去登录
        </Button>
      </div>
    )
  }

  // Circles loading
  if (isLoading) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-muted-foreground">加载中...</p>
      </div>
    )
  }

  if (!circles || circles.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-4 p-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <Users size={32} className="text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="text-lg font-medium">你还没有加入任何圈子</p>
          <p className="mt-1 text-sm text-muted-foreground">创建一个学习圈子，邀请朋友一起打卡</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push('/circle/create')}>
            <Plus className="mr-1" size={16} />
            创建圈子
          </Button>
          <Button variant="outline" onClick={() => setShowJoinModal(true)}>
            加入圈子
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">选择圈子</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/circle/create')}>
            <Plus className="mr-1" size={14} />
            创建
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowJoinModal(true)}>
            <Plus className="mr-1" size={14} />
            加入
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {circles.map((circle) => {
          const role = roleMap[circle.role] || roleMap.MEMBER
          const isPersonal = circle.name.includes('的个人空间')
          return (
            <button
              key={circle.id}
              onClick={() => router.push(`${pathname}?circle=${circle.id}`)}
              className="flex items-center gap-4 rounded-lg border bg-white p-4 text-left transition-shadow hover:shadow-md"
            >
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${isPersonal ? 'bg-purple-100 text-purple-600' : 'bg-primary/10 text-primary'}`}>
                <UserCircle size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate font-semibold">{circle.name}</span>
                  {isPersonal && (
                    <span className="shrink-0 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                      个人
                    </span>
                  )}
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${role.className}`}>
                    {role.label}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">点击进入该圈子</p>
              </div>
            </button>
          )
        })}
      </div>

      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowJoinModal(false)}>
          <div className="w-full max-w-md rounded-lg bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-semibold">加入圈子</h2>
            <p className="mb-4 text-sm text-muted-foreground">向朋友索要邀请码，输入即可加入圈子</p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">邀请码</Label>
                <Input
                  id="code"
                  placeholder="输入邀请码"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setLoading(true)
                    joinCircle({ inviteCode: inviteCode.toUpperCase() })
                  }}
                  disabled={joinLoading || inviteCode.length < 4}
                >
                  {joinLoading ? '加入中...' : '加入'}
                </Button>
                <Button variant="outline" onClick={() => setShowJoinModal(false)}>
                  取消
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
