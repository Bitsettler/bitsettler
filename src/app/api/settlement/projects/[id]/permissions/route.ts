import { NextRequest, NextResponse } from 'next/server';
// import { getSupabaseSession } from '@/lib/supabase-server-auth'; // DISABLED
// import { checkProjectPermissions } from '../../../../../../lib/spacetime-db-new/modules/projects/permissions'; // DISABLED
// import { createServerClient } from '../../../../../../lib/spacetime-db-new/shared/supabase-client'; // DISABLED

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // PERMISSIONS DISABLED - Everyone has full access
  return NextResponse.json({
    success: true,
    data: {
      canEdit: true,
      canArchive: true,
      canDelete: true,
      canContribute: true,
      isOwner: true,
      isCoOwner: true
    }
  });
}