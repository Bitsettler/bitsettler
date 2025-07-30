import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSession } from '@/lib/supabase-server-auth';
import { supabase } from '@/lib/spacetime-db-new/shared/supabase-client';

export async function POST(request: NextRequest) {
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

    const { memberId, displayName } = await request.json();

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      );
    }

    // Use the database function to claim the character
    const { data, error } = await supabase
      .rpc('claim_character', {
        p_auth_user_id: session.user.id,
        p_member_id: memberId,
        p_display_name: displayName || null
      });

    if (error) {
      console.error('Failed to claim character:', error);
      
      if (error.message.includes('Character not found or already claimed')) {
        return NextResponse.json(
          { error: 'Character not found or already claimed by another user' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to claim character' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Character claimed successfully'
    });

  } catch (error) {
    console.error('Claim character API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 