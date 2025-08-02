import { NextRequest, NextResponse } from 'next/server';
import { BitJitaAPI } from '@/lib/spacetime-db-new/modules/integrations/bitjita-api';
import { createServerClient } from '@/lib/spacetime-db-new/shared/supabase-client';

/**
 * Settlement Search API
 * 
 * Searches BitJita API for settlements by name to enable settlement establishment
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const page = parseInt(searchParams.get('page') || '1');

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }

    console.log(`🔍 Searching settlements for: "${query}" (page ${page})`);

    // Call BitJita API to search settlements
    const result = await BitJitaAPI.searchSettlements(query.trim(), page);

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