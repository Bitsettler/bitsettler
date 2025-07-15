import { Container } from '@/components/container'
import type { ResourceDesc } from '@/data/bindings/resource_desc_type'
import rawResources from '@/data/global/resource_desc.json'
import { convertRarityToString, createSlug, getAllItems, getItemsByTags, getAllCargo } from '@/lib/spacetime-db-live'
import { tagCollections } from '@/lib/spacetime-db-live/item-tag-collections'
import { camelCaseDeep } from '@/lib/utils/case-utils'
import { BuildingsSection } from './buildings-section'
import { EquipmentSection } from './equipment-section'
import { HeroSection, HeroSectionProps } from './hero-section'
import { ItemsSection } from './items-section'
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

  const weapons = getItemsByTags(tagCollections.weapons.tags)
  const tools = getItemsByTags(tagCollections.tools.tags)

  const consumables = getItemsByTags(tagCollections.consumables.tags)

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
          <EquipmentSection weapons={weapons} tools={tools} />
        </section>

        {/* Buildings & Structures Section */}
        <section>
          <BuildingsSection />
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
        {/* <section> */}
        {/*   <NewsSection /> */}
        {/* </section> */}
      </div>
    </Container>
  )
}
