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
      
      // if (shouldRateLimit(request)) {
      //   const rateLimitCheck = await characterClaimRateLimit(user.id)(request);
      //   if (!rateLimitCheck.allowed && rateLimitCheck.response) {
      //     userLogger.warn('Rate limit exceeded for character claiming');
      //     return rateLimitCheck.response;
      //   }
      // }
         
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

    const { playerEntityId, primaryProfession, secondaryProfession, settlementId } = validationResult.data as {
      playerEntityId: string;
      primaryProfession: string;
      secondaryProfession: string;
      settlementId: string;
    };

    // Fetch character details from BitJita API to verify it exists and get current data
    const profileResult = await BitJitaAPI.fetchPlayerProfile(playerEntityId);
    
    if (!profileResult.success || !profileResult.data) {
      console.error('❌ Failed to fetch character profile from BitJita:', profileResult.error);
      return NextResponse.json(
        { success: false, error: 'Character not found or BitJita API error' },
        { status: 404 }
      );
    }

    const profile = profileResult.data as any;
    

    if (settlementId == 'solo') {
      const default_settlement_id = profile.settlements[0].entityId;
      const data = await BitJitaAPI.fetchSettlementUsers(default_settlement_id);
      const membersData = data.data?.users.filter((member: any) => member.playerEntityId === playerEntityId)[0];

      if (membersData) {
        const { error: createError } = await serviceClient
          .from('settlement_members')
          .upsert({
            player_entity_id: playerEntityId,
            name: membersData.userName,
            skills: membersData.skills,
            total_skills: membersData.totalSkills,
            highest_level: membersData.highestLevel,
            total_level: membersData.totalLevel,
            total_xp: membersData.totalXP,
            top_profession: getTopProfession(membersData.skills || {}),
            primary_profession: primaryProfession,
            secondary_profession: secondaryProfession,
            is_active: true,
            is_solo: true,
            supabase_user_id: user.id,
            sync_source: 'manual_creation',
            last_synced_at: new Date().toISOString()
          }, {
            onConflict: 'player_entity_id'
          })
          .select()
          .single();

        if (createError) {
          console.error('❌ Error inserting character claim: settlement_members processing', createError);
          return NextResponse.json(
            { success: false, error: 'Failed to save character claim' },
            { status: 500 }
          );
        }

        return NextResponse.json({ success: true });
      }
    }

    const data = await BitJitaAPI.fetchSettlementUsers(settlementId);
    if (data.success && data.data) {
      const membersData = data.data.users.map((member: any) => {
        return {
          player_entity_id: member.playerEntityId,
          name: member.userName,
          skills: member.skills,
          total_skills: member.totalSkills,
          highest_level: member.highestLevel,
          total_level: member.totalLevel,
          total_xp: member.totalXP,
          top_profession: getTopLevelSkillId(member.skills),
          last_synced_at: new Date().toISOString()
        }
      });

      const { error: characterError } = await serviceClient
        .from('settlement_members')
        .upsert(membersData, {
          onConflict: 'player_entity_id'
        })
        .select();

      if (characterError) {
        console.error('❌ Error inserting character claim: settlement_members batch processing', characterError);
        return NextResponse.json(
          { success: false, error: 'Failed to save character claim' },
          { status: 500 }
        );
      }

      const settltmentMembersShip = data.data.users.map((member: any) => ({
        player_entity_id: member.playerEntityId,
        settlement_id: settlementId,
        is_claim: member.playerEntityId === playerEntityId ? true : false,
        is_owner: member.coOwnerPermission === 1 ? true : false,
        inventory_permission: member.inventoryPermission,
        build_permission: member.buildPermission,
        officer_permission: member.officerPermission,
        co_owner_permission: member.coOwnerPermission,
      }));

      const { error: characterMemberError } = await serviceClient
        .from('settlement_members_memberships')
        .upsert(settltmentMembersShip, {
          onConflict: 'player_entity_id, settlement_id'
        })
        .select();

      if (characterMemberError) {
        console.error('❌ Error inserting character claim: settlement_members_memberships processing', characterMemberError);
        return NextResponse.json(
          { success: false, error: 'Failed to save character claim' },
          { status: 500 }
        );
      }
    }

    const { error: createError } = await serviceClient
      .from('settlement_members')
      .update({
        is_active: true,
        is_solo: false,
        supabase_user_id: user.id,
        sync_source: 'manual_creation',
        last_synced_at: new Date().toISOString(),
        primary_profession: primaryProfession,
        secondary_profession: secondaryProfession,
      })
      .eq('player_entity_id', playerEntityId)
      .select()
      .single();

    if (createError) {
      console.error('❌ Error inserting character claim: settlement_members processing', createError);
      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to create character for new settlement: ${createError.message}`
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

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
