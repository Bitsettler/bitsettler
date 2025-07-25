import type { ItemDesc } from '@/data/bindings/item_desc_type'
import itemDescData from '@/data/sdk-tables/item_desc.json'

const items = itemDescData as ItemDesc[]

export function getAllItems(): ItemDesc[] {
  return items.filter((i) => i.compendiumEntry)
}
