'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Combobox, type ComboboxOption } from '@/components/ui/combobox'
import type { Item } from '@/hooks/use-item-selection'
import { getTierColor } from '@/lib/utils/item-utils'
import { useTranslations } from 'next-intl'
import Image from 'next/image'

interface CalculatorSearchInputProps {
  items: Item[]
  selectedItem?: Item
  onItemSelect: (slug: string) => void
}

export function CalculatorSearchInput({ items, selectedItem, onItemSelect }: CalculatorSearchInputProps) {
  const t = useTranslations()

  // Convert items to combobox options
  const itemOptions = items.map((item) => ({
    value: item.slug,
    label: item.name,
    keywords: `${item.name} ${item.slug} ${item.category}`,
    id: item.id,
    tier: item.tier,
    category: item.category,
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
          <Badge variant="outline" className="border-blue-200 bg-blue-50 text-xs text-blue-700">
            {option.category}
          </Badge>
        </div>
      </div>
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('calculator.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Combobox
          options={itemOptions}
          value={selectedItem?.slug || ''}
          onValueChange={onItemSelect}
          placeholder={t('calculator.searchPlaceholder')}
          searchPlaceholder={t('calculator.searchItems')}
          emptyText={t('calculator.noItemsFound')}
          renderOption={renderOption}
        />
      </CardContent>
    </Card>
  )
}
