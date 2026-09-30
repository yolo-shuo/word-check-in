'use client'

import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LoadingStateProps {
  text?: string
  height?: string
}

export function LoadingState({ text = '加载中...', height = 'h-40' }: LoadingStateProps) {
  return (
    <div className={'flex items-center justify-center ' + height}>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="animate-spin" size={16} />
        {text}
      </div>
    </div>
  )
}

interface ErrorStateProps {
  message: string
  hint?: string
  onRetry?: () => void
  height?: string
}

export function ErrorState({ message, hint, onRetry, height = 'h-40' }: ErrorStateProps) {
  return (
    <div className={'flex flex-col items-center justify-center gap-3 ' + height}>
      <p className="text-red-500">{message}</p>
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          重试
        </Button>
      )}
    </div>
  )
}

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  height?: string
}

export function EmptyState({ icon, title, description, height = 'h-40' }: EmptyStateProps) {
  return (
    <div className={'flex flex-col items-center justify-center gap-2 ' + height}>
      {icon}
      <p className="text-muted-foreground">{title}</p>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  )
}
