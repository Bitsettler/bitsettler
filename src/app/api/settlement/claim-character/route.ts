import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, requireAuth } from '@/lib/supabase-server-auth';

/**
 * Character Claim API
 * 
 * Flow:
 * 1. User selects character from available unclaimed characters
 * 2. API claims the character by linking it to the current user
 * 3. Sets onboarding completion timestamp
 * 4. Returns success confirmation
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication using proper header handling
    const authResult = await requireAuth(request);
    if (authResult.error) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const { session, user } = authResult;
    const supabase = await createServerSupabaseClient();

    const body = await request.json();
    const { characterId, settlementId } = body;

    if (!characterId || !settlementId) {
      return NextResponse.json(
        { success: false, error: 'characterId and settlementId are required' },
        { status: 400 }
      );
    }

    console.log(`👤 Claiming character: ${characterId} for user: ${user.id}`);

    // 1. Verify character exists and is unclaimed
    const { data: character, error: characterError } = await supabase
      .from('settlement_members')
      .select('*')
      .eq('entity_id', characterId)
      .eq('settlement_id', settlementId)
      .is('supabase_user_id', null) // Must be unclaimed
      .eq('is_active', true)
      .single();

    if (characterError || !character) {
      console.log(`❌ Character not found or already claimed: ${characterId}`);
      console.log(`❌ Character Error:`, characterError);
      console.log(`❌ Settlement ID:`, settlementId);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Character not available or already claimed',
          debug: {
            characterError: characterError?.message,
            characterId,
            settlementId,
            characterFound: !!character
          }
        },
        { status: 404 }
      );
    }

    // 2. Check if user already has a character in this settlement
    const { data: existingClaim, error: existingError } = await supabase
      .from('settlement_members')
      .select('entity_id, name')
      .eq('settlement_id', settlementId)
      .eq('supabase_user_id', user.id)
      .eq('is_active', true)
      .single();

    if (existingClaim) {
      return NextResponse.json(
        { 
          success: false, 
          error: `You already have a character in this settlement: ${existingClaim.name}`,
          existingCharacter: existingClaim
        },
        { status: 409 }
      );
    }

    // 3. Claim the character by setting supabase_user_id and onboarding timestamp
    const { data: claimedCharacter, error: claimError } = await supabase
      .from('settlement_members')
      .update({
        supabase_user_id: user.id,
        onboarding_completed_at: new Date().toISOString()
      })
      .eq('entity_id', characterId)
      .eq('settlement_id', settlementId)
      .is('supabase_user_id', null) // Double-check it's still unclaimed
      .select()
      .single();

    if (claimError) {
      console.error('❌ Failed to claim character:', claimError);
      console.error('❌ Character ID:', characterId);
      console.error('❌ Settlement ID:', settlementId);
      console.error('❌ User ID:', user.id);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to claim character. It may have been claimed by someone else.',
          debug: {
            error: claimError.message,
            code: claimError.code,
            characterId,
            settlementId,
            userId: user.id
          }
        },
        { status: 500 }
      );
    }

    if (!claimedCharacter) {
      return NextResponse.json(
        { success: false, error: 'Character was claimed by someone else' },
        { status: 409 }
      );
    }

    // 4. Get settlement information for response
    const { data: settlement, error: settlementError } = await supabase
      .from('settlements_master')
      .select('id, name, tier, population')
      .eq('id', settlementId)
      .single();

    console.log(`✅ Character claimed successfully: ${claimedCharacter.name} by user ${user.id}`);
    console.log(`🏛️ Settlement: ${settlement?.name || settlementId}`);

    return NextResponse.json({
      success: true,
      message: `Successfully claimed character: ${claimedCharacter.name}`,
      data: {
        character: {
          id: claimedCharacter.id,
          name: claimedCharacter.name,
          settlement_id: claimedCharacter.settlement_id,
          entity_id: claimedCharacter.entity_id,
          bitjita_user_id: claimedCharacter.bitjita_user_id,
          skills: claimedCharacter.skills || {},
          top_profession: claimedCharacter.top_profession || 'Unknown',
          total_level: claimedCharacter.total_level || 0,
          permissions: {
            inventory: claimedCharacter.inventory_permission > 0,
            build: claimedCharacter.build_permission > 0,
            officer: claimedCharacter.officer_permission > 0,
            co_owner: claimedCharacter.co_owner_permission > 0
          },
          onboarding_completed_at: claimedCharacter.onboarding_completed_at
        },
        settlement: settlement ? {
          id: settlement.id,
          name: settlement.name,
          tier: settlement.tier,
          population: settlement.population
        } : null
      }
    });

  } catch (error) {
    console.error('❌ Character claim error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during character claim'
    }, { status: 500 });
  }
}