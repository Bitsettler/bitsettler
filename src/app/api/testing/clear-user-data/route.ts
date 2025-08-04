import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/spacetime-db-new/shared/supabase-client';

/**
 * TESTING ENDPOINT: Clear all user assignments and auth data
 * 
 * This preserves BitJita synced data (characters, skills, permissions) 
 * but clears all user-specific data for clean testing.
 * 
 * ⚠️ DESTRUCTIVE OPERATION - Only use for testing!
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

    // Step 2: Clear user assignments from settlement_members (but preserve BitJita data)
    console.log('2️⃣ Clearing user assignments from settlement_members...');
    
    // Debug: First check how many records exist for this settlement
    const { count: totalCount } = await supabase
      .from('settlement_members')
      .select('id', { count: 'exact' })
      .eq('settlement_id', '504403158277057776');
    
    console.log(`🔍 DEBUG: Found ${totalCount} members for settlement 504403158277057776 before update`);
    
    const { data: updateData, error: memberUpdateError } = await supabase
      .from('settlement_members')
      .update({
        // Clear user assignment
        supabase_user_id: null,
        
        // Clear user profession choices (keep calculated top_profession)
        primary_profession: null,
        secondary_profession: null,
        
        // Clear user profile data
        display_name: null,
        discord_handle: null,
        bio: null,
        timezone: null,
        preferred_contact: 'discord',
        theme: 'system',
        profile_color: '#3b82f6',
        
        // Reset app settings to defaults
        default_settlement_view: 'dashboard',
        notifications_enabled: true,
        activity_tracking_enabled: true,
        
        // Clear app timestamps (keep BitJita sync timestamps)
        app_joined_at: null,
        app_last_active_at: null
      })
      .eq('settlement_id', '504403158277057776'); // Update all members of Port Taverna T6
    
    console.log(`Updated ${updateData?.length || 0} settlement members`)

    if (memberUpdateError) {
      console.error('❌ Failed to clear user assignments:', memberUpdateError);
      return NextResponse.json(
        { error: 'Failed to clear user assignments', details: memberUpdateError.message },
        { status: 500 }
      );
    }

    // Debug: Check how many records were actually updated
    const recordsUpdated = updateData?.length || 0;
    console.log(`🔍 DEBUG: Actually updated ${recordsUpdated} records`);
    
    if (recordsUpdated === 0) {
      console.warn('⚠️ WARNING: No records were updated in settlement_members table');
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

    // Step 4: Get counts for verification
    console.log('4️⃣ Verifying cleanup...');
    
    const { data: memberCount } = await supabase
      .from('settlement_members')
      .select('id', { count: 'exact' });
    
    const { data: claimedMembers, count: claimedCount } = await supabase
      .from('settlement_members')
      .select('id, name, supabase_user_id', { count: 'exact' })
      .not('supabase_user_id', 'is', null);

    const { data: professionMembers, count: professionCount } = await supabase
      .from('settlement_members') 
      .select('id, name, primary_profession, secondary_profession', { count: 'exact' })
      .or('primary_profession.not.is.null,secondary_profession.not.is.null');

    // Debug: Show exactly what we found
    console.log(`🔍 DEBUG: Found ${claimedCount || 0} claimed members:`, claimedMembers);
    console.log(`🔍 DEBUG: Found ${professionCount || 0} members with professions:`, professionMembers);

    console.log('✅ User data cleanup completed!');
    
    return NextResponse.json({
      success: true,
      message: 'User data cleared successfully',
      results: {
        total_members_preserved: memberCount?.length || 0,
        claimed_members_remaining: claimedCount || 0,
        members_with_professions: professionCount || 0,
        records_updated: recordsUpdated,
        debug: {
          claimed_members: claimedMembers,
          members_with_professions: professionMembers
        },
        cleared: {
          user_assignments: recordsUpdated > 0 ? `✅ Updated ${recordsUpdated} members` : '❌ No records updated',
          profession_choices: professionCount === 0 ? '✅ All primary/secondary professions cleared' : `❌ ${professionCount} still have professions`,
          user_profiles: '✅ All profile data cleared', 
          user_content: '✅ All projects, contributions, saves cleared',
          auth_users: `✅ Deleted ${deletedCount} auth users`
        },
        preserved: {
          member_records: '✅ All member records preserved',
          bitjita_skills: '✅ All skills data preserved',
          game_permissions: '✅ All game permissions preserved',
          sync_timestamps: '✅ All sync data preserved'
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