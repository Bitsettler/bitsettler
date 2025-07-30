import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSession } from '@/lib/supabase-server-auth';
import { supabase } from '@/lib/spacetime-db-new/shared/supabase-client';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Get user's settlement member ID first
    const { data: member } = await supabase
      .from('settlement_members')
      .select('id')
      .eq('auth_user_id', session.user.id)
      .single();

    if (!member) {
      return NextResponse.json(
        { error: 'No character claimed' },
        { status: 404 }
      );
    }

    // Delete the calculator save (only if it belongs to this member)
    const { error } = await supabase
      .from('user_calculator_saves')
      .delete()
      .eq('id', id)
      .eq('member_id', member.id);

    if (error) {
      console.error('Failed to delete calculator save:', error);
      return NextResponse.json(
        { error: 'Failed to delete save' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Calculator save deleted successfully'
    });

  } catch (error) {
    console.error('Calculator save delete API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 