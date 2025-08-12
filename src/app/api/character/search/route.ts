import { NextRequest, NextResponse } from 'next/server';
import { BitJitaAPI } from '@/lib/spacetime-db-new/modules/integrations/bitjita-api';

/**
 * Character Search API
 * 
 * Searches BitJita API for characters by name to enable character claiming
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Search query (q) is required' },
        { status: 400 }
      );
    }

    // Call BitJita API to search characters (query is already sanitized)
    const result = await BitJitaAPI.searchCharacters(query);

    if (!result.success) {
      // BitJita character search failed
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to search characters' },
        { status: 500 }
      );
    }

    // Return the BitJita API response directly
    return NextResponse.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    // Character search error
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during character search'
    }, { status: 500 });
  }
}