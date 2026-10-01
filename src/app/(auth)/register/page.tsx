'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { trpc } from '@/providers/trpc-provider'
import { validatePassword } from '@/lib/utils'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const { mutate: register } = trpc.auth.register.useMutation({
    onSuccess: () => {
      toast.success('注册成功，请登录')
      router.push('/login')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const pwdError = validatePassword(password)
    if (pwdError) {
      setPasswordError(pwdError)
      return
    }
    setLoading(true)
    register({ email, nickname, password })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">创建账户</CardTitle>
          <CardDescription className="text-center">加入坚持搭子，和朋友一起学习</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                placeholder="请输入邮箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nickname">昵称</Label>
              <Input
                id="nickname"
                type="text"
                placeholder="请输入昵称"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
                maxLength={20}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="至少10位，含大小写、数字和特殊字符"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setPasswordError(null)
                }}
                required
              />
              {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '注册中...' : '注册'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            已有账户？{' '}
            <Link href="/login" className="text-primary hover:underline">
              登录
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
