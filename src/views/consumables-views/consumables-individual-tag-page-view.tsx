import { type ConsumableWithItem } from '@/lib/spacetime-db/consumables'
import { TagPageView } from '@/views/tag-views/tag-page-view'

interface ConsumableIndividualTagPageViewProps {
  tagName: string
  consumables: ConsumableWithItem[]
  backLink?: string
  backLinkText?: string
}

export function ConsumableIndividualTagPageView({
  tagName,
  consumables,
  backLink = '/compendium/consumables',
  backLinkText = '← Back to Consumables'
}: ConsumableIndividualTagPageViewProps) {
  // Group by effect type
  const consumablesByEffect: Record<string, ConsumableWithItem[]> = {}
  consumables.forEach((item) => {
    const effect = item.effectType
    if (!consumablesByEffect[effect]) {
      consumablesByEffect[effect] = []
    }
    consumablesByEffect[effect].push(item)
  })

  // Create item groups for each effect type
  const itemGroups = Object.entries(consumablesByEffect).map(([effectType, consumableItems]) => {
    // Create base columns
    const baseColumns = [
      { key: 'icon', label: 'Icon', sortable: false, className: 'w-16' },
      { key: 'name', label: 'Name', sortable: true },
      { key: 'tier', label: 'Tier', sortable: true, className: 'text-center' },
      { key: 'rarity', label: 'Rarity', sortable: true, className: 'text-center' }
    ]

    // Add nutrition column for food items
    const hasFoodItems = consumableItems.some((item) => item.isFood)
    const nutritionColumn = hasFoodItems
      ? [{ key: 'nutritionValue', label: 'Nutrition', sortable: true, className: 'text-center' }]
      : []

    // Add category column if there are multiple categories in this group
    const categories = new Set(consumableItems.map((item) => item.consumableCategory))
    const categoryColumn =
      categories.size > 1
        ? [{ key: 'consumableCategory', label: 'Category', sortable: true, className: 'text-center' }]
        : []

    // Create enriched items
    const enrichedItems = consumableItems.map((consumable) => ({
      ...consumable,
      rarity: consumable.rarity || { tag: 'Common' }
    }))

    return {
      name: effectType,
      items: enrichedItems,
      columns: [...baseColumns, ...nutritionColumn, ...categoryColumn]
    }
  })

  // Sort groups by effect type name
  itemGroups.sort((a, b) => a.name.localeCompare(b.name))

  // Consumable statistics
  const totalConsumables = consumables.length
  const foodCount = consumables.filter((c) => c.isFood).length
  const potionCount = consumables.filter((c) => c.isPotion).length
  const baitCount = consumables.filter((c) => c.isBait).length

  // Create subtitle with breakdown
  const subtitleParts = [`${totalConsumables} items`]
  if (foodCount > 0) subtitleParts.push(`${foodCount} food`)
  if (potionCount > 0) subtitleParts.push(`${potionCount} potions`)
  if (baitCount > 0) subtitleParts.push(`${baitCount} bait`)

  const subtitle = subtitleParts.join(' • ')

  return (
    <TagPageView
      title={tagName}
      subtitle={subtitle}
      backLink={backLink}
      backLinkText={backLinkText}
      itemGroups={itemGroups}
    />
  )
}
