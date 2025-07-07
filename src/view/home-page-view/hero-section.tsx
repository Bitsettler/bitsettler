'use client'

import { Combobox } from '@/components/ui/combobox'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

interface Item {
  id: number
  name: string
  slug: string
  category: string
}

interface HeroSectionProps {
  items: Item[]
}

export function HeroSection({ items }: HeroSectionProps) {
  const t = useTranslations()
  const router = useRouter()

  // Convert items to combobox options
  const itemOptions = items.map((item) => ({
    value: item.slug,
    label: item.name,
    keywords: `${item.name} ${item.slug} ${item.category}`,
    id: item.id
  }))

  const handleItemSelect = (slug: string) => {
    if (slug) {
      router.push(`/calculator/${slug}`)
    }
  }

  return (
    <div className="flex flex-col items-center">
      <h1 className="mb-6 text-center text-6xl font-bold">{t('header.title')}</h1>
      <p className="text-muted-foreground mb-8 text-center text-xl">{t('header.subtitle')}</p>
      <div className="w-full max-w-xl">
        <Combobox
          options={itemOptions}
          value=""
          onValueChange={handleItemSelect}
          placeholder={t('calculator.searchPlaceholder')}
          searchPlaceholder={t('calculator.searchItems')}
          emptyText={t('calculator.noItemsFound')}
          triggerClassName="text-xl py-6"
          inputClassName="text-xl py-6"
          className="w-full"
        />
      </div>
    </div>
  )
}
