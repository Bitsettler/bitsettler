import { NextResponse } from 'next/server';
import { syncSettlementsMaster } from '../../../../lib/spacetime-db-new/modules/settlements/commands/sync-settlements-master';

export async function POST() {
  try {
    console.log('🔄 Starting manual settlement sync...');
    
    const result = await syncSettlementsMaster();
    
    if (result.success) {
      console.log(`✅ Settlement sync completed successfully:
        - Settlements found: ${result.settlementsFound}
        - Settlements added: ${result.settlementsAdded}  
        - Settlements updated: ${result.settlementsUpdated}
        - Duration: ${result.syncDurationMs}ms
        - API calls made: ${result.apiCallsMade}`);

      return NextResponse.json({
        success: true,
        message: 'Settlement sync completed successfully',
        data: {
          settlementsFound: result.settlementsFound,
          settlementsAdded: result.settlementsAdded,
          settlementsUpdated: result.settlementsUpdated,
          settlementsDeactivated: result.settlementsDeactivated,
          syncDurationMs: result.syncDurationMs,
          apiCallsMade: result.apiCallsMade
        }
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Sync failed without specific error',
          data: result
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Settlement sync API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown sync error'
      },
      { status: 500 }
    );
  }
} 