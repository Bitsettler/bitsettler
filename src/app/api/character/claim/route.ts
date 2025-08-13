import { NextRequest, NextResponse } from 'next/server';
import { createRequestLogger } from '@/lib/logger';
import { createServerClient } from '@/lib/spacetime-db-new/shared/supabase-client';
import { requireAuth } from '@/lib/supabase-server-auth';
import { createClient } from '@supabase/supabase-js';
import { BitJitaAPI } from '@/lib/spacetime-db-new/modules/integrations/bitjita-api';
import { validateRequestBody, SETTLEMENT_SCHEMAS } from '@/lib/validation';
import { shouldRateLimit, characterClaimRateLimit } from '@/lib/rate-limiting';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
    const logger = createRequestLogger(request, '/api/character/claim');
      
    try {
      logger.info('Character claim request started');
      
      const authResult = await requireAuth(request);
      if (authResult.error) {
        logger.warn('Authentication failed', { error: authResult.error });
        return NextResponse.json(
          { success: false, error: authResult.error },
          { status: authResult.status }
        );
      }
  
      const { user } = authResult;
      
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 401 }
        );
      }

      const userLogger = logger.child({ userId: user.id });
      
      if (shouldRateLimit(request)) {
        const rateLimitCheck = await characterClaimRateLimit(user.id)(request);
        if (!rateLimitCheck.allowed && rateLimitCheck.response) {
          userLogger.warn('Rate limit exceeded for character claiming');
          return rateLimitCheck.response;
        }
      }
         
      const serviceClient = createServerClient();
      
      if (!serviceClient) {
        return NextResponse.json(
          { success: false, error: 'Database service unavailable' },
          { status: 500 }
        );
      }
  
      const validationResult = await validateRequestBody(request, SETTLEMENT_SCHEMAS.claimCharacter);
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

    const { playerEntityId, primaryProfession, secondaryProfession } = validationResult.data as {
      playerEntityId: string;
      primaryProfession: string;
      secondaryProfession: string;
    };

    // Fetch character details from BitJita API to verify it exists and get current data
    console.log("playerEntityId", playerEntityId);
    const profileResult = await BitJitaAPI.fetchPlayerProfile(playerEntityId);
    
    if (!profileResult.success || !profileResult.data) {
      console.error('❌ Failed to fetch character profile from BitJita:', profileResult.error);
      return NextResponse.json(
        { success: false, error: 'Character not found or BitJita API error' },
        { status: 404 }
      );
    }

    const profile = profileResult.data as any;
    console.log("profile", profile);

    if (profile.settlements)

    // Get all settlements for the player
    profile.settlements.map(async (settlement: any) => {
      const data = await BitJitaAPI.fetchSettlementCitizens(settlement.entityId);
      if (data.success && data.data) {
        const membersData = data.data.citizens.map((citizen: any) => {
          return {
            default_settlement_id: settlement.entityId,
            player_entity_id: citizen.entityId,
            name: citizen.userName,
            skills: citizen.skills,
            total_skills: citizen.totalSkills,
            highest_level: citizen.highestLevel,
            total_level: citizen.totalLevel,
            total_xp: citizen.totalXP,
            top_profession: getTopLevelSkillId(citizen.skills),
            primary_profession: primaryProfession,
            secondary_profession: secondaryProfession,
            last_synced_at: new Date().toISOString()
          }
        });
        console.log("membersData", membersData);
        const { error: characterError } = await serviceClient
          .from('settlement_members')
          .upsert(membersData, {
            onConflict: 'player_entity_id'
          })
          .select();

          if (characterError) {
            console.error('❌ Error inserting character claim:', characterError);
            return NextResponse.json(
              { success: false, error: 'Failed to save character claim' },
              { status: 500 }
            );
          }
      }
    });   

    // // Get settlement information if available
    // let settlementInfo = null;
    // if (profile.settlements && profile.settlements.length > 0) {
    //   const primarySettlement = profile.settlements[0];
    //   settlementInfo = {
    //     id: primarySettlement.entityId,
    //     name: primarySettlement.name,
    //     tier: primarySettlement.tier,
    //     regionName: primarySettlement.regionName,
    //     isOwner: primarySettlement.permissions?.coOwner || false
    //   };
    // }

    // // Create the character claim record
    // const { data: claimData, error: insertError } = await supabase
    //   .from('characters')
    //   .insert({
    //     id: characterId,
    //     name: characterName,
    //     user_id: 'temp-user-id', // TODO: Replace with actual user ID from auth
    //     claimed_at: new Date().toISOString(),
    //     level: Math.max(...Object.values(profile.skills || {}).map((skill: any) => skill.level || 0), 0),
    //     profession: getTopProfession(profile.skills || {}),
    //     skills: Object.entries(profile.skills || {}).map(([name, skill]: [string, any]) => ({
    //       name,
    //       level: skill.level || 0
    //     })),
    //     settlement: settlementInfo,
    //     last_active: profile.lastLoginTimestamp || new Date().toISOString(),
    //     region_name: settlementInfo?.regionName
    //   })
    //   .select()
    //   .single();

    // if (insertError) {
    //   console.error('❌ Error inserting character claim:', insertError);
    //   return NextResponse.json(
    //     { success: false, error: 'Failed to save character claim' },
    //     { status: 500 }
    //   );
    // }

    // console.log('✅ Character claimed successfully:', characterName);

    // // Check if character is already claimed
    // let character;
    // const { data: existingCharacter, error: characterError } = await serviceClient
    //   .from('settlement_members')
    //   .select('*')
    //   .eq('player_entity_id', playerEntityId) // Use BitJita player entity ID (stable, never changes)
    //   .single();

    // if (characterError && characterError.code !== 'PGRST116') {
    //   // Real database error, not just "no rows found"
    //   return NextResponse.json(
    //     { 
    //       success: false, 
    //       error: 'Database error while checking character availability',
    //       debug: {
    //         characterError: characterError.message,
    //         playerEntityId,
    //       }
    //     },
    //     { status: 500 }
    //   );
    // }

    // if (!existingCharacter) {
    //   // Character doesn't exist, check if this settlement has no members yet
    //   const { data: settlementMembers, error: membersError } = await serviceClient
    //     .from('settlement_members')
    //     .select('id')
    //     .eq('settlement_id', settlementId);

    //   if (membersError) {
    //     claimLogger.error('Failed to check settlement members', {
    //       error: membersError.message,
    //       settlementId
    //     });
    //     return NextResponse.json(
    //       { 
    //         success: false, 
    //         error: 'Failed to vferify settlement status'
    //       },
    //       { status: 500 }
    //     );
    //   }

    //   if (!settlementMembers || settlementMembers.length === 0) {
    //     // This is a new settlement with no members, create the first member
    //     claimLogger.info('Creating first member for new settlement', {
    //       settlementId,
    //       playerEntityId
    //     });

    //     const { data: newCharacter, error: createError } = await serviceClient
    //       .from('settlement_members')
    //       .insert({
    //         settlement_id: settlementId,
    //         player_entity_id: playerEntityId,
    //         entity_id: `entity_${playerEntityId}`,
    //         claim_entity_id: `claim_${playerEntityId}`,
    //         name: displayName || 'Settlement Founder',
    //         skills: {},
    //         total_skills: 0,
    //         highest_level: 0,
    //         total_level: 0,
    //         total_xp: 0,
    //         top_profession: primaryProfession || 'New Resident',
    //         inventory_permission: 1,
    //         build_permission: 1,
    //         officer_permission: 1,
    //         co_owner_permission: 1,
    //         is_active: true,
    //         sync_source: 'manual_creation',
    //         last_synced_at: new Date().toISOString()
    //       })
    //       .select()
    //       .single();

    //     if (createError) {
    //       claimLogger.error('Failed to create new character', {
    //         error: createError.message,
    //         settlementId,
    //         playerEntityId
    //       });
    //       return NextResponse.json(
    //         { 
    //           success: false, 
    //           error: 'Failed to create character for new settlement'
    //         },
    //         { status: 500 }
    //       );
    //     }

    //     character = newCharacter;
    //     claimLogger.info('Successfully created first character for settlement');
    //   } else {
    //     // Settlement has members but this specific character doesn't exist
    //     claimLogger.warn('Character not found in existing settlement', {
    //       playerEntityId,
    //       settlementId,
    //       existingMemberCount: settlementMembers.length
    //     });
    //     return NextResponse.json(
    //       { 
    //         success: false, 
    //         error: 'Character not available or already claimed',
    //         debug: {
    //           characterError: characterError?.message,
    //           playerEntityId,
    //           settlementId,
    //           characterFound: false
    //         }
    //       },
    //       { status: 404 }
    //     );
    //   }
    // } else {
    //   character = existingCharacter;
    // }


    // // Return the claimed character data in the format expected by the UI
    // const claimedCharacter = {
    //   id: characterId,
    //   name: characterName,
    //   level: Math.max(...Object.values(profile.skills || {}).map((skill: any) => skill.level || 0), 0),
    //   profession: getTopProfession(profile.skills || {}),
    //   skills: Object.entries(profile.skills || {}).map(([name, skill]: [string, any]) => ({
    //     name,
    //     level: skill.level || 0
    //   })),
    //   settlement: settlementInfo ? {
    //     id: settlementInfo.id,
    //     name: settlementInfo.name,
    //     tier: settlementInfo.tier
    //   } : undefined,
    //   isOwner: settlementInfo?.isOwner || false,
    //   lastActive: profile.lastLoginTimestamp || new Date().toISOString(),
    //   regionName: settlementInfo?.regionName
    // };

    return NextResponse.json({
      success: true,
      data: {
        character: null,
        settlement: null
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

// Helper function to get the skill ID with the highest level
function getTopLevelSkillId(skills: Record<string, number>): string | undefined {
  if (!skills || Object.keys(skills).length === 0) {
    return undefined;
  }

  let topSkillId = '';
  let highestLevel = 0;

  for (const [skillId, level] of Object.entries(skills)) {
    if (level > highestLevel) {
      highestLevel = level;
      topSkillId = skillId;
    }
  }

  return topSkillId || undefined;
}
