import { NextRequest, NextResponse } from 'next/server';
import { createRequestLogger } from '@/lib/logger';
import { createServerSupabaseClient, requireAuth } from '@/lib/supabase-server-auth';
import { createClient } from '@supabase/supabase-js';
import { BitJitaAPI } from '@/lib/spacetime-db-new/modules/integrations/bitjita-api';
import { validateRequestBody, SETTLEMENT_SCHEMAS } from '@/lib/validation';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
    const logger = createRequestLogger(request, '/api/character/claim');
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
        // Validation failed
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid request data',
            details: validationResult.errors
          },
          { status: 400 }
        );
      }

    // Check if character is already claimed
    const { data: existingClaim, error: checkError } = await supabase
      .from('characters')
      .select('*')
      .eq('id', characterId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Error checking existing claim:', checkError);
      return NextResponse.json(
        { success: false, error: 'Database error while checking existing claim' },
        { status: 500 }
      );
    }

    if (existingClaim) {
      return NextResponse.json(
        { success: false, error: 'Character is already claimed by another user' },
        { status: 409 }
      );
    }

    // Fetch character details from BitJita API to verify it exists and get current data
    const profileResult = await BitJitaAPI.fetchPlayerProfile(characterId);
    
    if (!profileResult.success || !profileResult.data) {
      console.error('❌ Failed to fetch character profile from BitJita:', profileResult.error);
      return NextResponse.json(
        { success: false, error: 'Character not found or BitJita API error' },
        { status: 404 }
      );
    }

    const profile = profileResult.data as any;
    
    // Verify the character name matches (case-insensitive comparison)
    if (profile.userName.toLowerCase() !== characterName.toLowerCase()) {
      console.error('❌ Character name mismatch:', { expected: characterName, actual: profile.userName });
      return NextResponse.json(
        { success: false, error: 'Character name does not match the provided ID' },
        { status: 400 }
      );
    }

    // Get settlement information if available
    let settlementInfo = null;
    if (profile.settlements && profile.settlements.length > 0) {
      const primarySettlement = profile.settlements[0];
      settlementInfo = {
        id: primarySettlement.entityId,
        name: primarySettlement.name,
        tier: primarySettlement.tier,
        regionName: primarySettlement.regionName,
        isOwner: primarySettlement.permissions?.coOwner || false
      };
    }

    // Create the character claim record
    const { data: claimData, error: insertError } = await supabase
      .from('characters')
      .insert({
        id: characterId,
        name: characterName,
        user_id: 'temp-user-id', // TODO: Replace with actual user ID from auth
        claimed_at: new Date().toISOString(),
        level: Math.max(...Object.values(profile.skills || {}).map((skill: any) => skill.level || 0), 0),
        profession: getTopProfession(profile.skills || {}),
        skills: Object.entries(profile.skills || {}).map(([name, skill]: [string, any]) => ({
          name,
          level: skill.level || 0
        })),
        settlement: settlementInfo,
        last_active: profile.lastLoginTimestamp || new Date().toISOString(),
        region_name: settlementInfo?.regionName
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error inserting character claim:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to save character claim' },
        { status: 500 }
      );
    }

    console.log('✅ Character claimed successfully:', characterName);

    // Return the claimed character data in the format expected by the UI
    const claimedCharacter = {
      id: characterId,
      name: characterName,
      level: Math.max(...Object.values(profile.skills || {}).map((skill: any) => skill.level || 0), 0),
      profession: getTopProfession(profile.skills || {}),
      skills: Object.entries(profile.skills || {}).map(([name, skill]: [string, any]) => ({
        name,
        level: skill.level || 0
      })),
      settlement: settlementInfo ? {
        id: settlementInfo.id,
        name: settlementInfo.name,
        tier: settlementInfo.tier
      } : undefined,
      isOwner: settlementInfo?.isOwner || false,
      lastActive: profile.lastLoginTimestamp || new Date().toISOString(),
      regionName: settlementInfo?.regionName
    };

    return NextResponse.json({
      success: true,
      data: {
        character: claimedCharacter,
        settlement: settlementInfo
      }
    });

    } catch (error) {
      console.error('❌ Unexpected error in character claim:', error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
}

// Helper function to determine top profession from skills
function getTopProfession(skills: Record<string, any>): string | undefined {
  const professionSkills = ['combat', 'mining', 'farming', 'crafting', 'building', 'cooking'];
  let topProfession = '';
  let highestLevel = 0;

  for (const [skillName, skillData] of Object.entries(skills)) {
    if (professionSkills.includes(skillName.toLowerCase())) {
      const level = skillData.level || 0;
      if (level > highestLevel) {
        highestLevel = level;
        topProfession = skillName;
      }
    }
  }

  return topProfession || undefined;
}
