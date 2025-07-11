import { Container } from '@/components/container'
import type { ResourceDesc } from '@/data/bindings/resource_desc_type'
import rawResources from '@/data/global/resource_desc.json'
import { convertRarityToString, createSlug } from '@/lib/spacetime-db'
import { getAllCargo } from '@/lib/spacetime-db/cargo'
import { getAllCollectibles } from '@/lib/spacetime-db/collectibles'
import { ItemTag } from '@/lib/spacetime-db/constants/item-tags'
import { getAllItems, getItemsByTags } from '@/lib/spacetime-db/items'
import { camelCaseDeep } from '@/lib/utils/case-utils'
import { EquipmentSection } from './equipment-section'
import { HeroSection, HeroSectionProps } from './hero-section'
import { ItemsSection } from './items-section'
import { NewsSection } from './news-section'
import { ProfessionsSection } from './professions-section'

export function HomeView() {
  const items = getAllItems()
  const heroItems: HeroSectionProps['items'] = items.map((item) => {
    return {
      id: item.id.toString(),
      name: item.name,
      slug: createSlug(item.name),
      category: item.tag,
      tier: item.tier,
      rarity: convertRarityToString(item.rarity),
      icon_asset_name: item.iconAssetName
    }
  })

  const weapons = getItemsByTags([ItemTag.Weapon])
  const armor = getItemsByTags([ItemTag.MetalArmor])
  const clothing = getItemsByTags([ItemTag.LeatherClothing, ItemTag.ClothClothing])
  const tools = getItemsByTags([
    ItemTag.BlacksmithTool,
    ItemTag.CarpenterTool,
    ItemTag.FarmerTool,
    ItemTag.FisherTool,
    ItemTag.ForagerTool,
    ItemTag.ForesterTool,
    ItemTag.HunterTool,
    ItemTag.LeatherworkerTool,
    ItemTag.MasonTool,
    ItemTag.MinerTool,
    ItemTag.ScholarTool,
    ItemTag.TailorTool
  ])

  const collectibles = getAllCollectibles()

  // Consumables tags list (mirrors getConsumables logic)
  const consumableTags = [
    'Basic Food',
    'Bandage',
    'Bait',
    'Berry',
    'Chum',
    'Citric Berry',
    'Crafting Speed Elixir',
    'Healing Potion',
    'Meal',
    'Mushroom',
    'Raw Meal',
    'Recipe',
    'Stamina Potion',
    'Sugar',
    'Tea',
    'Vegetable',
    'Wonder Fruit'
  ] as ItemTag[]

  const consumables = getItemsByTags(consumableTags)

  // Others = everything not in consumables/cargo/resources (using ids)
  const cargoData = getAllCargo()
  const resourceDataFull = camelCaseDeep<ResourceDesc[]>(rawResources)
  const resourcesData = resourceDataFull.filter((r) => r.compendiumEntry === true)

  const totalItems = getAllItems().length

  return (
    <Container>
      <div className="space-y-16 py-8">
        {/* Hero Section */}
        <section>
          <HeroSection items={heroItems} />
        </section>

        <div className="">
          <p className="text-muted-foreground text-sm">
            🔍 Click on any category to explore detailed item information, stats, and crafting recipes!
          </p>
        </div>

        {/* Equipment Section */}
        <section>
          <EquipmentSection
            weapons={weapons}
            armor={armor}
            clothing={clothing}
            tools={tools}
            collectibles={collectibles}
          />
        </section>

        {/* Items & Resources Section */}
        <section>
          <ItemsSection consumables={consumables} cargo={cargoData} resources={resourcesData} totalItems={totalItems} />
        </section>

        {/* Professions Section */}
        <section>
          <ProfessionsSection />
        </section>

        {/* Latest Bitcraft News */}
        <section>
          <NewsSection />
        </section>
      </div>
    </Container>
  )
}
