import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/spacetime-db-new/shared/supabase-client';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const settlementId = searchParams.get('settlementId');
  
  if (!settlementId) {
    return NextResponse.json(
      { error: 'Settlement ID is required' },
      { status: 400 }
    );
  }

  try {
    console.log('🔍 Debug: Checking database tables...');

    if (!supabase) {
      return NextResponse.json({ error: 'Database connection not available' }, { status: 503 });
    }

    // Check settlement_members table
    const { data: members, error: membersError } = await supabase
      .from('settlement_members')
      .select('settlement_id, entity_id, user_name, is_active')
      .eq('settlement_id', settlementId)
      .limit(5);

    // Check settlement_citizens table  
    const { data: citizens, error: citizensError } = await supabase
      .from('settlement_citizens')
      .select('settlement_id, entity_id, user_name, skills, total_skills, highest_level, total_xp, top_profession')
      .eq('settlement_id', settlementId)
      .limit(5);

    // Check the view
    const { data: viewData, error: viewError } = await supabase
      .from('settlement_member_details')
      .select('settlement_id, entity_id, user_name, skills, total_skills, highest_level, top_profession')
      .eq('settlement_id', settlementId)
      .limit(5);

    console.log('🔍 Database debug results:', {
      membersCount: members?.length || 0,
      citizensCount: citizens?.length || 0,
      viewCount: viewData?.length || 0,
      sampleMember: members?.[0],
      sampleCitizen: citizens?.[0],
      sampleView: viewData?.[0]
    });

    return NextResponse.json({
      success: true,
      debug: {
        settlementId,
        tables: {
          settlement_members: {
            count: members?.length || 0,
            sample: members?.[0] || null,
            error: membersError
          },
          settlement_citizens: {
            count: citizens?.length || 0,
            sample: citizens?.[0] || null,
            error: citizensError
          },
          settlement_member_details: {
            count: viewData?.length || 0,
            sample: viewData?.[0] || null,
            error: viewError
          }
        }
      }
    });

  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Debug query failed'
    }, { status: 500 });
  }
} 