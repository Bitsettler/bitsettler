export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic'
export type Category = 'items' | 'cargo' | 'creatures' | 'resources' | 'structures'

export interface GameItem {
  id: string
  name: string
  slug: string
  tier: number
  rarity: Rarity
  category: Category
  description: string
}

export interface Profession {
  name: string
  level: number
}

export interface Tool {
  name: string
  tier: number
}

export interface Building {
  name: string
  tier: number
}

export interface RecipeOutput {
  item: string // slug of the item
  qty: number
}

export interface Recipe {
  id: number
  name: string
  requirements: {
    professions?: string
    tool?: string
    building?: string
    materials: Array<{ id: string; qty: number | null }>
  }
  output: Array<{
    item: string
    qty: number | number[] | null
    probability?: number // Drop rate/chance for extraction recipes (0-1)
  }>
}

// Server data interfaces (flattened, no namespace)
export interface ServerRecipe {
  id: number
  name: string
  time_requirement: number
  stamina_requirement: number
  tool_durability_lost: number
  building_requirement: [number, { building_type: number; tier: number }]
  level_requirements: [number, number][]
  tool_requirements: [number, number, number][]
  consumed_item_stacks: [number, number, [number, unknown[]], number, number][]
  crafted_item_stacks: [number, number, [number, unknown[]], [number, number]][]
  actions_required: number
  tool_mesh_index: number
  recipe_performance_id: number
  required_knowledges: number[]
  blocking_knowledges: number[]
  hide_without_required_knowledge: boolean
  hide_with_blocking_knowledges: boolean
  allow_use_hands: boolean
  is_passive: boolean
}

export interface ServerItem {
  id: number
  name: string
  description: string
  volume: number
  durability: number
  convert_to_on_durability_zero: number
  secondary_knowledge_id: number
  model_asset_name: string
  icon_asset_name: string
  tier: number
  tag: string
  rarity: [number, Record<string, unknown>]
  compendium_entry: boolean
  item_list_id: number
}

export type ServerItemStack = [number, number, [number, unknown[]], [number, number]]
export type ServerItemListPossibility = [number, ServerItemStack[]]

export interface ServerItemList {
  id: number
  name: string
  possibilities: ServerItemListPossibility[]
}

export interface ServerCargo {
  id: number
  name: string
  description: string
  volume: number
  secondary_knowledge_id: number
  model_asset_name: string
  icon_asset_name: string
  carried_model_asset_name: string
  pick_up_animation_start: string
  pick_up_animation_end: string
  drop_animation_start: string
  drop_animation_end: string
  pick_up_time: number
  place_time: number
  animator_state: string
  movement_modifier: number
  blocks_path: boolean
  on_destroy_yield_cargos: unknown[]
  despawn_time: number
  tier: number
  tag: string
  rarity: [number, Record<string, unknown>]
  not_pickupable: boolean
}

export interface ServerResource {
  id: number
  name: string
  description: string
  flattenable: boolean
  max_health: number
  ignore_damage: boolean
  despawn_time: number
  model_asset_name: string
  icon_asset_name: string
  on_destroy_yield: Array<[number, number, [number, unknown[]], [number, number]]>
  on_destroy_yield_resource_id: number
  spawn_priority: number
  footprint: Array<[number, number, [number, unknown[]]]>
  tier: number
  tag: string
  rarity: [number, Record<string, unknown>]
  compendium_entry: boolean
  enemy_params_id: number[]
  scheduled_respawn_time: number
  not_respawning: boolean
}
