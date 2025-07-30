'use client'

import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Settings, 
  LogOut, 
  LogIn 
} from 'lucide-react'

export function UserNav() {
  const { user, session, loading, signOut } = useAuth()
  const router = useRouter()

  const handleSignIn = () => {
    router.push('/en/auth/signin')
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/en/auth/signin')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex items-center space-x-3 p-2">
        <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
        <div className="space-y-1 flex-1">
          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          <div className="h-3 w-32 bg-muted rounded animate-pulse" />
        </div>
      </div>
    )
  }

  if (!session || !user) {
    return (
      <Button onClick={handleSignIn} variant="outline" className="w-full justify-start">
        <LogIn className="mr-2 h-4 w-4" />
        Sign In
      </Button>
    )
  }

  const displayName = user.user_metadata?.name || user.user_metadata?.preferred_username || user.email?.split('@')[0] || 'User'
  const initials = displayName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'U'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-start p-2 h-auto">
          <div className="flex items-center space-x-3 w-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.user_metadata?.avatar_url || ''} alt={displayName} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start flex-1 min-w-0">
              <p className="text-sm font-medium leading-none truncate w-full">
                {displayName}
              </p>
              <p className="text-xs text-muted-foreground truncate w-full">
                {user?.email}
              </p>
            </div>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <a href="/settings">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </a>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}