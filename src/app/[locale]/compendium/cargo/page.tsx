import { getCargoStatistics, getCargoGroupedByTag } from '@/lib/spacetime-db-live/cargo/cargo'
import { cargoCollections } from '@/lib/spacetime-db-live/cargo/cargo-tag-collections'
import { CargoView } from '@/views/cargo-views/cargo-index-page-view'

export default async function CargoPage() {
  // Get cargo categories from centralized metadata
  const cargoCollection = cargoCollections.cargo
  
  // Get actual cargo counts by tag
  const cargoByTag = await getCargoGroupedByTag()
  
  const cargoCategories = cargoCollection.tags.map((tag) => {
    const categoryMeta = cargoCollection.categories[tag]
    const cargoItems = cargoByTag[tag] || []
    
    return {
      id: categoryMeta.id,
      name: categoryMeta.name,
      description: categoryMeta.description,
      icon: categoryMeta.icon,
      tag,
      category: categoryMeta.section,
      href: categoryMeta.href,
      count: cargoItems.length
    }
  })

  // Get live cargo statistics
  const cargoStats = await getCargoStatistics()
  const totalCargo = cargoStats.total

  return (
    <CargoView
      title="Cargo"
      subtitle={`${totalCargo} cargo items across ${cargoCategories.length} categories`}
      cargoCategories={cargoCategories}
    />
  )
}