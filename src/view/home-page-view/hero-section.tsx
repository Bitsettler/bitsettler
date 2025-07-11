'use client'

import { Badge } from '@/components/ui/badge'
import { Combobox, type ComboboxOption } from '@/components/ui/combobox'
import { getRarityColor, getTierColor } from '@/lib/utils/item-utils'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

interface Item {
  id: string
  name: string
  slug: string
  category: string
  tier: number
  rarity: string
  icon_asset_name: string
}

export interface HeroSectionProps {
  items: Item[]
}

export function HeroSection({ items }: HeroSectionProps) {
  const t = useTranslations()
  const router = useRouter()

  // Convert items to combobox options
  const itemOptions = items.map((item) => ({
    value: item.slug,
    label: item.name,
    keywords: `${item.name} ${item.slug} ${item.category} ${item.rarity}`,
    id: item.id,
    tier: item.tier,
    category: item.category,
    rarity: item.rarity,
    icon_asset_name: item.icon_asset_name
  }))

  const renderOption = (option: ComboboxOption) => (
    <div className="flex w-full items-center gap-2">
      <Image
        src={`/assets/${option.icon_asset_name || 'GeneratedIcons/Items/Unknown'}.webp`}
        alt={option.label}
        width={32}
        height={32}
        className="flex-shrink-0 rounded"
      />
      <div className="flex min-w-0 flex-col justify-center gap-y-1">
        <div className="truncate font-medium">{option.label}</div>
        <div className="flex items-center gap-1 text-xs">
          {option.tier !== -1 && (
            <Badge variant="outline" className={`text-xs ${getTierColor(option.tier || 1)}`}>
              Tier {option.tier}
            </Badge>
          )}
          <Badge variant="outline" className={`text-xs ${getRarityColor(option.rarity || 'common')}`}>
            {option.rarity || 'Common'}
          </Badge>
          <Badge variant="outline" className="border-blue-200 bg-blue-50 text-xs text-blue-700">
            {option.category}
          </Badge>
        </div>
      </div>
    </div>
  )

  const handleItemSelect = (slug: string) => {
    if (slug) {
      router.push(`/calculator/${slug}`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h1 className="text-6xl font-bold">{t('header.title')}</h1>
        <p className="text-muted-foreground text-xl">{t('header.subtitle')}</p>
      </div>
      <div className="max-w-xl">
        <Combobox
          options={itemOptions}
          value=""
          onValueChange={handleItemSelect}
          placeholder={t('calculator.searchPlaceholder')}
          searchPlaceholder={t('calculator.searchItems')}
          emptyText={t('calculator.noItemsFound')}
          className="w-full"
          renderOption={renderOption}
        />
      </div>
    </div>
  )
}
