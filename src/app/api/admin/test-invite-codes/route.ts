import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server-auth';

/**
 * Test Invite Code Generation API
 * 
 * Creates test settlements and verifies invite code uniqueness
 * Useful for testing the bulk generation functions
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('🧪 Testing invite code generation...');

    // Create test settlements without invite codes
    const testSettlements = [
      {
        id: 'test_settlement_1',
        name: 'Test Settlement Alpha',
        tier: 1,
        is_active: true,
        sync_source: 'test'
      },
      {
        id: 'test_settlement_2', 
        name: 'Test Settlement Beta',
        tier: 2,
        is_active: true,
        sync_source: 'test'
      },
      {
        id: 'test_settlement_3',
        name: 'Test Settlement Gamma', 
        tier: 1,
        is_active: true,
        sync_source: 'test'
      }
    ];

    // Insert test settlements (or update if they exist)
    const { data: settlements, error: insertError } = await supabase
      .from('settlements_master')
      .upsert(testSettlements, { onConflict: 'id' })
      .select();

    if (insertError) {
      console.error('❌ Failed to create test settlements:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to create test settlements' },
        { status: 500 }
      );
    }

    console.log(`✅ Created ${settlements.length} test settlements`);

    // Generate invite codes using bulk function
    const { data: bulkResult, error: bulkError } = await supabase
      .rpc('generate_bulk_invite_codes', {
        p_batch_size: 10,
        p_generated_by: `test_user_${session.user.id}`
      });

    if (bulkError) {
      console.error('❌ Bulk generation failed:', bulkError);
      return NextResponse.json(
        { success: false, error: 'Bulk generation failed' },
        { status: 500 }
      );
    }

    // Get final state of test settlements
    const { data: finalSettlements, error: fetchError } = await supabase
      .from('settlements_master')
      .select('id, name, invite_code, invite_code_generated_at')
      .in('id', testSettlements.map(s => s.id));

    if (fetchError) {
      console.error('❌ Failed to fetch final settlements:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch results' },
        { status: 500 }
      );
    }

    // Check for uniqueness
    const inviteCodes = finalSettlements
      .filter(s => s.invite_code)
      .map(s => s.invite_code);
    
    const uniqueCodes = new Set(inviteCodes);
    const allUnique = inviteCodes.length === uniqueCodes.size;

    console.log('🔍 Test Results:');
    console.log(`   📝 Settlements created: ${settlements.length}`);
    console.log(`   📋 Invite codes generated: ${inviteCodes.length}`);
    console.log(`   ✅ All codes unique: ${allUnique}`);
    console.log(`   📊 Generated codes: ${inviteCodes.join(', ')}`);

    return NextResponse.json({
      success: true,
      message: 'Invite code test completed',
      data: {
        settlementsCreated: settlements.length,
        inviteCodesGenerated: inviteCodes.length,
        allCodesUnique: allUnique,
        generatedCodes: inviteCodes,
        bulkResults: bulkResult,
        settlements: finalSettlements
      }
    });

  } catch (error) {
    console.error('❌ Test invite codes error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during test'
    }, { status: 500 });
  }
}

/**
 * DELETE: Clean up test settlements
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Delete test settlements
    const { error } = await supabase
      .from('settlements_master')
      .delete()
      .eq('sync_source', 'test');

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to clean up test settlements' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Test settlements cleaned up'
    });

  } catch (error) {
    console.error('❌ Clean up test settlements error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during cleanup'
    }, { status: 500 });
  }
}