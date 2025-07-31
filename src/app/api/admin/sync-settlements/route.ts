import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server-auth';
import { syncSettlementsMaster } from '@/lib/spacetime-db-new/modules/settlements/commands/sync-settlements-master';

/**
 * Settlement Sync API
 * 
 * Fetches all settlements from BitJita and stores them in our database
 * with all the rich data fields we now support
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting settlement sync from BitJita (admin mode)...');

    // Skip auth for now - this is admin setup
    // const supabase = createServerSupabaseClient();
    // const { data: { session } } = await supabase.auth.getSession();

    // if (!session?.user?.id) {
    //   return NextResponse.json(
    //     { success: false, error: 'Authentication required' },
    //     { status: 401 }
    //   );
    // }

    const body = await request.json();
    const { mode = 'full' } = body; // 'full' or 'incremental'

    // Trigger the settlement sync
    const result = await syncSettlementsMaster(mode);

    if (result.success) {
      console.log('✅ Settlement sync completed successfully:');
      console.log(`   📊 Found: ${result.settlementsFound} settlements`);
      console.log(`   ➕ Added: ${result.settlementsAdded} new settlements`);
      console.log(`   🔄 Updated: ${result.settlementsUpdated} existing settlements`);
      console.log(`   ❌ Deactivated: ${result.settlementsDeactivated} inactive settlements`);
      console.log(`   ⏱️ Duration: ${result.syncDurationMs}ms`);
      console.log(`   🌐 API calls: ${result.apiCallsMade}`);

      // After settlements are synced, generate invite codes for any that don't have them
      console.log('🎯 Generating invite codes for new settlements...');
      
      // Create supabase client just for this operation
      const supabase = await createServerSupabaseClient();
      const { data: codeResult, error: codeError } = await supabase
        .rpc('ensure_all_settlements_have_invite_codes');

      if (codeError) {
        console.warn('⚠️ Failed to generate invite codes:', codeError);
      } else if (codeResult?.[0]) {
        const stats = codeResult[0];
        console.log(`✅ Invite codes: ${stats.codes_generated} generated, ${stats.failed_generations} failed`);
      }

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
          inviteCodesGenerated: codeResult?.[0]?.codes_generated || 0
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
            apiCallsMade: result.apiCallsMade
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
 * GET: Check current settlement sync status
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📊 Checking settlement sync status...');

    // Skip auth for now - this is admin setup
    const supabase = await createServerSupabaseClient();

    // Get current settlement counts and sync status
    const { data: settlements, error } = await supabase
      .from('settlements_master')
      .select('id, name, last_synced_at, sync_source, is_active')
      .order('last_synced_at', { ascending: false })
      .limit(5);

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to check settlement status' },
        { status: 500 }
      );
    }

    const totalSettlements = settlements?.length || 0;
    const activeSettlements = settlements?.filter(s => s.is_active).length || 0;
    const lastSyncTime = settlements?.[0]?.last_synced_at || null;

    return NextResponse.json({
      success: true,
      data: {
        totalSettlements,
        activeSettlements,
        lastSyncTime,
        recentSettlements: settlements?.slice(0, 5) || [],
        needsSync: totalSettlements === 0,
        syncStatus: totalSettlements > 0 ? 'has_data' : 'empty'
      }
    });

  } catch (error) {
    console.error('❌ Settlement status check error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}