import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, requireAuth } from '@/lib/supabase-server-auth';

/**
 * Settlement Establishment API
 * 
 * Flow:
 * 1. User selects settlement from BitJita search
 * 2. API fetches settlement data from BitJita
 * 3. Creates settlement in settlements_master table
 * 4. Generates unique invite code for the settlement
 * 5. Fetches and stores all member data
 * 6. Returns invite code + available characters for user to claim
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
    const { settlementId, settlementName } = body;

    if (!settlementId || !settlementName) {
      return NextResponse.json(
        { success: false, error: 'settlementId and settlementName are required' },
        { status: 400 }
      );
    }

    console.log(`🏛️ Establishing settlement: ${settlementName} (${settlementId})`);

    // 1. Check if settlement already exists
    const { data: existingSettlement } = await supabase
      .from('settlements_master')
      .select('id, name, invite_code')
      .eq('id', settlementId)
      .single();

    if (existingSettlement) {
      console.log(`✅ Settlement already exists: ${existingSettlement.name}`);
      
      // Settlement exists, so get the available characters from our database
      try {
        // Fetch settlement member data from OUR database (not BitJita)
        const membersResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/settlement/members?settlementId=${settlementId}`);
        const membersResult = await membersResponse.json();
        
        if (membersResult.success && membersResult.data.members) {
          const availableCharacters = membersResult.data.members
            // All members from our database are already unclaimed (filtered in API)
            .map((member: any) => ({
              id: member.entity_id,
              name: member.name || 'Unknown Character',
              settlement_id: member.settlement_id,
              entity_id: member.entity_id,
              bitjita_user_id: member.bitjita_user_id,
              skills: member.skills || {},
              top_profession: member.top_profession || 'Unknown',
              total_level: member.total_level || 0,
              permissions: {
                inventory: Boolean(member.inventory_permission),
                build: Boolean(member.build_permission),
                officer: Boolean(member.officer_permission),
                co_owner: Boolean(member.co_owner_permission)
              }
            }));

          return NextResponse.json({
            success: true,
            message: 'Settlement already established - proceed to claim character',
            data: {
              settlement: existingSettlement,
              inviteCode: existingSettlement.invite_code,
              availableCharacters
            }
          });
        }
      } catch (fetchError) {
        console.error('❌ Failed to fetch character data from database for existing settlement:', fetchError);
      }
      
      // Fallback if database fetch fails
      return NextResponse.json({
        success: true,
        message: 'Settlement already established',
        data: {
          settlement: existingSettlement,
          inviteCode: existingSettlement.invite_code,
          availableCharacters: []
        }
      });
    }

    // 2. Create settlement in settlements_master table
    const { data: settlement, error: settlementError } = await supabase
      .from('settlements_master')
      .insert({
        id: settlementId,
        name: settlementName,
        tier: 0, // Will be updated when we fetch from BitJita
        treasury: 0,
        supplies: 0,
        tiles: 0,
        population: 0,
        name_normalized: settlementName.toLowerCase(),
        name_searchable: settlementName,
        is_active: true,
        sync_source: 'establishment',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (settlementError) {
      console.error('❌ Failed to create settlement:', settlementError);
      return NextResponse.json(
        { success: false, error: 'Failed to create settlement in database' },
        { status: 500 }
      );
    }

    // 3. Generate invite code using database function
    const { data: inviteCodeResult, error: codeError } = await supabase
      .rpc('create_settlement_invite_code', {
        p_settlement_id: settlementId,
        p_generated_by: user.id
      });

    if (codeError || !inviteCodeResult) {
      console.error('❌ Failed to generate invite code:', codeError);
      return NextResponse.json(
        { success: false, error: 'Failed to generate invite code' },
        { status: 500 }
      );
    }

    console.log(`✅ Generated invite code: ${inviteCodeResult}`);

    // 4. Fetch real settlement data from BitJita API
    console.log(`🔍 Fetching settlement members from BitJita for ${settlementId}...`);
    
    let members: any[] = [];
    
    try {
      // Use our internal roster API which calls BitJita
      const rosterResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/settlement/roster?settlementId=${settlementId}`);
      const rosterResult = await rosterResponse.json();

      if (rosterResult.success && rosterResult.data.members) {
        const memberData = rosterResult.data.members.map((member: any) => ({
          settlement_id: settlementId,
          entity_id: member.entity_id,
          claim_entity_id: member.claim_entity_id,
          player_entity_id: member.player_entity_id,
          bitjita_user_id: member.bitjita_user_id,
          name: member.name,
          skills: member.skills || {},
          total_skills: member.total_skills || 0,
          highest_level: member.highest_level || 0,
          total_level: member.total_level || 0,
          total_xp: member.total_xp || 0,
          top_profession: member.top_profession || 'Unknown',
          inventory_permission: member.inventory_permission || 0,
          build_permission: member.build_permission || 0,
          officer_permission: member.officer_permission || 0,
          co_owner_permission: member.co_owner_permission || 0,
          last_login_timestamp: member.last_login_timestamp,
          joined_settlement_at: member.joined_settlement_at,
          is_active: true,
          last_synced_at: new Date(),
          sync_source: 'establishment'
        }));

        console.log(`👥 Importing ${memberData.length} members from BitJita...`);

        // 5. Insert member data
        const { data: insertedMembers, error: membersError } = await supabase
          .from('settlement_members')
          .insert(memberData)
          .select();

        if (membersError) {
          console.error('❌ Failed to insert member data:', membersError);
          console.warn('⚠️ Settlement created but member data failed to insert');
        } else {
          members = insertedMembers || [];
          console.log(`✅ Successfully imported ${members.length} members`);
        }
      } else {
        console.warn('⚠️ No member data available from BitJita, settlement created without members');
      }
    } catch (memberError) {
      console.error('❌ Failed to fetch members from BitJita:', memberError);
      console.warn('⚠️ Settlement created but member import failed');
    }

    // 6. Get the updated settlement with invite code
    const { data: finalSettlement, error: fetchError } = await supabase
      .from('settlements_master')
      .select('*')
      .eq('id', settlementId)
      .single();

    if (fetchError) {
      console.error('❌ Failed to fetch final settlement:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Settlement created but failed to retrieve' },
        { status: 500 }
      );
    }

    console.log(`🎉 Settlement established successfully: ${settlementName}`);
    console.log(`📋 Invite code: ${inviteCodeResult}`);
    console.log(`👥 Members imported: ${members?.length || 0}`);

    // Transform member data to match frontend expectations
    const transformedCharacters = (members || []).map((member: any) => ({
      id: member.entity_id,
      name: member.name,
      settlement_id: member.settlement_id,
      entity_id: member.entity_id,
      bitjita_user_id: member.bitjita_user_id,
      skills: member.skills || {},
      top_profession: member.top_profession || 'Unknown',
      total_level: member.total_level || 0,
      permissions: {
        inventory: Boolean(member.inventory_permission),
        build: Boolean(member.build_permission),
        officer: Boolean(member.officer_permission),
        co_owner: Boolean(member.co_owner_permission)
      }
    }));

    return NextResponse.json({
      success: true,
      message: `Settlement ${settlementName} established successfully`,
      data: {
        settlement: finalSettlement,
        inviteCode: inviteCodeResult,
        availableCharacters: transformedCharacters,
        membersImported: members?.length || 0
      }
    });

  } catch (error) {
    console.error('❌ Settlement establishment error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during settlement establishment'
    }, { status: 500 });
  }
}