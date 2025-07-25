import type { CargoDesc } from '@/data/bindings/cargo_desc_type'
import { getTierColor } from '@/lib/spacetime-db-new/shared/utils/entities'
import { TagPageView } from '@/views/tag-views/tag-page-view'

interface CargoIndividualTagPageViewProps {
  tagName: string
  cargo: CargoDesc[]
  backLink?: string
  backLinkText?: string
}

export function CargoIndividualTagPageView({
  tagName,
  cargo,
  backLink = '/compendium/cargo',
  backLinkText = '← Back to Cargo'
}: CargoIndividualTagPageViewProps) {
  // Create base columns (removing volume since all cargo has volume 600)
  const baseColumns = [
    { key: 'icon', label: 'Icon', sortable: false, className: 'w-16' },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'tier', label: 'Tier', sortable: true, className: 'text-center' },
    { key: 'rarity', label: 'Rarity', sortable: true, className: 'text-center' }
  ]

  // Add cargo-specific columns (using raw game values)
  const cargoColumns = [
    { key: 'pickUpTime', label: 'Pickup Time', sortable: true, className: 'text-center' },
    { key: 'movementModifier', label: 'Movement Modifier', sortable: true, className: 'text-center' }
  ]

  // Add conditional columns based on cargo properties
  const hasTransportableItems = cargo.some((item) => item.notPickupable)
  const transportableColumn = hasTransportableItems
    ? [{ key: 'isTransportable', label: 'Transportable', sortable: true, className: 'text-center' }]
    : []

  // Create enriched items with proper rarity fallback and tier colors
  const enrichedItems = cargo.map((cargoItem) => ({
    ...cargoItem,
    rarity: cargoItem.rarity || { tag: 'Common' },
    // Format boolean values for display
    isTransportable: !cargoItem.notPickupable ? 'Yes' : 'No',
    // Add tier color styling for the icon
    tierColor: getTierColor(cargoItem.tier)
  }))

  // Create single item group with tag name as title
  const itemGroups = [
    {
      name: tagName,
      items: enrichedItems,
      columns: [...baseColumns, ...cargoColumns, ...transportableColumn]
    }
  ]

  // Cargo statistics
  const totalCargo = cargo.length
  const transportableCount = cargo.filter((c) => !c.notPickupable).length
  // Simplified statistics - we can determine basic categories from tag patterns
  const animalCount = cargo.filter((c) => c.tag?.toLowerCase().includes('animal')).length
  const materialCount = cargo.filter(
    (c) =>
      c.tag?.toLowerCase().includes('material') ||
      c.tag?.toLowerCase().includes('wood') ||
      c.tag?.toLowerCase().includes('stone') ||
      c.tag?.toLowerCase().includes('metal')
  ).length
  const vehicleCount = cargo.filter((c) => c.tag?.toLowerCase().includes('vehicle')).length

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
