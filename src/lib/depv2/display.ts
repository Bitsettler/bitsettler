/**
 * Central, memoized item display resolver for depv2.
 * Builds a single Map at module scope and serves O(1) lookups.
 */
import { getIndexes } from './indexes'
import { getServerIconPath, cleanIconAssetName } from '@/lib/spacetime-db-new/shared/assets'

export type ItemDisplay = {
  id: string       // NOW PREFIXED: "item_123", "cargo_456", etc.
  name: string     // fallback '#<id>'
  tier?: number    // T1..T6
  slug?: string
  skill?: string   // e.g., 'Smithing'
  icon: string     // resolved or Unknown.webp
}

const UNKNOWN_ICON = '/assets/Unknown.webp'

let byId: Map<string, ItemDisplay> | null = null

function sanitizeName(n?: string) {
  if (!n) return undefined
  const t = String(n).trim()
  if (!t) return undefined
  if (t.startsWith('{') && t.endsWith('}')) return undefined
  return t
}

// Try a few common field names; leave undefined if missing
function readTier(it: Record<string, unknown>): number | undefined {
  return Number(it?.tier ?? it?.Tier ?? it?.T ?? it?.rank ?? it?.Rank) || undefined
}

function readSlug(it: Record<string, unknown>): string | undefined {
  return (it?.slug ?? it?.Slug ?? it?.code ?? undefined) || undefined
}

function readSkill(it: Record<string, unknown>): string | undefined {
  // Try explicit skill fields first  
  const explicit = it?.skill ?? it?.Skill ?? it?.craftingSkill ?? undefined
  if (explicit) return explicit
  
  // NOTE: Hard skill data from extraction recipes is handled in indexes.ts
  // and takes priority via itemToSkill mapping. This inference is only
  // a fallback for items not covered by recipes or extraction data.
  return inferGatheringSkill(it)
}

function inferGatheringSkill(it: Record<string, unknown>): string | undefined {
  const name = it?.name?.toLowerCase() || ''
  const category = it?.category?.toLowerCase() || ''
  const tags = it?.tags || []
  
  // Mining/Extraction
  if (name.includes('ore') || name.includes('stone') || name.includes('clay') || 
      name.includes('sand') || name.includes('mineral') || name.includes('gem') ||
      name.includes('braxite') || name.includes('pebbles') || name.includes('gypsite') ||
      name.includes('ancient') || name.includes('damaged') ||
      category.includes('ore') || category.includes('stone')) {
    return 'Mining'
  }
  
  // Forestry/Logging
  if (name.includes('wood') || name.includes('log') || name.includes('bark') || 
      name.includes('sap') || name.includes('timber') || name.includes('branch') ||
      category.includes('wood') || category.includes('tree')) {
    return 'Forestry'
  }
  
  // Farming/Foraging
  if (name.includes('berry') || name.includes('fruit') || name.includes('flower') || 
      name.includes('seed') || name.includes('grain') || name.includes('vegetable') ||
      name.includes('herb') || name.includes('plant') || name.includes('root') ||
      name.includes('bulb') || name.includes('fiber') || name.includes('filament') ||
      name.includes('straw') || name.includes('cotton') || name.includes('flax') ||
      category.includes('plant') || category.includes('food') || category.includes('fiber')) {
    return 'Farming'
  }
  
  // Fishing/Aquaculture  
  if (name.includes('fish') || name.includes('scale') || name.includes('shell') ||
      name.includes('seaweed') || name.includes('coral') || name.includes('pearl') ||
      category.includes('fish') || category.includes('aquatic')) {
    return 'Fishing'
  }
  
  // Hunting/Animal Husbandry
  if (name.includes('hide') || name.includes('pelt') || name.includes('leather') ||
      name.includes('bone') || name.includes('horn') || name.includes('fur') ||
      name.includes('feather') || name.includes('meat') || name.includes('hair') ||
      name.includes('wool') || name.includes('silk') ||
      category.includes('animal') || category.includes('hide')) {
    return 'Hunting'
  }
  
  return undefined
}

function iconFrom(it: Record<string, unknown>, id: string, slug?: string): string {
  // Try iconAssetName first (primary field in our data)
  const rawIconAssetName = it?.iconAssetName ?? it?.icon_asset_name
  if (rawIconAssetName && typeof rawIconAssetName === 'string' && rawIconAssetName.length > 0) {
    // Clean the asset name to fix double-nested paths and other issues
    const cleanedAssetName = cleanIconAssetName(rawIconAssetName)
    if (cleanedAssetName) {
      return getServerIconPath(cleanedAssetName)
    }
  }
  
  // Fallback to other possible icon fields
  const direct = it?.iconUrl ?? it?.icon_url ?? it?.icon ?? it?.Icon ?? undefined
  if (typeof direct === 'string' && direct.length) return direct
  if (slug) return `/assets/items/${slug}.webp`
  return UNKNOWN_ICON
}

function buildIndex() {
  const { itemById, itemToSkill } = getIndexes() // must be a module-singleton in indexes.ts
  const m = new Map<string, ItemDisplay>()
  
  for (const [id, it] of itemById.entries()) {
    const name = sanitizeName(it?.name) ?? `#${id}`
    const tier = readTier(it)
    const slug = readSlug(it)
    
    // Get skill from recipe mapping or try to read from item data
    const skill = itemToSkill.get(id) ?? readSkill(it)
    
    // Debug: Log skill resolution for specific items
    if (name.includes('Crop Oil') || name.includes('Gypsite') || 
        name.includes('Braxite') || name.includes('Pebbles')) {
    }
    
    // Count items without skills for audit
    if (!skill) {
      if (!window.itemsWithoutSkills) window.itemsWithoutSkills = []
      window.itemsWithoutSkills.push({ id, name, tier })
    }
    
    const icon = iconFrom(it, id, slug)
    m.set(id, { id, name, tier, slug, skill, icon })
  }
  return m
}

export function getItemDisplay(id: string): ItemDisplay {
  if (!byId) byId = buildIndex()       // build once, first call
  return byId.get(id) ?? { id, name: `#${id}`, icon: UNKNOWN_ICON }
}

export function getManyDisplays(ids: string[]): ItemDisplay[] {
  if (!byId) byId = buildIndex()
  return ids.map(id => byId!.get(id) ?? { id, name: `#${id}`, icon: UNKNOWN_ICON })
}

/**
 * Clear the display cache - useful for development/debugging
 */
export function clearDisplayCache() {
  byId = null
}

/**
 * Audit function to find items without skills
 */
export function auditItemsWithoutSkills(): { total: number; withoutSkills: Array<{id: string, name: string, tier?: number}> } {
  if (!byId) byId = buildIndex()
  
  const allItems = Array.from(byId.values())
  const withoutSkills = allItems.filter(item => !item.skill)
  
  console.log(`📊 Skill Assignment Audit:`)
  console.log(`Total items: ${allItems.length}`)
  console.log(`Items without skills: ${withoutSkills.length} (${((withoutSkills.length / allItems.length) * 100).toFixed(1)}%)`)
  
  // Log some examples
  console.log(`\n🔍 Examples of items without skills:`)
  withoutSkills.slice(0, 10).forEach(item => {
    console.log(`  - ${item.name} (${item.id}) Tier: ${item.tier || 'N/A'}`)
  })
  
  return {
    total: allItems.length,
    withoutSkills
  }
}

// Clear cache on module reload in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  clearDisplayCache()
}

// Force rebuild for debugging
clearDisplayCache()
