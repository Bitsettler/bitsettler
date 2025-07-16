'use client'

import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'

export function MainNav({ className, ...props }: React.ComponentProps<'nav'>) {
  const pathname = usePathname()
  const t = useTranslations()

  const items = [
    { href: '/', label: t('header.navigation.calculator') },
    { href: '/compendium', label: t('header.navigation.compendium') },
    { href: '/wiki', label: t('header.navigation.wiki') },
    { href: '/projects', label: t('header.navigation.projects') }
  ]

  return (
    <nav className={cn('items-center gap-0.5', className)} {...props}>
      {items.map((item) => (
        <Button key={item.href} variant="ghost" asChild size="sm">
          <Link href={item.href} className={cn(pathname === item.href && 'text-primary')}>
            {item.label}
          </Link>
        </Button>
      ))}
    </nav>
  )
}
