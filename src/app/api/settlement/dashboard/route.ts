import { NextResponse } from 'next/server';
import { 
  getSettlementDashboard, 
  getTreasuryDashboard 
} from '../../../../lib/spacetime-db-new/modules';

export async function GET() {
  try {
    // Fetch both settlement and treasury dashboard data in parallel
    const [settlementData, treasuryData] = await Promise.all([
      getSettlementDashboard(),
      getTreasuryDashboard(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        settlement: settlementData,
        treasury: treasuryData,
        lastUpdated: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Settlement dashboard API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch dashboard data',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
} 