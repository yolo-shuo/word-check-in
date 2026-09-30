'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { trpc } from '@/providers/trpc-provider'
import { ArrowLeft } from 'lucide-react'

import toast from 'react-hot-toast'

export default function CreateCirclePage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [timezone, setTimezone] = useState('Asia/Shanghai')
  const [studyDirection, setStudyDirection] = useState('')
  const [examType, setExamType] = useState('')
  const [circleType, setCircleType] = useState<'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY'>('PRIVATE')
  const [maxMembers, setMaxMembers] = useState(50)
  const [allowMemberInvite, setAllowMemberInvite] = useState(true)
  const [allowLeaderboard, setAllowLeaderboard] = useState(true)
  const [loading, setLoading] = useState(false)

  const { mutate: createCircle, isLoading: createLoading } = trpc.circle.create.useMutation({
    onSuccess: (data) => {
      toast.success('圈子创建成功！')
      router.push('/feed?circle=' + data.id)
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  // ESC key to go back
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      router.push('/feed')
    }
  }, [router])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!session?.user) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        请先登录
      </div>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    createCircle({ name, timezone })
  }

  const handleBack = () => {
    router.push('/feed')
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <button
        onClick={handleBack}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size="16" />
        返回
      </button>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">创建圈子</CardTitle>
          <CardDescription>创建一个学习圈子，邀请朋友一起打卡 (按 ESC 返回)</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">圈子名称 *</Label>
              <Input
                id="name"
                placeholder="例如：四六级备考群"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">1-50 个字符，最多 50 个字符</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">圈子描述（可选）</Label>
              <Input
                id="description"
                placeholder="简单描述这个圈子的学习目标和规则"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label>学习方向（可选）</Label>
              <select
                value={studyDirection}
                onChange={(e) => setStudyDirection(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                <option value="">不限</option>
                <option value="CET4">大学英语四级</option>
                <option value="CET6">大学英语六级</option>
                <option value="IELTS">雅思</option>
                <option value="TOEFL">托福</option>
                <option value="GRE">GRE</option>
                <option value="考研">考研英语</option>
                <option value="专四专八">英语专四/专八</option>
                <option value="其他">其他</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>圈子类型</Label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: 'PRIVATE', label: '私密', desc: '仅邀请码加入' },
                  { value: 'PUBLIC', label: '公开', desc: '所有人可搜索加入' },
                  { value: 'INVITE_ONLY', label: '仅邀请', desc: '仅圈主可邀请' },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCircleType(opt.value)}
                    className={`rounded-md border p-3 text-left transition-colors ${
                      circleType === opt.value
                        ? 'border-primary bg-primary/10'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className="font-medium text-sm">{opt.label}</div>
                    <div className="text-xs text-muted-foreground">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxMembers">最大成员数</Label>
              <Input
                id="maxMembers"
                type="number"
                min={2}
                max={500}
                value={maxMembers}
                onChange={(e) => setMaxMembers(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">圈子最多可容纳的成员数量（2-500）</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">时区 *</Label>
              <select
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                <option value="Asia/Shanghai">亚洲/上海 (UTC+8)</option>
                <option value="UTC">协调世界时 (UTC)</option>
                <option value="Asia/Tokyo">亚洲/东京 (UTC+9)</option>
                <option value="America/New_York">美洲/纽约 (UTC-5)</option>
                <option value="America/Los_Angeles">美洲/洛杉矶 (UTC-8)</option>
                <option value="Europe/London">欧洲/伦敦 (UTC+0)</option>
              </select>
              <p className="text-xs text-muted-foreground">时区影响打卡日期的计算，创建后不可修改</p>
            </div>

            <div className="space-y-3 border-t pt-4">
              <Label>高级设置</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={allowMemberInvite}
                    onChange={(e) => setAllowMemberInvite(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">允许成员生成邀请码</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={allowLeaderboard}
                    onChange={(e) => setAllowLeaderboard(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">开启排行榜</span>
                </label>
              </div>
            </div>

            <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
              <p className="font-medium">📝 创建说明：</p>
              <ul className="mt-1 list-inside list-disc space-y-0.5">
                <li>创建后你是圈子的所有者，拥有最高权限</li>
                <li>所有者可以转移所有权给其他成员</li>
                <li>解散圈子需要所有成员同意后确认</li>
                <li>时间创建后不可修改，请确认时区正确</li>
              </ul>
            </div>

            <Button type="submit" className="w-full" disabled={createLoading || name.length < 1}>
              {createLoading ? '创建中...' : '创建圈子'}
            </Button>
            <Button type="button" variant="outline" className="w-full" onClick={handleBack}>
              取消
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
