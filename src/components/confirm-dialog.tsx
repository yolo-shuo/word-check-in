'use client'

import { useState } from 'react'

export function useConfirm() {
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: '',
    description: '',
    confirmText: '确认',
    cancelText: '取消',
    variant: 'default' as 'default' | 'destructive',
    onConfirm: () => {},
  })

  const confirm = (options: {
    title: string
    description?: string
    confirmText?: string
    cancelText?: string
    variant?: 'default' | 'destructive'
    onConfirm: () => void
  }) => {
    setConfirmState({
      open: true,
      title: options.title,
      description: options.description || '',
      confirmText: options.confirmText || '确认',
      cancelText: options.cancelText || '取消',
      variant: options.variant || 'default',
      onConfirm: options.onConfirm,
    })
  }

  const close = () => setConfirmState({ ...confirmState, open: false })

  const Dialog = (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center ${
        confirmState.open ? 'visible' : 'invisible pointer-events-none'
      }`}
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={close}
      />
      <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold">{confirmState.title}</h3>
        {confirmState.description && (
          <p className="mt-2 text-sm text-muted-foreground">{confirmState.description}</p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button
            className="rounded-md px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200"
            onClick={close}
          >
            {confirmState.cancelText}
          </button>
          <button
            className={`rounded-md px-4 py-2 text-sm font-medium ${
              confirmState.variant === 'destructive'
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
            onClick={() => {
              confirmState.onConfirm()
              close()
            }}
          >
            {confirmState.confirmText}
          </button>
        </div>
      </div>
    </div>
  )

  return { confirm, Dialog }
}
