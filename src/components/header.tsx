'use client'

import { Fragment } from 'react'
import { Link, usePathname } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { LanguageSwitcher } from './language-switcher'
import { ThemeSwitcher } from './theme-switcher'
import { ProfessionAvatar } from './profession-avatar'
import { Button } from './ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Settings, LogOut } from 'lucide-react'
import { useUserProfile } from '../hooks/use-user-profile'
import { useSelectedSettlement } from '../hooks/use-selected-settlement'
import { UserProfileManager } from './user-profile-manager'

// Mapping of path segments to translation keys
const pathTranslations: Record<string, string> = {
  compendium: 'sidebar.compendium',
  calculator: 'sidebar.calculator',
  changelog: 'sidebar.changelog',
  about: 'sidebar.aboutUs',
  settlement: 'sidebar.settlement',
  // Item categories
  buildings: 'sidebar.buildings',
  resources: 'sidebar.resources',
  tools: 'sidebar.tools',
  // Settlement pages
  dashboard: 'sidebar.settlementDashboard',
  members: 'sidebar.settlementMembers',
  projects: 'sidebar.settlementProjects',
  treasury: 'sidebar.settlementTreasury',
  skills: 'sidebar.skills',
  research: 'sidebar.research'
}

export function Header() {
  const pathname = usePathname()
  const t = useTranslations()
  const { profile, isLoading, clearProfile } = useUserProfile()
  const { clearSettlement } = useSelectedSettlement()

  // Check if we're in a settlement area
  const isSettlementArea = pathname.includes('/settlement')

  const handleSignOut = () => {
    clearProfile()
    clearSettlement()
    window.location.href = '/'
  }

  // Generate breadcrumb items from current pathname
  const generateBreadcrumbs = (path: string) => {
    const segments = path.split('/').filter(Boolean).slice(1) // Remove locale
    const breadcrumbs = []

         // Add home
     breadcrumbs.push({
       label: t('sidebar.mainPage'),
       href: '/',
       isLast: segments.length === 0
     })

    // Add segments
    let currentPath = ''
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`
      const isLast = index === segments.length - 1
      const translationKey = pathTranslations[segment]
      
      breadcrumbs.push({
        label: translationKey ? t(translationKey) : segment.charAt(0).toUpperCase() + segment.slice(1),
        href: currentPath,
        isLast
      })
    })

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs(pathname)

  return (
    <header className="bg-background border-border sticky top-0 z-50 w-full border-b">
      <div className="flex h-14 items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((breadcrumb) => (
                <Fragment key={breadcrumb.href}>
                  <BreadcrumbItem>
                    {breadcrumb.isLast ? (
                      <span className="text-muted-foreground">
                        {breadcrumb.label}
                      </span>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={breadcrumb.href}>{breadcrumb.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!breadcrumb.isLast && <BreadcrumbSeparator />}
                </Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center justify-end gap-2">
          <LanguageSwitcher />
          <ThemeSwitcher />
          
          {/* User Profile - only show in settlement areas */}
          {isSettlementArea && !isLoading && profile && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <ProfessionAvatar
                    profession={profile.profession}
                    displayName={profile.displayName}
                    profileColor={profile.profileColor}
                    profileInitials={profile.profileInitials}
                    size="sm"
                  />
                  <span className="hidden md:inline">{profile.displayName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <UserProfileManager
                  trigger={
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Settings className="mr-2 h-4 w-4" />
                      Profile Settings
                    </DropdownMenuItem>
                  }
                />
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  )
}
