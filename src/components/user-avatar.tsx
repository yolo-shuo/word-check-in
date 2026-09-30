'use client'

interface UserAvatarProps {
  user: { nickname: string; avatarUrl: string | null }
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function UserAvatar({ user, size = 'lg', className = '' }: UserAvatarProps) {
  const sizeCls = size === 'sm' ? 'h-6 w-6 text-xs' : size === 'md' ? 'h-8 w-8 text-sm' : 'h-10 w-10 text-base'

  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.nickname}
        className={'rounded-full ' + sizeCls + ' ' + className}
      />
    )
  }

  return (
    <div className={'flex items-center justify-center rounded-full bg-primary text-primary-foreground ' + sizeCls + ' ' + className}>
      {user.nickname[0]}
    </div>
  )
}
