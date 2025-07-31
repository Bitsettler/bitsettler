import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server-auth';

/**
 * Bulk Invite Code Generation API
 * 
 * Used for:
 * - Initial bulk import of settlements from BitJita
 * - Fixing settlements that don't have invite codes
 * - Ensuring all active settlements have unique codes
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

    // TODO: Add admin permission check here
    // For now, any authenticated user can trigger bulk generation

    const body = await request.json();
    const { batchSize = 100 } = body;

    console.log('🔄 Starting bulk invite code generation...');

    // Use the database function to generate codes for all settlements missing them
    const { data: result, error } = await supabase
      .rpc('ensure_all_settlements_have_invite_codes');

    if (error) {
      console.error('❌ Bulk invite code generation failed:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to generate invite codes' },
        { status: 500 }
      );
    }

    const stats = result[0];

    console.log('✅ Bulk invite code generation completed:');
    console.log(`   📊 Total settlements: ${stats.total_settlements}`);
    console.log(`   🔍 Settlements needing codes: ${stats.settlements_needing_codes}`);
    console.log(`   ✅ Codes generated: ${stats.codes_generated}`);
    console.log(`   ❌ Failed generations: ${stats.failed_generations}`);

    return NextResponse.json({
      success: true,
      message: 'Bulk invite code generation completed',
      data: {
        totalSettlements: stats.total_settlements,
        settlementsNeedingCodes: stats.settlements_needing_codes,
        codesGenerated: stats.codes_generated,
        failedGenerations: stats.failed_generations,
        completionRate: stats.settlements_needing_codes > 0 
          ? Math.round((stats.codes_generated / stats.settlements_needing_codes) * 100)
          : 100
      }
    });

  } catch (error) {
    console.error('❌ Bulk invite code generation error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during bulk generation'
    }, { status: 500 });
  }
}

/**
 * GET: Check how many settlements need invite codes
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Count settlements without invite codes
    const { data: stats, error } = await supabase
      .from('settlements_master')
      .select('invite_code, is_active')
      .eq('is_active', true);

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to check settlement codes' },
        { status: 500 }
      );
    }

    const totalSettlements = stats.length;
    const settlementsWithCodes = stats.filter(s => s.invite_code).length;
    const settlementsNeedingCodes = totalSettlements - settlementsWithCodes;

    return NextResponse.json({
      success: true,
      data: {
        totalSettlements,
        settlementsWithCodes,
        settlementsNeedingCodes,
        completionRate: totalSettlements > 0 
          ? Math.round((settlementsWithCodes / totalSettlements) * 100)
          : 100,
        needsGeneration: settlementsNeedingCodes > 0
      }
    });

  } catch (error) {
    console.error('❌ Check invite codes error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}