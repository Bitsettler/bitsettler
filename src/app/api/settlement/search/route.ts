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

    console.log(`🔍 Searching settlements for: "${query}" (page ${pageNum})`);

    // Call BitJita API to search settlements (query is already sanitized)
    const result = await BitJitaAPI.searchSettlements(query, pageNum);

    if (!result.success) {
      console.error('❌ BitJita settlement search failed:', result.error);
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to search settlements' },
        { status: 500 }
      );
    }

    // Get database client to check for real member counts
    const supabase = createServerClient();
    
    // Transform BitJita data and get real member counts from our database
    const settlements = await Promise.all((result.data?.settlements || []).map(async (settlement) => {
      let memberCount = 0;
      
      if (supabase) {
        try {
          // Check if this settlement exists in our database and get real member count
          const { data: members, error } = await supabase
            .from('settlement_members')
            .select('entity_id', { count: 'exact' })
            .eq('settlement_id', settlement.id);
          
          if (!error && members) {
            memberCount = members.length;
          }
        } catch (err) {
          console.warn(`⚠️ Could not fetch member count for settlement ${settlement.id}:`, err);
        }
      }
      
      console.log(`🔍 Settlement ${settlement.name}: BitJita data:`, {
        id: settlement.id,
        tiles: settlement.tiles,
        population: settlement.population,
        dbMemberCount: memberCount
      });

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
    }));

    console.log(`✅ Found ${settlements.length} settlements for "${query}"`);

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
    console.error('❌ Settlement search error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during settlement search'
    }, { status: 500 });
  }
}