import { NextRequest } from 'next/server';
import { getRecentSettlementActivities } from '@/lib/settlement/activity-tracker';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const settlementId = searchParams.get('settlementId');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    if (!settlementId) {
      return Response.json({ 
        success: false, 
        error: 'Settlement ID required' 
      }, { status: 400 });
    }
    
    const activities = await getRecentSettlementActivities(settlementId, limit);
    
    return Response.json({ 
      success: true, 
      activities,
      count: activities.length,
      type: 'settlement' 
    });
    
  } catch (error) {
    console.error('Error fetching settlement activities:', error);
    return Response.json({ 
      success: false, 
      error: 'Failed to fetch settlement activities' 
    }, { status: 500 });
  }
}