import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSession } from '@/lib/supabase-server-auth';
import { createServerClient } from '../../../../../../../lib/spacetime-db-new/shared/supabase-client';
// import { checkProjectPermissions } from '../../../../../../../lib/spacetime-db-new/modules/projects/permissions'; // DISABLED
import { withErrorHandlingParams, apiSuccess, apiError, parseRequestBody } from '@/lib/api-utils';
import { Result, ErrorCodes } from '@/lib/result';
import { logger } from '@/lib/logger';

async function handleUpdateProjectItem(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
): Promise<Result<unknown>> {
  const { id: projectId, itemId } = await params;
  
  // Check authentication
  const session = await getSupabaseSession(request);
  if (!session || !session.user) {
    return apiError('Authentication required', ErrorCodes.UNAUTHENTICATED);
  }

  const supabase = createServerClient();
  if (!supabase) {
    return apiError('Database not available', ErrorCodes.OPERATION_FAILED);
  }

  // Parse request body
  const bodyResult = await parseRequestBody<{
    required_quantity: number;
  }>(request);
  
  if (!bodyResult.success) {
    return bodyResult;
  }

  const { required_quantity } = bodyResult.data;

  // Validate required quantity
  if (!Number.isInteger(required_quantity) || required_quantity < 1) {
    return apiError('Required quantity must be a positive integer', ErrorCodes.INVALID_PARAMETER);
  }

  // Set reasonable maximum to prevent overflow issues
  const MAX_QUANTITY = 999999;
  if (required_quantity > MAX_QUANTITY) {
    return apiError(`Maximum quantity is ${MAX_QUANTITY.toLocaleString()}`, ErrorCodes.INVALID_PARAMETER);
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
      .from('projects')
      .select('id')
      .eq('project_number', parseInt(projectId))
      .single();
    
    if (!project) {
      return apiError('Project not found', ErrorCodes.NOT_FOUND);
    }
    actualProjectId = project.id;
  }

  // PERMISSION CHECK DISABLED - Everyone can edit project items

  // Validate item ID format (should be UUID)
  if (!isValidUUID(itemId)) {
    return apiError('Invalid item ID format', ErrorCodes.INVALID_PARAMETER);
  }

  try {
    // First, check if the item exists and belongs to this project
    const { data: existingItem, error: fetchError } = await supabase
      .from('items')
      .select('id, item_name, project_id, required_quantity')
      .eq('id', itemId)
      .eq('project_id', actualProjectId)
      .single();

    if (fetchError || !existingItem) {
      return apiError('Item not found in this project', ErrorCodes.NOT_FOUND);
    }

    // Update the project item
    const { data: updatedItem, error: updateError } = await supabase
      .from('items')
      .update({ required_quantity })
      .eq('id', itemId)
      .eq('project_id', actualProjectId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    logger.info('Project item updated successfully', {
      operation: 'UPDATE_PROJECT_ITEM',
      projectId: actualProjectId,
      originalProjectId: projectId,
      itemId: itemId,
      itemName: existingItem.item_name,
      oldQuantity: existingItem.required_quantity,
      newQuantity: required_quantity,
      userId: session.user.id
    });

    return apiSuccess(updatedItem, 'Item updated successfully');

  } catch (error) {
    logger.error('Failed to update project item', error instanceof Error ? error : new Error(String(error)), {
      operation: 'UPDATE_PROJECT_ITEM',
      projectId: actualProjectId,
      originalProjectId: projectId,
      itemId: itemId,
      userId: session.user.id
    });
    
    return apiError('Failed to update item', ErrorCodes.OPERATION_FAILED);
  }
}

async function handleDeleteProjectItem(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
): Promise<Result<unknown>> {
  const { id: projectId, itemId } = await params;
  
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
      .from('projects')
      .select('id')
      .eq('project_number', parseInt(projectId))
      .single();
    
    if (!project) {
      return apiError('Project not found', ErrorCodes.NOT_FOUND);
    }
    actualProjectId = project.id;
  }

  // PERMISSION CHECK DISABLED - Everyone can delete project items

  // Validate item ID format (should be UUID)
  if (!isValidUUID(itemId)) {
    return apiError('Invalid item ID format', ErrorCodes.INVALID_PARAMETER);
  }

  try {
    // First, check if the item exists and belongs to this project
    const { data: existingItem, error: fetchError } = await supabase
      .from('items')
      .select('id, item_name, project_id')
      .eq('id', itemId)
      .eq('project_id', actualProjectId)
      .single();

    if (fetchError || !existingItem) {
      return apiError('Item not found in this project', ErrorCodes.NOT_FOUND);
    }

    // Delete the project item
    const { error: deleteError } = await supabase
      .from('items')
      .delete()
      .eq('id', itemId)
      .eq('project_id', actualProjectId);

    if (deleteError) {
      throw deleteError;
    }

    logger.info('Project item deleted successfully', {
      operation: 'DELETE_PROJECT_ITEM',
      projectId: actualProjectId,
      originalProjectId: projectId,
      itemId: itemId,
      itemName: existingItem.item_name,
      userId: session.user.id
    });

    return apiSuccess({ id: itemId }, 'Item deleted successfully');

  } catch (error) {
    logger.error('Failed to delete project item', error instanceof Error ? error : new Error(String(error)), {
      operation: 'DELETE_PROJECT_ITEM',
      projectId: actualProjectId,
      originalProjectId: projectId,
      itemId: itemId,
      userId: session.user.id
    });
    
    return apiError('Failed to delete item from project', ErrorCodes.OPERATION_FAILED);
  }
}

function isValidUUID(value: string): boolean {
  const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string; itemId: string }> }) {
  try {
    const result = await handleUpdateProjectItem(request, context);
    
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

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string; itemId: string }> }) {
  try {
    const result = await handleDeleteProjectItem(request, context);
    
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