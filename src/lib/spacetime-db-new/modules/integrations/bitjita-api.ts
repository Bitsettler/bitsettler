import { settlementConfig } from '../../../../config/settlement-config';

// BitJita API interfaces
export interface BitJitaMember {
  entityId: string;
  claimEntityId: string;
  playerEntityId: string;
  userName: string;
  inventoryPermission: number;
  buildPermission: number;
  officerPermission: number;
  coOwnerPermission: number;
  createdAt: string;
  updatedAt: string;
  lastLoginTimestamp?: string;
}

export interface BitJitaCitizen {
  entityId: string;
  userName: string;
  skills: Record<string, number>;
  totalSkills: number;
  highestLevel: number;
  totalLevel: number;
  totalXP: number;
}

export interface BitJitaSettlementDetails {
  id: string;
  name: string;
  tier: number;
  treasury: number;
  supplies: number;
  tiles: number;
  population?: number;
}

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
   */
  static async fetchSettlementRoster(settlementId: string): Promise<BitJitaAPIResponse<{ members: BitJitaMember[] }>> {
    try {
      console.log(`🔍 Fetching settlement roster for ${settlementId}...`);
      
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
   */
  static async fetchSettlementCitizens(settlementId: string): Promise<BitJitaAPIResponse<{ citizens: BitJitaCitizen[]; skillNames: Record<string, string> }>> {
    try {
      console.log(`🔍 Fetching settlement citizens for ${settlementId}...`);
      
      const response = await fetch(`${this.BASE_URL}/claims/${settlementId}/citizens`, {
        method: 'GET',
        headers: this.HEADERS,
        signal: AbortSignal.timeout(settlementConfig.bitjita.timeout)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log(`✅ Fetched ${data.citizens?.length || 0} citizens with skills`);
      
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
   * Fetch all settlements for sync purposes (uses broad search queries)
   * Uses common search terms to discover settlements across the game
   */
  static async fetchAllSettlementsForSync(): Promise<BitJitaAPIResponse<{
    settlements: BitJitaSettlementDetails[];
    totalFound: number;
    queriesUsed: string[];
  }>> {
    try {
      console.log('🔄 Starting comprehensive settlement sync from BitJita...');
      
      // Use common search terms to discover settlements
      const searchTerms = [
        '', // Empty search to get recent/popular settlements
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
        'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
        'port', 'town', 'city', 'settlement', 'haven', 'valley', 'grove'
      ];
      
      const allSettlements = new Map<string, BitJitaSettlementDetails>();
      const queriesUsed: string[] = [];
      let totalApiCalls = 0;
      
      for (const term of searchTerms) {
        try {
          // Fetch first page only to avoid overwhelming the API
          const result = await this.searchSettlements(term || 'a', 1);
          totalApiCalls++;
          
          if (result.success && result.data) {
            queriesUsed.push(term || 'default');
            
            // Add settlements to our map (deduplicates by ID)
            result.data.settlements.forEach(settlement => {
              allSettlements.set(settlement.id, settlement);
            });
            
            console.log(`📊 Query "${term}": Found ${result.data.settlements.length} settlements`);
          }
          
          // Rate limiting: wait between requests
          await new Promise(resolve => setTimeout(resolve, settlementConfig.delays.betweenApiCalls));
          
        } catch (error) {
          console.warn(`⚠️ Failed to search settlements for term "${term}":`, error);
          continue;
        }
      }
      
      const settlements = Array.from(allSettlements.values());
      console.log(`✅ Settlement sync complete: ${settlements.length} unique settlements found from ${totalApiCalls} API calls`);
      
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