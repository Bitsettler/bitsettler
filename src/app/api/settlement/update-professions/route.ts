import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, requireAuth } from '@/lib/supabase-server-auth';
import { createServerClient } from '@/lib/spacetime-db-new/shared/supabase-client';
import { validateRequestBody } from '@/lib/validation';
import { createRequestLogger } from '@/lib/logger';
import { shouldRateLimit, standardRateLimit } from '@/lib/rate-limiting';
import { PROFESSIONS } from '@/constants/professions';

/**
 * Update User Professions API
 * 
 * Allows users to update their primary and secondary profession choices.
 * This gives users control over their professional identity beyond just skill levels.
 */

// Validation schema for profession updates
const UPDATE_PROFESSIONS_SCHEMA = {
  primaryProfession: {
    required: false,
    type: 'string' as const,
    minLength: 1,
    maxLength: 50,
    sanitize: true,
    custom: (value: string) => {
      if (!value) return true; // Allow null/empty
      return PROFESSIONS.some(p => p.id === value) || 'Invalid profession ID';
    }
  },
  secondaryProfession: {
    required: false,
    type: 'string' as const,
    minLength: 1,
    maxLength: 50,
    sanitize: true,
    custom: (value: string) => {
      if (!value) return true; // Allow null/empty
      return PROFESSIONS.some(p => p.id === value) || 'Invalid profession ID';
    }
  }
};

export async function PUT(request: NextRequest) {
  const logger = createRequestLogger(request, '/api/settlement/update-professions');
  const timer = logger.time('profession_update_request');
  
  try {
    logger.info('Profession update request started');
    
    // Verify authentication
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
    
    // Apply rate limiting (10 updates per hour)
    if (shouldRateLimit(request)) {
      const rateLimitCheck = await standardRateLimit(user.id)(request);
      if (!rateLimitCheck.allowed && rateLimitCheck.response) {
        userLogger.warn('Rate limit exceeded for profession updates');
        return rateLimitCheck.response;
      }
    }
    
    // Use authenticated client for this operation (respects RLS)
    const authenticatedClient = await createServerSupabaseClient();
    
    // Validate request body
    const validationResult = await validateRequestBody(request, UPDATE_PROFESSIONS_SCHEMA);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request data',
          details: validationResult.errors 
        },
        { status: 400 }
      );
    }

    let { primaryProfession, secondaryProfession } = validationResult.data!;

    // Convert empty strings to null
    primaryProfession = primaryProfession || null;
    secondaryProfession = secondaryProfession || null;

    // Ensure professions are different
    if (primaryProfession && secondaryProfession && primaryProfession === secondaryProfession) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Primary and secondary professions must be different'
        },
        { status: 400 }
      );
    }

    userLogger.info('Updating user professions', {
      primaryProfession,
      secondaryProfession
    });

    // Update the user's profession choices
    const { data: updatedMember, error: updateError } = await authenticatedClient
      .from('settlement_members')
      .update({
        primary_profession: primaryProfession,
        secondary_profession: secondaryProfession,
        updated_at: new Date().toISOString()
      })
      .eq('supabase_user_id', user.id)
      .select('id, name, primary_profession, secondary_profession, top_profession')
      .single();

    if (updateError) {
      userLogger.error('Failed to update professions', { error: updateError });
      
      if (updateError.code === 'PGRST116') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'No claimed character found. Please claim a character first.'
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to update professions'
        },
        { status: 500 }
      );
    }

    userLogger.info('Professions updated successfully', {
      characterName: updatedMember.name,
      primaryProfession: updatedMember.primary_profession,
      secondaryProfession: updatedMember.secondary_profession
    });

    timer();

    return NextResponse.json({
      success: true,
      message: 'Professions updated successfully',
      data: {
        character: {
          id: updatedMember.id,
          name: updatedMember.name,
          primary_profession: updatedMember.primary_profession,
          secondary_profession: updatedMember.secondary_profession,
          top_profession: updatedMember.top_profession
        }
      }
    });

  } catch (error) {
    logger.error('Profession update API error', {
      securityEvent: 'profession_update_exception'
    }, error);
    timer();
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during profession update'
    }, { status: 500 });
  }
}