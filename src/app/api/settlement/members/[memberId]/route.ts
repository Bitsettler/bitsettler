import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/spacetime-db-new/shared/supabase-client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await params;
    const { searchParams } = new URL(request.url);
    const settlementId = searchParams.get('settlementId');

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    let { data: member, error: memberError } = await supabase
      .from('players')
      .select('*')
      .eq('id', memberId)
      .maybeSingle();

    if (memberError) {
      console.error('Member lookup error:', memberError);
      return NextResponse.json(
        { error: 'Database query failed' },
        { status: 500 }
      );
    }

    if (!member) {
      console.log(`❌ Member ${memberId} not found in players table`);
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    console.log(`✅ Found member ${member.name} in unified table`);
    let settlementData = null;
    if (settlementId) {
    let { data: settlement, error: settlementError } = await supabase
      .from('settlements')
      .select('*')
      .eq('id', settlementId)
      .maybeSingle();

      if (settlementError) {
        console.error('Settlement lookup error:', settlementError);
        return NextResponse.json(
          { error: 'Database query failed' },
          { status: 500 }
        );
      }
  
      if (!settlement) {
        console.log(`❌ Member ${settlementId} not found in settlements table`);
        return NextResponse.json(
          { error: 'Member not found' },
          { status: 404 }
        );
      }
      settlementData = settlement;
    }
    const formattedMember = {
      name: member.name,
      settlement_name: settlementData?.name || null,
      playerEntityId: member.id,
      primary_profession: member.primary_profession,
      secondary_profession: member.secondary_profession,
      skills: member.skills || {},
      permissions: {
        inventory: member.inventory_permission || 0,
        build: member.build_permission || 0,
        officer: member.officer_permission || 0,
        coOwner: member.co_owner_permission || 0
      },
      lastLogin: member.last_login_timestamp,
      joinedAt: member.joined_settlement_at,
      isActive: member.is_active,
      lastSyncInfo: member.last_synced_at ? `Last synced: ${new Date(member.last_synced_at).toLocaleString()}` : 'Never synced',
      avatar_url: member.avatar_url
    };

    return NextResponse.json({
      success: true,
      data: formattedMember,
      meta: {
        dataSource: 'unified_settlement_members',
        lastUpdated: new Date().toISOString(),
        skillsCount: Object.keys(member.skills || {}).length,
        isClaimed: !!member.supabase_user_id
      }
    });

  } catch (error) {
    console.error('Member detail API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 