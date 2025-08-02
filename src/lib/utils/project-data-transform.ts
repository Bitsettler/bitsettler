/**
 * Transform project API response to match frontend expectations
 * Handles the API returning `project_items` instead of `items` and field name mismatches
 */
export function transformProjectData(apiData: any) {
  const projectData = apiData?.data || apiData;
  
  // Check if we're using the new API format (from getProjectById) or old format
  const hasNewFormat = projectData.items && projectData.contributions;
  
  if (hasNewFormat) {
    // New API format already has the correct structure, just pass it through
    return projectData;
  }
  
  // Legacy format - transform project_items to items
  return {
    ...projectData,
    items: (projectData.project_items || []).map((item: any) => ({
      id: item.id,
      projectId: projectData.id,
      itemName: item.item_name,
      requiredQuantity: item.required_quantity,
      currentQuantity: item.current_quantity,
      tier: item.tier,
      priority: item.priority,
      rankOrder: item.rank_order || 0,
      status: item.status || 'Needed',
      assignedMemberId: null, // assigned_member_id column doesn't exist in project_items table
      notes: item.notes,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at)
    })),
    totalItems: projectData.project_items?.length || 0,
    completedItems: (projectData.project_items || []).filter((item: any) => item.status === 'Completed').length,
    completionPercentage: projectData.project_items?.length > 0 
      ? Math.round(((projectData.project_items || []).filter((item: any) => item.status === 'Completed').length / projectData.project_items.length) * 100)
      : 0
  };
}