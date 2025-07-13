import { getEquipmentStatistics } from '@/lib/spacetime-db-live/equipments'
import { ItemTag } from '@/lib/spacetime-db/items/tags'
import { getItemsByTags } from '@/lib/spacetime-db/items/utils'
import { EquipmentView } from '@/views/equipment-views/equipment-index-page-view'

export default async function EquipmentPage() {
  // Define equipment categories
  const equipmentCategories = [
    // Armor & Clothing Section
    {
      id: 'metal-armor',
      name: 'Metal Armor',
      description: 'Heavy armor and protective gear made from metal',
      icon: '🛡️',
      tag: ItemTag.MetalArmor,
      category: 'Armor & Clothing',
      href: '/compendium/metal-armor'
    },
    {
      id: 'leather-clothing',
      name: 'Leather Clothing',
      description: 'Flexible clothing and armor made from leather',
      icon: '🧥',
      tag: ItemTag.LeatherClothing,
      category: 'Armor & Clothing',
      href: '/compendium/leather-clothing'
    },
    {
      id: 'cloth-clothing',
      name: 'Cloth Clothing',
      description: 'Comfortable clothing made from various fabrics',
      icon: '👘',
      tag: ItemTag.ClothClothing,
      category: 'Armor & Clothing',
      href: '/compendium/cloth-clothing'
    },
    {
      id: 'cosmetic-clothes',
      name: 'Cosmetic Clothing',
      description: 'Special decorative and cosmetic clothing items',
      icon: '✨',
      tag: ItemTag.CosmeticClothes,
      category: 'Armor & Clothing',
      href: '/compendium/cosmetic-clothes'
    },
    // Jewelry & Artifacts Section
    {
      id: 'jewelry',
      name: 'Jewelry',
      description: 'Rings, necklaces, and other precious accessories',
      icon: '💍',
      tag: ItemTag.Jewelry,
      category: 'Jewelry & Artifacts',
      href: '/compendium/jewelry'
    },
    {
      id: 'automata-heart',
      name: 'Automata Heart',
      description: 'Magical heart components and automata artifacts',
      icon: '🤖',
      tag: ItemTag.AutomataHeart,
      category: 'Jewelry & Artifacts',
      href: '/compendium/automata-heart'
    }
  ]

  // Get item counts for each category using tagCollections for consistency
  const categoriesWithCounts = equipmentCategories.map((category) => {
    const items = getItemsByTags([category.tag])
    return {
      ...category,
      count: items.length
    }
  })

  // Get live equipment statistics
  const equipmentStats = await getEquipmentStatistics()
  const totalEquipment = equipmentStats.total

  return (
    <EquipmentView
      title="Equipment"
      subtitle={`${totalEquipment} equipment items across ${categoriesWithCounts.length} categories`}
      equipmentCategories={categoriesWithCounts}
    />
  )
}
