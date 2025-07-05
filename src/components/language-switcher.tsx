'use client'

import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { languages, type Locale } from '@/i18n/config'
import { Link, usePathname } from '@/i18n/navigation'
import { Globe } from '@phosphor-icons/react'
import { useLocale, useTranslations } from 'next-intl'

export function LanguageSwitcher() {
  const locale = useLocale() as Locale
  const pathname = usePathname()
  const t = useTranslations('languageSwitcher')

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" title={t('switchLanguage')}>
          <Globe className="size-5" />
          <span className="sr-only">{t('switchLanguageSr')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {languages.map((language) => (
          <DropdownMenuItem key={language.code} asChild>
            <Link
              href={pathname}
              locale={language.code}
              className={`flex w-full items-center justify-between ${locale === language.code ? 'bg-accent' : ''}`}
            >
              <span>{language.name}</span>
              {locale === language.code && <span className="text-muted-foreground text-xs">✓</span>}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
