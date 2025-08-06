import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSession } from '@/lib/supabase-server-auth';
import { createServerClient } from '../../../../../../lib/spacetime-db-new/shared/supabase-client';
import { checkProjectPermissions } from '../../../../../../lib/spacetime-db-new/modules/projects/permissions';
import { withErrorHandlingParams, parseRequestBody, apiSuccess, apiError } from '@/lib/api-utils';
import { Result, ErrorCodes } from '@/lib/result';
import { logger } from '@/lib/logger';

interface AddProjectItemData {
  itemName: string;
  requiredQuantity: number;
  notes?: string;
  priority?: number;
  tier?: number;
}

async function handleAddProjectItem(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Result<unknown>> {
  const { id: projectId } = await params;
  
  // Check authentication
  const session = await getSupabaseSession(request);
  if (!session || !session.user) {
    return apiError('Authentication required', ErrorCodes.UNAUTHENTICATED);
  }

  const supabase = createServerClient();
  if (!supabase) {
    return apiError('Database not available', ErrorCodes.OPERATION_FAILED);
  }

  // First, resolve the project ID to get the actual UUID for permissions
  let actualProjectId = projectId;
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId);
  const isProjectNumber = /^\d+$/.test(projectId);
  
  if (!isUUID && !isProjectNumber) {
    return apiError('Invalid project ID format', ErrorCodes.INVALID_PARAMETER);
  }

  if (isProjectNumber) {
    const { data: project } = await supabase
      .from('settlement_projects')
      .select('id')
      .eq('project_number', parseInt(projectId))
      .single();
    
    if (!project) {
      return apiError('Project not found', ErrorCodes.NOT_FOUND);
    }
    actualProjectId = project.id;
  }

  // Check permissions using the actual UUID
  const permissions = await checkProjectPermissions(actualProjectId, session.user.id, session.user.email);
  if (!permissions.canEdit) {
    return apiError('You do not have permission to add items to this project', ErrorCodes.FORBIDDEN);
  }

  // Parse request body
  const bodyResult = await parseRequestBody<AddProjectItemData>(request);
  if (!bodyResult.success) {
    return bodyResult;
  }

  const itemData = bodyResult.data;

  // Validate required fields
  if (!itemData.itemName?.trim()) {
    return apiError('Item name is required', ErrorCodes.INVALID_PARAMETER);
  }

  if (!itemData.requiredQuantity || itemData.requiredQuantity < 1) {
    return apiError('Required quantity must be at least 1', ErrorCodes.INVALID_PARAMETER);
  }

  try {
    // Insert the project item
    const { data: newItem, error } = await supabase
      .from('project_items')
      .insert({
        project_id: actualProjectId,
        item_name: itemData.itemName.trim(),
        required_quantity: itemData.requiredQuantity,
        current_quantity: 0,
        tier: Math.max(1, Math.min(10, itemData.tier || 1)), // Support tiers 1-10 to match brico's system
        priority: Math.max(1, Math.min(5, itemData.priority || 3)),
        rank_order: 0,
        status: 'Needed',
        notes: itemData.notes?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    logger.info('Project item added successfully', {
      operation: 'ADD_PROJECT_ITEM',
      projectId: actualProjectId,
      originalProjectId: projectId,
      itemId: newItem.id,
      itemName: itemData.itemName,
      userId: session.user.id
    });

    return apiSuccess(newItem, 'Item added successfully');

  } catch (error) {
    logger.error('Failed to add project item', error instanceof Error ? error : new Error(String(error)), {
      operation: 'ADD_PROJECT_ITEM',
      projectId: actualProjectId,
      originalProjectId: projectId,
      userId: session.user.id,
      itemData
    });
    
    return apiError('Failed to add item to project', ErrorCodes.OPERATION_FAILED);
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const result = await handleAddProjectItem(request, context);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        code: result.code
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}