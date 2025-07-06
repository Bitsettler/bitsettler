'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Combobox } from '@/components/ui/combobox'
import type { Item } from '@/hooks/use-item-selection'
import { useTranslations } from 'next-intl'

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
    id: item.id
  }))

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
        />
      </CardContent>
    </Card>
  )
}
