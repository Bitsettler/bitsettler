import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/spacetime-db-new/shared/supabase-client';
import { BitJitaAPI } from '../../../../lib/spacetime-db-new/modules/integrations/bitjita-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    if (query.length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }

    console.log(`🔍 API: Searching settlements for "${query}" (local DB)`);

    // If Supabase is available, search locally first
    if (supabase) {
      try {
        const offset = (page - 1) * limit;
        
        // Search using case-insensitive ILIKE for fast matching
        const { data: settlements, error, count } = await supabase
          .from('settlements_master')
          .select('*', { count: 'exact' })
          .eq('is_active', true)
          .ilike('name_normalized', `%${query.toLowerCase()}%`)
          .order('population', { ascending: false }) // Order by population (most active first)
          .range(offset, offset + limit - 1);

        if (error) {
          console.error('Database search error:', error);
          // Fall back to BitJita API if database fails
        } else {
          // Transform database results to API format
          const formattedSettlements = (settlements || []).map(s => ({
            id: s.id,
            name: s.name,
            tier: s.tier,
            treasury: s.treasury,
            supplies: s.supplies,
            tiles: s.tiles,
            population: s.population
          }));

          console.log(`✅ Local DB search found ${formattedSettlements.length} settlements`);

          return NextResponse.json({
            success: true,
            settlements: formattedSettlements,
            pagination: {
              currentPage: page,
              totalResults: count || 0,
              hasMore: (count || 0) > offset + limit,
              resultsPerPage: limit
            },
            source: 'local_database',
            lastSyncInfo: settlements && settlements.length > 0 
              ? `Last synced: ${new Date(settlements[0].last_synced_at).toLocaleString()}`
              : null
          });
        }
      } catch (dbError) {
        console.error('Local database search failed:', dbError);
        // Fall through to BitJita API fallback
      }
    }

    // Fallback to BitJita API (for demo mode or if database is unavailable)
    console.log(`🌐 Falling back to BitJita API search for "${query}"`);
    
    const result = await BitJitaAPI.searchSettlements(query, page);

    if (!result.success) {
      console.error('BitJita search failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to search settlements' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      settlements: result.data?.settlements || [],
      pagination: result.data?.pagination || {
        currentPage: page,
        totalResults: 0,
        hasMore: false
      },
      source: 'bitjita_api',
      fallbackReason: supabase ? 'database_error' : 'database_unavailable'
    });

  } catch (error) {
    console.error('Settlement search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 