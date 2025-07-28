import { NextRequest, NextResponse } from 'next/server';
import { syncSettlementsMaster } from '../../../../../lib/spacetime-db-new/modules/settlements/commands/sync-settlements-master';

// This endpoint can be called by external cron services like Vercel Cron, GitHub Actions, or Uptime Robot
// Set up a cron job to call this endpoint every 30 minutes: https://your-domain.com/api/settlement/sync/scheduled

export async function POST(request: NextRequest) {
  try {
    // Check for authorization if provided
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.SETTLEMENT_SYNC_AUTH_TOKEN;
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🕒 Starting scheduled settlement sync...');
    
    // Use incremental mode by default for scheduled syncs (more API efficient)
    // Full sync should be run manually or on a longer schedule (daily)
    const result = await syncSettlementsMaster('incremental');
    
    if (result.success) {
      console.log(`✅ Scheduled settlement sync completed successfully:
        - Settlements found: ${result.settlementsFound}
        - Settlements added: ${result.settlementsAdded}  
        - Settlements updated: ${result.settlementsUpdated}
        - Duration: ${result.syncDurationMs}ms
        - API calls made: ${result.apiCallsMade}`);

      return NextResponse.json({
        success: true,
        message: 'Scheduled settlement sync completed successfully',
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
      console.error(`❌ Scheduled settlement sync failed: ${result.error}`);
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Sync failed without specific error',
          timestamp: new Date().toISOString(),
          data: result
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Scheduled settlement sync API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown sync error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Also allow GET for health check
export async function GET() {
  return NextResponse.json({
    status: 'Settlement sync endpoint is active',
    timestamp: new Date().toISOString(),
    message: 'Use POST method to trigger sync, or set up external cron to call this endpoint every 30 minutes'
  });
} 