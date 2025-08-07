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
import { cn } from '@/lib/utils'

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
  'my-character': 'sidebar.myCharacter',
  members: 'sidebar.settlementMembers',
  projects: 'sidebar.settlementProjects',
  treasury: 'sidebar.settlementTreasury',
  skills: 'sidebar.skills',
  research: 'sidebar.research',
  manage: 'sidebar.settlementManage'
}

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const pathname = usePathname()
  const t = useTranslations()
  // Generate breadcrumb items from current pathname
  const generateBreadcrumbs = (path: string) => {
    const segments = path.split('/').filter(Boolean);
    const breadcrumbs = []

         // Add home
     breadcrumbs.push({
       label: t('sidebar.mainPage'),
       href: '/',
       isLast: segments.length === 0
     })

    // Add segments
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      const href = '/' + segments.slice(0, i + 1).join('/')
      const isLast = i === segments.length - 1
      
      // Try to translate the segment
      const translatedLabel = pathTranslations[segment] 
        ? t(pathTranslations[segment])
        : segment.charAt(0).toUpperCase() + segment.slice(1)
      
      breadcrumbs.push({
        label: translatedLabel,
        href,
        isLast
      })
    }

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs(pathname)

  return (
    <header className={cn("bg-background border-b", className)}>
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
          

        </div>
      </div>
    </header>
  )
}
