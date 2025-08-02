import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, requireAuth } from '@/lib/supabase-server-auth';
import { validateRequestBody, SETTLEMENT_SCHEMAS } from '@/lib/validation';
import { createRequestLogger } from '@/lib/logger';

/**
 * Settlement Join API
 * 
 * Flow:
 * 1. User enters invite code
 * 2. API looks up settlement by invite code
 * 3. Returns settlement info + available characters for claiming
 * 4. User picks which character they are
 */
export async function POST(request: NextRequest) {
  const logger = createRequestLogger(request, '/api/settlement/join');
  const timer = logger.time('settlement_join_request');
  
  try {
    logger.info('Settlement join request started');
    
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

    const supabase = await createServerSupabaseClient();

    // Validate and sanitize request body
    const validationResult = await validateRequestBody(request, SETTLEMENT_SCHEMAS.join);
    if (!validationResult.success) {
      userLogger.warn('Request validation failed', { 
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

    const { inviteCode } = validationResult.data!;
    const settlementLogger = userLogger.child({ inviteCode });
    
    settlementLogger.info('Looking up settlement by invite code');

    // 1. Find settlement by invite code
    const { data: settlement, error: settlementError } = await supabase
      .from('settlements_master')
      .select('*')
      .eq('invite_code', inviteCode.toUpperCase())
      .single();

    if (settlementError || !settlement) {
      settlementLogger.warn('Settlement not found for invite code', { 
        error: settlementError?.message 
      });
      return NextResponse.json(
        { success: false, error: 'Invalid invite code' },
        { status: 404 }
      );
    }

    const foundLogger = settlementLogger.child({ 
      settlementId: settlement.id,
      settlementName: settlement.name 
    });
    foundLogger.info('Settlement found successfully');

    // 2. Get available characters (unclaimed members) in this settlement
    const { data: availableCharacters, error: charactersError } = await supabase
      .from('settlement_members')
      .select('*')
      .eq('settlement_id', settlement.id)
      .is('supabase_user_id', null) // Only unclaimed characters
      .order('name');

    if (charactersError) {
      foundLogger.error('Failed to fetch available characters', {}, charactersError);
      return NextResponse.json(
        { success: false, error: 'Failed to retrieve settlement members' },
        { status: 500 }
      );
    }

    foundLogger.info('Available characters fetched', { 
      characterCount: availableCharacters?.length || 0 
    });

    if (!availableCharacters || availableCharacters.length === 0) {
      foundLogger.warn('No available characters in settlement');
      return NextResponse.json(
        { 
          success: false, 
          error: 'No unclaimed characters available in this settlement',
          settlement: {
            id: settlement.id,
            name: settlement.name
          }
        },
        { status: 404 }
      );
    }

    // 3. Format character data for frontend
    const formattedCharacters = availableCharacters.map(char => ({
      id: char.id,
      name: char.name,
      settlement_id: char.settlement_id,
      entity_id: char.entity_id,
      bitjita_user_id: char.bitjita_user_id,
      skills: char.skills || {},
      top_profession: char.top_profession || 'Unknown',
      total_level: char.total_level || 0,
      permissions: {
        inventory: char.inventory_permission > 0,
        build: char.build_permission > 0,
        officer: char.officer_permission > 0,
        co_owner: char.co_owner_permission > 0
      }
    }));

    foundLogger.info('Settlement join successful', {
      characterCount: formattedCharacters.length
    });
    timer();

    return NextResponse.json({
      success: true,
      message: `Found settlement: ${settlement.name}`,
      data: {
        settlement: {
          id: settlement.id,
          name: settlement.name,
          tier: settlement.tier,
          population: settlement.population,
          memberCount: availableCharacters.length
        },
        availableCharacters: formattedCharacters,
        totalAvailable: formattedCharacters.length
      }
    });

  } catch (error) {
    logger.error('Settlement join API error', {}, error);
    timer();
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during settlement lookup'
    }, { status: 500 });
  }
}