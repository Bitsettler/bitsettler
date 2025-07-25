import { getCargoStatistics, getCargoTagsMetadata } from '@/lib/spacetime-db-new/modules/cargo/flows'
import { CargoView } from '@/views/cargo-views/cargo-index-page-view'

export default async function CargoPage() {
  // Get cargo metadata (includes count for each tag)
  const cargoCategories = getCargoTagsMetadata()
    .filter((category) => category.count > 0) // Only show categories with items
    .map((meta) => ({
      id: meta.id,
      name: meta.name,
      description: meta.description,
      icon: meta.icon,
      tag: meta.name, // The actual tag name
      category: meta.section,
      href: meta.href,
      count: meta.count
    }))

  // Get live cargo statistics
  const cargoStats = getCargoStatistics()
  const totalCargo = cargoStats.total

  return (
    <CargoView
      title="Cargo"
      subtitle={`${totalCargo} cargo items across ${cargoCategories.length} categories`}
      cargoCategories={cargoCategories}
    />
  )
}
