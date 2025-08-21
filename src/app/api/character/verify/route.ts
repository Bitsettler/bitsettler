import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { BitJitaAPI, PlayerProfile } from '@/lib/spacetime-db-new/modules/integrations/bitjita-api';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { characterId } = body;

    if (!characterId) {
      return NextResponse.json(
        { success: false, error: 'Character ID is required' },
        { status: 400 }
      );
    }

    const { data: existingClaim, error: checkError } = await supabase
      .from('players')
      .select('id, name, supabase_user_id')
      .eq('id', characterId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Error checking character claim:', checkError);
      return NextResponse.json(
        { success: false, error: 'Database error while checking character claim' },
        { status: 500 }
      );
    }

    const profileResult = await BitJitaAPI.fetchPlayerProfile(characterId);
  
    if (!profileResult.success || !profileResult.data) {
      console.error('❌ Failed to fetch character profile from BitJita:', profileResult.error);
      return NextResponse.json(
        { success: false, error: 'Character not found or BitJita API error' },
        { status: 404 }
      );
    }

    const profile = profileResult.data as PlayerProfile;
    const skills = profile.skills;

    if (!existingClaim) {
      return NextResponse.json({
        success: true,
        data: {
          isClaimed: false,
          message: 'Character not claimed - available for claiming',
          skills: skills
        }
      });
    }


    if (existingClaim.supabase_user_id) {
      return NextResponse.json({
        success: true,
        data: {
          isClaimed: true,
          message: 'Character is already claimed. Please contact support if you believe this is an issue.',
          claimedBy: existingClaim.supabase_user_id
        }
      });
    }
    
    

    return NextResponse.json({
      success: true,
      data: {
        isClaimed: false,
        message: 'Character is available for claiming',
        characterName: existingClaim.name,
        skills: skills
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
