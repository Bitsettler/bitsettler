import type { ItemDesc } from '@/data/bindings/item_desc_type'
import type { CargoDesc } from '@/data/bindings/cargo_desc_type'
import items from '@/data/global/item_desc.json'
import rawCargo from '@/data/global/cargo_desc.json'
import { ItemTag } from './item-tags'
import { camelCaseDeep } from '../utils/case-utils'

export function getItemsByTags(tags: readonly ItemTag[]): ItemDesc[] {
  return camelCaseDeep<ItemDesc[]>(
    items.filter((item) => tags.includes(item.tag as ItemTag) && item.compendium_entry === true)
  )
}

export function getAllItems(): ItemDesc[] {
  return camelCaseDeep<ItemDesc[]>(items.filter((item) => item.compendium_entry === true))
}

export function getAllCargo(): CargoDesc[] {
  return camelCaseDeep<CargoDesc[]>(rawCargo)
}