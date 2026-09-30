'use client'

import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'

import { trpc } from '@/providers/trpc-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

import { getRelativeTime } from '@/lib/utils'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function CheckinDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const [commentText, setCommentText] = useState('')
  const [loading, setLoading] = useState(false)
  const { data: session } = useSession()

  const { data: checkin, isLoading, error } = trpc.checkin.get.useQuery({ id })

  const { mutate: toggleLike } = trpc.feed.like.useMutation({
    onSuccess: () => {},
  })

  const { mutate: addComment } = trpc.feed.addComment.useMutation({
    onSuccess: () => {
      setCommentText('')
      toast.success('评论成功')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  if (isLoading) {
    return <div className="flex h-40 items-center justify-center text-muted-foreground">加载中...</div>
  }

  if (error) {
    return <div className="flex h-40 items-center justify-center text-red-500">加载失败</div>
  }

  if (!checkin) {
    return <div className="flex h-40 items-center justify-center text-muted-foreground">打卡不存在</div>
  }

  const levelMap: Record<string, string> = { CET4: '四级', CET6: '六级', COMBINED: '综合', CUSTOM: '自定义' }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/feed" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        ← 返回动态
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            {checkin.user.avatarUrl ? (
              <img src={checkin.user.avatarUrl} alt={checkin.user.nickname} className="h-10 w-10 rounded-full" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                {checkin.user.nickname[0]}
              </div>
            )}
            <div>
              <p className="font-medium">{checkin.user.nickname}</p>
              <p className="text-xs text-muted-foreground">{getRelativeTime(checkin.createdAt)}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-md bg-secondary px-2 py-1 text-sm font-medium">
              {checkin.vocabVersion.name} {levelMap[checkin.vocabVersion.level]} v{checkin.vocabVersion.version}
            </span>
            <span className="rounded-md bg-blue-50 px-2 py-1 text-sm font-medium text-blue-700">
              {checkin.wordCount} 个单词
            </span>
            <span className="rounded-md bg-purple-50 px-2 py-1 text-sm font-medium text-purple-700">
              {checkin.minutes} 分钟
            </span>
          </div>
          {checkin.note && <p className="text-sm">{checkin.note}</p>}
          <p className="text-xs text-muted-foreground">打卡日期：{format(checkin.date, 'yyyy-MM-dd')}</p>

          <div className="flex items-center gap-4 border-t pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleLike({ checkinId: checkin.id })}
              className={checkin.likes.some((l: { userId: string }) => l.userId === session?.user?.id) ? 'text-red-500' : ''}
            >
              ❤️ {checkin.likes.length}
            </Button>
          </div>

          {checkin.edits.length > 0 && (
            <div className="space-y-2 border-t pt-4">
              <h3 className="text-sm font-medium">修改历史</h3>
              {checkin.edits.map((edit) => (
                <div key={edit.id} className="text-xs text-muted-foreground">
                  {format(edit.createdAt, 'yyyy-MM-dd HH:mm')} · {edit.field}: {edit.oldValue || '空'} → {edit.newValue || '空'}
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3 border-t pt-4">
            <h3 className="text-sm font-medium">评论</h3>
            <div className="flex gap-2">
              <Input
                placeholder="写评论..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1"
                maxLength={500}
              />
              <Button
                onClick={() => {
                  setLoading(true)
                  addComment({ checkinId: checkin.id, content: commentText })
                }}
                disabled={loading || !commentText.trim()}
              >
                发送
              </Button>
            </div>
            {checkin.comments.map((comment) => (
              <div key={comment.id} className="rounded-md bg-muted p-3">
                <div className="flex items-center gap-2">
                  {comment.user.avatarUrl ? (
                    <img src={comment.user.avatarUrl} alt={comment.user.nickname} className="h-6 w-6 rounded-full" />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                      {comment.user.nickname[0]}
                    </div>
                  )}
                  <span className="text-sm font-medium">{comment.user.nickname}</span>
                  <span className="text-xs text-muted-foreground">{getRelativeTime(comment.createdAt)}</span>
                </div>
                <p className="mt-1 text-sm">{comment.content}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
