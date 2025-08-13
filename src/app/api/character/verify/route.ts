import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { characterId } = body;

    // Validate input
    if (!characterId) {
      return NextResponse.json(
        { success: false, error: 'Character ID is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Verifying character: ${characterId}`);

    // Check if character is already claimed in settlement_members table
    const { data: existingClaim, error: checkError } = await supabase
      .from('settlement_members')
      .select('id, name, supabase_user_id, player_entity_id')
      .eq('player_entity_id', characterId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Error checking character claim:', checkError);
      return NextResponse.json(
        { success: false, error: 'Database error while checking character claim' },
        { status: 500 }
      );
    }

    if (!existingClaim) {
      // Character not found in database - might need to be created
      return NextResponse.json({
        success: true,
        data: {
          isClaimed: false,
          message: 'Character not claimed - available for claiming'
        }
      });
    }

    if (existingClaim.supabase_user_id) {
      // Character is already claimed
      return NextResponse.json({
        success: true,
        data: {
          isClaimed: true,
          message: 'Character is already claimed. Please contact support if you believe this is an issue.',
          claimedBy: existingClaim.supabase_user_id
        }
      });
    }

    // Character exists but is not claimed
    return NextResponse.json({
      success: true,
      data: {
        isClaimed: false,
        message: 'Character is available for claiming',
        characterName: existingClaim.name
      }
    });

  } catch (error) {
    console.error('❌ Character verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error during character verification' },
      { status: 500 }
    );
  }
}
