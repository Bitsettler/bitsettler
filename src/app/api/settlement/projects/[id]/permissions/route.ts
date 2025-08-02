import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSession } from '@/lib/supabase-server-auth';
import { checkProjectPermissions } from '../../../../../../lib/spacetime-db-new/modules/projects/permissions';
import { createServerClient } from '../../../../../../lib/spacetime-db-new/shared/supabase-client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 Permissions API called for project:', params.id);
    
    // Check authentication
    const session = await getSupabaseSession(request);
    if (!session || !session.user) {
      console.log('❌ No session found');
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('✅ Session found for user:', session.user.email);

    // Handle both UUID and short_id formats like the main project route
    let actualProjectId = params.id;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id);
    const isShortId = /^proj_[a-z0-9]{6}$/i.test(params.id);
    
    if (!isUUID && !isShortId) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID format' },
        { status: 400 }
      );
    }

    if (isShortId) {
      const supabase = createServerClient();
      if (supabase) {
        const { data: project } = await supabase
          .from('settlement_projects')
          .select('id')
          .eq('short_id', params.id)
          .single();
        
        if (!project) {
          return NextResponse.json(
            { success: false, error: 'Project not found' },
            { status: 404 }
          );
        }
        actualProjectId = project.id;
      }
    }

    // Use the same real permission checking as the DELETE route
    const permissions = await checkProjectPermissions(
      actualProjectId, 
      session.user.id, 
      session.user.email
    );

    console.log('✅ Real permissions for project:', actualProjectId, 'User:', session.user.email, 'Permissions:', permissions);
    
    return NextResponse.json({
      success: true,
      data: permissions
    });

  } catch (error) {
    console.error('❌ Error in permissions API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check permissions' },
      { status: 500 }
    );
  }
}