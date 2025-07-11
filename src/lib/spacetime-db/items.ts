import items from '@/data/global/item_desc.json'
import { camelCaseDeep } from '../utils/case-utils'
import { ItemTag } from './constants/item-tags'

export function getItemsByTags(tags: ItemTag[]) {
  return camelCaseDeep(items.filter((item) => tags.includes(item.tag as ItemTag) && item.compendium_entry === true))
}

export function getAllItems() {
  return camelCaseDeep(items.filter((item) => item.compendium_entry === true))
}
