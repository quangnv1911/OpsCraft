import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User } from 'lucide-react'

interface UserAvatarProps {
  user: {
    name: string
    avatar?: string
  }
  className?: string
}

export function UserAvatar({ user, className }: UserAvatarProps) {
  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)

  return (
    <Avatar className={className}>
      <AvatarImage src={user.avatar ?? '/placeholder.svg'} alt={user.name} />
      <AvatarFallback className="bg-primary text-primary-foreground">
        {user.avatar ? <User className="h-4 w-4" /> : initials}
      </AvatarFallback>
    </Avatar>
  )
}
