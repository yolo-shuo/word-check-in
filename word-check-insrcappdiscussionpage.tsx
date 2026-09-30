'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { trpc } from '@/providers/trpc-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CircleSelector } from '@/components/circle-selector'
import { UserAvatar } from '@/components/user-avatar'
import { LoadingState, ErrorState, EmptyState } from '@/components/page-states'
import { getRelativeTime } from '@/lib/utils'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { useSession } from 'next-auth/react'
import { Trash2, RefreshCw, MessageSquare, Image } from 'lucide-react'

function DiscussionContent() {
  const searchParams = useSearchParams()
  const circleId = searchParams.get('circle')
  const [messageText, setMessageText] = useState('')
  const [showQuickMessages, setShowQuickMessages] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showRetentionNotice, setShowRetentionNotice] = useState(false)
  const { data: session } = useSession()

  const { data, isLoading, error, refetch } = trpc.discussion.list.useQuery(
    circleId ? { circleId } : undefined,
    { enabled: !!circleId, refetchInterval: 30000 }
  )

  const { data: settings } = trpc.discussion.getSettings.useQuery(
    circleId ? { circleId } : undefined,
    { enabled: !!circleId }
  )

  const { mutate: sendMessage, isLoading: sending } = trpc.discussion.send.useMutation({
    onSuccess: () => {
      setMessageText('')
      toast.success('发送成功')
      refetch()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const { mutate: markRead } = trpc.discussion.markRead.useMutation()

  const { data: quickMessages } = trpc.discussion.quickMessages.useQuery()

  const { data: unread } = trpc.discussion.unreadCount.useQuery(
    circleId ? { circleId } : undefined,
    { enabled: !!circleId, refetchInterval: 30000 }
  )

  const { mutate: deleteMessage } = trpc.discussion.delete.useMutation({
    onSuccess: () => {
      toast.success('消息已删除')
      refetch()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  useEffect(() => {
    if (data?.messages) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      if (data.messages.length > 0) {
        markRead({ circleId: circleId!, messageId: data.messages[0].id })
      }
    }
  }, [data?.messages?.length])

  const sensitiveWords = ['垃圾', '傻子', '笨蛋', '混蛋', '去死', '滚', 'fuck', 'shit', 'bitch']
  const hasSensitiveWord = (text: string) => {
    const lower = text.toLowerCase()
    return sensitiveWords.some(w => lower.includes(w.toLowerCase()))
  }

  const handleSend = () => {
    if (!messageText.trim() || !circleId) return
    if (hasSensitiveWord(messageText)) {
      toast.error('消息包含敏感词，已自动过滤')
    }
    sendMessage({
      circleId,
      type: 'TEXT',
      content: messageText,
    })
  }

  const handleQuickMessage = (msg: string) => {
    if (!circleId) return
    sendMessage({
      circleId,
      type: 'TEXT',
      content: msg,
    })
    setShowQuickMessages(false)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !circleId) return
    const reader = new FileReader()
    reader.onload = () => {
      sendMessage({
        circleId,
        type: 'IMAGE',
        imageUrl: reader.result as string,
      })
    }
    reader.readAsDataURL(file)
  }

  const groupedMessages = data?.messages?.reduce((acc, msg) => {
    const dateStr = format(new Date(msg.createdAt), 'yyyy-MM-dd')
    if (!acc[dateStr]) {
      acc[dateStr] = []
    }
    acc[dateStr].push(msg)
    return acc
  }, {} as Record<string, any[]>)

  if (!circleId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">学习讨论</h1>
        <CircleSelector />
      </div>
    )
  }

  if (error) {
    return (
      <ErrorState
        message="加载失败：" + error.message
        hint="请确保已登录并选择正确的圈子"
        onRetry={() => refetch()}
        height="h-40"
      />
    )
  }

  if (isLoading) {
    return <LoadingState />
  }

  const discussionEnabled = settings?.enabled !== false

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">学习讨论</h1>
        <div className="flex items-center gap-3">
          {unread && unread.count > 0 && (
            <span className="rounded-full bg-red-500 px-3 py-1 text-sm text-white">{unread.count} 条未读</span>
          )}
          <button
            onClick={() => setShowRetentionNotice(!showRetentionNotice)}
            className="text-xs text-muted-foreground hover:text-foreground"
            title="消息保留说明"
          >
            ⚙️
          </button>
        </div>
      </div>

      {showRetentionNotice && (
        <div className="mb-4 rounded-md bg-blue-50 p-3 text-sm text-blue-800">
          消息保留说明：讨论消息将永久保留，除非被作者或圈主删除。被删除的消息不可恢复。
          <button onClick={() => setShowRetentionNotice(false)} className="ml-2 text-blue-600 hover:underline">关闭</button>
        </div>
      )}

      {!discussionEnabled && (
        <div className="mb-4 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
          该圈子的讨论区已被圈主关闭，你无法发送消息。
        </div>
      )}

      <div className="mb-4 h-[60vh] overflow-y-auto rounded-lg border bg-white p-4">
        {groupedMessages && Object.keys(groupedMessages).length > 0 ? (
          Object.entries(groupedMessages).map(([date, messages]) => (
            <div key={date} className="mb-4">
              <div className="mb-2 text-center text-sm text-muted-foreground">{date}</div>
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className="flex gap-3 group">
                    <UserAvatar user={msg.user} size="md" />
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-sm font-medium">{msg.user.nickname}</span>
                        <span className="text-xs text-muted-foreground">{getRelativeTime(msg.createdAt)}</span>
                        {(msg.userId === session?.user?.id) && (
                          <button
                            onClick={() => {
                              if (confirm('确定要删除这条消息吗？删除后不可恢复。')) {
                                deleteMessage({ messageId: msg.id })
                              }
                            }}
                            className="ml-1 text-xs text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="删除消息"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                      {msg.type === 'TEXT' && msg.content && (
                        <div className="rounded-lg bg-muted p-3 text-sm">{msg.content}</div>
                      )}
                      {msg.type === 'CHECKIN' && msg.checkin && (
                        <div className="rounded-lg bg-blue-50 p-3">
                          <div className="text-sm font-medium">{msg.user.nickname} 完成了打卡</div>
                          <div className="text-xs text-muted-foreground">
                            {msg.checkin.vocabVersion.name} · {msg.checkin.wordCount}词 · {msg.checkin.minutes}分钟
                          </div>
                        </div>
                      )}
                      {msg.type === 'WORD' && msg.entry && (
                        <div className="rounded-lg bg-green-50 p-3">
                          <div className="text-sm font-medium">{msg.user.nickname} 分享了单词</div>
                          <div className="text-xs text-muted-foreground">
                            <span className="font-mono">{msg.entry.term}</span>
                            {msg.entry.phonetic && ' /' + msg.entry.phonetic + '/'}
                            {msg.entry.definition && ' - ' + msg.entry.definition}
                          </div>
                        </div>
                      )}
                      {msg.type === 'IMAGE' && msg.imageUrl && (
                        <img src={msg.imageUrl} alt="图片" className="max-w-full rounded-lg" />
                      )}
                      {msg.parent && (
                        <div className="mt-2 rounded-lg bg-yellow-50 p-2 text-xs text-muted-foreground">
                          回复了 {msg.parent.user.nickname}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            icon={<MessageSquare size={40} className="opacity-50" />}
            title="还没有消息，快来发送第一条消息吧！"
            height="h-full"
          />
        )}
        <div ref={messagesEndRef} />
      </div>

      {showQuickMessages && (
        <div className="mb-2 flex flex-wrap gap-2">
          {quickMessages?.map((msg, idx) => (
            <Button key={idx} size="sm" variant="outline" onClick={() => handleQuickMessage(msg)}>
              {msg}
            </Button>
          ))}
        </div>
      )}

      {discussionEnabled && (
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => setShowQuickMessages(!showQuickMessages)} title="快捷消息">
            <MessageSquare size={16} />
          </Button>
          <label className="flex items-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={sending}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                document.querySelector('input[type="file"]')?.click()
              }}
              disabled={sending}
              title="发送图片"
            >
              <Image size={16} />
            </Button>
          </label>
          <Input
            placeholder="输入消息...（敏感词将被自动过滤）"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1"
            disabled={sending}
          />
          <Button onClick={handleSend} disabled={sending || !messageText.trim()}>
            {sending ? '发送中...' : '发送'}
          </Button>
        </div>
      )}
    </div>
  )
}

export default function DiscussionPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">加载中...</div>}>
      <DiscussionContent />
    </Suspense>
  )
}
