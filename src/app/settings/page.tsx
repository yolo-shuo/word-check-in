'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { trpc } from '@/providers/trpc-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useConfirm } from '@/components/confirm-dialog'
import { Camera, Download } from 'lucide-react'

import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { data: session } = useSession()
  const [nickname, setNickname] = useState(session?.user?.name || '')
  const [loading, setLoading] = useState(false)
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const { confirm: showConfirm, Dialog: ConfirmDialog } = useConfirm()

  const { mutate: updateProfile } = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      toast.success('资料更新成功')
    },
    onError: (error) => toast.error(error.message)
  })

  const { mutate: changePassword, isLoading: changePasswordLoading } = trpc.auth.changePassword.useMutation({
    onSuccess: () => {
      toast.success('密码修改成功，请使用新密码登录')
      setShowPasswordChange(false)
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    },
    onError: (error) => toast.error(error.message),
  })

  const { mutate: deactivate, isLoading: deactivating } = trpc.auth.deactivate.useMutation({
    onSuccess: () => {
      toast.success('账号已注销')
      signOut({ redirect: false })
      window.location.href = '/login'
    },
    onError: (error) => toast.error(error.message)
  })

  const handleExport = async (format: string) => {
    try {
      const result = await trpc.export.exportProfile.query({ circleId: '', format: format as 'JSON' | 'CSV' })
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `export-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('数据导出成功')
    } catch {
      toast.error('导出失败')
    }
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('图片大小不能超过 2MB')
      return
    }
    // TODO: 后端需要头像上传 API
    toast.success('头像上传功能即将上线')
  }

  const handlePasswordChange = () => {
    if (newPassword !== confirmPassword) {
      toast.error('两次输入的密码不一致')
      return
    }
    if (newPassword.length < 10) {
      toast.error('新密码至少 10 个字符')
      return
    }
    changePassword({ oldPassword, newPassword })
  }

  const handleDeactivateConfirm = () => {
    showConfirm({
      title: '确认注销账号？',
      description: '注销后你的所有数据将被永久删除，包括打卡记录、笔记和圈子会员关系，且不可恢复。请先转移所有圈子的所有者权限。',
      confirmText: '确认注销',
      variant: 'destructive',
      onConfirm: () => {
        deactivate()
      },
    })
  }

  return (
    <>
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">个人设置</h1>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">个人资料</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {session?.user?.image ? (
                    <img src={session.user.image} alt="头像" className="h-16 w-16 rounded-full" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl">
                      {(session?.user?.name || 'U')[0]}
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 cursor-pointer rounded-full bg-primary p-1 text-white hover:bg-primary/80">
                    <Camera size={12} />
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  </label>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>点击相机图标更换头像</p>
                  <p className="text-xs">支持 JPG、PNG，不超过 2MB</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nickname">昵称</Label>
                <Input id="nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={20} />
                <p className="text-xs text-muted-foreground">昵称将显示在动态、讨论和成员列表中</p>
              </div>
              <Button onClick={() => { setLoading(true); updateProfile({ nickname }) }} disabled={loading}>
                {loading ? '保存中...' : '保存资料'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">修改密码</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {showPasswordChange ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="oldPassword">当前密码</Label>
                    <Input id="oldPassword" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">新密码</Label>
                    <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                    <p className="text-xs text-muted-foreground">至少 10 个字符，包含大小写字母、数字和特殊字符</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">确认新密码</Label>
                    <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handlePasswordChange} disabled={changePasswordLoading}>
                      {changePasswordLoading ? '修改中...' : '确认修改'}
                    </Button>
                    <Button variant="outline" onClick={() => setShowPasswordChange(false)}>
                      取消
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">定期修改密码以保护账户安全</p>
                  <Button variant="outline" onClick={() => setShowPasswordChange(true)}>
                    修改密码
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">数据导出</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">导出你的个人数据，包括打卡记录、笔记和学习统计</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleExport('JSON')}>
                  <Download className="mr-1" size={14} />
                  导出 JSON
                </Button>
                <Button variant="outline" onClick={() => handleExport('CSV')}>
                  <Download className="mr-1" size={14} />
                  导出 CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader><CardTitle className="text-lg text-red-600">危险区域</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">注销账号后：</p>
                <ul className="mt-1 list-inside list-disc text-sm text-muted-foreground space-y-0.5">
                  <li>你的所有打卡记录和笔记将被永久删除</li>
                  <li>你在所有圈子中的会员关系将被解除</li>
                  <li>你发布的评论和点赞将被移除</li>
                  <li>数据删除后不可恢复</li>
                </ul>
                <p className="mt-1 text-xs text-red-500">请先转移所有圈子的所有者权限</p>
              </div>
              <Button variant="destructive" onClick={handleDeactivateConfirm} disabled={deactivating}>
                {deactivating ? '注销中...' : '注销账号'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      {ConfirmDialog}
    </>
  )
}
