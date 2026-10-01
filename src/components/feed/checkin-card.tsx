'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { trpc } from '@/providers/trpc-provider'

import { getRelativeTime } from '@/lib/utils'
import toast from 'react-hot-toast'

interface CheckinCardProps {
  checkin: {
    id: string
    wordCount: number
    minutes: number
    note: string | null
    date: string
    createdAt: Date
    user: { nickname: string; avatarUrl: string | null }
    vocabVersion: { name: string; level: string; version: string }
    likeCount: number
    commentCount: number
    hasLiked: boolean
    isToday: boolean
  }
}

export function CheckinCard({ checkin: c }: CheckinCardProps) {
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [loading, setLoading] = useState(false)

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

  const levelMap: Record<string, string> = { CET4: '四级', CET6: '六级', COMBINED: '综合', CUSTOM: '自定义' }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          {c.user.avatarUrl ? (
            <img src={c.user.avatarUrl} alt={c.user.nickname} className="h-10 w-10 rounded-full" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              {c.user.nickname[0]}
            </div>
          )}
          <div>
            <p className="font-medium">{c.user.nickname}</p>
            <p className="text-xs text-muted-foreground">{getRelativeTime(c.createdAt)}</p>
          </div>
        </div>
        {c.isToday && (
          <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">今天</span>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-md bg-secondary px-2 py-1 text-sm font-medium">
            {c.vocabVersion.name} {levelMap[c.vocabVersion.level] || c.vocabVersion.level}
          </span>
          <span className="rounded-md bg-blue-50 px-2 py-1 text-sm font-medium text-blue-700">
            {c.wordCount} 个单词
          </span>
          <span className="rounded-md bg-purple-50 px-2 py-1 text-sm font-medium text-purple-700">
            {c.minutes} 分钟
          </span>
        </div>
        {c.note && <p className="text-sm">{c.note}</p>}
        <div className="flex items-center gap-4 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleLike({ checkinId: c.id })}
            className={c.hasLiked ? 'text-red-500' : ''}
          >
            {c.hasLiked ? '❤️' : '🤍'} {c.likeCount}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowComments(!showComments)}>
            💬 {c.commentCount}
          </Button>
          <Link href={`/checkin/${c.id}`}>
            <Button variant="ghost" size="sm">
              详情
            </Button>
          </Link>
        </div>
        {showComments && (
          <div className="space-y-3 border-t pt-3">
            <div className="flex gap-2">
              <Input
                placeholder="写评论..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={() => {
                  setLoading(true)
                  addComment({ checkinId: c.id, content: commentText })
                }}
                disabled={loading || !commentText.trim()}
              >
                发送
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
