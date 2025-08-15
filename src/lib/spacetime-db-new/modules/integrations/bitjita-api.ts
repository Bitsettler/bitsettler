import { settlementConfig } from '../../../../config/settlement-config';
import { transformBitJitaClaims, type RawBitJitaClaim, type BitJitaSettlementDetails } from './bitjita-api-mapping';

// ============================================================================
// CLEAN DATA MODEL - ONE USER ENTITY
// ============================================================================

/**
 * Raw BitJita Member Data (from /claims/{id}/members)
 * Contains permissions and basic settlement membership info
 */
export interface BitJitaRawMember {
  entityId: string;           // User's unique ID
  claimEntityId: string;      // Settlement claim ID  
  playerEntityId: string;     // Alternative user ID
  userName?: string;          // Username (may be undefined in API)
  inventoryPermission: number;
  buildPermission: number;
  officerPermission: number;
  coOwnerPermission: number;
  createdAt: string;
  updatedAt?: string;
  lastLoginTimestamp?: string;
}

/**
 * Raw BitJita Citizen Data (from /claims/{id}/citizens)  
 * Contains skills and progression data
 */
export interface BitJitaRawCitizen {
  entityId: string;           // User's unique ID (same as member)
  userName: string;           // Username (usually present here)
  skills: Record<string, number>;
  totalSkills: number;
  highestLevel: number;
  totalLevel: number;
  totalXP: number;
}

/**
 * UNIFIED USER MODEL - This is what we actually care about
 * Combines member permissions + citizen skills for the same user
 */
export interface SettlementUser {
  // Core Identity  
  entityId: string;           // PRIMARY KEY - User's unique BitJita ID
  userName: string;           // Display name
  
  // Settlement Membership
  settlementId: string;       // Which settlement they're in
  claimEntityId: string;      // Settlement's claim ID
  playerEntityId: string;     // Alternative user ID
  
  // Permissions in Settlement
  inventoryPermission: number;
  buildPermission: number;
  officerPermission: number;
  coOwnerPermission: number;
  
  // Skills & Progression
  skills: Record<string, number>;
  totalSkills: number;
  highestLevel: number;
  totalLevel: number;
  totalXP: number;
  
  // Timestamps
  joinedAt: string;
  lastLoginTimestamp?: string;
  lastSyncedAt: string;
}

/**
 * Raw BitJita Player Data (from /players/{playerId})
 * Contains individual player profile, skills, and experience
 */
export interface BitJitaRawPlayer {
  entityId: string;           // Player's unique ID
  userName: string;           // Display name
  lastLoginTimestamp?: string;
  claims: Array<{
    entityId: string;
    name: string;
    tier: number;
    treasury: number;
    supplies: number;
    tiles: number;
    regionName: string;
    regionId: string;
    permissions: {
      inventory: boolean;
      build: boolean;
      officer: boolean;
      coOwner: boolean;
    };
  }>;
  empires: Array<{
    entityId: string;
    name: string;
    rank: number;
    donatedShards: number;
    nobleSince: string;
  }>;
  skills: Record<string, {
    level: number;
    xp: number;
    progressToNext: number;
    tool?: string;
    toolTier?: number;
    toolRarity?: string;
  }>;
  exploration: {
    totalExplored: number;
    totalChunks: number;
    progress: number;
    regions: Array<{
      name: string;
      explored: number;
      total: number;
      progress: number;
    }>;
  };
  inventory?: {
    toolbelt: Array<{
      itemId: string;
      name: string;
      tier: number;
      rarity: string;
      quantity: number;
    }>;
    wallet: Array<{
      itemId: string;
      name: string;
      quantity: number;
    }>;
    storage: Array<{
      location: string;
      items: Array<{
        itemId: string;
        name: string;
        tier: number;
        rarity: string;
        quantity: number;
      }>;
    }>;
  };
}

/**
 * UNIFIED PLAYER MODEL - Clean player data for our app
 */
export interface PlayerProfile {
  // Core Identity
  entityId: string;
  userName: string;
  lastLoginTimestamp?: string;
  
  // Settlement Memberships
  settlements: Array<{
    entityId: string;
    name: string;
    tier: number;
    treasury: number;
    supplies: number;
    tiles: number;
    regionName: string;
    regionId: string;
    isOwner: boolean;
    permissions: {
      inventory: boolean;
      build: boolean;
      officer: boolean;
      coOwner: boolean;
    };
  }>;
  
  // Empire Memberships
  empires: Array<{
    entityId: string;
    name: string;
    rank: number;
    donatedShards: number;
    nobleSince: string;
  }>;
  
  // Skills & Progression
  skills: Record<string, {
    level: number;
    xp: number;
    progressToNext: number;
    tool?: string;
    toolTier?: number;
    toolRarity?: string;
  }>;
  
  // Exploration Progress
  exploration: {
    totalExplored: number;
    totalChunks: number;
    progress: number;
    regions: Array<{
      name: string;
      explored: number;
      total: number;
      progress: number;
    }>;
  };
  
  // Inventory (optional - may not always be included)
  inventory?: {
    toolbelt: Array<{
      itemId: string;
      name: string;
      tier: number;
      rarity: string;
      quantity: number;
    }>;
    wallet: Array<{
      itemId: string;
      name: string;
      quantity: number;
    }>;
    storage: Array<{
      location: string;
      items: Array<{
        itemId: string;
        name: string;
        tier: number;
        rarity: string;
        quantity: number;
      }>;
    }>;
  };
  
  // Metadata
  lastSyncedAt: string;
}

// BitJitaSettlementDetails interface moved to bitjita-api-mapping.ts

export interface BitJitaAPIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Raw BitJita Player Search Response (from /api/players?q={query})
 * Contains basic player information from search results
 */

export interface BitJitaPlayerSearchRawType{
    entityId: string;
    username: string;
    signedIn: boolean;
    timePlayed: number;
    timeSignedIn: number;
    createdAt: string;
    updatedAt: string;
    lastLoginTimestamp: string;
  }

export interface BitJitaPlayerSearchResponse {
  players: Array<BitJitaPlayerSearchRawType>;
  total: number;
}

/**
 * BitJita API client for external settlement data integration
 */
export class BitJitaAPI {
  private static readonly BASE_URL = settlementConfig.bitjita.baseUrl;
  private static readonly HEADERS = {
    'x-app-identifier': settlementConfig.bitjita.appIdentifier,
    'Content-Type': 'application/json',
    'User-Agent': 'BitSettler/1.0 (https://bitsettler.io)',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  };

  // Alternative headers that might work better
  private static readonly ALTERNATIVE_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (compatible; BitSettler/1.0; +https://bitsettler.io)',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin'
  };

    /**
   * Fetch settlement roster from BitJita API
   * Returns raw member data with permissions but unreliable userNames
   */
static async fetchSettlementRoster(settlementId: string): Promise<BitJitaAPIResponse<{ members: BitJitaRawMember[] }>> {
    try {
  
      
      const response = await fetch(`${this.BASE_URL}/claims/${settlementId}/members`, {
        method: 'GET',
        headers: this.HEADERS,
        signal: AbortSignal.timeout(settlementConfig.bitjita.timeout)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log(`✅ Fetched ${data.members?.length || 0} members`);
      
      // DEBUG: Log the actual API response structure
      if (data.members && data.members.length > 0) {
        console.log(`🔍 BitJita /members API response structure:`);
        console.log(`   First member keys:`, Object.keys(data.members[0]));
        console.log(`   First member data:`, data.members[0]);
      }
      
      return {
        success: true,
        data: {
          members: data.members || []
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error fetching settlement roster:', errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Fetch settlement citizens with skills from BitJita API  
   * Returns raw citizen data with skills and reliable userNames
   */
  static async fetchSettlementCitizens(settlementId: string): Promise<BitJitaAPIResponse<{ citizens: BitJitaRawCitizen[]; skillNames: Record<string, string> }>> {
    try {
      const citizensUrl = `${this.BASE_URL}/claims/${settlementId}/citizens`;
  
      console.log(`   URL: ${citizensUrl}`);
      
      const response = await fetch(citizensUrl, {
        method: 'GET',
        headers: this.HEADERS,
        signal: AbortSignal.timeout(settlementConfig.bitjita.timeout)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log(`✅ Fetched ${data.citizens?.length || 0} citizens with skills`);
      
      // 🚨 DEBUG: Log the raw API response structure (not full data to avoid spam)
      console.log(`🔍 RAW CITIZENS API RESPONSE STRUCTURE:`);
      console.log(`   Keys: ${Object.keys(data)}`);
      console.log(`   Citizens array exists: ${Array.isArray(data.citizens)}`);
      console.log(`   Citizens count: ${data.citizens?.length || 0}`);
      console.log(`   Skill names object: ${data.skillNames ? Object.keys(data.skillNames).length + ' skills' : 'none'}`);
      if (data.citizens?.length === 0) {
        console.log(`   🚨 EMPTY RESPONSE - Full data:`, data);
      }
      
      // Debug first citizen's skills data to check API response integrity
      if (data.citizens && data.citizens.length > 0) {
        const firstCitizen = data.citizens[0];
        console.log(`🔍 BitJita API skills response check:`);
        console.log(`   Sample citizen: ${firstCitizen.userName}`);
        console.log(`   Skills type: ${typeof firstCitizen.skills}`);
        console.log(`   Skills count: ${firstCitizen.skills ? Object.keys(firstCitizen.skills).length : 'null/undefined'}`);
        if (firstCitizen.skills && Object.keys(firstCitizen.skills).length > 0) {
          const skillSample = Object.entries(firstCitizen.skills).slice(0, 3);
          console.log(`   Skills sample: ${skillSample.map(([id, level]) => `${id}:${level}`).join(', ')}`);
          console.log(`   Total levels: ${firstCitizen.totalLevel}, Highest: ${firstCitizen.highestLevel}`);
        } else {
          console.log(`   ⚠️ No skills in API response for ${firstCitizen.userName}`);
        }
      }
      
      return {
        success: true,
        data: {
          citizens: data.citizens || [],
          skillNames: data.skillNames || {}
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error fetching settlement citizens:', errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Clean implementation: Get members + citizens data and merge them
   */
  static async fetchSettlementUsers(settlementId: string): Promise<BitJitaAPIResponse<{ users: SettlementUser[], skillNames: Record<string, string> }>> {
    try {
      // Call both APIs in parallel
      const [membersResponse, citizensResponse] = await Promise.all([
        fetch(`${this.BASE_URL}/claims/${settlementId}/members`, {
          method: 'GET',
          headers: this.HEADERS,
          signal: AbortSignal.timeout(30000)
        }),
        fetch(`${this.BASE_URL}/claims/${settlementId}/citizens`, {
          method: 'GET', 
          headers: this.HEADERS,
          signal: AbortSignal.timeout(30000)
        })
      ]);

      if (!membersResponse.ok) {
        throw new Error(`Members API failed: ${membersResponse.status}`);
      }

      const membersData = await membersResponse.json();
      const members = membersData.members || [];

      let citizens = [];
      let skillNames = {};
      
      if (citizensResponse.ok) {
        const citizensData = await citizensResponse.json();
        citizens = citizensData.citizens || [];
        skillNames = citizensData.skillNames || {};
        console.log(`✅ Citizens API: ${citizens.length} citizens, ${Object.keys(skillNames).length} skill names`);
      } else {
        console.log(`❌ Citizens API failed: ${citizensResponse.status}`);
      }

      // Create lookup maps for citizens - try multiple ID fields
      const citizensByEntityId = new Map(citizens.map((c: BitJitaRawCitizen) => [c.entityId, c]));
      const citizensByPlayerEntityId = new Map(citizens.map((c: BitJitaRawCitizen) => [c.entityId, c])); // Citizens use entityId as their key
      const citizensByUserName = new Map(citizens.map((c: BitJitaRawCitizen) => [c.userName, c]));

      // Merge members + citizens data
      const users: SettlementUser[] = members.map((member: BitJitaRawMember) => {
        // Try multiple matching strategies
        let citizen = citizensByEntityId.get(member.entityId) ||
                     citizensByPlayerEntityId.get(member.playerEntityId) ||
                     citizensByEntityId.get(member.playerEntityId) ||
                     citizensByUserName.get(member.userName);
        
        return {
          entityId: member.entityId,
          userName: member.userName || citizen?.userName || `User_${member.entityId.slice(-8)}`,
          settlementId,
          claimEntityId: member.claimEntityId,
          playerEntityId: member.playerEntityId,
          inventoryPermission: member.inventoryPermission,
          buildPermission: member.buildPermission,
          officerPermission: member.officerPermission,
          coOwnerPermission: member.coOwnerPermission,
          skills: citizen?.skills || {},
          totalSkills: citizen?.totalSkills || 0,
          highestLevel: citizen?.highestLevel || 0,
          totalLevel: citizen?.totalLevel || 0,
          totalXP: citizen?.totalXP || 0,
          joinedAt: member.createdAt,
          lastLoginTimestamp: member.lastLoginTimestamp,
          lastSyncedAt: new Date().toISOString()
        };
      });

      const usersWithSkills = users.filter(u => u.totalSkills > 0).length;
      console.log(`✅ Merged: ${users.length} users, ${usersWithSkills} with skills`);

      return {
        success: true,
        data: { users, skillNames }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error fetching unified settlement users:', errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Search settlements by name from BitJita API
   */
  static async searchSettlements(query: string, page: number = 1): Promise<BitJitaAPIResponse<{
    settlements: BitJitaSettlementDetails[];
    pagination: {
      currentPage: number;
      totalResults: number;
      hasMore: boolean;
    };
  }>> {
    try {
      console.log(`🔍 Searching settlements for "${query}" (page ${page})...`);
      
      const response = await fetch(`${this.BASE_URL}/claims?q=${encodeURIComponent(query)}&page=${page}`, {
        method: 'GET',
        headers: this.HEADERS,
        signal: AbortSignal.timeout(settlementConfig.bitjita.timeout)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Found ${data.claims?.length || 0} settlements`);
      
      // Transform the data to our format
      const settlements: BitJitaSettlementDetails[] = (data.claims || []).map((claim: RawBitJitaClaim) => ({
        id: claim.entityId,
        name: claim.name,
        tier: claim.tier || 0,
        treasury: parseInt(claim.treasury) || 0,
        supplies: claim.supplies || 0,
        tiles: claim.numTiles || 0,
        population: claim.numTiles || 0, // BitJita doesn't provide actual member count
        regionName: claim.regionName || 'Unknown Region',
        regionId: claim.regionId
      }));
      
      return {
        success: true,
        data: {
          settlements,
          pagination: {
            currentPage: page,
            totalResults: data.totalResults || settlements.length,
            hasMore: data.hasMore || false
          }
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error searching settlements:', errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Search characters by name from BitJita API
   * Since BitJita doesn't have a direct character search endpoint, we'll use a combination approach:
   * 1. Try to fetch player profile directly if the query looks like a player ID
   * 2. Search through settlements and their members to find matching characters
   */
  static async searchCharacters(query: string, page: number = 1): Promise<BitJitaAPIResponse<BitJitaPlayerSearchResponse>> {
    try {
      console.log(`🔍 Searching characters for "${query}" (page ${page})...`);
      
      // Use the new direct player search endpoint
      const searchUrl = `${this.BASE_URL}/players?q=${encodeURIComponent(query)}`;
      console.log(`🔍 Calling BitJita API: ${searchUrl}`);
      
      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: this.HEADERS,
        signal: AbortSignal.timeout(settlementConfig.bitjita.timeout),
        cache: 'no-cache'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ BitJita API error (${response.status}):`, errorText);
        return {
          success: false,
          error: `BitJita API returned ${response.status}: ${errorText}`
        };
      }
      
      const searchData: BitJitaPlayerSearchResponse = await response.json();
      console.log(`✅ Found ${searchData.players.length} players matching "${query}"`);
      
     
      return {
        success: true,
        data: searchData
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error searching characters:', error);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Helper method to determine the top profession from skills
   */
  private static getTopProfession(skills: Record<string, any>): string {
    if (!skills || Object.keys(skills).length === 0) {
      return 'Settler';
    }
    
    // Define profession skill mappings
    const professionSkills: Record<string, string[]> = {
      'Warrior': ['combat', 'defense', 'weaponry', 'tactics'],
      'Blacksmith': ['smithing', 'mining', 'engineering', 'crafting'],
      'Guard': ['defense', 'combat', 'protection', 'vigilance'],
      'Scholar': ['knowledge', 'research', 'magic', 'wisdom'],
      'Merchant': ['trading', 'negotiation', 'economics', 'diplomacy'],
      'Explorer': ['exploration', 'survival', 'navigation', 'discovery']
    };
    
    // Find the profession with the highest total skill levels
    let topProfession = 'Settler';
    let highestScore = 0;
    
    for (const [profession, skillNames] of Object.entries(professionSkills)) {
      const score = skillNames.reduce((total, skillName) => {
        const skill = skills[skillName];
        return total + (skill?.level || 0);
      }, 0);
      
      if (score > highestScore) {
        highestScore = score;
        topProfession = profession;
      }
    }
    
    return topProfession;
  }

  /**
   * Fetch all settlements directly from BitJita claims API (no search, just pagination)
   * Based on BitJita showing 2,323 total settlements across 117 pages
   * 
   * @param mode - 'full' for complete sync, 'incremental' for just checking new settlements
   */
  static async fetchAllSettlementsForSync(mode: 'full' | 'incremental' = 'full'): Promise<BitJitaAPIResponse<{
    settlements: BitJitaSettlementDetails[];
    totalFound: number;
    queriesUsed: string[];
  }>> {
    try {
      console.log('🔄 Starting comprehensive settlement sync from BitJita...');
      
      if (mode === 'incremental') {
        console.log('🔄 Incremental mode: Checking first ~300 settlements for new/updated entries');
        console.log('⚡ API efficient: ~3 calls instead of 25 (10x reduction)');
      } else {
        console.log('🎯 Full mode: All 2,323+ settlements from BitJita claims API (up to 120 pages)');
        console.log('⚡ Using optimized bulk fetching: 100 settlements per API call');
      }
      
      const allSettlements = new Map<string, BitJitaSettlementDetails>();
      const queriesUsed: string[] = [];
      let totalApiCalls = 0;
      
      // Try the claims endpoint without search query first
      console.log('🔍 Attempting to fetch all settlements using claims API...');
      
      let currentPage = 1;
      let hasMore = true;
      let totalExpected = 0;
      
      const maxPages = mode === 'incremental' ? 3 : 120; // Incremental: 3 pages (~300 settlements), Full: 120 pages (covers all ~2,323+ settlements)
      
      while (hasMore && currentPage <= maxPages) {
        try {
          console.log(`📄 Fetching page ${currentPage}...`);
          
          // Try direct claims API without search query - GET 100 SETTLEMENTS PER REQUEST
          const response = await fetch(`${this.BASE_URL}/claims?page=${currentPage}&limit=100`, {
            method: 'GET',
            headers: this.HEADERS,
            signal: AbortSignal.timeout(settlementConfig.bitjita.timeout)
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          totalApiCalls++;
          
          if (data.claims && data.claims.length > 0) {
            queriesUsed.push(`page${currentPage}`);
            
            // Store total for progress tracking - set expected to 2323 if not provided
            if (currentPage === 1) {
              totalExpected = data.totalResults || 2323; // Use known total from BitJita website
              console.log(`🎯 BitJita reports ${totalExpected} total settlements (or using known total: 2323)`);
            }
            
            // Transform and add settlements using clean mapping function
            const transformedSettlements = transformBitJitaClaims(data.claims);
            transformedSettlements.forEach(settlement => {
              allSettlements.set(settlement.id, settlement);
            });
            
            console.log(`📊 Page ${currentPage}: Found ${data.claims.length} settlements (total unique: ${allSettlements.size}/${totalExpected}) [${data.claims.length} per call]`);
            
            // FORCE continuation - don't trust API pagination metadata
            // Keep going until we hit an empty page or reach page 120
            currentPage++;
            
            // Rate limiting: wait between requests to be respectful
            // Longer delays for incremental mode to be extra considerate
            const delay = mode === 'incremental' ? settlementConfig.delays.betweenApiCalls * 2 : settlementConfig.delays.betweenApiCalls;
            await new Promise(resolve => setTimeout(resolve, delay));
            
          } else {
            console.log(`📄 Page ${currentPage}: No settlements found, ending pagination`);
            hasMore = false;
          }
          
        } catch (error) {
          console.warn(`⚠️ Failed to fetch page ${currentPage}:`, error);
          
          // If direct API fails, fall back to empty search query
          if (currentPage === 1) {
            console.log('🔄 Direct claims API failed, trying with empty search query...');
            try {
              const fallbackResult = await this.searchSettlements('', currentPage);
              if (fallbackResult.success && fallbackResult.data) {
                fallbackResult.data.settlements.forEach(settlement => {
                  allSettlements.set(settlement.id, settlement);
                });
                console.log(`📊 Fallback page ${currentPage}: Found ${fallbackResult.data.settlements.length} settlements`);
                hasMore = fallbackResult.data.pagination.hasMore;
                currentPage++;
              } else {
                hasMore = false;
              }
            } catch (fallbackError) {
              console.error('❌ Both direct API and fallback failed:', fallbackError);
              hasMore = false;
            }
          } else {
            hasMore = false;
          }
        }
      }
      
      const settlements = Array.from(allSettlements.values());
      const foundPercentage = totalExpected > 0 ? ((settlements.length / totalExpected) * 100).toFixed(1) : 'unknown';
      
      console.log(`✅ Settlement sync complete:`);
      console.log(`   📊 Found: ${settlements.length} settlements (${foundPercentage}% of expected ${totalExpected})`);
      console.log(`   🌐 API calls: ${totalApiCalls} (efficient: ~100 settlements per call)`);
      console.log(`   📄 Pages processed: ${currentPage - 1}`);
      
      return {
        success: true,
        data: {
          settlements,
          totalFound: settlements.length,
          queriesUsed
        }
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error in comprehensive settlement sync:', errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Fetch settlement details from BitJita API
   */
  static async fetchSettlementDetails(settlementId: string): Promise<BitJitaAPIResponse<BitJitaSettlementDetails>> {
    try {
      console.log(`🔍 Fetching settlement details for ${settlementId}...`);
      
      // Search for the settlement using BitJita search to get the most up-to-date data
      // Since we don't know the settlement name, we'll search by a common term and then filter by ID
      const response = await fetch(`${this.BASE_URL}/claims?page=1`, {
        method: 'GET',
        headers: this.HEADERS,
        signal: AbortSignal.timeout(settlementConfig.bitjita.timeout)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`🔍 Searching through ${data.claims?.length || 0} claims for ${settlementId}...`);
      
      // Find the settlement with matching ID
      const settlement = data.claims?.find((claim: RawBitJitaClaim) => claim.entityId === settlementId);
      
      if (!settlement) {
        // Try searching more pages if not found in the first page
        for (let page = 2; page <= 5; page++) {
          console.log(`🔍 Searching page ${page} for settlement ${settlementId}...`);
          
          const pageResponse = await fetch(`${this.BASE_URL}/claims?page=${page}&limit=100`, {
            method: 'GET',
            headers: this.HEADERS,
            signal: AbortSignal.timeout(settlementConfig.bitjita.timeout)
          });
          
          if (pageResponse.ok) {
            const pageData = await pageResponse.json();
            const foundSettlement = pageData.claims?.find((claim: RawBitJitaClaim) => claim.entityId === settlementId);
            
            if (foundSettlement) {
              console.log(`✅ Found settlement on page ${page}:`, foundSettlement.name);
              return {
                success: true,
                data: {
                  id: foundSettlement.entityId,
                  name: foundSettlement.name,
                  tier: foundSettlement.tier,
                  treasury: parseInt(foundSettlement.treasury) || 0,
                  supplies: foundSettlement.supplies || 0,
                  tiles: foundSettlement.numTiles || 0,
                  population: foundSettlement.numTiles || 0
                }
              };
            }
          }
          
          // Add small delay between pages to be polite to the API
          await this.delay(200);
        }
        
        throw new Error(`Settlement with ID ${settlementId} not found in BitJita claims`);
      }
      
      console.log(`✅ Found settlement:`, settlement.name);
      
      return {
        success: true,
        data: {
          id: settlement.entityId,
          name: settlement.name,
          tier: settlement.tier,
          treasury: parseInt(settlement.treasury) || 0,
          supplies: settlement.supplies || 0,
          tiles: settlement.numTiles || 0,
          population: settlement.numTiles || 0 // Use tiles as population proxy
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Error fetching settlement details for ${settlementId}:`, errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Fetch individual player profile from BitJita API
   * Returns comprehensive player data including skills, settlements, and exploration
   */
  static async fetchPlayerProfile(playerId: string): Promise<BitJitaAPIResponse<PlayerProfile>> {
    try {
      console.log(`🔍 Fetching player profile for ${playerId}...`);
      
      const response = await fetch(`${this.BASE_URL}/players/${playerId}`, {
        method: 'GET',
        headers: this.HEADERS,
        signal: AbortSignal.timeout(settlementConfig.bitjita.timeout)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      console.log(`✅ Fetched player profile for ${data.player.username || playerId}`);
      
      // Debug: Log the structure of the response
      console.log(`🔍 Player API response structure:`);
      console.log(`   Keys: ${Object.keys(data)}`);
      console.log(`   Claims count: ${data.player.claims?.length || 0}`);
      console.log(`   Empires count: ${data.player.empires?.length || 0}`);
      console.log(`   Skills count: ${data.player.skills ? Object.keys(data.player.skills).length : 0}`);
      console.log(`   Exploration: ${data.player.exploration?.totalExplored || 0}/${data.player.exploration?.totalChunks || 0}`);
      
      // Transform the raw data to our clean format
      const playerProfile: PlayerProfile = {
        entityId: data.entityId || playerId,
        userName: data.player.username || `Player_${playerId.slice(-8)}`,
        lastLoginTimestamp: data.player.lastLoginTimestamp,
        
        settlements: (data.player.claims || []).map((claim: any) => ({
          entityId: claim.entityId,
          name: claim.name,
          tier: claim.tier || 0,
          treasury: parseInt(claim.treasury) || 0,
          supplies: claim.supplies || 0,
          tiles: claim.numTiles || claim.tiles || 0,
          regionName: claim.regionName || 'Unknown Region',
          regionId: claim.regionId,
          isOwner: claim.isOwner,
          permissions: {
            inventory: claim.memberPermissions.inventoryPermission > 0,
            build: claim.memberPermissions.buildPermission > 0,
            officer: claim.memberPermissions.officerPermission > 0,
            coOwner: claim.memberPermissions.coOwnerPermission > 0
          }
        })),
        
        empires: (data.player.empires || []).map((empire: any) => ({
          entityId: empire.entityId,
          name: empire.name,
          rank: empire.rank || 0,
          donatedShards: empire.donatedShards || 0,
          nobleSince: empire.nobleSince
        })),
        
        skills: data.skills || {},
        
        exploration: {
          totalExplored: data.exploration?.totalExplored || 0,
          totalChunks: data.exploration?.totalChunks || 57600, // Default total from BitJita
          progress: data.exploration?.progress || 0,
          regions: data.exploration?.regions || []
        },
        
        inventory: data.inventory ? {
          toolbelt: data.inventory.toolbelt || [],
          wallet: data.inventory.wallet || [],
          storage: data.inventory.storage || []
        } : undefined,
        
        lastSyncedAt: new Date().toISOString()
      };
      
      return {
        success: true,
        data: playerProfile
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Error fetching player profile for ${playerId}:`, errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Test different header combinations and API endpoints
   * This will help us find the right combination that works with BitJita
   */
  static async testBitJitaAccess(playerId: string): Promise<BitJitaAPIResponse<{
    workingEndpoints: string[];
    workingHeaders: string[];
    testResults: Array<{
      endpoint: string;
      headers: string;
      success: boolean;
      status: number;
      data?: any;
      error?: string;
    }>;
  }>> {
    try {
      console.log(`🧪 Testing BitJita API access for player ${playerId}...`);
      
      const endpoints = [
        `/players/${playerId}`,
        `/players/${playerId}/profile`,
        `/players/${playerId}/data`,
        `/players/${playerId}/full`,
        `/players/${playerId}?include=all`,
        `/players/${playerId}?format=json`,
        `/api/players/${playerId}`,
        `/api/players/${playerId}/profile`
      ];
      
      const headerSets = [
        { name: 'Default', headers: this.HEADERS },
        { name: 'Alternative', headers: this.ALTERNATIVE_HEADERS },
        { name: 'Minimal', headers: { 'Accept': 'application/json' } },
        { name: 'Browser-like', headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive'
        }},
        { name: 'With-App-ID', headers: {
          ...this.HEADERS,
          'x-app-identifier': 'BitSettler/1.0',
          'x-requested-with': 'XMLHttpRequest'
        }}
      ];
      
      const testResults = [];
      const workingEndpoints = [];
      const workingHeaders = [];
      
      for (const endpoint of endpoints) {
        for (const headerSet of headerSets) {
          try {
            console.log(`🔍 Testing ${endpoint} with ${headerSet.name} headers...`);
            
            const response = await fetch(`${this.BASE_URL}${endpoint}`, {
              method: 'GET',
              headers: headerSet.headers,
              signal: AbortSignal.timeout(10000) // 10 second timeout for tests
            });
            
            const result = {
              endpoint,
              headers: headerSet.name,
              success: response.ok,
              status: response.status,
              data: undefined,
              error: undefined
            };
            
            if (response.ok) {
              try {
                const data = await response.json();
                result.data = data;
                workingEndpoints.push(endpoint);
                if (!workingHeaders.includes(headerSet.name)) {
                  workingHeaders.push(headerSet.name);
                }
                console.log(`✅ ${endpoint} with ${headerSet.name} headers: SUCCESS`);
              } catch (parseError) {
                result.error = 'Failed to parse JSON response';
                console.log(`⚠️ ${endpoint} with ${headerSet.name} headers: JSON parse error`);
              }
            } else {
              result.error = `${response.status}: ${response.statusText}`;
              console.log(`❌ ${endpoint} with ${headerSet.name} headers: ${response.status}`);
            }
            
            testResults.push(result);
            
            // Small delay between tests to be respectful
            await new Promise(resolve => setTimeout(resolve, 100));
            
          } catch (error) {
            const result = {
              endpoint,
              headers: headerSet.name,
              success: false,
              status: 0,
              data: undefined,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
            testResults.push(result);
            console.log(`❌ ${endpoint} with ${headerSet.name} headers: ${result.error}`);
          }
        }
      }
      
      console.log(`🧪 Test complete. Working endpoints: ${workingEndpoints.length}, Working headers: ${workingHeaders.length}`);
      
      return {
        success: true,
        data: {
          workingEndpoints,
          workingHeaders,
          testResults
        }
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Error testing BitJita access:`, errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Fetch player inventory by trying multiple potential API endpoints
   * Attempts to find the right endpoint that provides inventory data
   */
  static async fetchPlayerInventory(playerId: string): Promise<BitJitaAPIResponse<{
    entityId: string;
    userName: string;
    inventory: {
      toolbelt: Array<{
        itemId: string;
        name: string;
        tier: number;
        rarity: string;
        quantity: number;
      }>;
      wallet: Array<{
        itemId: string;
        name: string;
        quantity: number;
      }>;
      storage: Array<{
        location: string;
        items: Array<{
          itemId: string;
          name: string;
          tier: number;
          rarity: string;
          quantity: number;
        }>;
      }>;
    };
  }>> {
    try {
      console.log(`🔍 Fetching player inventory for ${playerId}...`);
      
      // Try multiple possible inventory endpoints
      const endpoints = [
        `/players/${playerId}/inventory`,
        `/players/${playerId}/items`,
        `/players/${playerId}/equipment`,
        `/players/${playerId}/toolbelt`
      ];
      
      for (const endpoint of endpoints) {
        try {
          console.log(`🔍 Trying endpoint: ${endpoint}`);
          
          const response = await fetch(`${this.BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: this.HEADERS,
            signal: AbortSignal.timeout(settlementConfig.bitjita.timeout)
          });

          if (response.ok) {
            const data = await response.json();
            console.log(`✅ Found inventory data at ${endpoint}:`, data);
            
            return {
              success: true,
              data: {
                entityId: data.entityId || playerId,
                userName: data.userName || `Player_${playerId.slice(-8)}`,
                inventory: {
                  toolbelt: data.toolbelt || data.equipment || [],
                  wallet: data.wallet || [],
                  storage: data.storage || data.inventory || []
                }
              }
            };
          } else {
            console.log(`❌ Endpoint ${endpoint} failed: ${response.status}`);
          }
        } catch (error) {
          console.log(`❌ Endpoint ${endpoint} error:`, error);
        }
      }
      
      // If no inventory endpoints work, try the main player endpoint with different parameters
      console.log(`🔍 Trying main player endpoint with inventory parameter...`);
      
      const response = await fetch(`${this.BASE_URL}/players/${playerId}?include=inventory`, {
        method: 'GET',
        headers: this.HEADERS,
        signal: AbortSignal.timeout(settlementConfig.bitjita.timeout)
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Main endpoint with inventory parameter:`, data);
        
        return {
          success: true,
          data: {
            entityId: data.entityId || playerId,
            userName: data.userName || `Player_${playerId.slice(-8)}`,
            inventory: {
              toolbelt: data.inventory?.toolbelt || [],
              wallet: data.inventory?.wallet || [],
              storage: data.inventory?.storage || []
            }
          }
        };
      }
      
      throw new Error('No inventory endpoints returned data');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Error fetching player inventory for ${playerId}:`, errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Fetch player data using web scraping approach (fallback)
   * This would be used if the API doesn't provide the data we need
   */
  static async fetchPlayerDataViaWeb(playerId: string): Promise<BitJitaAPIResponse<{
    entityId: string;
    userName: string;
    skills: Record<string, any>;
    inventory: {
      toolbelt: Array<any>;
      wallet: Array<any>;
      storage: Array<any>;
    };
    settlements: Array<any>;
    empires: Array<any>;
    exploration: any;
  }>> {
    try {
      console.log(`🔍 Attempting web scraping approach for player ${playerId}...`);
      
      // This would require a server-side web scraping solution
      // For now, we'll return an error indicating this approach isn't implemented
      throw new Error('Web scraping approach not implemented - would require server-side HTML parsing');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Error in web scraping approach for ${playerId}:`, errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Fetch player skills specifically (lightweight version)
   * Useful when you only need skills data without full profile
   */
  static async fetchPlayerSkills(playerId: string): Promise<BitJitaAPIResponse<{
    entityId: string;
    userName: string;
    skills: Record<string, {
      level: number;
      xp: number;
      progressToNext: number;
      tool?: string;
      toolTier?: number;
      toolRarity?: string;
    }>;
  }>> {
    try {
      console.log(`🔍 Fetching player skills for ${playerId}...`);
      
      const response = await fetch(`${this.BASE_URL}/players/${playerId}/skills`, {
        method: 'GET',
        headers: this.HEADERS,
        signal: AbortSignal.timeout(settlementConfig.bitjita.timeout)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log(`✅ Fetched skills for ${data.userName || playerId}: ${Object.keys(data.skills || {}).length} skills`);
      
      return {
        success: true,
        data: {
          entityId: data.entityId || playerId,
          userName: data.userName || `Player_${playerId.slice(-8)}`,
          skills: data.skills || {}
        }
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Error fetching player skills for ${playerId}:`, errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Helper method to add delays between API calls for rate limiting
   */
  static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Batch process API calls with rate limiting
   */
  static async batchProcess<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    batchSize: number = settlementConfig.batchSizes.apiCalls,
    delayMs: number = settlementConfig.delays.betweenBatches
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(items.length / batchSize)}...`);

      // Process batch in parallel
      const batchPromises = batch.map(item => processor(item));
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.warn(`Failed to process item ${i + index}:`, result.reason);
        }
      });

      // Delay between batches
      if (i + batchSize < items.length) {
        console.log(`⏳ Waiting ${delayMs}ms before next batch...`);
        await this.delay(delayMs);
      }
    }

    return results;
  }
}