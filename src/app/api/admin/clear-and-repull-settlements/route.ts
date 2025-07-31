import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server-auth';

/**
 * Clear and Repull Settlements API
 * 
 * Completely clears all settlement data from the database and re-imports
 * everything fresh from BitJita API
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🗑️ Admin clearing and repulling settlements...');

    // TODO: Add proper admin authentication before production use

    const supabase = await createServerSupabaseClient();

    const startTime = Date.now();
    const deletionResults = {
      user_activity: 0,
      user_calculator_saves: 0,
      member_contributions: 0,
      project_members: 0,
      project_items: 0,
      treasury_transactions: 0,
      settlement_projects: 0,
      settlement_members: 0,
      skill_names: 0,
      settlements_master: 0
    };

    // Step 1: Delete in correct order to respect foreign key constraints
    console.log('🗑️ Clearing all settlement data...');

    // Clear user-related tables first
    try {
      const { data: deletedActivity, error: activityError } = await supabase
        .from('user_activity')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records
        .select('id');
      
      if (!activityError) {
        deletionResults.user_activity = deletedActivity?.length || 0;
      }
    } catch (err) {
      console.warn('User activity table may not exist:', err);
    }

    try {
      const { data: deletedSaves, error: savesError } = await supabase
        .from('user_calculator_saves')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records
        .select('id');
      
      if (!savesError) {
        deletionResults.user_calculator_saves = deletedSaves?.length || 0;
      }
    } catch (err) {
      console.warn('Calculator saves table may not exist:', err);
    }

    try {
      const { data: deletedContributions, error: contributionsError } = await supabase
        .from('member_contributions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records
        .select('id');
      
      if (!contributionsError) {
        deletionResults.member_contributions = deletedContributions?.length || 0;
      }
    } catch (err) {
      console.warn('Member contributions table may not exist:', err);
    }

    try {
      const { data: deletedProjectMembers, error: projectMembersError } = await supabase
        .from('project_members')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records
        .select('id');
      
      if (!projectMembersError) {
        deletionResults.project_members = deletedProjectMembers?.length || 0;
      }
    } catch (err) {
      console.warn('Project members table may not exist:', err);
    }

    try {
      const { data: deletedProjectItems, error: projectItemsError } = await supabase
        .from('project_items')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records
        .select('id');
      
      if (!projectItemsError) {
        deletionResults.project_items = deletedProjectItems?.length || 0;
      }
    } catch (err) {
      console.warn('Project items table may not exist:', err);
    }

    try {
      const { data: deletedTransactions, error: transactionsError } = await supabase
        .from('treasury_transactions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records
        .select('id');
      
      if (!transactionsError) {
        deletionResults.treasury_transactions = deletedTransactions?.length || 0;
      }
    } catch (err) {
      console.warn('Treasury transactions table may not exist:', err);
    }

    // Clear settlement-related tables
    try {
      const { data: deletedProjects, error: projectsError } = await supabase
        .from('settlement_projects')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records
        .select('id');
      
      if (!projectsError) {
        deletionResults.settlement_projects = deletedProjects?.length || 0;
      }
    } catch (err) {
      console.warn('Settlement projects table may not exist:', err);
    }

    try {
      const { data: deletedMembers, error: membersError } = await supabase
        .from('settlement_members')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records
        .select('id');
      
      if (!membersError) {
        deletionResults.settlement_members = deletedMembers?.length || 0;
      }
    } catch (err) {
      console.warn('Settlement members table may not exist:', err);
    }

    try {
      const { data: deletedSkills, error: skillsError } = await supabase
        .from('skill_names')
        .delete()
        .neq('skill_id', 'impossible-skill-id') // Delete all records
        .select('skill_id');
      
      if (!skillsError) {
        deletionResults.skill_names = deletedSkills?.length || 0;
      }
    } catch (err) {
      console.warn('Skill names table may not exist:', err);
    }

    // Finally clear the master settlements table
    console.log('🗑️ Clearing settlements_master table...');
    try {
      const { data: deletedSettlements, error: settlementsError } = await supabase
        .from('settlements_master')
        .delete()
        .neq('id', 'impossible-settlement-id') // Delete all records
        .select('id');

      if (settlementsError) {
        console.error('❌ Failed to clear settlements_master:', settlementsError);
        console.error('Error details:', JSON.stringify(settlementsError, null, 2));
        
        // If settlements_master doesn't exist, that's okay - continue anyway
        if (settlementsError.code === 'PGRST116' || settlementsError.message?.includes('does not exist')) {
          console.log('📝 settlements_master table does not exist, skipping...');
          deletionResults.settlements_master = 0;
        } else {
          return NextResponse.json(
            { success: false, error: `Failed to clear settlements data: ${settlementsError.message}` },
            { status: 500 }
          );
        }
      } else {
        deletionResults.settlements_master = deletedSettlements?.length || 0;
        console.log(`✅ Cleared ${deletionResults.settlements_master} settlements from settlements_master`);
      }
    } catch (err) {
      console.error('❌ Exception when clearing settlements_master:', err);
      console.warn('settlements_master table may not exist:', err);
      deletionResults.settlements_master = 0;
    }

    const deletionTime = Date.now() - startTime;
    console.log(`✅ Database cleared in ${deletionTime}ms`);
    console.log('📊 Deletion results:', deletionResults);

    // Step 2: Re-import settlements from BitJita
    console.log('🔄 Starting fresh import from BitJita...');
    console.log('⚠️  Note: This will hit BitJita API with ~25 requests for 2,300+ settlements');
    
    const importStartTime = Date.now();
    
    // Call the existing sync-settlements API
    const syncResponse = await fetch(`${request.nextUrl.origin}/api/settlement/sync`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '' // Forward cookies for auth
      },
      body: JSON.stringify({ 
        operation: 'master',
        mode: 'full',
        triggeredBy: 'admin_clear_and_repull'
      })
    });

    const syncResult = await syncResponse.json();
    const importTime = Date.now() - importStartTime;

    if (!syncResult.success) {
      console.error('❌ Failed to re-import settlements:', syncResult.error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database cleared but re-import failed: ' + syncResult.error,
          deletionResults 
        },
        { status: 500 }
      );
    }

    const totalTime = Date.now() - startTime;

    console.log(`🎉 Clear and repull complete! Total time: ${totalTime}ms`);

    return NextResponse.json({
      success: true,
      message: 'Settlements cleared and repulled successfully',
      data: {
        deletionResults,
        importResults: syncResult.data,
        timing: {
          deletionTimeMs: deletionTime,
          importTimeMs: importTime,
          totalTimeMs: totalTime
        }
      }
    });

  } catch (error) {
    console.error('❌ Clear and repull error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during clear and repull'
    }, { status: 500 });
  }
}