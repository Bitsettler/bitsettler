import { type CargoWithStats } from '@/lib/spacetime-db/modules/cargo/cargo'
import { TagPageView } from '@/views/tag-views/tag-page-view'

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
  // Group by volume (raw game value) for better organization
  const cargoByVolume: Record<string, CargoWithStats[]> = {}
  cargo.forEach((item) => {
    const volume = item.volume.toString()
    if (!cargoByVolume[volume]) {
      cargoByVolume[volume] = []
    }
    cargoByVolume[volume].push(item)
  })

  // Create item groups for each volume
  const itemGroups = Object.entries(cargoByVolume).map(([volume, cargoItems]) => {
    // Create base columns
    const baseColumns = [
      { key: 'icon', label: 'Icon', sortable: false, className: 'w-16' },
      { key: 'name', label: 'Name', sortable: true },
      { key: 'tier', label: 'Tier', sortable: true, className: 'text-center' },
      { key: 'rarity', label: 'Rarity', sortable: true, className: 'text-center' },
      { key: 'volume', label: 'Volume', sortable: true, className: 'text-center' }
    ]

    // Add cargo-specific columns (using raw game values)
    const cargoColumns = [
      { key: 'pickUpTime', label: 'Pickup Time', sortable: true, className: 'text-center' },
      { key: 'movementModifier', label: 'Movement Modifier', sortable: true, className: 'text-center' }
    ]

    // Add conditional columns based on cargo properties
    const hasTransportableItems = cargoItems.some((item) => !item.isTransportable)
    const transportableColumn = hasTransportableItems
      ? [{ key: 'isTransportable', label: 'Transportable', sortable: true, className: 'text-center' }]
      : []

    // Create enriched items with proper rarity fallback
    const enrichedItems = cargoItems.map((cargoItem) => ({
      ...cargoItem,
      rarity: cargoItem.rarity || { tag: 'Common' },
      // Format boolean values for display
      isTransportable: cargoItem.isTransportable ? 'Yes' : 'No'
    }))

    return {
      name: `Volume ${volume}`,
      items: enrichedItems,
      columns: [...baseColumns, ...cargoColumns, ...transportableColumn]
    }
  })

  // Sort groups by volume value (ascending)
  itemGroups.sort((a, b) => {
    const aVolume = parseInt(a.name.replace('Volume ', ''))
    const bVolume = parseInt(b.name.replace('Volume ', ''))
    return aVolume - bVolume
  })

  // Cargo statistics
  const totalCargo = cargo.length
  const transportableCount = cargo.filter((c) => c.isTransportable).length
  const animalCount = cargo.filter((c) => c.isAnimal).length
  const materialCount = cargo.filter((c) => c.isMaterial).length
  const vehicleCount = cargo.filter((c) => c.isVehicle).length

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
