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
const pathTranslationMap: Record<string, string> = {
  compendium: 'sidebar.compendium',
  calculator: 'sidebar.calculator',
  changelog: 'sidebar.changelog',
  about: 'sidebar.aboutUs',
  contact: 'sidebar.contactUs',
  donate: 'sidebar.donate',
  random: 'sidebar.randomPage',
  dashboard: 'sidebar.dashboard',
  projects: 'sidebar.projects'
}

export function Header() {
  const pathname = usePathname()
  const t = useTranslations()

  // Generate breadcrumb items from current pathname
  const generateBreadcrumbs = () => {
    // Remove locale prefix (e.g., /en, /fr, /es) and split by /
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/'
    const segments = pathWithoutLocale.split('/').filter(Boolean)

    const breadcrumbs = [
      {
        label: t('sidebar.mainPage'),
        href: '/',
        isLast: segments.length === 0
      }
    ]

    // Build breadcrumbs for each segment
    let currentPath = ''
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`
      const isLast = index === segments.length - 1

      // Get translation for the segment or use the segment itself (capitalized)
      const translationKey = pathTranslationMap[segment]
      const label = translationKey
        ? t(translationKey)
        : segment.charAt(0).toUpperCase() + segment.slice(1)

      breadcrumbs.push({
        label,
        href: currentPath,
        isLast
      })
    })

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

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
