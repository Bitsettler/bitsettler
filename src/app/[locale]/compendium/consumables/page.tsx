import { getConsumableStatistics } from '@/lib/spacetime-db-live/consumables'
import { ItemTag } from '@/lib/spacetime-db/items/tags'
import { getItemsByTags } from '@/lib/spacetime-db/items/utils'
import { ConsumablesView } from '@/views/consumables-views/consumables-index-page-view'

export default async function ConsumablesPage() {
  // Define consumable categories
  const consumableCategories = [
    // Food & Nutrition Section
    {
      id: 'basic-food',
      name: 'Basic Food',
      description: 'Simple food items for basic nutrition',
      icon: '🍞',
      tag: ItemTag.BasicFood,
      category: 'Food & Nutrition',
      href: '/compendium/basic-food'
    },
    {
      id: 'meal',
      name: 'Prepared Meals',
      description: 'Cooked meals with high nutritional value',
      icon: '🍽️',
      tag: ItemTag.Meal,
      category: 'Food & Nutrition',
      href: '/compendium/meal'
    },
    {
      id: 'raw-meal',
      name: 'Raw Meals',
      description: 'Uncooked meal ingredients and preparations',
      icon: '🥩',
      tag: ItemTag.RawMeal,
      category: 'Food & Nutrition',
      href: '/compendium/raw-meal'
    },
    {
      id: 'berry',
      name: 'Berries',
      description: 'Fresh berries and fruit for quick nutrition',
      icon: '🫐',
      tag: ItemTag.Berry,
      category: 'Food & Nutrition',
      href: '/compendium/berry'
    },
    {
      id: 'citric-berry',
      name: 'Citric Berries',
      description: 'Special citrus berries with enhanced effects',
      icon: '🍊',
      tag: ItemTag.CitricBerry,
      category: 'Food & Nutrition',
      href: '/compendium/citric-berry'
    },
    {
      id: 'mushroom',
      name: 'Mushrooms',
      description: 'Edible mushrooms and fungi',
      icon: '🍄',
      tag: ItemTag.Mushroom,
      category: 'Food & Nutrition',
      href: '/compendium/mushroom'
    },
    {
      id: 'vegetable',
      name: 'Vegetables',
      description: 'Fresh vegetables and plant-based foods',
      icon: '🥕',
      tag: ItemTag.Vegetable,
      category: 'Food & Nutrition',
      href: '/compendium/vegetable'
    },
    {
      id: 'wonder-fruit',
      name: 'Wonder Fruit',
      description: 'Magical fruits with special properties',
      icon: '🌟',
      tag: ItemTag.WonderFruit,
      category: 'Food & Nutrition',
      href: '/compendium/wonder-fruit'
    },
    {
      id: 'sugar',
      name: 'Sugar',
      description: 'Sweet ingredients for cooking and crafting',
      icon: '🍯',
      tag: ItemTag.Sugar,
      category: 'Food & Nutrition',
      href: '/compendium/sugar'
    },
    {
      id: 'tea',
      name: 'Tea',
      description: 'Brewed teas with various beneficial effects',
      icon: '🍵',
      tag: ItemTag.Tea,
      category: 'Food & Nutrition',
      href: '/compendium/tea'
    },
    // Potions & Medicine Section
    {
      id: 'healing-potion',
      name: 'Healing Potions',
      description: 'Potions that restore health and vitality',
      icon: '🧪',
      tag: ItemTag.HealingPotion,
      category: 'Potions & Medicine',
      href: '/compendium/healing-potion'
    },
    {
      id: 'stamina-potion',
      name: 'Stamina Potions',
      description: 'Potions that restore stamina and energy',
      icon: '⚡',
      tag: ItemTag.StaminaPotion,
      category: 'Potions & Medicine',
      href: '/compendium/stamina-potion'
    },
    {
      id: 'crafting-speed-elixir',
      name: 'Crafting Speed Elixirs',
      description: 'Elixirs that boost crafting speed and efficiency',
      icon: '🚀',
      tag: ItemTag.CraftingSpeedElixir,
      category: 'Potions & Medicine',
      href: '/compendium/crafting-speed-elixir'
    },
    {
      id: 'bandage',
      name: 'Bandages',
      description: 'Medical supplies for treating wounds',
      icon: '🩹',
      tag: ItemTag.Bandage,
      category: 'Potions & Medicine',
      href: '/compendium/bandage'
    },
    // Fishing Supplies Section
    {
      id: 'bait',
      name: 'Bait',
      description: 'Fishing bait to attract various fish',
      icon: '🪱',
      tag: ItemTag.Bait,
      category: 'Fishing Supplies',
      href: '/compendium/bait'
    },
    {
      id: 'chum',
      name: 'Chum',
      description: 'Special fishing attractants and chum',
      icon: '🐟',
      tag: ItemTag.Chum,
      category: 'Fishing Supplies',
      href: '/compendium/chum'
    },
    // Crafting & Recipes Section
    {
      id: 'recipe',
      name: 'Recipes',
      description: 'Crafting recipes and knowledge scrolls',
      icon: '📜',
      tag: ItemTag.Recipe,
      category: 'Crafting & Recipes',
      href: '/compendium/recipe'
    }
  ]

  // Get item counts for each category using getItemsByTags for consistency
  const categoriesWithCounts = consumableCategories.map((category) => {
    const items = getItemsByTags([category.tag])
    return {
      ...category,
      count: items.length
    }
  })

  // Get live consumable statistics
  const consumableStats = await getConsumableStatistics()
  const totalConsumables = consumableStats.total

  return (
    <ConsumablesView
      title="Consumables"
      subtitle={`${totalConsumables} consumable items across ${categoriesWithCounts.length} categories`}
      consumableCategories={categoriesWithCounts}
    />
  )
}