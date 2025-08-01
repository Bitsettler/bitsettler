import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server-auth';
import { requireAdminAuth, logAdminAction } from '@/lib/admin-auth';

/**
 * Reset User Experience API
 * 
 * DANGER: Clears all user-specific data to reset the experience while keeping
 * BitJita settlement data intact for re-claiming. Requires admin authentication.
 */
export async function POST(request: NextRequest) {
  try {
    // 🔐 REQUIRE ADMIN AUTHENTICATION
    const admin = await requireAdminAuth(request);
    
    logAdminAction(admin, 'RESET_USER_EXPERIENCE', {
      warning: 'This action will reset all user claims and data'
    });

    console.log(`🔄 Admin ${admin.email} resetting user experience...`);

    const supabase = await createServerSupabaseClient();

    // Step 1: Clear user claims (reset supabase_user_id to NULL)
    const { data: resetMembers, error: resetError } = await supabase
      .from('settlement_members')
      .update({
        supabase_user_id: null,
        onboarding_completed_at: null,
        app_joined_at: null,
        app_last_active_at: null,
        display_name: null,
        discord_handle: null,
        bio: null,
        timezone: null,
        preferred_contact: 'discord',
        theme: 'system',
        profile_color: '#3b82f6',
        default_settlement_view: 'dashboard',
        notifications_enabled: true,
        activity_tracking_enabled: true
      })
      .not('supabase_user_id', 'is', null); // Only reset claimed characters

    if (resetError) {
      console.error('❌ Failed to reset settlement members:', resetError);
      return NextResponse.json(
        { success: false, error: 'Failed to reset character claims' },
        { status: 500 }
      );
    }

    const resetCount = resetMembers?.length || 0;
    console.log(`✅ Reset ${resetCount} character claims`);

    // Step 2: Clear user-specific data tables
    const cleanupResults = {
      calculator_saves: 0,
      user_activity: 0,
      member_contributions: 0,
      treasury_transactions: 0
    };

    // Clear calculator saves
    try {
      const { data: deletedSaves, error: savesError } = await supabase
        .from('user_calculator_saves')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records
        .select('id');

      if (!savesError) {
        cleanupResults.calculator_saves = deletedSaves?.length || 0;
      }
    } catch (err) {
      console.warn('Calculator saves table may not exist:', err);
    }

    // Clear user activity
    try {
      const { data: deletedActivity, error: activityError } = await supabase
        .from('user_activity')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records
        .select('id');

      if (!activityError) {
        cleanupResults.user_activity = deletedActivity?.length || 0;
      }
    } catch (err) {
      console.warn('User activity table may not exist:', err);
    }

    // Clear member contributions (keep the data but remove user links)
    try {
      const { data: resetContributions, error: contributionsError } = await supabase
        .from('member_contributions')
        .update({ contributor_user_id: null })
        .not('contributor_user_id', 'is', null)
        .select('id');

      if (!contributionsError) {
        cleanupResults.member_contributions = resetContributions?.length || 0;
      }
    } catch (err) {
      console.warn('Member contributions table may not exist:', err);
    }

    // Clear user-created treasury transactions (keep system ones)
    try {
      const { data: deletedTransactions, error: transactionsError } = await supabase
        .from('treasury_transactions')
        .delete()
        .not('created_by_user_id', 'is', null)
        .select('id');

      if (!transactionsError) {
        cleanupResults.treasury_transactions = deletedTransactions?.length || 0;
      }
    } catch (err) {
      console.warn('Treasury transactions table may not exist:', err);
    }

    // Step 3: Get summary of what remains (BitJita data)
    const { data: settlements, error: settlementsError } = await supabase
      .from('settlements_master')
      .select('id, name')
      .limit(5);

    const { data: allMembers, error: membersError } = await supabase
      .from('settlement_members')
      .select('id, name, settlement_id')
      .eq('is_active', true)
      .limit(10);

    const totalSettlements = settlements?.length || 0;
    const totalMembers = allMembers?.length || 0;

    console.log(`🎉 User experience reset complete!`);
    console.log(`📊 Preserved: ${totalSettlements} settlements, ${totalMembers} characters available for claiming`);

    return NextResponse.json({
      success: true,
      message: 'User experience reset successfully',
      data: {
        resetClaims: resetCount,
        cleanedData: cleanupResults,
        preserved: {
          settlements: totalSettlements,
          availableCharacters: totalMembers
        },
        instructions: 'You can now go through the settlement establishment or joining process again'
      }
    });

  } catch (error) {
    console.error('❌ Reset user experience error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during reset'
    }, { status: 500 });
  }
}