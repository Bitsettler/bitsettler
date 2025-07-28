import { NextResponse } from 'next/server';
import { syncSettlementsMaster } from '../../../../../lib/spacetime-db-new/modules/settlements/commands/sync-settlements-master';

export async function POST() {
  try {
    console.log('🔄 Starting incremental settlement sync (API efficient)...');
    
    const result = await syncSettlementsMaster('incremental');
    
    if (result.success) {
      console.log(`✅ Incremental settlement sync completed successfully:
        - Settlements checked: ${result.settlementsFound} (first ~300 for new/updated)
        - Settlements added: ${result.settlementsAdded}  
        - Settlements updated: ${result.settlementsUpdated}
        - Duration: ${result.syncDurationMs}ms
        - API calls made: ${result.apiCallsMade} (efficient mode)`);

      return NextResponse.json({
        success: true,
        message: 'Incremental settlement sync completed successfully',
        mode: 'incremental',
        timestamp: new Date().toISOString(),
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
          mode: 'incremental',
          error: result.error || 'Incremental sync failed without specific error',
          timestamp: new Date().toISOString(),
          data: result
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Incremental settlement sync API error:', error);
    return NextResponse.json(
      {
        success: false,
        mode: 'incremental',
        error: error instanceof Error ? error.message : 'Unknown sync error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Also allow GET for info
export async function GET() {
  return NextResponse.json({
    status: 'Incremental settlement sync endpoint',
    description: 'Checks first ~300 settlements for new/updated entries (API efficient)',
    timestamp: new Date().toISOString(),
    message: 'Use POST method to trigger incremental sync'
  });
} 