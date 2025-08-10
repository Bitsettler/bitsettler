'use client'

import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'
import { 
  CalculatorIcon, 
  BookOpenIcon, 
  InfoIcon, 
  HammerIcon 
} from '@phosphor-icons/react'

export function MainNav({ className, ...props }: React.ComponentProps<'nav'>) {
  const pathname = usePathname()
  const t = useTranslations()

  const items = [
    { href: '/', label: t('header.navigation.calculator'), icon: CalculatorIcon },
    { href: '/compendium', label: t('header.navigation.compendium'), icon: BookOpenIcon },
    { href: '/wiki', label: t('header.navigation.wiki'), icon: InfoIcon },
    { href: '/projects', label: t('header.navigation.projects'), icon: HammerIcon }
  ]

  return (
    <nav className={cn('items-center gap-0.5', className)} {...props}>
      {items.map((item) => {
        const Icon = item.icon
        return (
          <Button key={item.href} variant="ghost" asChild size="sm">
            <Link
              href={item.href}
              className={cn(
                'flex items-center gap-2',
                pathname === item.href && 'text-primary'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          </Button>
        )
      })}
    </nav>
  )
}
