import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { primaryProfession, secondaryProfession } = body;

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the user's settlement member record
    const { data: member, error: memberError } = await supabase
      .from('players')
      .select('id, settlement_id')
      .eq('supabase_user_id', user.id)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { success: false, error: 'Settlement member record not found. Please claim your character first.' },
        { status: 403 }
      );
    }

    // Update the member's professions
    const { error: updateError } = await supabase
      .from('players')
      .update({
        primary_profession: primaryProfession,
        secondary_profession: secondaryProfession
      })
      .eq('id', member.id);

    if (updateError) {
      console.error('Failed to update professions:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update professions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Professions updated successfully'
    });

  } catch (error) {
    console.error('Update professions API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
