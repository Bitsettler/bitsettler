import { type CargoWithStats } from '@/lib/spacetime-db-live/cargo'
import { TagPageView } from '@/views/tag-page-view/tag-page-view'

interface CargoIndividualTagPageViewProps {
  tagName: string
  cargo: CargoWithStats[]
  backLink?: string
  backLinkText?: string
}

export function CargoIndividualTagPageView({
  tagName,
  cargo,
  backLink = '/compendium/cargo',
  backLinkText = '← Back to Cargo'
}: CargoIndividualTagPageViewProps) {
  // Group by volume category for better organization
  const cargoByVolume: Record<string, CargoWithStats[]> = {}
  cargo.forEach((item) => {
    const volume = item.volumeCategory
    if (!cargoByVolume[volume]) {
      cargoByVolume[volume] = []
    }
    cargoByVolume[volume].push(item)
  })

  // Create item groups for each volume category
  const itemGroups = Object.entries(cargoByVolume).map(([volumeCategory, cargoItems]) => {
    // Create base columns
    const baseColumns = [
      { key: 'icon', label: 'Icon', sortable: false, className: 'w-16' },
      { key: 'name', label: 'Name', sortable: true },
      { key: 'tier', label: 'Tier', sortable: true, className: 'text-center' },
      { key: 'rarity', label: 'Rarity', sortable: true, className: 'text-center' },
      { key: 'volume', label: 'Volume', sortable: true, className: 'text-center' }
    ]

    // Add cargo-specific columns
    const cargoColumns = [
      { key: 'pickupDifficulty', label: 'Pickup', sortable: true, className: 'text-center' },
      { key: 'movementImpact', label: 'Movement', sortable: true, className: 'text-center' }
    ]

    // Add conditional columns based on cargo properties
    const hasTransportableItems = cargoItems.some(item => !item.isTransportable)
    const transportableColumn = hasTransportableItems ? [
      { key: 'isTransportable', label: 'Transportable', sortable: true, className: 'text-center' }
    ] : []

    // Create enriched items with proper rarity fallback
    const enrichedItems = cargoItems.map((cargoItem) => ({
      ...cargoItem,
      rarity: cargoItem.rarity || { tag: 'Common' },
      // Format boolean values for display
      isTransportable: cargoItem.isTransportable ? 'Yes' : 'No'
    }))

    return {
      name: `${volumeCategory} Volume`,
      items: enrichedItems,
      columns: [...baseColumns, ...cargoColumns, ...transportableColumn]
    }
  })

  // Sort groups by volume category order (Small -> Medium -> Large -> Extra Large)
  const volumeOrder = ['Small', 'Medium', 'Large', 'Extra Large']
  itemGroups.sort((a, b) => {
    const aVolume = a.name.replace(' Volume', '')
    const bVolume = b.name.replace(' Volume', '')
    return volumeOrder.indexOf(aVolume) - volumeOrder.indexOf(bVolume)
  })

  // Cargo statistics
  const totalCargo = cargo.length
  const transportableCount = cargo.filter(c => c.isTransportable).length
  const animalCount = cargo.filter(c => c.isAnimal).length
  const materialCount = cargo.filter(c => c.isMaterial).length
  const vehicleCount = cargo.filter(c => c.isVehicle).length

  // Create subtitle with breakdown
  const subtitleParts = [`${totalCargo} items`]
  if (transportableCount < totalCargo) {
    subtitleParts.push(`${transportableCount} transportable`)
  }
  if (animalCount > 0) subtitleParts.push(`${animalCount} animals`)
  if (materialCount > 0) subtitleParts.push(`${materialCount} materials`)
  if (vehicleCount > 0) subtitleParts.push(`${vehicleCount} vehicles`)

  const subtitle = subtitleParts.join(' • ')

  return (
    <TagPageView
      title={tagName}
      subtitle={subtitle}
      backLink={backLink}
      backLinkText={backLinkText}
      itemGroups={itemGroups}
    />
  )
}