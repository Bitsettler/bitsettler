import { NextRequest, NextResponse } from 'next/server';
import { createRequestLogger } from '@/lib/logger';
import { createServerClient } from '@/lib/spacetime-db-new/shared/supabase-client';
import { requireAuth } from '@/lib/supabase-server-auth';
import { createClient } from '@supabase/supabase-js';
import { BitJitaAPI, PlayerProfile } from '@/lib/spacetime-db-new/modules/integrations/bitjita-api';
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

      // const userLogger = logger.child({ userId: user.id });
      
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

    if (settlementId == 'solo') {
      const profileResult = await BitJitaAPI.fetchPlayerProfile(playerEntityId);
  
      if (!profileResult.success || !profileResult.data) {
        console.error('❌ Failed to fetch character profile from BitJita:', profileResult.error);
        return NextResponse.json(
          { success: false, error: 'Character not found or BitJita API error' },
          { status: 404 }
        );
      }

      const profile = profileResult.data as PlayerProfile;

      const { error: updsertError } = await serviceClient
        .from('players')
        .upsert({
          id: playerEntityId,
          name: profile.userName,
          skills: profile.skills,
          total_skills: profile.totalSkills,
          highest_level: profile.highestLevel,
          total_level: profile.totalLevel,
          total_xp: profile.totalXP,
          primary_profession: primaryProfession,
          secondary_profession: secondaryProfession,
          is_active: true,
          is_solo: true,
          is_claim: true,
          supabase_user_id: user.id,
          sync_source: 'bitjita',
          last_synced_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })
        .select()
        .single();

        if (updsertError) {
          console.error('❌ Error inserting character claim: players processing', updsertError);
          return NextResponse.json(
            { success: false, error: 'Failed to save character claim' },
            { status: 500 }
          );
        }

        return NextResponse.json({ success: true });
      }

      const { data: syncResult, error: syncError } = await supabase.functions.invoke('sync_players_by_settlement_id', {
        body: { settlementId }
      });
      
      if (syncError) {
        console.error('❌ Error syncing settlement members:', syncError);
        return NextResponse.json({ success: false, error: 'Failed to sync settlement members' }, { status: 500 });
      }

      console.log(syncResult);

      const { error: characterError } = await serviceClient
        .from('players')
        .update({
          supabase_user_id: user.id,
          claim_settlement_id: settlementId,
          primary_profession: primaryProfession,
          secondary_profession: secondaryProfession,
          last_synced_at: new Date().toISOString(),
          is_active: true,
          is_solo: false,
          is_claim: true,
        })
        .eq('id', playerEntityId)
        .select()
        .single();

      if (characterError) {
        console.error('❌ Error inserting character claim: players batch processing', characterError);
        return NextResponse.json(
          { success: false, error: 'Failed to save character claim' },
          { status: 500 }
        );
      }
      
      const { error: settlementError } = await serviceClient
        .from('settlements')
        .update({
          is_established: true
        })
        .eq('id', settlementId)
        .single();
        
      if (settlementError) {
        console.error('❌ Error updating settlement population', settlementError);
        return NextResponse.json(
          { success: false, error: 'Failed to update settlement population' },
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
