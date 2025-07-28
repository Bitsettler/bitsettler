import { NextRequest, NextResponse } from 'next/server';
import { syncSettlementMembers } from '../../../../../lib/spacetime-db-new/modules/settlements/commands/sync-settlement-members';

/**
 * Settlement Onboarding Sync
 * Triggered when a user completes settlement selection to immediately populate their dashboard
 * Syncs ONLY the selected settlement's member data (not all settlements)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { settlementId, settlementName } = body;

    if (!settlementId) {
      return NextResponse.json(
        { success: false, error: 'settlementId is required' },
        { status: 400 }
      );
    }

    console.log(`🚀 Starting onboarding sync for settlement: ${settlementName || settlementId}`);
    console.log('🎯 Purpose: Populate dashboard immediately after user selection');
    
    const startTime = Date.now();
    
    // Sync member data for this specific settlement only
    const result = await syncSettlementMembers({
      settlementId,
      settlementName: settlementName || `Settlement ${settlementId}`,
      triggeredBy: 'user_onboarding'
    });
    
    const duration = Date.now() - startTime;

    if (result.success) {
      console.log(`✅ Onboarding sync completed successfully for ${settlementName}:`);
      console.log(`   👥 Members: ${result.membersFound} found, ${result.membersAdded} added, ${result.membersUpdated} updated`);
      console.log(`   🎓 Citizens: ${result.citizensFound} found, ${result.citizensAdded} added, ${result.citizensUpdated} updated`);
      console.log(`   ⚡ Duration: ${duration}ms`);
      console.log(`   🌐 API calls: ${result.apiCallsMade}`);

      return NextResponse.json({
        success: true,
        message: `Settlement ${settlementName} data synced successfully`,
        data: {
          settlementId,
          settlementName,
          membersFound: result.membersFound,
          membersAdded: result.membersAdded,
          membersUpdated: result.membersUpdated,
          citizensFound: result.citizensFound,
          citizensAdded: result.citizensAdded,
          citizensUpdated: result.citizensUpdated,
          syncDurationMs: duration,
          apiCallsMade: result.apiCallsMade
        },
        triggeredBy: 'user_onboarding'
      });

    } else {
      console.error(`❌ Onboarding sync failed for ${settlementName}:`, result.error);
      
      return NextResponse.json({
        success: false,
        error: `Failed to sync settlement data: ${result.error}`,
        settlementId,
        settlementName
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Onboarding sync endpoint error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during settlement sync',
      triggeredBy: 'user_onboarding'
    }, { status: 500 });
  }
} 