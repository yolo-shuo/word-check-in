'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function useConfirm() {
  const [dialogData, setDialogData] = useState<{
    open: boolean
    title: string
    description?: string
    confirmText?: string
    cancelText?: string
    variant?: 'default' | 'destructive'
    onConfirm?: () => void
  }>({ open: false, title: '' })

  const confirm = (options: Omit<typeof dialogData, 'open'>) => {
    setDialogData({ ...options, open: true })
  }

  const close = () => {
    setDialogData((d) => ({ ...d, open: false }))
  }

  const handleConfirm = () => {
    dialogData.onConfirm?.()
    close()
  }

  const Dialog = dialogData.open ? (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) close()
      }}
    >
      <div
        className="w-full max-w-md rounded-xl border bg-background p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold">{dialogData.title}</h3>
        {dialogData.description && (
          <p className="mt-2 text-sm text-muted-foreground">
            {dialogData.description}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={close}>
            {dialogData.cancelText || '取消'}
          </Button>
          <Button
            variant={dialogData.variant || 'default'}
            onClick={handleConfirm}
          >
            {dialogData.confirmText || '确认'}
          </Button>
        </div>
      </div>
    </div>
  ) : null

  return { confirm, Dialog }
}
