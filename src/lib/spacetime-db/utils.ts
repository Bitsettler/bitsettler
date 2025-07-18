import type { CargoDesc } from '@/data/bindings/cargo_desc_type'
import type { ItemDesc } from '@/data/bindings/item_desc_type'
import type { ResourceDesc } from '@/data/bindings/resource_desc_type'
import rawCargo from '@/data/global/cargo_desc.json'
import items from '@/data/global/item_desc.json'
import rawResources from '@/data/global/resource_desc.json'
import { ItemTag } from './modules/items/item-tags'
import { camelCaseDeep } from './shared/utils/case-utils'

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

export function getAllResources(): ResourceDesc[] {
  return camelCaseDeep<ResourceDesc[]>(rawResources.filter((resource) => resource.compendium_entry === true))
}
