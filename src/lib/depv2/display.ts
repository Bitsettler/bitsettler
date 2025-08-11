/**
 * Central, memoized item display resolver for depv2.
 * Builds a single Map at module scope and serves O(1) lookups.
 */
import { getIndexes } from './indexes'

export type ItemDisplay = {
  id: number
  name: string     // fallback '#<id>'
  tier?: number    // T1..T6
  slug?: string
  skill?: string   // e.g., 'Smithing'
  icon: string     // resolved or Unknown.webp
}

const UNKNOWN_ICON = '/assets/Unknown.webp'

let byId: Map<number, ItemDisplay> | null = null

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
  return (it?.skill ?? it?.Skill ?? it?.craftingSkill ?? it?.category ?? it?.Category ?? undefined) || undefined
}

function iconFrom(it: any, id: number, slug?: string): string {
  // Prefer explicit URL/path on item; else build from slug; else unknown
  const direct = it?.iconUrl ?? it?.icon_url ?? it?.icon ?? it?.Icon ?? undefined
  if (typeof direct === 'string' && direct.length) return direct
  if (slug) return `/assets/items/${slug}.webp`
  return UNKNOWN_ICON
}

function buildIndex() {
  const { itemById, itemToSkill } = getIndexes() // must be a module-singleton in indexes.ts
  const m = new Map<number, ItemDisplay>()
  
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

export function getItemDisplay(id: number): ItemDisplay {
  if (!byId) byId = buildIndex()       // build once, first call
  return byId.get(id) ?? { id, name: `#${id}`, icon: UNKNOWN_ICON }
}

export function getManyDisplays(ids: number[]): ItemDisplay[] {
  if (!byId) byId = buildIndex()
  return ids.map(id => byId!.get(id) ?? { id, name: `#${id}`, icon: UNKNOWN_ICON })
}
