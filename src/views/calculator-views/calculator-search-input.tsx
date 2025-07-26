'use client'

import { Badge } from '@/components/ui/badge'
import { Combobox, type ComboboxOption } from '@/components/ui/combobox'
import { DEFAULT_ICON_PATH } from '@/constants/assets'
import type { CalculatorItem } from '@/lib/spacetime-db-new/shared/dtos/calculator-dtos'
import { getTierColor } from '@/lib/spacetime-db-new/shared/utils/entities'
import { useTranslations } from 'next-intl'
import Image from 'next/image'

interface CalculatorSearchInputProps {
  items: CalculatorItem[]
  selectedItem?: CalculatorItem
  onItemSelect: (slug: string) => void
}

export function CalculatorSearchInput({ items, selectedItem, onItemSelect }: CalculatorSearchInputProps) {
  const t = useTranslations()

  // Convert items to combobox options
  const itemOptions = items
    // Deduplicate by name - keep only the first occurrence of each name
    .filter((item, index, array) => {
      const normalizedName = item.name.toLowerCase().trim()
      return array.findIndex((i) => i.name.toLowerCase().trim() === normalizedName) === index
    })
    .map((item) => ({
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
      {/* <span>{option.icon_asset_name}</span> */}
      <Image
        src={option.icon_asset_name ?? `${DEFAULT_ICON_PATH}.webp`}
        alt={option.label}
        width={32}
        height={32}
        className="flex-shrink-0 rounded"
      />
      <div className="flex min-w-0 flex-col justify-center gap-y-1">
        <div className="truncate font-medium">{option.label}</div>
        <div className="flex items-center gap-1">
          {option.tier !== -1 && (
            <Badge variant="outline" className={getTierColor(option.tier || 1)}>
              Tier {option.tier}
            </Badge>
          )}
          <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
            {option.category}
          </Badge>
        </div>
      </div>
    </div>
  )

  return (
    <Combobox
      options={itemOptions}
      value={selectedItem?.slug || ''}
      onValueChange={onItemSelect}
      placeholder={t('calculator.searchPlaceholder')}
      searchPlaceholder={t('calculator.searchItems')}
      emptyText={t('calculator.noItemsFound')}
      renderOption={renderOption}
    />
  )
}
