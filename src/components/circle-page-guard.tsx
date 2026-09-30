'use client'

import { CircleSelector } from '@/components/circle-selector'

interface CirclePageGuardProps {
  circleId: string | null
  title: string
  maxWidth?: '2xl' | '3xl'
}

export function CirclePageGuard({ circleId, title, maxWidth = '3xl' }: CirclePageGuardProps) {
  if (!circleId) {
    return (
      <div className={'mx-auto max-w-' + maxWidth + ' px-4 py-8'}>
        <h1 className="mb-6 text-2xl font-bold">{title}</h1>
        <CircleSelector />
      </div>
    )
  }
  return null
}
