'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { trpc } from '@/providers/trpc-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CircleSelector } from '@/components/circle-selector'
import { format } from 'date-fns'
import { skipToken } from '@tanstack/react-query'

function AuditContent() {
  const searchParams = useSearchParams()
  const circleId = searchParams.get('circle')

  const { data: logs, isLoading, error, refetch } = trpc.audit.list.useQuery(
    circleId ? { circleId, skip: 0, take: 100 } : skipToken,
    { enabled: !!circleId }
  )

  if (!circleId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">审计日志</h1>
        <CircleSelector />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2">
        <p className="text-red-500">加载失败：{error.message}</p>
        <Button variant="outline" onClick={() => refetch()}>重试</Button>
      </div>
    )
  }
  if (isLoading) return <div className="flex h-40 items-center justify-center text-muted-foreground">加载中...</div>

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">审计日志</h1>
      <Card>
        <CardHeader><CardTitle className="text-lg">操作记录</CardTitle></CardHeader>
        <CardContent>
          {logs && logs.length === 0 ? <p className="text-muted-foreground">暂无审计日志</p> : (
            <div className="space-y-2">
              {logs?.map((log: any) => (
                <div key={log.id} className="rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{log.eventType}</span>
                    <span className="text-xs text-muted-foreground">{format(log.createdAt, 'yyyy-MM-dd HH:mm:ss')}</span>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    操作者: {log.actor?.nickname || '未知'}
                    {log.target && ' → 目标: ' + (log.target.nickname || log.targetId)}
                  </div>
                  {log.reason && <div className="mt-1 text-sm">原因: {log.reason}</div>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function AuditPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">加载中...</div>}>
      <AuditContent />
    </Suspense>
  )
}