import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, requireAuth } from '@/lib/supabase-server-auth';
import { createServerClient } from '@/lib/spacetime-db-new/shared/supabase-client';
import { validateRequestBody, SETTLEMENT_SCHEMAS } from '@/lib/validation';
import { createRequestLogger } from '@/lib/logger';
import { shouldRateLimit, characterClaimRateLimit } from '@/lib/rate-limiting';

/**
 * Character Claim API
 * 
 * Flow:
 * 1. User selects character from available unclaimed characters
 * 2. API claims the character by linking it to the current user
 * 3. Sets onboarding completion timestamp
 * 4. Returns success confirmation
 * 
 * Security: Hybrid RLS approach
 * - Uses authenticated client for reads/verification (respects RLS)
 * - Uses service role client only for atomic claim operation (bypasses RLS)
 * - Maintains audit trail with detailed security logging
 * - Prevents privilege escalation while ensuring functionality
 */
export async function POST(request: NextRequest) {
  const logger = createRequestLogger(request, '/api/settlement/claim-character');
  const timer = logger.time('character_claim_request');
  
  try {
    logger.info('Character claim request started');
    
    // Verify authentication using proper header handling
    const authResult = await requireAuth(request);
    if (authResult.error) {
      logger.warn('Authentication failed', { error: authResult.error });
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const { session, user } = authResult;
    const userLogger = logger.child({ userId: user.id });
    
    // Apply strict rate limiting for character claiming (3 attempts per hour)
    if (shouldRateLimit(request)) {
      const rateLimitCheck = await characterClaimRateLimit(user.id)(request);
      if (!rateLimitCheck.allowed && rateLimitCheck.response) {
        userLogger.warn('Rate limit exceeded for character claiming');
        return rateLimitCheck.response;
      }
    }
    
    // Use authenticated client for reads/verification (respects RLS)
    const authenticatedClient = await createServerSupabaseClient();
    
    // Use service role client only for the atomic claim operation (bypasses RLS)
    const serviceClient = createServerClient();
    
    if (!serviceClient) {
      return NextResponse.json(
        { success: false, error: 'Database service unavailable' },
        { status: 500 }
      );
    }

    // Validate and sanitize request body
    const validationResult = await validateRequestBody(request, SETTLEMENT_SCHEMAS.claimCharacter);
    if (!validationResult.success) {
      console.error('❌ Validation failed:', {
        errors: validationResult.errors
      });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request data',
          details: validationResult.errors
        },
        { status: 400 }
      );
    }
    
    console.log('🔍 Claim character validated data:', validationResult.data);

    const { playerEntityId, settlementId, displayName, primaryProfession, secondaryProfession, replaceExisting } = validationResult.data!;
    const claimLogger = userLogger.child({ 
      playerEntityId, 
      settlementId,
      replaceExisting: !!replaceExisting,
      operation: replaceExisting ? 'character_switch' : 'character_claim'
    });

    claimLogger.info('Starting character claim process');

    // 1. Verify character exists and is unclaimed using service client
    // (RLS policies may block seeing unclaimed characters)
    const { data: character, error: characterError } = await serviceClient
      .from('settlement_members')
      .select('*')
      .eq('player_entity_id', playerEntityId) // Use BitJita player entity ID (stable, never changes)
      .is('supabase_user_id', null) // Must be unclaimed
      .single();

    if (characterError || !character) {
      claimLogger.warn('Character not found or already claimed', {
        error: characterError?.message,
        characterFound: !!character
      });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Character not available or already claimed',
          debug: {
            characterError: characterError?.message,
            playerEntityId,
            settlementId,
            characterFound: !!character
          }
        },
        { status: 404 }
      );
    }

    // 2. Check if user already has a character in this settlement using authenticated client
    // (This respects RLS - users can only see their own claimed characters)
    const { data: existingClaim, error: existingError } = await authenticatedClient
      .from('settlement_members')
      .select('id, player_entity_id, entity_id, name, settlement_id')
      .eq('supabase_user_id', user.id)
      .single();

    if (existingClaim && !replaceExisting) {
      // Normal flow: prevent claiming if user already has a character
      claimLogger.warn('User already has character, replacement not requested', {
        existingCharacter: existingClaim.name
      });
      return NextResponse.json(
        { 
          success: false, 
          error: `You already have a character in this settlement: ${existingClaim.name}`,
          existingCharacter: existingClaim
        },
        { status: 409 }
      );
    }

    if (replaceExisting && !existingClaim) {
      // Switch flow: user requested replacement but has no existing character
      claimLogger.warn('Character replacement requested but user has no existing character');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot replace character: you do not have an existing character to replace',
          code: 'NO_EXISTING_CHARACTER'
        },
        { status: 400 }
      );
    }

    if (replaceExisting && existingClaim) {
      // Switch flow: verify user is replacing within the same settlement
      if (existingClaim.settlement_id !== settlementId) {
        claimLogger.warn('Attempt to replace character in different settlement', {
          existingSettlement: existingClaim.settlement_id,
          targetSettlement: settlementId
        });
        return NextResponse.json(
          { 
            success: false, 
            error: 'Cannot replace character: new character must be in the same settlement',
            code: 'SETTLEMENT_MISMATCH'
          },
          { status: 400 }
        );
      }
      
      claimLogger.info('Character replacement validated', {
        existingCharacter: existingClaim.name,
        newCharacter: playerEntityId
      });
    }

    // 3. Handle character claiming (with optional replacement)
    claimLogger.info('Security: Initiating character claim', {
      userEmail: user.email,
      characterName: character.name,
      isReplacement: !!replaceExisting,
      securityEvent: replaceExisting ? 'character_replacement_initiation' : 'character_claim_initiation'
    });
    
    // 3a. If replacing, release the existing character first
    if (replaceExisting && existingClaim) {
      claimLogger.info('Releasing existing character for replacement', {
        existingCharacterId: existingClaim.player_entity_id,
        existingCharacterName: existingClaim.name
      });
      
      const { error: releaseError } = await serviceClient
        .from('settlement_members')
        .update({
          supabase_user_id: null,
          bitjita_user_id: null,
          display_name: null,
          primary_profession: null,
          secondary_profession: null,
          app_joined_at: null,
          app_last_active_at: null,
          onboarding_completed_at: null
        })
        .eq('id', existingClaim.id)
        .eq('supabase_user_id', user.id); // Safety: only release if still owned by user

      if (releaseError) {
        claimLogger.error('Failed to release existing character', {
          error: releaseError.message,
          existingCharacterId: existingClaim.id
        });
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to release existing character for replacement',
            debug: { releaseError: releaseError.message }
          },
          { status: 500 }
        );
      }
      
      claimLogger.info('Successfully released existing character');
    }
    
    // 3b. Claim the new character
    const updateData: any = {
      supabase_user_id: user.id,
      onboarding_completed_at: new Date().toISOString()
    };

    // Add display name if provided
    if (displayName) {
      updateData.display_name = displayName;
    }

    // Add profession choices if provided
    if (primaryProfession) {
      updateData.primary_profession = primaryProfession;
    }
    if (secondaryProfession) {
      updateData.secondary_profession = secondaryProfession;
    }



    const { data: claimedCharacter, error: claimError } = await serviceClient
      .from('settlement_members')
      .update(updateData)
      .eq('player_entity_id', playerEntityId) // Use BitJita player entity ID (stable, never changes)
      .is('supabase_user_id', null) // Double-check it's still unclaimed
      .select()
      .single();

    if (claimError) {
      console.error('❌ Failed to claim character:', claimError);
      console.error('❌ Character ID:', playerEntityId);
      console.error('❌ Settlement ID:', settlementId);
      console.error('❌ User ID:', user.id);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to claim character. It may have been claimed by someone else.',
          debug: {
            error: claimError.message,
            code: claimError.code,
            playerEntityId,
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

    // 4. Mark settlement as established (since someone claimed a character)
    await serviceClient
      .from('settlements_master')
      .update({ is_established: true })
      .eq('id', settlementId);

    // 5. Start treasury polling for the newly established settlement
    try {
      console.log('💰 Starting treasury polling for established settlement...');
      const { TreasuryPollingService } = await import('@/lib/spacetime-db-new/modules/treasury/services/treasury-polling-service');
      const treasuryService = TreasuryPollingService.getInstance();
      
      const initialSnapshot = await treasuryService.pollTreasuryData(settlementId);
      if (initialSnapshot) {
        console.log(`✅ Treasury polling started with initial balance: ${initialSnapshot.balance}`);
      } else {
        console.log('📊 Treasury polling started (no immediate balance change recorded)');
      }
    } catch (treasuryError) {
      console.error('⚠️ Failed to start treasury polling:', treasuryError);
      // Don't fail the character claim if treasury polling fails
    }

    // 6. Get settlement information for response using authenticated client
    const { data: settlement, error: settlementError } = await authenticatedClient
      .from('settlements_master')
      .select('id, name, tier, population')
      .eq('id', settlementId)
      .single();

    claimLogger.info('Character claim successful', {
      characterName: claimedCharacter.name,
      settlementName: settlement?.name,
      securityEvent: 'character_claim_success',
      auditTrail: 'preserved'
    });
    timer();

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
          primary_profession: claimedCharacter.primary_profession,
          secondary_profession: claimedCharacter.secondary_profession,
          display_name: claimedCharacter.display_name,
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
    logger.error('Character claim API error', {
      securityEvent: 'character_claim_exception'
    }, error);
    timer();
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during character claim'
    }, { status: 500 });
  }
}