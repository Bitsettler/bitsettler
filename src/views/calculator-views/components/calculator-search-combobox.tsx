import { Badge } from '@/components/ui/badge'
import { Combobox, type ComboboxOption } from '@/components/ui/combobox'
import { Link } from '@/i18n/navigation'
import type { CalculatorItem } from '@/lib/spacetime-db'
import { getServerIconPath } from '@/lib/spacetime-db/assets'
import { getRarityColor, getTierColor } from '@/lib/utils/item-utils'
import { getTranslations } from 'next-intl/server'
import Image from 'next/image'

interface CalculatorSearchComboboxProps {
  items: CalculatorItem[]
  selectedItem?: CalculatorItem
  currentQuantity: number
}

export async function CalculatorSearchCombobox({ 
  items, 
  selectedItem, 
  currentQuantity 
}: CalculatorSearchComboboxProps) {
  const t = await getTranslations()

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
    <Link href={`/calculator/${option.value}?qty=${currentQuantity}`} className="block w-full">
      <div className="flex w-full items-center gap-2">
        <Image
          src={getServerIconPath(option.icon_asset_name || 'Unknown')}
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
            <Badge variant="outline" className={getRarityColor(option.rarity || 'common')}>
              {option.rarity || 'Common'}
            </Badge>
            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
              {option.category}
            </Badge>
          </div>
        </div>
      </div>
    </Link>
  )

  // Custom onValueChange that does nothing since we're using Links
  const handleValueChange = () => {
    // Navigation is handled by Link components
  }

  return (
    <Combobox
      options={itemOptions}
      value={selectedItem?.slug || ''}
      onValueChange={handleValueChange}
      placeholder={t('calculator.searchPlaceholder')}
      searchPlaceholder={t('calculator.searchItems')}
      emptyText={t('calculator.noItemsFound')}
      renderOption={renderOption}
    />
  )
}