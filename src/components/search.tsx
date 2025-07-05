'use client'

import { Button } from '@/components/ui/button'
import { MagnifyingGlass } from '@phosphor-icons/react'
import { useTranslations } from 'next-intl'

export function Search() {
  const t = useTranslations()

  return (
    <Button variant="ghost" size="sm" className="hidden md:flex">
      <MagnifyingGlass className="h-4 w-4" />
      <span className="sr-only">{t('common.search')}</span>
    </Button>
  )
}
