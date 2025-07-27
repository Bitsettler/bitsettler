import { NextRequest, NextResponse } from 'next/server';
import { 
  getTreasurySummary, 
  getTreasuryStats, 
  getTreasuryTransactions, 
  getTreasuryTransactionsWithDetails,
  getTreasuryCategories,
  type GetTransactionsOptions 
} from '../../../../lib/spacetime-db-new/modules';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'summary';

    switch (action) {
      case 'summary': {
        const [summary, stats] = await Promise.all([
          getTreasurySummary(),
          getTreasuryStats(),
        ]);

        return NextResponse.json({
          success: true,
          data: {
            summary,
            stats,
          },
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

      default: {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action. Use: summary, transactions, or categories',
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