import { NextRequest, NextResponse } from 'next/server';
import { 
  getTreasurySummary, 
  getTreasuryStats, 
  getTreasuryTransactions, 
  getTreasuryTransactionsWithDetails,
  getTreasuryCategories,
  type GetTransactionsOptions 
} from '../../../../lib/spacetime-db-new/modules';
import { BitJitaAPI } from '../../../../lib/spacetime-db-new/modules/integrations/bitjita-api';
import { treasuryPollingService } from '../../../../lib/spacetime-db-new/modules/treasury/services/treasury-polling-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'summary';

    switch (action) {
      case 'summary': {
        console.log('🏛️ Fetching treasury summary with BitJita integration...');
        
        // Get settlement ID from query params or use default
        const settlementId = searchParams.get('settlementId') || '504403158277057776'; // Port Taverna
        
        // Fetch real-time treasury balance from BitJita
        const bitjitaResult = await BitJitaAPI.fetchSettlementDetails(settlementId);
        
        // Get local transaction data for statistics
        const [localSummary, stats] = await Promise.all([
          getTreasurySummary(),
          getTreasuryStats(),
        ]);

        // Build enhanced summary with BitJita balance
        let enhancedSummary = {
          ...localSummary,
          currentBalance: 0, // Will be updated with BitJita data
          lastUpdated: new Date().toISOString(),
        };

        // Use BitJita treasury balance if available
        if (bitjitaResult.success && bitjitaResult.data) {
          console.log(`✅ Using BitJita treasury balance: ${bitjitaResult.data.treasury}`);
          enhancedSummary.currentBalance = bitjitaResult.data.treasury;
        } else {
          console.warn(`⚠️ Failed to fetch BitJita balance: ${bitjitaResult.error}`);
          // Fallback to local summary balance
          enhancedSummary.currentBalance = localSummary?.currentBalance || 0;
        }

        console.log(`📊 Treasury summary: Current Balance: ${enhancedSummary.currentBalance}, Transactions: ${stats?.transactionCount || 0}`);

        return NextResponse.json({
          success: true,
          data: {
            summary: enhancedSummary,
            stats,
          },
          meta: {
            dataSource: bitjitaResult.success ? 'bitjita_realtime' : 'local_database',
            lastUpdated: enhancedSummary.lastUpdated,
            settlementId
          }
        });
      }

      case 'transactions': {
        const options: GetTransactionsOptions = {
          type: searchParams.get('type') as 'Income' | 'Expense' | 'Transfer' | 'Adjustment' || undefined,
          category: searchParams.get('category') || undefined,
          startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
          endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
          relatedProjectId: searchParams.get('projectId') || undefined,
          relatedMemberId: searchParams.get('memberId') || undefined,
          limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
          offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
          includeDetails: searchParams.get('includeDetails') === 'true',
        };

        const transactions = options.includeDetails
          ? await getTreasuryTransactionsWithDetails(options)
          : await getTreasuryTransactions(options);

        return NextResponse.json({
          success: true,
          data: transactions,
          count: transactions.length,
          pagination: {
            limit: options.limit,
            offset: options.offset,
          },
          includesDetails: options.includeDetails || false,
        });
      }

      case 'categories': {
        const categories = await getTreasuryCategories();

        return NextResponse.json({
          success: true,
          data: categories,
          count: categories.length,
        });
      }

      case 'history': {
        const settlementId = searchParams.get('settlementId') || '504403158277057776';
        const timeRangeMonths = parseInt(searchParams.get('timeRange') || '6');
        
        const history = await treasuryPollingService.getTreasuryHistory(settlementId, timeRangeMonths);

        return NextResponse.json({
          success: true,
          data: history,
          count: history.length,
          meta: {
            settlementId,
            timeRangeMonths,
            dataSource: 'treasury_history_polling'
          }
        });
      }

      case 'start_polling': {
        const settlementId = searchParams.get('settlementId') || '504403158277057776';
        treasuryPollingService.startPolling(settlementId);
        
        return NextResponse.json({
          success: true,
          message: 'Treasury polling started',
          status: treasuryPollingService.getStatus()
        });
      }

      case 'stop_polling': {
        treasuryPollingService.stopPolling();
        
        return NextResponse.json({
          success: true,
          message: 'Treasury polling stopped',
          status: treasuryPollingService.getStatus()
        });
      }

      case 'polling_status': {
        return NextResponse.json({
          success: true,
          status: treasuryPollingService.getStatus()
        });
      }

      case 'poll_now': {
        const settlementId = searchParams.get('settlementId') || '504403158277057776';
        const snapshot = await treasuryPollingService.pollTreasuryData(settlementId);
        
        return NextResponse.json({
          success: true,
          data: snapshot,
          message: snapshot ? 'Treasury data polled successfully' : 'No changes detected'
        });
      }

      case 'cleanup_snapshots': {
        const settlementId = searchParams.get('settlementId') || '504403158277057776';
        await treasuryPollingService.cleanupExcessiveSnapshots(settlementId);
        
        return NextResponse.json({
          success: true,
          message: 'Excessive treasury snapshots cleaned up'
        });
      }

      default: {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action. Use: summary, transactions, categories, history, start_polling, stop_polling, polling_status, poll_now, or cleanup_snapshots',
          },
          { status: 400 }
        );
      }
    }

  } catch (error) {
    console.error('Treasury API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch treasury data',
      },
      { status: 500 }
    );
  }
} 