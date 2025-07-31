import { NextRequest, NextResponse } from 'next/server';
import { BitJitaAPI } from '@/lib/spacetime-db-new/modules/integrations/bitjita-api';

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

    // Transform BitJita data to our frontend format
    const settlements = result.data?.settlements.map(settlement => ({
      id: settlement.id,
      name: settlement.name,
      memberCount: settlement.population, // Use population as proxy for member count
      location: settlement.regionName || 'Unknown Region',
      description: `Tier ${settlement.tier} settlement with ${settlement.tiles} tiles`,
      isActive: true, // Assume all BitJita settlements are active
      owner: 'Game Settlement',
      lastActive: new Date().toISOString(),
      tier: settlement.tier,
      treasury: settlement.treasury,
      tiles: settlement.tiles,
      population: settlement.population
    })) || [];

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