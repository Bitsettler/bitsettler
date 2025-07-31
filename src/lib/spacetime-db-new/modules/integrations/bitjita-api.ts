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

// BitJitaSettlementDetails interface moved to bitjita-api-mapping.ts

export interface BitJitaAPIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * BitJita API client for external settlement data integration
 */
export class BitJitaAPI {
  private static readonly BASE_URL = settlementConfig.bitjita.baseUrl;
  private static readonly HEADERS = {
    'x-app-identifier': settlementConfig.bitjita.appIdentifier,
    'Content-Type': 'application/json'
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
      const citizensByEntityId = new Map(citizens.map((c: any) => [c.entityId, c]));
      const citizensByPlayerEntityId = new Map(citizens.map((c: any) => [c.playerEntityId, c]));
      const citizensByUserName = new Map(citizens.map((c: any) => [c.userName, c]));

      // Merge members + citizens data
      const users: SettlementUser[] = members.map((member: any) => {
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
      const settlements: BitJitaSettlementDetails[] = (data.claims || []).map((claim: any) => ({
        id: claim.entityId,
        name: claim.name,
        tier: claim.tier || 0,
        treasury: parseInt(claim.treasury) || 0,
        supplies: claim.supplies || 0,
        tiles: claim.numTiles || 0,
        population: claim.numTiles || 0 // Use tiles as population proxy
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
        console.log('🎯 Full mode: All 2,323+ settlements from BitJita claims API');
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
      
      const maxPages = mode === 'incremental' ? 3 : 30; // Incremental: 3 pages (~300 settlements), Full: 30 pages (~3000 settlements)
      
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
      
      // Use the search API to find the settlement
      const response = await fetch(`${this.BASE_URL}/claims?q=taverna&page=1`, {
        method: 'GET',
        headers: this.HEADERS,
        signal: AbortSignal.timeout(settlementConfig.bitjita.timeout)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Fetched settlement search results:`, data);
      
      // Find the settlement with matching ID
      const settlement = data.claims?.find((claim: any) => claim.entityId === settlementId);
      
      if (!settlement) {
        throw new Error(`Settlement with ID ${settlementId} not found in search results`);
      }
      
      console.log(`✅ Found settlement:`, settlement);
      
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
      console.error('Error fetching settlement details:', errorMessage);
      
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