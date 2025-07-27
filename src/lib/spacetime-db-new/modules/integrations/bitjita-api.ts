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