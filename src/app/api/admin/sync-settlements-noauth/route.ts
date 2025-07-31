import { NextRequest, NextResponse } from 'next/server';
import { syncSettlementsMaster } from '@/lib/spacetime-db-new/modules/settlements/commands/sync-settlements-master';

/**
 * Settlement Sync API (No Auth - for initial setup only)
 * 
 * This is a temporary endpoint for initial database population
 * Remove this after initial setup is complete
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting settlement sync from BitJita (no auth)...');

    const body = await request.json();
    const { mode = 'full' } = body; // 'full' or 'incremental'

    const startTime = Date.now();

    // Trigger the settlement sync
    const result = await syncSettlementsMaster(mode);

    const duration = Date.now() - startTime;

    if (result.success) {
      console.log('✅ Settlement sync completed successfully:');
      console.log(`   📊 Found: ${result.settlementsFound} settlements`);
      console.log(`   ➕ Added: ${result.settlementsAdded} new settlements`);
      console.log(`   🔄 Updated: ${result.settlementsUpdated} existing settlements`);
      console.log(`   ❌ Deactivated: ${result.settlementsDeactivated} inactive settlements`);
      console.log(`   ⏱️ Duration: ${result.syncDurationMs}ms`);
      console.log(`   🌐 API calls: ${result.apiCallsMade}`);

      return NextResponse.json({
        success: true,
        message: `Settlement sync completed - ${result.settlementsFound} settlements processed`,
        data: {
          mode: mode,
          settlementsFound: result.settlementsFound,
          settlementsAdded: result.settlementsAdded,
          settlementsUpdated: result.settlementsUpdated,
          settlementsDeactivated: result.settlementsDeactivated,
          syncDurationMs: result.syncDurationMs,
          apiCallsMade: result.apiCallsMade,
          totalDuration: duration
        }
      });

    } else {
      console.error('❌ Settlement sync failed:', result.error);
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Settlement sync failed',
          data: {
            settlementsFound: result.settlementsFound,
            syncDurationMs: result.syncDurationMs,
            apiCallsMade: result.apiCallsMade,
            totalDuration: duration
          }
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Settlement sync endpoint error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during settlement sync'
    }, { status: 500 });
  }
}

/**
 * GET: Check current settlement count (no auth)
 */
export async function GET() {
  try {
    // Simple count check without auth
    const { createServerSupabaseClient } = await import('@/lib/supabase-server-auth');
    const supabase = createServerSupabaseClient();

    const { count, error } = await supabase
      .from('settlements_master')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log('Settlement count check:', count);

    return NextResponse.json({
      success: true,
      data: {
        totalSettlements: count || 0,
        needsSync: (count || 0) === 0
      }
    });

  } catch (error) {
    console.error('GET /sync-settlements-noauth error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}