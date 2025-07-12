import type { ItemDesc } from '@/data/bindings/item_desc_type'
import items from '@/data/global/item_desc.json'
import { camelCaseDeep } from '../../utils/case-utils'
import { ItemTag } from './tags'

export function getItemsByTags(tags: readonly ItemTag[]): ItemDesc[] {
  return camelCaseDeep<ItemDesc[]>(
    items.filter((item) => tags.includes(item.tag as ItemTag) && item.compendium_entry === true)
  )
}

export function getAllItems(): ItemDesc[] {
  return camelCaseDeep<ItemDesc[]>(items.filter((item) => item.compendium_entry === true))
}
