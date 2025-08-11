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
function readTier(it: any): number | undefined {
  return Number(it?.tier ?? it?.Tier ?? it?.T ?? it?.rank ?? it?.Rank) || undefined
}

function readSlug(it: any): string | undefined {
  return (it?.slug ?? it?.Slug ?? it?.code ?? undefined) || undefined
}

function readSkill(it: any): string | undefined {
  // Try explicit skill fields first
  const explicit = it?.skill ?? it?.Skill ?? it?.craftingSkill ?? undefined
  if (explicit) return explicit
  
  // Try to infer gathering skills from item properties
  return inferGatheringSkill(it)
}

function inferGatheringSkill(it: any): string | undefined {
  const name = it?.name?.toLowerCase() || ''
  const category = it?.category?.toLowerCase() || ''
  const tags = it?.tags || []
  
  // Mining/Extraction
  if (name.includes('ore') || name.includes('stone') || name.includes('clay') || 
      name.includes('sand') || name.includes('mineral') || name.includes('gem') ||
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
      category.includes('plant') || category.includes('food')) {
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
      name.includes('feather') || name.includes('meat') ||
      category.includes('animal') || category.includes('hide')) {
    return 'Hunting'
  }
  
  return undefined
}

function iconFrom(it: any, id: string, slug?: string): string {
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
    let skill = itemToSkill.get(id) ?? readSkill(it)
    
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
