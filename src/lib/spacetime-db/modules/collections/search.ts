import { cargoCollections } from '../collections/cargo-tag-collections'
import type { SearchItem } from '../../shared/dtos/search-dtos'
import { tagCollections } from './item-tag-collections'
import { resourceCollections } from './resource-tag-collections'

/**
 * Transform tag collections to search format
 */
export function transformCollectionsToSearch(): SearchItem[] {
  const collections: SearchItem[] = []

  // Add item tag collections
  Object.values(tagCollections).forEach((collection) => {
    Object.values(collection.categories).forEach((category) => {
      if (category) {
        collections.push({
          id: `collection_${category.id}`,
          name: category.name,
          slug: category.id,
          category: 'Collections',
          type: 'collection',
          href: category.href,
          description: category.description,
          section: category.section
        })
      }
    })
  })

  // Add cargo tag collections
  Object.values(cargoCollections).forEach((collection) => {
    Object.values(collection.categories).forEach((category) => {
      if (category) {
        collections.push({
          id: `collection_cargo_${category.id}`,
          name: category.name,
          slug: category.id,
          category: 'Cargo Collections',
          type: 'collection',
          href: category.href,
          description: category.description,
          section: category.section
        })
      }
    })
  })

  // Add resource tag collections
  Object.values(resourceCollections).forEach((collection) => {
    Object.values(collection.categories).forEach((category) => {
      if (category) {
        collections.push({
          id: `collection_resource_${category.id}`,
          name: category.name,
          slug: category.id,
          category: 'Resource Collections',
          type: 'collection',
          href: category.href,
          description: category.description,
          section: category.section
        })
      }
    })
  })

  return collections
}
