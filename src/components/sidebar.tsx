'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SITE_CONFIG } from '@/config/site-config'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import {
  BookOpen,
  Calculator,
  DiscordLogo,
  Envelope,
  GithubLogo,
  Hammer,
  Heart,
  House,
  Info,
  Shuffle,
  TwitterLogo
} from '@phosphor-icons/react'
import { useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'

interface NavigationItem {
  translationKey: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  external?: boolean
  comingSoon?: boolean
}

interface NavigationSection {
  translationLabel: string
  children: NavigationItem[]
  description?: string
}

export function Sidebar() {
  const t = useTranslations()
  const pathname = usePathname()

  const sidebarNavigation: NavigationSection[] = [
    {
      translationLabel: 'sidebar.navigation',
      children: [
        { translationKey: 'sidebar.mainPage', href: '/', icon: House },
        { translationKey: 'sidebar.aboutUs', href: '/about', icon: Info },
        { translationKey: 'sidebar.randomPage', href: '/random', icon: Shuffle },
        { translationKey: 'sidebar.contactUs', href: '/contact', icon: Envelope },
        { translationKey: 'sidebar.donate', href: '/donate', icon: Heart }
      ]
    },
    {
      translationLabel: 'sidebar.recentChanges',
      children: [{ translationKey: 'sidebar.changelog', href: '/changelog', icon: BookOpen }],
      description: 'sidebar.recentChangesDescription'
    },
    {
      translationLabel: 'sidebar.guides',
      children: [],
      description: 'sidebar.guidesComingSoon'
    },
    {
      translationLabel: 'sidebar.tools',
      children: [
        { translationKey: 'sidebar.calculator', href: '/calculator', icon: Calculator },
        { translationKey: 'sidebar.projects', href: '/projects', icon: Hammer, comingSoon: true }
      ]
    },
    {
      translationLabel: 'sidebar.community',
      children: [
        {
          translationKey: 'sidebar.bitcraftGuideDiscord',
          href: SITE_CONFIG.links.discord,
          icon: DiscordLogo,
          external: true
        },
        {
          translationKey: 'sidebar.bitcraftGuideGithub',
          href: SITE_CONFIG.links.github,
          icon: GithubLogo,
          external: true
        },
        {
          translationKey: 'sidebar.bitcraftGuideTwitter',
          href: SITE_CONFIG.links.twitter,
          icon: TwitterLogo,
          external: true
        }
      ]
    }
  ]

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/' || pathname === '/en' || pathname === '/fr' || pathname === '/es'
    }
    return pathname.includes(href)
  }

  const renderNavigationItem = (item: NavigationItem) => {
    const Icon = item.icon
    return (
      <li key={item.href}>
        <Button
          variant={isActive(item.href) ? 'secondary' : 'ghost'}
          size="sm"
          className={cn('h-8 w-full justify-start text-sm font-normal', isActive(item.href) && 'bg-accent')}
          asChild={!item.comingSoon}
          disabled={item.comingSoon}
        >
          {item.comingSoon ? (
            <div className="flex w-full items-center">
              <Icon className="mr-2 h-4 w-4" />
              {t(item.translationKey)}
              <Badge variant="secondary" className="ml-auto text-xs">
                {t('sidebar.comingSoon')}
              </Badge>
            </div>
          ) : item.external ? (
            <a href={item.href} target="_blank" rel="noopener noreferrer">
              <Icon className="mr-2 h-4 w-4" />
              {t(item.translationKey)}
            </a>
          ) : (
            <Link href={item.href}>
              <Icon className="mr-2 h-4 w-4" />
              {t(item.translationKey)}
            </Link>
          )}
        </Button>
      </li>
    )
  }

  return (
    <aside className="bg-background border-border sticky top-0 h-full overflow-y-auto border-r">
      <div className="space-y-6 py-4 pr-4">
        {sidebarNavigation.map((section) => (
          <div key={section.translationLabel}>
            <h3 className="mb-3 text-sm font-semibold">{t(section.translationLabel)}</h3>
            {section.children.length > 0 ? (
              <ul className="space-y-1">{section.children.map(renderNavigationItem)}</ul>
            ) : null}
            {section.description && (
              <div className="text-muted-foreground mt-2 ml-2 text-xs">{t(section.description)}</div>
            )}
          </div>
        ))}
      </div>
    </aside>
  )
}
