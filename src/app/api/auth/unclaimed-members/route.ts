import { NextResponse } from 'next/server';
import { getSupabaseSession } from '@/lib/supabase-server-auth';
import { supabase } from '@/lib/spacetime-db-new/shared/supabase-client';

export async function GET(request: Request) {
  try {
    const session = await getSupabaseSession(request);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    // Get unclaimed settlement members (supabase_user_id is NULL)
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
      .is('supabase_user_id', null)
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