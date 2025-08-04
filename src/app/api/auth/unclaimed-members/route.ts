import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, requireAuth } from '@/lib/supabase-server-auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Get unclaimed settlement members (auth_user_id is NULL)
    const { data: members, error } = await supabase
      .from('settlement_members')
      .select(`
        id,
        entity_id,
        name,
        top_profession,
        total_level,
        highest_level,
        settlement_id,
        is_active
      `)
      .is('auth_user_id', null)
      .order('total_level', { ascending: false });

    if (error) {
      console.error('Failed to fetch unclaimed members:', error);
      return NextResponse.json(
        { error: 'Failed to fetch members' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: members || []
    });

  } catch (error) {
    console.error('Unclaimed members API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 