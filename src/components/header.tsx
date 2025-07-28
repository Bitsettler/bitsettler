'use client'

import { LanguageSwitcher } from '@/components/language-switcher'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Link, usePathname } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { Fragment } from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator
} from './ui/breadcrumb'

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
  skills: 'sidebar.skills'
}

export function Header() {
  const pathname = usePathname()
  const t = useTranslations()

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
        </div>
      </div>
    </header>
  )
}
