'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

const STORAGE_KEY = 'login_credentials'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 页面加载时，读取保存的凭据
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const { email: savedEmail, password: savedPassword } = JSON.parse(saved)
        setEmail(savedEmail)
        setPassword(savedPassword)
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // 添加超时控制，防止无限加载
      const result = await Promise.race([
        signIn('credentials', { email, password, redirect: false }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('TIMEOUT')), 10000)
        )
      ])

      if ((result as any)?.error) {
        setError('邮箱或密码错误')
        toast.error('邮箱或密码错误')
      } else {
        if (rememberMe) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ email, password }))
        }
        toast.success('登录成功')
        router.push('/feed')
        router.refresh()
      }
    } catch (err: any) {
      if (err.message === 'TIMEOUT') {
        setError('登录超时，请检查网络连接或稍后重试')
        toast.error('登录超时，请检查网络连接或稍后重试')
      } else {
        setError('登录失败，请重试')
        toast.error('登录失败，请重试')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleClearCredentials = () => {
    localStorage.removeItem(STORAGE_KEY)
    setEmail('')
    setPassword('')
    setRememberMe(false)
    toast.success('已清除保存的登录信息')
  }

  const handleForgotPassword = () => {
    toast('忘记密码功能即将上线，请联系管理员重置密码')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">登录</CardTitle>
          <CardDescription className="text-center">登录后进入学习动态，开始今天的打卡</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}
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
              <p className="text-xs text-muted-foreground">仅支持邮箱登录，暂不支持手机号或用户名</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">密码</Label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs text-primary hover:underline"
                >
                  忘记密码？
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                密码要求：至少10位，包含大小写字母、数字和特殊字符
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="rememberMe"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label htmlFor="rememberMe" className="text-sm">
                  记住我
                </Label>
              </div>
              <button
                type="button"
                onClick={handleClearCredentials}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                清除已保存信息
              </button>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '登录中...' : '登录'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            还没有账户？{' '}
            <Link href="/register" className="text-primary hover:underline">
              注册一个
            </Link>
          </div>
          <div className="mt-4 border-t pt-4 text-center text-xs text-muted-foreground">
            登录即表示你同意{' '}
            <Link href="/terms" className="text-primary hover:underline">
              用户协议
            </Link>{' '}
            和{' '}
            <Link href="/privacy" className="text-primary hover:underline">
              隐私政策
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
