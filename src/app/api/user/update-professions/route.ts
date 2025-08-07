import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server-auth';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Update professions API called');
    
    const body = await request.json();
    const { primaryProfession, secondaryProfession } = body;
    
    console.log('📝 Profession data:', { primaryProfession, secondaryProfession });

    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Auth error:', authError);
      return NextResponse.json(
        { success: false, error: 'Authentication error: ' + authError.message },
        { status: 401 }
      );
    }
    
    if (!user) {
      console.error('❌ No user found');
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    console.log('✅ User authenticated:', user.id);

    // Get the user's settlement member record
    const { data: member, error: memberError } = await supabase
      .from('settlement_members')
      .select('id, settlement_id')
      .eq('supabase_user_id', user.id)
      .single();

    if (memberError) {
      console.error('❌ Member lookup error:', memberError);
      return NextResponse.json(
        { success: false, error: 'Member lookup failed: ' + memberError.message },
        { status: 500 }
      );
    }

    if (!member) {
      console.error('❌ No member found for user:', user.id);
      return NextResponse.json(
        { success: false, error: 'Settlement member record not found. Please claim your character first.' },
        { status: 403 }
      );
    }
    
    console.log('✅ Member found:', member.id);

    // Update the member's professions
    console.log('🔄 Updating professions for member:', member.id);
    
    const { error: updateError } = await supabase
      .from('settlement_members')
      .update({
        primary_profession: primaryProfession,
        secondary_profession: secondaryProfession,
        updated_at: new Date().toISOString()
      })
      .eq('id', member.id);

    if (updateError) {
      console.error('❌ Failed to update professions:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update professions: ' + updateError.message },
        { status: 500 }
      );
    }
    
    console.log('✅ Professions updated successfully');

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
