import { NextResponse } from 'next/server';
import { getSupabaseSession } from '@/lib/supabase-server-auth';
import { supabase } from '@/lib/supabase-auth';

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

    // Get the user's claimed settlement member
    const { data: member, error } = await supabase
      .from('settlement_members')
      .select('*')
      .eq('supabase_user_id', session.user.id.toString())
      .maybeSingle();

    if (error) {
      // Database error fetching member
      return NextResponse.json(
        { error: 'Failed to fetch member data' },
        { status: 500 }
      );
    }

    if (!member) {
      return NextResponse.json(
        { error: 'No character claimed', code: 'NO_CHARACTER' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: member
    });

  } catch (error) {
    // API error handled
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 