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
import { createServerClient } from '../../../../lib/spacetime-db-new/shared/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'summary';

    switch (action) {
      case 'summary': {
        // Fetching treasury summary with BitJita integration
        
        // Get settlement ID from query params (required)
        const settlementId = searchParams.get('settlementId');
        
        if (!settlementId) {
          return NextResponse.json(
            { error: 'Settlement ID is required' },
            { status: 400 }
          );
        }
        
                // Get the latest treasury balance from polling history
        const supabase = createServerClient();
        let currentBalance = 0;
        
        try {
          const bitjitaResult = await BitJitaAPI.fetchSettlementDetails(settlementId);
          if (bitjitaResult.success && bitjitaResult.data) {
            currentBalance = bitjitaResult.data.treasury;
            console.log(`🏛️ Direct BitJita treasury balance: ${currentBalance}`);
          }
        } catch (error) {
          console.error('Error fetching BitJita settlement details:', error);
        }

        // Get local transaction data for statistics (with fallbacks for missing tables)
        let localSummary = null;
        let stats = null;
        
        try {
          localSummary = await getTreasurySummary();
        } catch (error) {
          console.warn('⚠️ Treasury summary table not available, using defaults');
          localSummary = null;
        }
        
        try {
          stats = await getTreasuryStats(settlementId);
        } catch (error) {
          console.warn('⚠️ Treasury stats tables not available, using defaults');
          stats = {
            monthlyIncome: 0,
            monthlyExpenses: 0,
            netChange: 0,
            transactionCount: 0,
            averageTransactionSize: 0
          };
        }

        // Build enhanced summary with BitJita balance
        const enhancedSummary = {
          ...localSummary,
          currentBalance: 0, // Will be updated with BitJita data
          lastUpdated: new Date().toISOString(),
        };

        // Use live BitJita balance as the source of truth
        enhancedSummary.currentBalance = currentBalance;

        console.log(`📊 Treasury summary: Current Balance: ${enhancedSummary.currentBalance}, Transactions: ${stats?.transactionCount || 0}`);

        return NextResponse.json({
          success: true,
          data: {
            summary: enhancedSummary,
            stats,
          },
          meta: {
            dataSource: 'manual_transactions',
            lastUpdated: enhancedSummary.lastUpdated,
            settlementId
          }
        });
        break;
      }

      case 'transactions': {
        try {

          const settlementId = searchParams.get('settlementId');
        
          if (!settlementId) {
            return NextResponse.json(
              { error: 'Settlement ID is required' },
              { status: 400 }
            );
          }
          
          const options: GetTransactionsOptions = {
            settlementId: settlementId,
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
        } catch (error) {
          console.warn('⚠️ Treasury transactions table not available, returning empty list');
          return NextResponse.json({
            success: true,
            data: [],
            count: 0,
            pagination: {
              limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
              offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
            },
            includesDetails: false,
          });
        }
        break;
      }

      case 'categories': {
        try {
          const categories = await getTreasuryCategories();

          return NextResponse.json({
            success: true,
            data: categories,
            count: categories.length,
          });
        } catch (error) {
          console.warn('⚠️ Treasury categories table not available, returning empty list');
          return NextResponse.json({
            success: true,
            data: [],
            count: 0,
          });
        }
        break;
      }

      case 'history': {
        try {
          const settlementId = searchParams.get('settlementId');
        
        if (!settlementId) {
          return NextResponse.json(
            { error: 'Settlement ID is required' },
            { status: 400 }
          );
        }
          const timeRange = parseInt(searchParams.get('timeRange') || '30'); // Changed from 7 to 30 days
          const timeUnit = (searchParams.get('timeUnit') || 'days') as 'days' | 'months';
          
          const history = await treasuryPollingService.getTreasuryHistory(settlementId, timeRange, timeUnit);

          return NextResponse.json({
            success: true,
            data: history,
            count: history.length,
            meta: {
              settlementId,
              timeRange,
              timeUnit,
              dataSource: 'treasury_history_polling'
            }
          });
        } catch (error) {
          console.warn('⚠️ Treasury history table not available, returning empty list');
          return NextResponse.json({
            success: true,
            data: [],
            count: 0,
            meta: {
              settlementId: searchParams.get('settlementId') || 'unknown',
              timeRange: parseInt(searchParams.get('timeRange') || '30'),
              timeUnit: (searchParams.get('timeUnit') || 'days') as 'days' | 'months',
              dataSource: 'empty_fallback'
            }
          });
        }
        break;
      }

      case 'start_polling': {
        const settlementId = searchParams.get('settlementId');
        
        if (!settlementId) {
          return NextResponse.json(
            { error: 'Settlement ID is required' },
            { status: 400 }
          );
        }
        
        // First create an initial snapshot if needed
        console.log('🏛️ Creating initial treasury snapshot before starting polling...');
        const initialSnapshot = await treasuryPollingService.pollTreasuryData(settlementId);
        
        // Then start regular polling
        treasuryPollingService.startPolling(settlementId);
        
        return NextResponse.json({
          success: true,
          message: 'Treasury polling started',
          initialSnapshot,
          status: treasuryPollingService.getStatus()
        });
        break;
      }

      case 'stop_polling': {
        treasuryPollingService.stopPolling();
        
        return NextResponse.json({
          success: true,
          message: 'Treasury polling stopped',
          status: treasuryPollingService.getStatus()
        });
        break;
      }

      case 'ensure_established_polling': {
        try {
          const result = await treasuryPollingService.ensureEstablishedSettlementsPolling();
          
          return NextResponse.json({
            success: result.success,
            message: `Checked ${result.settlementsProcessed} established settlements, started polling for ${result.newPollingStarted} settlements`,
            data: {
              settlementsProcessed: result.settlementsProcessed,
              newPollingStarted: result.newPollingStarted,
              errors: result.errors
            }
          });
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to ensure established settlements polling'
          }, { status: 500 });
        }
        break;
      }

      case 'polling_status': {
        return NextResponse.json({
          success: true,
          status: treasuryPollingService.getStatus()
        });
        break;
      }

      case 'poll_now': {
        const settlementId = searchParams.get('settlementId');
        
        if (!settlementId) {
          return NextResponse.json(
            { error: 'Settlement ID is required' },
            { status: 400 }
          );
        }
        const snapshot = await treasuryPollingService.pollTreasuryData(settlementId);
        
        return NextResponse.json({
          success: true,
          data: snapshot,
          message: snapshot ? 'Treasury data polled successfully' : 'No changes detected'
        });
        break;
      }

      case 'cleanup_snapshots': {
        const settlementId = searchParams.get('settlementId');
        
        if (!settlementId) {
          return NextResponse.json(
            { error: 'Settlement ID is required' },
            { status: 400 }
          );
        }
        await treasuryPollingService.cleanupExcessiveSnapshots(settlementId);
        
        return NextResponse.json({
          success: true,
          message: 'Excessive treasury snapshots cleaned up'
        });
        break;
      }

      case 'create_sample_history': {
        const settlementId = searchParams.get('settlementId');
        
        if (!settlementId) {
          return NextResponse.json(
            { error: 'Settlement ID is required' },
            { status: 400 }
          );
        }
        
        try {
          // Create sample data points over the last 7 days
          const now = new Date();
          const sampleData = [];
          const baseBalance = 300000; // Starting balance
          
          for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            date.setHours(12, 0, 0, 0); // Noon each day
            
            // Create realistic balance fluctuations
            const variation = (Math.random() - 0.5) * 20000; // +/- 10k variation
            const dayTrend = i * 2000; // Slight upward trend
            const balance = Math.floor(baseBalance + dayTrend + variation);
            
            sampleData.push({
              settlement_id: settlementId,
              balance: balance,
              previous_balance: i === 6 ? 0 : Math.floor(baseBalance + (i + 1) * 2000),
              change_amount: i === 6 ? 0 : balance - Math.floor(baseBalance + (i + 1) * 2000),
              supplies: 101000 + Math.floor(Math.random() * 1000),
              tier: 6,
              num_tiles: 7998,
              data_source: 'sample_data',
              recorded_at: date.toISOString()
            });
          }
          
          // Insert the sample data
          const supabase = await import('../../../../lib/supabase-server-auth').then(m => m.createServerSupabaseClient());
          const { data, error } = await supabase
            .from('treasury_history')
            .insert(sampleData as any)
            .select();
            
          if (error) {
            throw error;
          }
          
          return NextResponse.json({
            success: true,
            message: `Created ${sampleData.length} sample treasury history records`,
            data: data
          });
          
        } catch (error) {
          console.error('Failed to create sample history:', error);
          return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create sample data'
          }, { status: 500 });
        }
        break;
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