import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/spacetime-db-new/shared/supabase-client';

interface ContributionResponseItem {
  id: string;
  project_id: string;
  contribution_type: 'Direct' | 'Crafted' | 'Purchased';
  delivery_method: 'Dropbox' | 'Officer Handoff' | 'Added to Building' | 'Other';
  item_name: string | null;
  quantity: number;
  notes: string | null;
  contributed_at: string;
  project?: {
    name: string;
    short_id?: string | null;
    project_number?: number | null;
    status?: string | null;
    priority?: number | null;
  } | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await params; // player_entity_id
    const { searchParams } = new URL(request.url);
    const settlementId = searchParams.get('settlementId');

    if (!settlementId) {
      return NextResponse.json(
        { success: false, error: 'Settlement ID is required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database not available' },
        { status: 503 }
      );
    }

   // Fetch contributions for this member, include basic project info
    const { data: contributions, error: contribError } = await supabase
      .from('contributions')
      .select(
        `*, projects ( name, short_id, project_number, status, priority )`
      )
      .eq('member_id', memberId)
      .order('contributed_at', { ascending: false });

    if (contribError) {
      console.error('Contributions query error:', contribError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch contributions' },
        { status: 500 }
      );
    }

    const items: ContributionResponseItem[] = (contributions || []).map((row: any) => ({
      id: row.id,
      project_id: row.project_id,
      contribution_type: row.contribution_type,
      delivery_method: row.delivery_method,
      item_name: row.item_name,
      quantity: row.quantity,
      notes: row.notes,
      contributed_at: row.contributed_at,
      project: row.projects
        ? {
            name: row.projects.name,
            short_id: row.projects.short_id ?? null,
            project_number: row.projects.project_number ?? null,
            status: row.projects.status ?? null,
            priority: row.projects.priority ?? null,
          }
        : null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        settlementId,
        memberId,
        contributions: items,
        totalCount: items.length,
      },
      meta: {
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Member contributions API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


