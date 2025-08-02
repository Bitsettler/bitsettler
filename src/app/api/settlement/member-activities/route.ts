import { NextRequest } from 'next/server';
import { getRecentMemberActivities } from '@/lib/settlement/activity-tracker';

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
    
    const activities = await getRecentMemberActivities(settlementId, limit);
    
    return Response.json({ 
      success: true, 
      activities,
      count: activities.length,
      type: 'member' 
    });
    
  } catch (error) {
    console.error('Error fetching member activities:', error);
    return Response.json({ 
      success: false, 
      error: 'Failed to fetch member activities' 
    }, { status: 500 });
  }
}