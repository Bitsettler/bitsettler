import { NextRequest, NextResponse } from 'next/server';
import { syncSettlementsMaster } from '../../../../lib/spacetime-db-new/modules/settlements/commands/sync-settlements-master';
import { syncSettlementMembers } from '../../../../lib/spacetime-db-new/modules/settlements/commands/sync-settlement-members';

/**
 * Unified Settlement Sync API
 * 
 * Supports multiple sync modes and operations:
 * - Settlement master list sync (full/incremental)
 * - Individual settlement member sync  
 * - Scheduled/manual triggers
 * - Admin/user/onboarding contexts
 */

/**
 * GET: Scheduled settlement sync (for Vercel cron jobs)
 */
export async function GET(request: NextRequest) {
  try {
    // Note: Vercel cron jobs are internal calls that don't need auth
    // If external auth is needed later, check User-Agent header for Vercel cron
    console.log('🕒 Starting scheduled settlement sync (cron)...');
    
    // Use incremental mode by default for scheduled syncs (more API efficient)
    const masterResult = await syncSettlementsMaster('incremental');
    
    if (!masterResult.success) {
      console.error('❌ Master settlement sync failed:', masterResult.error);
      return NextResponse.json({
        success: false,
        error: masterResult.error || 'Master settlement sync failed',
        data: masterResult
      }, { status: 500 });
    }
    
    console.log(`✅ Master sync completed: ${masterResult.settlementsFound} settlements found`);
    
    // Also sync members for established settlements (user requirement)
    console.log('🔄 Starting member sync for established settlements...');
    const { syncAllSettlementMembers } = await import('../../../../lib/spacetime-db-new/modules/settlements/commands/sync-settlement-members');
    const memberResult = await syncAllSettlementMembers('scheduled');
    
    const result = {
      success: masterResult.success && memberResult.success,
      masterSync: masterResult,
      memberSync: memberResult
    };
    
    if (result.success) {
      console.log(`✅ Scheduled settlement sync completed successfully:`);
      console.log(`   📊 Master: ${result.masterSync.settlementsFound} settlements found`);
      console.log(`   ➕ Added: ${result.masterSync.settlementsAdded}, 🔄 Updated: ${result.masterSync.settlementsUpdated}`);
      console.log(`   👥 Member sync: ${result.memberSync.settlementsProcessed} settlements, ${result.memberSync.totalMembers} members`);
      console.log(`   ⏱️ Duration: ${result.masterSync.syncDurationMs}ms, 🌐 API calls: ${result.masterSync.apiCallsMade}`);

      return NextResponse.json({
        success: true,
        message: 'Scheduled settlement and member sync completed successfully',
        operation: 'master_and_members',
        mode: 'incremental',
        triggeredBy: 'scheduled',
        data: {
          masterSync: result.masterSync,
          memberSync: result.memberSync
        }
      });
    } else {
      console.error('❌ Scheduled settlement sync failed');
      console.error('Master sync error:', result.masterSync.error);
      console.error('Member sync errors:', result.memberSync.errors);
      
      return NextResponse.json({
        success: false,
        operation: 'master_and_members',
        mode: 'incremental',
        triggeredBy: 'scheduled',
        error: 'Scheduled settlement sync failed',
        data: result
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Scheduled settlement sync error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown scheduled sync error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST: Manual settlement sync with full parameter control
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { 
      mode = 'full',           // 'full' | 'incremental'
      operation = 'master',    // 'master' | 'members' | 'onboarding'
      settlementId,
      settlementName,
      triggeredBy = 'manual',
      authToken
    } = body;

    // Note: Auth removed to allow Vercel cron jobs and manual operations
    // Manual operations from authenticated users go through other API endpoints

    console.log(`🔄 Starting ${operation} settlement sync (${mode} mode, triggered by: ${triggeredBy})...`);
    const startTime = Date.now();
    
    if (operation === 'members' || operation === 'onboarding') {
      // Individual settlement member sync
      if (!settlementId || !settlementName) {
        return NextResponse.json(
          { success: false, error: 'settlementId and settlementName are required for member sync' },
          { status: 400 }
        );
      }

      const result = await syncSettlementMembers({
        settlementId,
        settlementName,
        triggeredBy,
        forceFullSync: mode === 'full'
      });
      
      const duration = Date.now() - startTime;

      if (result.success) {
        console.log(`✅ ${operation} sync completed for ${settlementName}:`);
        console.log(`   👥 Members: ${result.membersFound} found, ${result.membersAdded} added, ${result.membersUpdated} updated`);
        console.log(`   🎓 Citizens: ${result.citizensFound} found, ${result.citizensAdded} added, ${result.citizensUpdated} updated`);
        console.log(`   ⚡ Duration: ${duration}ms, API calls: ${result.apiCallsMade}`);

        return NextResponse.json({
          success: true,
          message: `Settlement ${settlementName} ${operation} sync completed successfully`,
          operation,
          mode,
          triggeredBy,
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
          }
        });
      } else {
        console.error(`❌ ${operation} sync failed for ${settlementName}:`, result.error);
        
        return NextResponse.json({
          success: false,
          operation,
          mode,
          triggeredBy,
          error: `Failed to sync settlement data: ${result.error}`,
          settlementId,
          settlementName
        }, { status: 500 });
      }

    } else {
      // Master settlement list sync
      const result = await syncSettlementsMaster(mode);
      
      if (result.success) {
        console.log(`✅ Settlement master sync (${mode}) completed successfully:`);
        console.log(`   📊 Found: ${result.settlementsFound} settlements`);
        console.log(`   ➕ Added: ${result.settlementsAdded}, 🔄 Updated: ${result.settlementsUpdated}`);
        console.log(`   ❌ Deactivated: ${result.settlementsDeactivated}`);
        console.log(`   ⏱️ Duration: ${result.syncDurationMs}ms, 🌐 API calls: ${result.apiCallsMade}`);

        return NextResponse.json({
          success: true,
          message: `Settlement master sync (${mode}) completed successfully`,
          operation: 'master',
          mode,
          triggeredBy,
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
        console.error(`❌ Settlement master sync (${mode}) failed:`, result.error);
        
        return NextResponse.json({
          success: false,
          operation: 'master',
          mode,
          triggeredBy,
          error: result.error || 'Settlement master sync failed without specific error',
          data: result
        }, { status: 500 });
      }
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