import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server-auth';

/**
 * Onboarding Analytics API
 * 
 * Simple analytics to understand user onboarding completion rates
 * Uses the minimal tracking approach (Option A)
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

    // TODO: Add admin permission check here if needed
    // For now, any authenticated user can view analytics

    // Get analytics from the view we created
    const { data: analytics, error: analyticsError } = await supabase
      .from('onboarding_analytics')
      .select('*')
      .single();

    if (analyticsError) {
      console.error('❌ Failed to fetch onboarding analytics:', analyticsError);
      return NextResponse.json(
        { success: false, error: 'Failed to retrieve analytics' },
        { status: 500 }
      );
    }

    // Get detailed breakdown by settlement
    const { data: bySettlement, error: settlementError } = await supabase
      .from('settlement_members')
      .select(`
        settlement_id,
        COUNT(*) as total_members,
        COUNT(onboarding_completed_at) as completed_members,
        settlements_master!inner(name)
      `)
      .not('supabase_user_id', 'is', null)
      .order('completed_members', { ascending: false });

    if (settlementError) {
      console.warn('⚠️ Failed to fetch settlement breakdown:', settlementError);
    }

    // Get recent completions (last 7 days)
    const { data: recentCompletions, error: recentError } = await supabase
      .from('settlement_members')
      .select('onboarding_completed_at, name, settlement_id')
      .not('onboarding_completed_at', 'is', null)
      .gte('onboarding_completed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('onboarding_completed_at', { ascending: false })
      .limit(10);

    if (recentError) {
      console.warn('⚠️ Failed to fetch recent completions:', recentError);
    }

    return NextResponse.json({
      success: true,
      data: {
        overall: analytics,
        bySettlement: bySettlement || [],
        recentCompletions: recentCompletions || [],
        insights: {
          needsAttention: analytics?.completion_rate_percent < 50,
          avgTimeMessage: analytics?.avg_days_to_complete 
            ? `Users take an average of ${Math.round(analytics.avg_days_to_complete)} days to complete onboarding`
            : 'Not enough data for timing analysis'
        }
      }
    });

  } catch (error) {
    console.error('❌ Onboarding analytics error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}