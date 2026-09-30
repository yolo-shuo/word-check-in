'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { trpc } from '@/providers/trpc-provider'
import toast from 'react-hot-toast'

function JoinContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = searchParams.get('code')
  const [inviteCode, setInviteCode] = useState(code || '')
  const [loading, setLoading] = useState(false)

  const { mutate: joinCircle } = trpc.circle.join.useMutation({
    onSuccess: (data) => {
      toast.success('加入成功！')
      router.push('/feed?circle=' + data.circleId)
    },
    onError: (error) => {
      toast.error('邀请码无效，请检查后重试')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    joinCircle({ inviteCode: inviteCode.toUpperCase() })
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">加入圈子</CardTitle>
          <CardDescription>输入邀请码加入学习圈子</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">邀请码</Label>
              <Input
                id="code"
                placeholder="输入邀请码"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                required
                maxLength={8}
                className="text-center text-lg font-mono tracking-widest"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading || inviteCode.length < 4}>
              {loading ? '加入中...' : '加入圈子'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">加载中...</div>}>
      <JoinContent />
    </Suspense>
  )
}
