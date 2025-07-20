import { createSlug } from '@/lib/spacetime-db-new/shared/utils/entities'
import { getBuildingDescsByTypeId } from '../commands/get-building-descs-by-type-id'
import { getAllBuildingTypes } from '../commands/get-building-type-by-id'

interface BuildingTypeMetadata {
  id: string
  name: string
  description: string
  icon: string | undefined
  count: number
  href: string
  category: string
}

const BUILDING_TYPE_DESCRIPTIONS: Record<number, string> = {
  1: 'Commercial buildings for trade and commerce',
  2: 'Rest and recovery facilities',
  3: 'Buildings for storing items, resources, and cargo',
  4: 'Buildings for storing items, resources, and cargo',
  5: 'Administrative and governance buildings',
  6: 'Defensive structures and fortifications',
  7: 'Defensive structures and fortifications',
  8: 'Entry points and access control structures',
  9: 'Defensive structures and fortifications',
  10: 'Workshops, forges, and other crafting facilities',
  11: 'Workshops, forges, and other crafting facilities',
  12: 'Workshops, forges, and other crafting facilities',
  13: 'Workshops, forges, and other crafting facilities',
  14: 'Workshops, forges, and other crafting facilities',
  15: 'Workshops, forges, and other crafting facilities',
  16: 'Workshops, forges, and other crafting facilities',
  17: 'Workshops, forges, and other crafting facilities',
  20: 'Workshops, forges, and other crafting facilities',
  21: 'Workshops, forges, and other crafting facilities',
  22: 'Workshops, forges, and other crafting facilities',
  23: 'Workshops, forges, and other crafting facilities',
  24: 'Workshops, forges, and other crafting facilities',
  25: 'Workshops, forges, and other crafting facilities',
  26: 'Workshops, forges, and other crafting facilities',
  27: 'Mysterious ancient structures and ruins',
  28: 'Territory markers and claim management structures',
  29: 'Environmental modification and terraforming facilities',
  30: 'Trading and bartering facilities',
  32: 'Workshops, forges, and other crafting facilities',
  33: 'Workshops, forges, and other crafting facilities',
  34: 'Workshops, forges, and other crafting facilities',
  40: 'Workshops, forges, and other crafting facilities',
  41: 'Workshops, forges, and other crafting facilities',
  44: 'Workshops, forges, and other crafting facilities',
  45: 'Workshops, forges, and other crafting facilities',
  47: 'Workshops, forges, and other crafting facilities',
  48: 'Workshops, forges, and other crafting facilities',
  59: 'Property rental and management stations',
  100: 'Workshops, forges, and other crafting facilities',
  200: 'Workshops, forges, and other crafting facilities',
  201: 'Workshops, forges, and other crafting facilities',
  202: 'Workshops, forges, and other crafting facilities',
  400: 'Workshops, forges, and other crafting facilities',
  500: 'Workshops, forges, and other crafting facilities',
  999: 'Transportation and teleportation structures',
  1000: 'Buildings for storing items, resources, and cargo',
  1001: 'Buildings for storing items, resources, and cargo',
  1002: 'Decorative and aesthetic structures',
  2000: 'Observation and surveillance structures',
  2001: 'Large-scale industrial and empire facilities',
  31359901: 'Vertical transportation structures',
  81226542: 'Marketplace and trading centers',
  127749503: 'Workshops, forges, and other crafting facilities',
  238340097: 'Item recovery and safety storage',
  635094930: 'Workshops, forges, and other crafting facilities',
  688483913: 'Housing and living accommodations for citizens',
  787619404: 'Personal player residences and homes',
  848835411: 'Information and directional signage',
  1265792081: 'Navigation and fast travel markers',
  1559722792: 'Workshops, forges, and other crafting facilities',
  1721785854: 'Financial institutions and vaults',
  1913947152: 'Workshops, forges, and other crafting facilities',
  2012420824: 'Workshops, forges, and other crafting facilities'
}

/**
 * Get building type metadata with counts and descriptions
 */
export function getBuildingsTypeMetadata(): BuildingTypeMetadata[] {
  const buildingTypes = getAllBuildingTypes()

  return buildingTypes
    .map((buildingType): BuildingTypeMetadata => {
      const buildingDescs = getBuildingDescsByTypeId(buildingType.id)
      const slug = createSlug(buildingType.name)

      // Get icon from the first building of this type
      const firstBuilding = buildingDescs[0]
      const icon = firstBuilding?.iconAssetName || undefined

      console.log({
        typeId: buildingType.id,
        typeName: buildingType.name,
        buildingCount: buildingDescs.length,
        firstBuildingName: firstBuilding?.name,
        firstBuildingIcon: firstBuilding?.iconAssetName,
        icon
      })

      return {
        id: slug,
        name: buildingType.name,
        description: BUILDING_TYPE_DESCRIPTIONS[buildingType.id] || 'Various building structures and facilities',
        icon: icon,
        count: buildingDescs.length,
        href: `/compendium/buildings/${slug}`,
        category: 'Buildings & Structures'
      }
    })
    .filter((metadata) => metadata.count > 0) // Only include types with actual buildings
}
