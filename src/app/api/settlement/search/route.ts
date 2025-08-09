import { NextRequest, NextResponse } from 'next/server';
import { BitJitaAPI } from '@/lib/spacetime-db-new/modules/integrations/bitjita-api';
import { createServerClient } from '@/lib/spacetime-db-new/shared/supabase-client';
import { validateQueryParams, SETTLEMENT_SCHEMAS } from '@/lib/validation';
import { shouldRateLimit, searchRateLimit } from '@/lib/rate-limiting';

/**
 * Settlement Search API
 * 
 * Searches BitJita API for settlements by name to enable settlement establishment
 */
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting for search operations (20 requests per minute by IP)
    if (shouldRateLimit(request)) {
      const rateLimitCheck = await searchRateLimit(request);
      if (!rateLimitCheck.allowed && rateLimitCheck.response) {
        return rateLimitCheck.response;
      }
    }
    
    const { searchParams } = new URL(request.url);
    
    // Add query to searchParams for validation
    const paramsToValidate = new URLSearchParams(searchParams);
    if (!paramsToValidate.has('q')) {
      return NextResponse.json(
        { success: false, error: 'Search query (q) is required' },
        { status: 400 }
      );
    }

    // Validate query parameters  
    const validationResult = validateQueryParams(paramsToValidate, {
      q: {
        required: true,
        type: 'string',
        minLength: 2,
        maxLength: 100,
        sanitize: true
      },
      page: {
        required: false,
        type: 'string', // URL params are always strings
        pattern: /^\d+$/, // Must be numeric string
        custom: (value: string) => {
          const num = parseInt(value);
          return (num >= 1 && num <= 100) || 'Page must be between 1 and 100';
        }
      }
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid query parameters',
          details: validationResult.errors 
        },
        { status: 400 }
      );
    }

    const { q: query, page = '1' } = validationResult.data!;
    const pageNum = parseInt(page.toString());

    // Searching settlements

    // Call BitJita API to search settlements (query is already sanitized)
    const result = await BitJitaAPI.searchSettlements(query, pageNum);

    if (!result.success) {
      // BitJita settlement search failed
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to search settlements' },
        { status: 500 }
      );
    }

    // Get database client to check for real member counts
    const supabase = createServerClient();
    
    // Transform BitJita data and filter out already established settlements
    const settlementPromises = (result.data?.settlements || []).map(async (settlement) => {
      let memberCount = 0;
      let isEstablished = false;
      
      if (supabase) {
        try {
          // Check if this settlement is already established in our database
          const { data: dbSettlement, error: settlementError } = await supabase
            .from('settlements_master')
            .select('is_established')
            .eq('id', settlement.id)
            .single();
          
          if (!settlementError && dbSettlement) {
            isEstablished = dbSettlement.is_established;
          }
          
          // If established, get real member count
          if (isEstablished) {
            const { data: members, error: membersError } = await supabase
              .from('settlement_members')
              .select('entity_id', { count: 'exact' })
              .eq('settlement_id', settlement.id);
            
            if (!membersError && members) {
              memberCount = members.length;
            }
          }
        } catch (err) {
          // Could not fetch settlement data
        }
      }
      
      // Only show settlements that are NOT established (available to claim)
      // OR settlements that ARE established and have members (joinable)
      if (isEstablished && memberCount === 0) {
        return null; // Skip established settlements with no members
      }
      
      // Settlement data retrieved

      return {
        id: settlement.id,
        name: settlement.name,
        memberCount, // Real member count from our database
        location: settlement.regionName || 'Unknown Region',
        description: memberCount > 0 ? `${memberCount} members` : `Tier ${settlement.tier} settlement`,
        isActive: true, // Assume all BitJita settlements are active
        owner: 'Game Settlement',
        lastActive: new Date().toISOString(),
        tier: settlement.tier,
        treasury: settlement.treasury,
        tiles: settlement.tiles,
        population: settlement.population,
        regionName: settlement.regionName,
        regionId: settlement.regionId
      };
    });

    // Wait for all promises and filter out null results (established settlements with no members)
    const allSettlements = await Promise.all(settlementPromises);
    const settlements = allSettlements.filter(settlement => settlement !== null);

    // Settlement search completed

    return NextResponse.json({
      success: true,
      data: {
        settlements,
        pagination: {
          currentPage: result.data?.pagination.currentPage || page,
          totalResults: result.data?.pagination.totalResults || settlements.length,
          hasMore: result.data?.pagination.hasMore || false
        },
        searchQuery: query
      }
    });

  } catch (error) {
    // Settlement search error
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during settlement search'
    }, { status: 500 });
  }
}