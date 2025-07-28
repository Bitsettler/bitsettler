import { config } from 'dotenv'
import { promises as fs } from 'fs'
import path from 'path'
import { DbConnection } from '../data/bindings/index'

// Import individual types
import type { AchievementDesc } from '../data/bindings/achievement_desc_type'
import type { AlertDesc } from '../data/bindings/alert_desc_type'
import type { BiomeDesc } from '../data/bindings/biome_desc_type'
import type { BuffDesc } from '../data/bindings/buff_desc_type'
import type { BuffTypeDesc } from '../data/bindings/buff_type_desc_type'
import type { BuildingClaimDesc } from '../data/bindings/building_claim_desc_type'
import type { BuildingDesc } from '../data/bindings/building_desc_type'
import type { BuildingFunctionTypeMappingDesc } from '../data/bindings/building_function_type_mapping_desc_type'
import type { BuildingPortalDesc } from '../data/bindings/building_portal_desc_type'
import type { BuildingRepairsDesc } from '../data/bindings/building_repairs_desc_type'
import type { BuildingTypeDesc } from '../data/bindings/building_type_desc_type'
import type { CargoDesc } from '../data/bindings/cargo_desc_type'
import type { CharacterStatDesc } from '../data/bindings/character_stat_desc_type'
import type { ClaimTechDesc } from '../data/bindings/claim_tech_desc_type'
import type { ClaimTileCost } from '../data/bindings/claim_tile_cost_type'
import type { ClimbRequirementDesc } from '../data/bindings/climb_requirement_desc_type'
import type { ClothingDesc } from '../data/bindings/clothing_desc_type'
import type { CollectibleDesc } from '../data/bindings/collectible_desc_type'
import type { CombatActionDesc } from '../data/bindings/combat_action_desc_type'
import type { ConstructionRecipeDesc } from '../data/bindings/construction_recipe_desc_type'
import type { CraftingRecipeDesc } from '../data/bindings/crafting_recipe_desc_type'
import type { DeconstructionRecipeDesc } from '../data/bindings/deconstruction_recipe_desc_type'
import type { DeployableDesc } from '../data/bindings/deployable_desc_type'
import type { DistantVisibleEntityDesc } from '../data/bindings/distant_visible_entity_desc_type'
import type { ElevatorDesc } from '../data/bindings/elevator_desc_type'
import type { EmoteDesc } from '../data/bindings/emote_desc_type'
import type { EmpireColorDesc } from '../data/bindings/empire_color_desc_type'
import type { EmpireIconDesc } from '../data/bindings/empire_icon_desc_type'
import type { EmpireNotificationDesc } from '../data/bindings/empire_notification_desc_type'
import type { EmpireRankDesc } from '../data/bindings/empire_rank_desc_type'
import type { EmpireSuppliesDesc } from '../data/bindings/empire_supplies_desc_type'
import type { EmpireTerritoryDesc } from '../data/bindings/empire_territory_desc_type'
import type { EnemyAiParamsDesc } from '../data/bindings/enemy_ai_params_desc_type'
import type { EnemyDesc } from '../data/bindings/enemy_desc_type'
import type { EnvironmentDebuffDesc } from '../data/bindings/environment_debuff_desc_type'
import type { EquipmentDesc } from '../data/bindings/equipment_desc_type'
import type { ExtractionRecipeDesc } from '../data/bindings/extraction_recipe_desc_type'
import type { FoodDesc } from '../data/bindings/food_desc_type'
import type { GateDesc } from '../data/bindings/gate_desc_type'
import type { HexiteExchangeEntryDesc } from '../data/bindings/hexite_exchange_entry_desc_type'
import type { InteriorEnvironmentDesc } from '../data/bindings/interior_environment_desc_type'
import type { InteriorInstanceDesc } from '../data/bindings/interior_instance_desc_type'
import type { InteriorNetworkDesc } from '../data/bindings/interior_network_desc_type'
import type { InteriorPortalConnectionsDesc } from '../data/bindings/interior_portal_connections_desc_type'
import type { InteriorShapeDesc } from '../data/bindings/interior_shape_desc_type'
import type { InteriorSpawnDesc } from '../data/bindings/interior_spawn_desc_type'
import type { ItemConversionRecipeDesc } from '../data/bindings/item_conversion_recipe_desc_type'
import type { ItemDesc } from '../data/bindings/item_desc_type'
import type { ItemListDesc } from '../data/bindings/item_list_desc_type'
import type { KnowledgeScrollDesc } from '../data/bindings/knowledge_scroll_desc_type'
import type { KnowledgeStatModifierDesc } from '../data/bindings/knowledge_stat_modifier_desc_type'
import type { LootChestDesc } from '../data/bindings/loot_chest_desc_type'
import type { LootTableDesc } from '../data/bindings/loot_table_desc_type'
import type { NpcDesc } from '../data/bindings/npc_desc_type'
import type { ParametersDesc } from '../data/bindings/parameters_desc_type'
import type { PathfindingDesc } from '../data/bindings/pathfinding_desc_type'
import type { PavingTileDesc } from '../data/bindings/paving_tile_desc_type'
import type { PillarShapingDesc } from '../data/bindings/pillar_shaping_desc_type'
import type { PlayerActionDesc } from '../data/bindings/player_action_desc_type'
import type { PlayerHousingDesc } from '../data/bindings/player_housing_desc_type'
import type { ResourceDesc } from '../data/bindings/resource_desc_type'
import type { ResourcePlacementRecipeDesc } from '../data/bindings/resource_placement_recipe_desc_type'
import type { SecondaryKnowledgeDesc } from '../data/bindings/secondary_knowledge_desc_type'
import type { SkillDesc } from '../data/bindings/skill_desc_type'
import type { TargetingMatrixDesc } from '../data/bindings/targeting_matrix_desc_type'
import type { TeleportItemDesc } from '../data/bindings/teleport_item_desc_type'
import type { TerraformRecipeDesc } from '../data/bindings/terraform_recipe_desc_type'
import type { ToolDesc } from '../data/bindings/tool_desc_type'
import type { ToolTypeDesc } from '../data/bindings/tool_type_desc_type'
import type { TravelerTaskDesc } from '../data/bindings/traveler_task_desc_type'
import type { TravelerTradeOrderDesc } from '../data/bindings/traveler_trade_order_desc_type'
import type { WallDesc } from '../data/bindings/wall_desc_type'
import type { WeaponDesc } from '../data/bindings/weapon_desc_type'
import type { WeaponTypeDesc } from '../data/bindings/weapon_type_desc_type'

config({ path: '.env.local' })

// List of table names to collect (Spacetime table names)
const curatedTables = [
  'achievement_desc',
  'alert_desc',
  'biome_desc',
  'buff_desc',
  'buff_type_desc',
  'building_claim_desc',
  'building_desc',
  'building_function_type_mapping_desc',
  'building_portal_desc',
  'building_repairs_desc',
  'building_type_desc',
  'cargo_desc',
  'character_stat_desc',
  'claim_tech_desc',
  'claim_tile_cost',
  'climb_requirement_desc',
  'clothing_desc',
  'collectible_desc',
  'combat_action_desc',
  'construction_recipe_desc',
  'crafting_recipe_desc',
  'deconstruction_recipe_desc',
  'deployable_desc',
  'distant_visible_entity_desc',
  'elevator_desc',
  'emote_desc',
  'empire_color_desc',
  'empire_icon_desc',
  'empire_notification_desc',
  'empire_rank_desc',
  'empire_supplies_desc',
  'empire_territory_desc',
  'enemy_ai_params_desc',
  'enemy_desc',
  'environment_debuff_desc',
  'equipment_desc',
  'extraction_recipe_desc',
  'food_desc',
  'gate_desc',
  'hexite_exchange_entry_desc',
  'interior_environment_desc',
  'interior_instance_desc',
  'interior_network_desc',
  'interior_portal_connections_desc',
  'interior_shape_desc',
  'interior_spawn_desc',
  'item_conversion_recipe_desc',
  'item_desc',
  'item_list_desc',
  'knowledge_scroll_desc',
  'knowledge_stat_modifier_desc',
  'loot_chest_desc',
  'loot_table_desc',
  'npc_desc',
  'parameters_desc',
  'pathfinding_desc',
  'paving_tile_desc',
  'pillar_shaping_desc',
  'player_action_desc',
  'player_housing_desc',
  'resource_desc',
  'resource_placement_recipe_desc',
  'secondary_knowledge_desc',
  'skill_desc',
  'targeting_matrix_desc',
  'teleport_item_desc',
  'terraform_recipe_desc',
  'tool_desc',
  'tool_type_desc',
  'traveler_task_desc',
  'traveler_trade_order_desc',
  'wall_desc',
  'weapon_desc',
  'weapon_type_desc'
] as const

// Table name → Type mapping
interface TableTypeMap {
  achievement_desc: AchievementDesc
  alert_desc: AlertDesc
  biome_desc: BiomeDesc
  buff_desc: BuffDesc
  buff_type_desc: BuffTypeDesc
  building_claim_desc: BuildingClaimDesc
  building_desc: BuildingDesc
  building_function_type_mapping_desc: BuildingFunctionTypeMappingDesc
  building_portal_desc: BuildingPortalDesc
  building_repairs_desc: BuildingRepairsDesc
  building_type_desc: BuildingTypeDesc
  cargo_desc: CargoDesc
  character_stat_desc: CharacterStatDesc
  claim_tech_desc: ClaimTechDesc
  claim_tile_cost: ClaimTileCost
  climb_requirement_desc: ClimbRequirementDesc
  clothing_desc: ClothingDesc
  collectible_desc: CollectibleDesc
  combat_action_desc: CombatActionDesc
  construction_recipe_desc: ConstructionRecipeDesc
  crafting_recipe_desc: CraftingRecipeDesc
  deconstruction_recipe_desc: DeconstructionRecipeDesc
  deployable_desc: DeployableDesc
  distant_visible_entity_desc: DistantVisibleEntityDesc
  elevator_desc: ElevatorDesc
  emote_desc: EmoteDesc
  empire_color_desc: EmpireColorDesc
  empire_icon_desc: EmpireIconDesc
  empire_notification_desc: EmpireNotificationDesc
  empire_rank_desc: EmpireRankDesc
  empire_supplies_desc: EmpireSuppliesDesc
  empire_territory_desc: EmpireTerritoryDesc
  enemy_ai_params_desc: EnemyAiParamsDesc
  enemy_desc: EnemyDesc
  environment_debuff_desc: EnvironmentDebuffDesc
  equipment_desc: EquipmentDesc
  extraction_recipe_desc: ExtractionRecipeDesc
  food_desc: FoodDesc
  gate_desc: GateDesc
  hexite_exchange_entry_desc: HexiteExchangeEntryDesc
  interior_environment_desc: InteriorEnvironmentDesc
  interior_instance_desc: InteriorInstanceDesc
  interior_network_desc: InteriorNetworkDesc
  interior_portal_connections_desc: InteriorPortalConnectionsDesc
  interior_shape_desc: InteriorShapeDesc
  interior_spawn_desc: InteriorSpawnDesc
  item_conversion_recipe_desc: ItemConversionRecipeDesc
  item_desc: ItemDesc
  item_list_desc: ItemListDesc
  knowledge_scroll_desc: KnowledgeScrollDesc
  knowledge_stat_modifier_desc: KnowledgeStatModifierDesc
  loot_chest_desc: LootChestDesc
  loot_table_desc: LootTableDesc
  npc_desc: NpcDesc
  parameters_desc: ParametersDesc
  pathfinding_desc: PathfindingDesc
  paving_tile_desc: PavingTileDesc
  pillar_shaping_desc: PillarShapingDesc
  player_action_desc: PlayerActionDesc
  player_housing_desc: PlayerHousingDesc
  resource_desc: ResourceDesc
  resource_placement_recipe_desc: ResourcePlacementRecipeDesc
  secondary_knowledge_desc: SecondaryKnowledgeDesc
  skill_desc: SkillDesc
  targeting_matrix_desc: TargetingMatrixDesc
  teleport_item_desc: TeleportItemDesc
  terraform_recipe_desc: TerraformRecipeDesc
  tool_desc: ToolDesc
  tool_type_desc: ToolTypeDesc
  traveler_task_desc: TravelerTaskDesc
  traveler_trade_order_desc: TravelerTradeOrderDesc
  wall_desc: WallDesc
  weapon_desc: WeaponDesc
  weapon_type_desc: WeaponTypeDesc
}

// Derived type for full data set
type GameData = {
  [K in keyof TableTypeMap]: TableTypeMap[K][]
}

function camelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

function replacer(_key: string, value: unknown) {
  return typeof value === 'bigint' ? value.toString() : value
}

function getSortKey(item: unknown): number {
  if (typeof item === 'object' && item !== null) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj = item as any
    return (
      obj.id ?? obj.itemId ?? obj.buildingId ?? obj.cargoId ?? obj.typeId ?? 0
    )
  }
  return 0
}

async function setupWebSocketPolyfill() {
  const { WebSocket } = await import('ws')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(global as any).WebSocket = WebSocket
}

async function connectToDb(): Promise<DbConnection> {
  const host = process.env.BITCRAFT_SPACETIME_HOST!
  const token = process.env.BITCRAFT_AUTH_TOKEN!
  const bitcraftModule = process.env.BITCRAFT_REGION_MODULE!
  const uri = `wss://${host}`

  await setupWebSocketPolyfill()

  return new Promise((resolve, reject) => {
    DbConnection.builder()
      .withUri(uri)
      .withModuleName(bitcraftModule)
      .withToken(token)
      .onConnect((conn) => resolve(conn))
      .onDisconnect(() => console.log('🔌 Disconnected'))
      .build()

    setTimeout(() => reject(new Error('Connection timeout')), 30000)
  })
}

async function subscribeToTables(
  conn: DbConnection,
  tables: readonly (keyof TableTypeMap)[]
) {
  const queries = tables.map((name) => `SELECT * FROM ${name}`)
  conn.subscriptionBuilder().subscribe(queries)
  await new Promise((res) => setTimeout(res, 5000)) // wait for data to arrive
}

function collectTableData(
  conn: DbConnection,
  tables: readonly (keyof TableTypeMap)[]
): GameData {
  const data = {} as GameData

  for (const table of tables) {
    const dbKey = camelCase(table)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cache = (conn.db as any)[dbKey]
    if (cache?.iter) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(data as any)[table] = Array.from(cache.iter())
    } else {
      console.warn(`⚠️ Missing table cache for ${table}`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(data as any)[table] = []
    }
  }

  return data
}

async function saveTableDataAsJSON(dataDir: string, tableData: GameData) {
  const outputDir = path.join(dataDir, 'sdk-tables')
  await fs.mkdir(outputDir, { recursive: true })

  for (const [name, data] of Object.entries(tableData)) {
    if (data.length === 0) continue
    const sorted = [...data].sort((a, b) => getSortKey(a) - getSortKey(b))
    await fs.writeFile(
      path.join(outputDir, `${name}.json`),
      JSON.stringify(sorted, replacer, 2)
    )
    console.log(`✅ Saved ${name}.json (${sorted.length} rows)`)
  }
}

function logSummary(tableData: GameData) {
  console.log('\n📋 Data Summary:')
  for (const [name, data] of Object.entries(tableData)) {
    console.log(`- ${name}: ${data.length} rows`)
  }
  const totalRows = Object.values(tableData).reduce(
    (acc, arr) => acc + arr.length,
    0
  )
  console.log(`\n📊 Total tables: ${Object.keys(tableData).length}`)
  console.log(`📊 Total rows: ${totalRows}`)
}

async function main() {
  try {
    const dataDir =
      process.env.DATA_DIR || path.join(process.cwd(), 'src', 'data')
    await fs.mkdir(dataDir, { recursive: true })

    console.log('🚀 Connecting to SpacetimeDB...')
    const conn = await connectToDb()

    console.log('📡 Subscribing to tables...')
    await subscribeToTables(conn, curatedTables)

    console.log('📊 Collecting table data...')
    const tableData = collectTableData(conn, curatedTables)

    console.log('💾 Saving data...')
    await saveTableDataAsJSON(dataDir, tableData)

    logSummary(tableData)

    console.log('\n🎉 Done.')
    process.exit(0)
  } catch (err) {
    console.error('❌ Error:', err)
    process.exit(1)
  }
}

main()
