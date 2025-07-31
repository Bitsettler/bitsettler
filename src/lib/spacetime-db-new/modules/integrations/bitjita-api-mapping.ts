/**
 * BitJita API Data Mapping and Transformation
 * 
 * Clear mapping between BitJita API responses and our internal data structures
 * Handles type conversions, validation, and field name normalization
 */

export interface RawBitJitaClaim {
  // Core identification
  entityId: string;                    // Settlement unique ID
  name: string;                        // Settlement display name
  
  // Financial data (⚠️ BitJita sends as strings, we convert to numbers)
  treasury: string;                    // Settlement's money (string like "886")
  buildingMaintenance: number;         // Building upkeep costs (number like 0)
  
  // Settlement metrics  
  tier: number;                        // Settlement tier (0, 1, 2, etc.)
  supplies: number;                    // Current supplies count
  numTiles: number;                    // Number of claimed tiles (⚠️ field name differs from our "tiles")
  
  // Ownership & Control
  ownerPlayerEntityId: string;         // Who owns this settlement
  ownerBuildingEntityId: string;       // Owner's building entity ID
  neutral: boolean;                    // Is settlement neutral?
  
  // Geographic Location
  regionId: number;                    // Which region (like 9 for Zepharel)
  regionName: string;                  // Region name (like "Zepharel")
  locationX: number;                   // X coordinate in world
  locationZ: number;                   // Z coordinate in world  
  locationDimension: number;           // Which dimension/world layer
  
  // Research & Technology
  learned: number[];                   // Array of learned technology IDs
  researching: number;                 // Currently researching tech ID (0 = none)
  startTimestamp: string | null;       // When research started (ISO date or null)
  
  // Timestamps (ISO date strings)
  createdAt: string;                   // When settlement was created
  updatedAt: string;                   // Last time BitJita updated this record
}

export interface BitJitaSettlementDetails {
  // Core identification (normalized field names)
  id: string;                          // BitJita entityId
  name: string;                        // Settlement display name
  
  // Financial data (converted to numbers)
  treasury: number;                    // Settlement's treasury balance (converted from string)
  buildingMaintenance: number;         // Building upkeep costs
  
  // Settlement metrics
  tier: number;                        // Settlement tier level
  supplies: number;                    // Current supplies
  tiles: number;                       // Number of claimed tiles (renamed from numTiles)
  population: number;                  // Population estimate (derived from tiles)
  
  // Ownership & Control  
  ownerPlayerEntityId: string;         // Settlement owner's player ID
  ownerBuildingEntityId: string;       // Owner's building entity
  neutral: boolean;                    // Neutral settlement flag
  
  // Geographic Location
  regionId: number;                    // Region identifier
  regionName: string;                  // Human-readable region name
  locationX: number;                   // World X coordinate
  locationZ: number;                   // World Z coordinate
  locationDimension: number;           // Dimension/layer
  
  // Research & Technology
  learned: number[];                   // Learned technology IDs
  researching: number;                 // Current research (0 = none)
  startTimestamp: string | null;       // Research start time
  
  // Timestamps
  createdAt: string;                   // Creation timestamp
  updatedAt: string;                   // Last update timestamp
}

/**
 * Transform raw BitJita claim data into our normalized settlement structure
 * 
 * Key transformations:
 * - treasury: string → number (BitJita bug: sends numbers as strings)
 * - numTiles → tiles (field name normalization)
 * - population derived from tiles (BitJita doesn't provide population directly)
 * - Validates and defaults missing values
 */
export function transformBitJitaClaim(rawClaim: RawBitJitaClaim): BitJitaSettlementDetails {
  // Validate required fields
  if (!rawClaim.entityId || !rawClaim.name) {
    throw new Error(`Invalid BitJita claim data: missing entityId or name`);
  }
  
  // Convert and validate treasury (BitJita sends as string)
  const treasuryNumber = parseInt(rawClaim.treasury, 10);
  if (isNaN(treasuryNumber)) {
    console.warn(`Invalid treasury value for settlement ${rawClaim.name}: "${rawClaim.treasury}"`);
  }
  
  // Derive population from tiles (BitJita doesn't provide population)
  const tilesCount = rawClaim.numTiles || 0;
  const estimatedPopulation = tilesCount; // 1:1 ratio for now, could be adjusted
  
  return {
    // Core identification
    id: rawClaim.entityId,
    name: rawClaim.name,
    
    // Financial data (with type conversion)
    treasury: treasuryNumber || 0,
    buildingMaintenance: rawClaim.buildingMaintenance || 0,
    
    // Settlement metrics  
    tier: rawClaim.tier || 0,
    supplies: rawClaim.supplies || 0,
    tiles: tilesCount,
    population: estimatedPopulation,
    
    // Ownership & Control (pass through)
    ownerPlayerEntityId: rawClaim.ownerPlayerEntityId,
    ownerBuildingEntityId: rawClaim.ownerBuildingEntityId,
    neutral: rawClaim.neutral || false,
    
    // Geographic Location (pass through)
    regionId: rawClaim.regionId,
    regionName: rawClaim.regionName,
    locationX: rawClaim.locationX,
    locationZ: rawClaim.locationZ,
    locationDimension: rawClaim.locationDimension,
    
    // Research & Technology (pass through)
    learned: rawClaim.learned || [],
    researching: rawClaim.researching || 0,
    startTimestamp: rawClaim.startTimestamp,
    
    // Timestamps (pass through)
    createdAt: rawClaim.createdAt,
    updatedAt: rawClaim.updatedAt
  };
}

/**
 * Transform multiple BitJita claims with error handling
 * 
 * Skips invalid records and logs warnings instead of failing the entire batch
 */
export function transformBitJitaClaims(rawClaims: RawBitJitaClaim[]): BitJitaSettlementDetails[] {
  const validSettlements: BitJitaSettlementDetails[] = [];
  const errors: string[] = [];
  
  for (const rawClaim of rawClaims) {
    try {
      const settlement = transformBitJitaClaim(rawClaim);
      validSettlements.push(settlement);
    } catch (error) {
      const errorMsg = `Failed to transform settlement ${rawClaim.name || rawClaim.entityId}: ${error}`;
      console.warn(errorMsg);
      errors.push(errorMsg);
    }
  }
  
  if (errors.length > 0) {
    console.warn(`⚠️ Skipped ${errors.length}/${rawClaims.length} invalid settlements during transformation`);
  }
  
  return validSettlements;
}

/**
 * Field mapping documentation for reference
 */
export const FIELD_MAPPINGS = {
  // Core fields
  'entityId → id': 'Settlement unique identifier',
  'name → name': 'Settlement display name (unchanged)',
  
  // Financial fields (type conversion required)
  'treasury → treasury': 'String to number conversion (BitJita API bug)',
  'buildingMaintenance → buildingMaintenance': 'Building upkeep costs (unchanged)',
  
  // Settlement metrics
  'tier → tier': 'Settlement tier level (unchanged)',
  'supplies → supplies': 'Current supplies count (unchanged)', 
  'numTiles → tiles': 'Field name normalization',
  'derived → population': 'Estimated from tiles count (BitJita doesn\'t provide)',
  
  // Geographic data (unchanged)
  'regionId → regionId': 'Region identifier',
  'regionName → regionName': 'Human-readable region name',
  'locationX → locationX': 'World X coordinate',
  'locationZ → locationZ': 'World Z coordinate',
  'locationDimension → locationDimension': 'Dimension/layer',
  
  // Research data (unchanged)
  'learned → learned': 'Array of learned technology IDs',
  'researching → researching': 'Current research ID (0 = none)',
  'startTimestamp → startTimestamp': 'Research start time',
  
  // Metadata (unchanged)
  'createdAt → createdAt': 'Settlement creation timestamp',
  'updatedAt → updatedAt': 'Last BitJita update timestamp'
} as const;

// Re-export for external use
export type { RawBitJitaClaim, BitJitaSettlementDetails };