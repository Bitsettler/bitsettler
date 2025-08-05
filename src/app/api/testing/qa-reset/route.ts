import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/spacetime-db-new/shared/supabase-client';

/**
 * QA/TESTING ENDPOINT: Complete User & Claim State Reset
 * 
 * Perfect for QA testing - gives you a completely clean slate while preserving 
 * expensive-to-fetch BitJita data. Use this between test scenarios.
 * 
 * 🔒 PRESERVES (Expensive BitJita Data):
 * - settlements_master (settlement list from BitJita - expensive to re-sync)
 * - settlement_members BitJita data (skills, permissions, entity IDs, game metadata)
 * - BitJita sync timestamps and metadata
 * 
 * 🧹 COMPLETELY REMOVES (User/Test Data):
 * - ALL user accounts (auth.users) 
 * - ALL character claims (supabase_user_id = null)
 * - ALL projects and contributions
 * - ALL treasury transactions and history
 * - ALL Discord links from settlements
 * - ALL user profiles and preferences
 * - ALL onboarding/claim state
 * - ALL invite usage tracking
 * - ALL calculator saves and user activity
 * 
 * 🎯 Result: Fresh app state with all BitJita data intact
 * 
 * ⚠️ DESTRUCTIVE OPERATION - Development/Testing environments only!
 */
export async function POST(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'This endpoint is only available in development' },
        { status: 403 }
      );
    }

    // Use service role client to bypass RLS policies for admin operations
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log('🧹 Starting user data cleanup...');

    // Step 1: Clear user-created content (respect foreign key constraints)
    console.log('1️⃣ Clearing user-created content...');
    
    const { error: activityError } = await supabase
      .from('user_activity')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (activityError) console.warn('Warning: user_activity clear failed:', activityError.message);

    const { error: calculatorError } = await supabase
      .from('user_calculator_saves')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (calculatorError) console.warn('Warning: user_calculator_saves clear failed:', calculatorError.message);

    const { error: contributionsError } = await supabase
      .from('member_contributions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (contributionsError) console.warn('Warning: member_contributions clear failed:', contributionsError.message);

    const { error: projectMembersError } = await supabase
      .from('project_members')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (projectMembersError) console.warn('Warning: project_members clear failed:', projectMembersError.message);

    const { error: projectItemsError } = await supabase
      .from('project_items')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (projectItemsError) console.warn('Warning: project_items clear failed:', projectItemsError.message);

    const { error: projectsError } = await supabase
      .from('settlement_projects')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (projectsError) console.warn('Warning: settlement_projects clear failed:', projectsError.message);

    // Clear treasury transactions (user-created financial data)
    const { error: treasuryError } = await supabase
      .from('treasury_transactions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (treasuryError) console.warn('Warning: treasury_transactions clear failed:', treasuryError.message);

    // Clear settlement invite usage tracking
    const { error: inviteUsageError } = await supabase
      .from('settlement_invite_usage')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (inviteUsageError) console.warn('Warning: settlement_invite_usage clear failed:', inviteUsageError.message);

    // Clear treasury history (all historical treasury data)
    const { error: treasuryHistoryError } = await supabase
      .from('treasury_history')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (treasuryHistoryError) console.warn('Warning: treasury_history clear failed:', treasuryHistoryError.message);

    // Step 2: Clear ALL user assignments and claim state from settlement_members (preserve BitJita data)
    console.log('2️⃣ Clearing ALL user assignments and claim state...');
    
    // Debug: First check how many claimed characters exist across all settlements
    const { count: totalClaimedCount } = await supabase
      .from('settlement_members')
      .select('id', { count: 'exact' })
      .not('supabase_user_id', 'is', null);
    
    console.log(`🔍 DEBUG: Found ${totalClaimedCount || 0} claimed characters across all settlements`);
    
    // Clear ALL user assignments across ALL settlements
    const { data: updateData, error: memberUpdateError } = await supabase
      .from('settlement_members')
      .update({
        // Clear user assignment (most important)
        supabase_user_id: null,
        
        // Clear user profession choices (keep calculated top_profession from BitJita)
        primary_profession: null,
        secondary_profession: null,
        
        // Clear ALL user profile data
        display_name: null,
        discord_handle: null,
        bio: null,
        timezone: null,
        preferred_contact: null,  // Completely null, not default
        theme: null,              // Completely null, not default  
        profile_color: null,      // Completely null, not default
        
        // Clear ALL app settings 
        default_settlement_view: null,
        notifications_enabled: null,
        activity_tracking_enabled: null,
        
        // Clear ALL claim/onboarding timestamps
        app_joined_at: null,
        app_last_active_at: null,
        onboarding_completed_at: null,  // Clear onboarding state
        
        // NOTE: Preserve BitJita sync data:
        // - entity_id, claim_entity_id, player_entity_id
        // - name, skills, total_skills, highest_level, etc.
        // - inventory_permission, build_permission, officer_permission, co_owner_permission
        // - last_login_timestamp, joined_settlement_at, is_active
        // - last_synced_at, sync_source
      })
      .not('supabase_user_id', 'is', null); // Only update records that have user assignments
    
    const recordsUpdated = updateData?.length || 0;
    console.log(`✅ Updated ${recordsUpdated} settlement members (cleared all claim state)`);

    if (memberUpdateError) {
      console.error('❌ Failed to clear user assignments:', memberUpdateError);
      return NextResponse.json(
        { error: 'Failed to clear user assignments', details: memberUpdateError.message },
        { status: 500 }
      );
    }

    // Step 2b: Clear ANY remaining onboarding state (even without user assignments)
    console.log('2️⃣b Clearing any orphaned onboarding state...');
    
    const { error: onboardingClearError } = await supabase
      .from('settlement_members')
      .update({ onboarding_completed_at: null })
      .not('onboarding_completed_at', 'is', null); // Clear any remaining onboarding timestamps
    
    if (onboardingClearError) {
      console.warn('Warning: Failed to clear orphaned onboarding state:', onboardingClearError.message);
    } else {
      console.log('✅ Cleared any orphaned onboarding state');
    }

    // Step 3: Clear Supabase auth users
    console.log('3️⃣ Clearing Supabase auth users...');
    let deletedCount = 0;
    
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.warn('Warning: Could not list auth users:', listError.message);
    } else {
      
      if (users.users && users.users.length > 0) {
        console.log(`Found ${users.users.length} auth users to delete`);
        
        // Delete each user individually using admin API
        for (const user of users.users) {
          const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
          if (deleteError) {
            console.warn(`Failed to delete user ${user.id}:`, deleteError.message);
          } else {
            deletedCount++;
          }
        }
        
        console.log(`✅ Deleted ${deletedCount} auth users`);
      } else {
        console.log('No auth users found to delete');
      }
    }

    // Step 4: Clear Discord links from settlements_master
    console.log('4️⃣ Clearing Discord links from settlements...');
    
    const { error: discordClearError } = await supabase
      .from('settlements_master')
      .update({ discord_link: null })
      .not('discord_link', 'is', null); // Only update settlements that have Discord links
    
    if (discordClearError) {
      console.warn('Warning: Failed to clear Discord links:', discordClearError.message);
    } else {
      console.log('✅ Cleared all Discord links from settlements');
    }

    // Step 5: Comprehensive verification
    console.log('5️⃣ Verifying complete cleanup...');
    
    // Check settlement_members state
    const { count: totalMemberCount } = await supabase
      .from('settlement_members')
      .select('id', { count: 'exact' });
    
    const { count: claimedCount } = await supabase
      .from('settlement_members')
      .select('id', { count: 'exact' })
      .not('supabase_user_id', 'is', null);

    const { count: professionCount } = await supabase
      .from('settlement_members') 
      .select('id', { count: 'exact' })
      .or('primary_profession.not.is.null,secondary_profession.not.is.null');

    const { count: onboardingCount } = await supabase
      .from('settlement_members')
      .select('id', { count: 'exact' })
      .not('onboarding_completed_at', 'is', null);

    const { count: profileCount } = await supabase
      .from('settlement_members')
      .select('id', { count: 'exact' })
      .or('display_name.not.is.null,discord_handle.not.is.null,bio.not.is.null');

    // Check related tables
    const { count: projectCount } = await supabase
      .from('settlement_projects')
      .select('id', { count: 'exact' });

    const { count: treasuryCount } = await supabase
      .from('treasury_transactions')
      .select('id', { count: 'exact' });

    const { count: treasuryHistoryCount } = await supabase
      .from('treasury_history')
      .select('id', { count: 'exact' });

    const { count: discordLinksCount } = await supabase
      .from('settlements_master')
      .select('id', { count: 'exact' })
      .not('discord_link', 'is', null);

    const { count: authUserCount } = await supabase.auth.admin.listUsers()
      .then(result => result.data?.users?.length || 0)
      .catch(() => 0);

    console.log(`🔍 VERIFICATION RESULTS:`);
    console.log(`   Total settlement members preserved: ${totalMemberCount || 0}`);
    console.log(`   Claimed characters remaining: ${claimedCount || 0} (should be 0)`);
    console.log(`   Members with professions: ${professionCount || 0} (should be 0)`);
    console.log(`   Members with onboarding state: ${onboardingCount || 0} (should be 0)`);
    console.log(`   Members with profile data: ${profileCount || 0} (should be 0)`);
    console.log(`   Projects remaining: ${projectCount || 0} (should be 0)`);
    console.log(`   Treasury transactions remaining: ${treasuryCount || 0} (should be 0)`);
    console.log(`   Treasury history remaining: ${treasuryHistoryCount || 0} (should be 0)`);
    console.log(`   Discord links remaining: ${discordLinksCount || 0} (should be 0)`);
    console.log(`   Auth users remaining: ${authUserCount} (should be 0)`);

    console.log('✅ User data cleanup completed!');
    
    return NextResponse.json({
      success: true,
      message: 'Complete user and claim state cleanup completed',
      results: {
        settlement_members: {
          total_preserved: totalMemberCount || 0,
          claimed_remaining: claimedCount || 0,
          with_professions: professionCount || 0,
          with_onboarding_state: onboardingCount || 0,
          with_profile_data: profileCount || 0,
          records_updated: recordsUpdated
        },
        user_content: {
          projects_remaining: projectCount || 0,
          treasury_transactions_remaining: treasuryCount || 0,
          treasury_history_remaining: treasuryHistoryCount || 0,
          discord_links_remaining: discordLinksCount || 0,
          auth_users_remaining: authUserCount
        },
        verification: {
          is_clean: ((claimedCount || 0) === 0 && (professionCount || 0) === 0 && (onboardingCount || 0) === 0 && 
                     (profileCount || 0) === 0 && (projectCount || 0) === 0 && (treasuryCount || 0) === 0 && 
                     (treasuryHistoryCount || 0) === 0 && (discordLinksCount || 0) === 0 && (authUserCount || 0) === 0),
          issues: [
            ...(claimedCount > 0 ? [`${claimedCount} characters still claimed`] : []),
            ...(professionCount > 0 ? [`${professionCount} members have profession choices`] : []),
            ...(onboardingCount > 0 ? [`${onboardingCount} members have onboarding state`] : []),
            ...(profileCount > 0 ? [`${profileCount} members have profile data`] : []),
            ...(projectCount > 0 ? [`${projectCount} projects remain`] : []),
            ...(treasuryCount > 0 ? [`${treasuryCount} treasury transactions remain`] : []),
            ...(treasuryHistoryCount > 0 ? [`${treasuryHistoryCount} treasury history records remain`] : []),
            ...(discordLinksCount > 0 ? [`${discordLinksCount} settlements have Discord links`] : []),
            ...(authUserCount > 0 ? [`${authUserCount} auth users remain`] : [])
          ]
        },
        preserved: {
          settlements_master: '✅ All settlement list data preserved (expensive to re-fetch)',
          bitjita_member_data: '✅ All skills, permissions, game data preserved',
          bitjita_sync_timestamps: '✅ All sync metadata preserved'
        }
      }
    });

  } catch (error) {
    console.error('❌ Error during user data cleanup:', error);
    return NextResponse.json(
      { error: 'Failed to clear user data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}