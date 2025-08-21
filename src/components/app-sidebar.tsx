'use client'

import { Link, usePathname } from '@/i18n/navigation'
import { ChevronRight } from 'lucide-react'
import * as React from 'react'

import { EnhancedSearchForm } from '@/components/enhanced-search-form'
import { UserNav } from '@/components/user-nav'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail
} from '@/components/ui/sidebar'
import { SITE_CONFIG } from '@/config/site-config'
import type { SearchData } from '@/lib/spacetime-db-new/shared/dtos/search-dtos'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

import { Logo } from './logo'
import { useClaimPlayerContext } from '@/contexts/claim-player-context';

// Type definitions for navigation items
type NavigationItem = {
  translationKey: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  external?: boolean
  comingSoon?: boolean
}

// Import Phosphor icons
import {
  BookOpenIcon,
  CalculatorIcon,
  ChartBarIcon,
  CoinsIcon,
  CubeIcon,
  FlaskIcon,
  FolderIcon,
  GraduationCapIcon,
  HammerIcon,
  HouseIcon,
  InfoIcon,
  ListIcon,
  MountainsIcon,
  TreeIcon,
  UserIcon,
  UsersIcon
} from '@phosphor-icons/react'

// Navigation data with icons and descriptions
const data = {
  homeItem: { translationKey: 'sidebar.mainPage', href: '/', icon: HouseIcon },
  navMain: [
    {
      translationLabel: 'sidebar.settlement',
      children: [
        { translationKey: 'sidebar.settlementDashboard', href: '/settlement', icon: ChartBarIcon },
        { translationKey: 'sidebar.myCharacter', href: '/settlement/my-character', icon: UserIcon },
        { translationKey: 'sidebar.settlementMembers', href: '/settlement/members', icon: UsersIcon },
        { translationKey: 'sidebar.skills', href: '/settlement/skills', icon: GraduationCapIcon },
        { translationKey: 'sidebar.research', href: '/settlement/research', icon: FlaskIcon },
        { translationKey: 'sidebar.projects', href: '/settlement/projects', icon: FolderIcon },
        { translationKey: 'sidebar.settlementTreasury', href: '/settlement/treasury', icon: CoinsIcon },
        {
          translationKey: 'sidebar.calculator',
          href: '/calculator',
          icon: CalculatorIcon
        },
        {
          translationKey: 'sidebar.calculatorNew',
          href: '/calculator-new',
          icon: CalculatorIcon
        }
      ]
    },
    {
      translationLabel: 'sidebar.compendium',
      children: [
        { translationKey: 'sidebar.codex', href: '/compendium/codex', icon: BookOpenIcon },
        {
          translationKey: 'sidebar.compendiumTools',
          href: '/compendium/tools',
          icon: HammerIcon
        },
        { translationKey: 'sidebar.resources', href: '/compendium/resources', icon: MountainsIcon },
        { translationKey: 'sidebar.buildings', href: '/compendium/buildings', icon: CubeIcon },
        {
          translationKey: 'sidebar.deployables',
          href: '/compendium/collectibles/deployable',
          icon: TreeIcon
        },
        { translationKey: 'sidebar.seeAll', href: '/compendium', icon: ListIcon }
      ]
    },
    {
      translationLabel: 'sidebar.recentChanges',
      children: [
        {
          translationKey: 'sidebar.changelog',
          href: '/changelog',
          icon: BookOpenIcon
        }
      ],
      description: 'sidebar.recentChangesDescription'
    }
  ],
  navSolo: [
    {
      translationLabel: 'sidebar.settlement',
      children: [
        { translationKey: 'sidebar.myCharacter', href: '/settlement/my-character', icon: UserIcon },
      ]
    },
    {
      translationLabel: 'sidebar.compendium',
      children: [
        { translationKey: 'sidebar.codex', href: '/compendium/codex', icon: BookOpenIcon },
        {
          translationKey: 'sidebar.compendiumTools',
          href: '/compendium/tools',
          icon: HammerIcon
        },
        { translationKey: 'sidebar.resources', href: '/compendium/resources', icon: MountainsIcon },
        { translationKey: 'sidebar.buildings', href: '/compendium/buildings', icon: CubeIcon },
        {
          translationKey: 'sidebar.deployables',
          href: '/compendium/collectibles/deployable',
          icon: TreeIcon
        },
        { translationKey: 'sidebar.seeAll', href: '/compendium', icon: ListIcon }
      ]
    },
    {
      translationLabel: 'sidebar.recentChanges',
      children: [
        {
          translationKey: 'sidebar.changelog',
          href: '/changelog',
          icon: BookOpenIcon
        }
      ],
      description: 'sidebar.recentChangesDescription'
    }
  ]
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  searchData: SearchData
}

export function AppSidebar({ searchData, ...props }: AppSidebarProps) {
  const pathname = usePathname()
  const t = useTranslations()
  const { member, isClaimed, isSolo } = useClaimPlayerContext()

  // Directly compute navItems without useState to avoid hydration mismatch
  const navItems = isSolo ? data.navSolo : data.navMain

  const isActive = (href: string) => {
    // Exact match for home page
    if (href === '/') {
      return pathname === '/'
    }

    // Exact match for compendium root
    if (href === '/compendium') {
      return pathname === '/compendium'
    }

    // For settlement pages, check for exact path matches or proper sub-path
    if (href.startsWith('/settlement')) {
      // Exact match for settlement dashboard
      if (href === '/settlement') {
        return pathname === '/settlement'
      }
      
      // For sub-pages, check exact match or immediate child pages
      return pathname === href || pathname.startsWith(href + '/')
    }

    // For other paths, check if current path starts with the href
    return pathname === href || pathname.startsWith(href + '/')
  }

  const renderNavigationItem = (item: NavigationItem) => {
    const Icon = item.icon
    return (
      <SidebarMenuItem key={item.href}>
        <Button
          variant={isActive(item.href) ? 'secondary' : 'ghost'}
          size="sm"
          className={cn(
            'h-8 w-full justify-start text-sm font-normal',
            isActive(item.href) && 'bg-accent'
          )}
          asChild={!item.comingSoon}
          disabled={item.comingSoon}
        >
          {item.comingSoon ? (
            <div className="flex w-full items-center">
              {Icon && <Icon className="mr-2 h-4 w-4" />}
              {item.translationKey === 'sidebar.myCharacter' && isClaimed && member
                ? member.name
                : t(item.translationKey)
              }
              <Badge variant="secondary" className="ml-auto text-xs">
                {t('sidebar.comingSoon')}
              </Badge>
            </div>
          ) : item.external ? (
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center"
            >
              {Icon && <Icon className="mr-2 h-4 w-4" />}
              {item.translationKey === 'sidebar.myCharacter' && isClaimed && member
                ? member.name
                : t(item.translationKey)
              }
            </a>
          ) : (
            <Link href={item.href} className="flex items-center">
              {Icon && <Icon className="mr-2 h-4 w-4" />}
              {item.translationKey === 'sidebar.myCharacter' && isClaimed && member
                ? member.name
                : t(item.translationKey)
              }
            </Link>
          )}
        </Button>
      </SidebarMenuItem>
    )
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader className="space-y-2">
        <div className="flex h-10 items-center">
          <Logo />
        </div>
        <EnhancedSearchForm searchData={searchData} />
      </SidebarHeader>
      <SidebarContent className="gap-0">
        {/* Standalone Home Item */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {renderNavigationItem(data.homeItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {navItems.map((section: any) => (
          <Collapsible
            key={section.translationLabel}
            defaultOpen
            className="group/collapsible"
          >
            <SidebarGroup>
              <SidebarGroupLabel
                asChild
                className="group/label text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm"
              >
                <CollapsibleTrigger>
                  {t(section.translationLabel)}{' '}
                  <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent className="ml-2">
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.children.length > 0 ? (
                      section.children.map(renderNavigationItem)
                    ) : (
                      <div className="px-2 py-1">
                        <div className="text-muted-foreground text-xs">
                          {section.description && t(section.description)}
                        </div>
                      </div>
                    )}
                  </SidebarMenu>
                  {section.description && section.children.length > 0 && (
                    <div className="px-2 py-1">
                      <div className="text-muted-foreground text-xs">
                        {t(section.description)}
                      </div>
                    </div>
                  )}
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>

      {/* User Navigation - Bottom of sidebar */}
      <div className="border-t p-4">
        <UserNav />
      </div>

      <SidebarRail />
    </Sidebar>
  )
}
