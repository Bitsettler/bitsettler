import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, requireAuth } from '@/lib/supabase-server-auth';
import { createRequestLogger } from '@/lib/logger';

/**
 * Switch Character API
 * 
 * Returns available unclaimed characters in the user's current settlement
 * for character switching. Uses database (not BitJita API) since we're 
 * working with already synced data.
 * 
 * Flow:
 * 1. Get user's currently claimed character to find their settlement
 * 2. Query unclaimed characters in that same settlement
 * 3. Return character list in same format as join flow
 */
export async function GET(request: NextRequest) {
  const logger = createRequestLogger(request, '/api/settlement/switch-character');
  const timer = logger.time('switch_character_request');
  
  try {
    logger.info('Switch character request started');
    
    // 1. Require authentication
    const authResult = await requireAuth(request);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { user } = authResult;
    const authenticatedClient = await createServerSupabaseClient();
    
    const userLogger = logger.child({ userId: user.id });

    // 2. Get user's current settlement by finding their claimed character
    const { data: currentMember, error: memberError } = await authenticatedClient
      .from('players')
      .select('settlement_id, name, id')
      .eq('supabase_user_id', user.id)
      .single();

    if (memberError || !currentMember) {
      userLogger.warn('User has no claimed character', {
        error: memberError?.message
      });
      return NextResponse.json(
        { 
          success: false, 
          error: 'You must have a claimed character to switch characters',
          code: 'NO_CURRENT_CHARACTER'
        },
        { status: 404 }
      );
    }

    const { settlement_id: settlementId } = currentMember;
    userLogger.info('Found user current settlement', { 
      settlementId,
      currentCharacter: currentMember.name 
    });

    // 3. Get unclaimed characters in the same settlement
    const { data: availableCharacters, error: charactersError } = await authenticatedClient
      .from('players')
      .select(`
        id,
        player_entity_id,
        entity_id,
        claim_entity_id,
        name,
        settlement_id,
        bitjita_user_id,
        skills,
        top_profession,
        total_level,
        highest_level,
        inventory_permission,
        build_permission,
        officer_permission,
        co_owner_permission,
        is_active
      `)
      .eq('settlement_id', settlementId)
      .is('supabase_user_id', null) // Only unclaimed characters
      .order('total_level', { ascending: false });

    if (charactersError) {
      userLogger.error('Failed to fetch available characters', {
        error: charactersError.message,
        settlementId
      });
      return NextResponse.json(
        { error: 'Failed to fetch available characters' },
        { status: 500 }
      );
    }

    if (!availableCharacters || availableCharacters.length === 0) {
      userLogger.info('No unclaimed characters available for switching', {
        settlementId
      });
      return NextResponse.json(
        { 
          success: false, 
          error: 'No unclaimed characters available in your settlement for switching',
          code: 'NO_AVAILABLE_CHARACTERS'
        },
        { status: 404 }
      );
    }

    // 4. Format character data in same format as join flow
    const formattedCharacters = availableCharacters.map(char => ({
      id: char.id,
      name: char.name,
      settlement_id: char.settlement_id,
      player_entity_id: char.player_entity_id,
      entity_id: char.entity_id,
      claim_entity_id: char.claim_entity_id,
      bitjita_user_id: char.bitjita_user_id,
      skills: char.skills || {},
      top_profession: char.top_profession || 'Unknown',
      total_level: char.total_level || 0,
      highest_level: char.highest_level || 0,
      permissions: {
        inventory: (char.inventory_permission || 0) > 0,
        build: (char.build_permission || 0) > 0,
        officer: (char.officer_permission || 0) > 0,
        co_owner: (char.co_owner_permission || 0) > 0
      },
      is_active: char.is_active
    }));

    userLogger.info('Switch character data prepared', {
      availableCount: formattedCharacters.length,
      currentCharacter: currentMember.name
    });
    
    timer();

    // 5. Return data in same format as join flow for UI compatibility
    return NextResponse.json({
      success: true,
      message: `Found ${formattedCharacters.length} available characters for switching`,
      data: {
        // Include current settlement info
        settlement: {
          id: settlementId,
          name: `Current Settlement`, // We don't have settlement name in members table
          memberCount: formattedCharacters.length
        },
        availableCharacters: formattedCharacters,
        totalAvailable: formattedCharacters.length,
        // Additional context for switch flow
        currentCharacter: {
          id: currentMember.id,
          name: currentMember.name
        }
      }
    });

  } catch (error) {
    logger.error('Switch character API error', {}, error);
    timer();
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during character switch lookup'
    }, { status: 500 });
  }
}