'use client'

import { useAuth } from '@/hooks/use-auth'
import { useSettlementPermissions } from '@/hooks/use-settlement-permissions'
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
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  LogOut, 
  LogIn,
  User,
  Users,
  Crown,
  Shield,
  Hammer,
  Package,
  Building,
  DollarSign,
  HelpCircle,
  RefreshCw
} from 'lucide-react'

export function UserNavNew() {
  const { user, session, loading, signOut } = useAuth()
  const { userRole, permissions, loading: permissionsLoading } = useSettlementPermissions()
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

  const getRoleIcon = () => {
    if (!userRole) return <User className="h-3 w-3" />
    
    switch (userRole.level) {
      case 'co-owner': return <Crown className="h-3 w-3" />
      case 'officer': return <Shield className="h-3 w-3" />
      case 'builder': return <Hammer className="h-3 w-3" />
      case 'storage': return <Package className="h-3 w-3" />
      default: return <User className="h-3 w-3" />
    }
  }

  const getRoleColor = () => {
    if (!userRole) return "secondary"
    
    switch (userRole.level) {
      case 'co-owner': return "default" // Gold/yellow
      case 'officer': return "default" // Blue
      case 'builder': return "secondary"
      case 'storage': return "secondary"
      default: return "outline"
    }
  }

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
              <div className="flex items-center gap-2 w-full">
                <p className="text-sm font-medium leading-none truncate">
                  {displayName}
                </p>
                {userRole && (
                  <Badge variant={getRoleColor()} className="text-xs py-0 px-1 h-4">
                    {getRoleIcon()}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate w-full">
                {user?.email}
              </p>
            </div>
          </div>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-72" align="end" forceMount>
        {/* User Info Header */}
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              {userRole && (
                <Badge variant={getRoleColor()} className="text-xs">
                  {getRoleIcon()}
                  <span className="ml-1">{userRole.displayName}</span>
                </Badge>
              )}
            </div>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />

        {/* Personal Section */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs text-muted-foreground font-medium">
            Personal
          </DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <a href="/en/profile">
              <User className="mr-2 h-4 w-4" />
              <span>Account Settings</span>
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href="/en/settings">
              <Settings className="mr-2 h-4 w-4" />
              <span>App Preferences</span>
            </a>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Character Section */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs text-muted-foreground font-medium">
            Character
          </DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <a href="/en/auth/claim-character">
              <RefreshCw className="mr-2 h-4 w-4" />
              <span>Switch Character</span>
            </a>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Settlement Section - Role Based */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs text-muted-foreground font-medium">
            Settlement
          </DropdownMenuLabel>
          
          {/* Always visible to settlement members */}
          <DropdownMenuItem asChild>
            <a href="/en/settlement">
              <Building className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </a>
          </DropdownMenuItem>

          {/* Projects - Members can view, some can manage */}
          <DropdownMenuItem asChild>
            <a href="/en/settlement/projects">
              <Package className="mr-2 h-4 w-4" />
              <span>Projects</span>
              {userRole?.canManageProjects && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  Manage
                </Badge>
              )}
            </a>
          </DropdownMenuItem>

          {/* Treasury - All members can view, Officers/Co-Owners can manage */}
          {userRole?.canViewTreasury && (
            <DropdownMenuItem asChild>
              <a href="/en/settlement/treasury">
                <DollarSign className="mr-2 h-4 w-4" />
                <span>Treasury</span>
                {userRole?.canManageTreasury && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    Manage
                  </Badge>
                )}
              </a>
            </DropdownMenuItem>
          )}

          {/* Members - All members can view, Officers/Co-Owners can manage */}
          {userRole?.canViewMembers && (
            <DropdownMenuItem asChild>
              <a href="/en/settlement/members">
                <Users className="mr-2 h-4 w-4" />
                <span>Members</span>
                {userRole?.canManageMembers && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    Manage
                  </Badge>
                )}
              </a>
            </DropdownMenuItem>
          )}

          {/* Settlement Admin - Officers/Co-Owners only */}
          {userRole?.canManageSettlement && (
            <DropdownMenuItem asChild>
              <a href="/en/settlement/manage">
                <Shield className="mr-2 h-4 w-4" />
                <span>Settlement Admin</span>
              </a>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Help Section */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs text-muted-foreground font-medium">
            Support
          </DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <a href="/help" target="_blank">
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>Get Help</span>
            </a>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Sign Out */}
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}