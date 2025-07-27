import {
  getCargoStatistics,
  getCargoTagsMetadata
} from '@/lib/spacetime-db-new/modules/cargo/flows'
import {
  getEquipmentCategories,
  getEquipmentStatistics
} from '@/lib/spacetime-db-new/modules/equipment/flows'
import {
  getConsumableStatistics,
  getConsumableTagsMetadata,
  getItemStatistics,
  getItemTagsMetadata
} from '@/lib/spacetime-db-new/modules/items/flows'
import {
  getResourceStatistics,
  getResourceTagsMetadata
} from '@/lib/spacetime-db-new/modules/resources/flows'
import {
  getToolCategories,
  getToolStatistics
} from '@/lib/spacetime-db-new/modules/tools/flows'
import {
  getWeaponCategories,
  getWeaponStatistics
} from '@/lib/spacetime-db-new/modules/weapons/flows'
import { CompendiumIndexPageView } from '@/views/compendium-views/compendium-index-page-view'

export default function CompendiumPage() {
  // Get statistics for special collections
  const weaponStats = getWeaponStatistics()
  const equipmentStats = getEquipmentStatistics()
  const toolStats = getToolStatistics()
  const consumableStats = getConsumableStatistics()

  // Get category data for sections
  const consumableCategories = getConsumableTagsMetadata()
  const itemsCategories = getItemTagsMetadata()
  const cargoCategories = getCargoTagsMetadata()
  const resourceCategories = getResourceTagsMetadata()

  // Get first items for special collection icons
  const weaponCategoriesData = getWeaponCategories()
  const equipmentCategoriesData = getEquipmentCategories()
  const toolCategoriesData = getToolCategories()
  const firstConsumable = consumableCategories[0]

  // Prepare special collections with real icons and live stats
  const specialCollections = [
    {
      href: '/compendium/weapon',
      icon: weaponCategoriesData[0]?.firstWeapon?.iconAssetName,
      title: 'Weapons',
      description: `${weaponStats.total} weapons across ${weaponStats.types} types`
    },
    {
      href: '/compendium/equipment',
      icon: equipmentCategoriesData[0]?.firstEquipment?.iconAssetName,
      title: 'Equipment',
      description: `${equipmentStats.total} equipment items`
    },
    {
      href: '/compendium/tools',
      icon: toolCategoriesData[0]?.firstTool?.iconAssetName,
      title: 'Tools',
      description: `${toolStats.total} profession tools`
    },
    {
      href: '/compendium/consumables',
      icon: firstConsumable?.icon,
      title: 'Consumables',
      description: `${consumableStats.total} consumable items`
    }
  ]

  // Get statistics for sections
  const itemStats = getItemStatistics()
  const cargoStats = getCargoStatistics()
  const resourceStats = getResourceStatistics()

  const sections = [
    {
      title: 'Items',
      totalCount: itemStats.total,
      categories: itemsCategories
    },
    {
      title: 'Cargo',
      totalCount: cargoStats.total,
      categories: cargoCategories
    },
    {
      title: 'Resources',
      totalCount: resourceStats.total,
      categories: resourceCategories
    }
  ]

  return (
    <CompendiumIndexPageView
      title="Bitcraft Compendium"
      subtitle="Explore all items, cargo, and resources in the world of Bitcraft"
      specialCollections={specialCollections}
      sections={sections}
    />
  )
}
