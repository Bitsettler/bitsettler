/**
 * Project permissions and authorization logic
 */

import { getSupabaseSession } from '@/lib/supabase-server-auth';
import { createServerClient } from '../../shared/supabase-client';
import { type ProjectWithItems } from './commands/get-all-projects';

export interface ProjectPermissions {
  canEdit: boolean;
  canArchive: boolean;
  canDelete: boolean;
  canContribute: boolean;
  isOwner: boolean;
  isCoOwner: boolean;
}

/**
 * Check if a user has permission to perform actions on a project
 */
export async function checkProjectPermissions(
  projectId: string,
  userId: string,
  userEmail?: string
): Promise<ProjectPermissions> {
  const supabase = createServerClient();
  
  if (!supabase) {
    return {
      canEdit: false,
      canArchive: false,
      canDelete: false,
      canContribute: false,
      isOwner: false,
      isCoOwner: false
    };
  }

  try {
    // Get project details
    const { data: project, error: projectError } = await supabase
      .from('settlement_projects')
      .select('created_by_member_id, id, status')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      throw new Error('Project not found');
    }

    // Get the current user's member record to check ownership
    const { data: userMember, error: memberError } = await supabase
      .from('settlement_members')
      .select('id')
      .eq('auth_user_id', userId)
      .single();

    // Check if user is the project owner (by member ID)
    const isOwner = userMember && project.created_by_member_id === userMember.id;

    // Get user's settlement member info for co-owner status
    let isCoOwner = false;
    
    if (userEmail) {
      const { data: member, error: memberError } = await supabase
        .from('settlement_members')
        .select('co_owner_permission, officer_permission')
        .eq('supabase_user_id', userId)
        .single();

      if (!memberError && member) {
        isCoOwner = Boolean(member.co_owner_permission);
      }
    }

    // Define permissions based on ownership and role
    const canEdit = true; // Allow all settlement members to edit projects
    const canArchive = isOwner || isCoOwner;
    const canDelete = isOwner || isCoOwner;
    const canContribute = true; // Anyone can contribute to active projects

    return {
      canEdit,
      canArchive,
      canDelete,
      canContribute,
      isOwner,
      isCoOwner
    };

  } catch (error) {
    console.error('Error checking project permissions:', error);
    return {
      canEdit: false,
      canArchive: false,
      canDelete: false,
      canContribute: false,
      isOwner: false,
      isCoOwner: false
    };
  }
}

/**
 * Check if user can perform a specific action on a project
 */
export async function canUserEditProject(projectId: string, userId: string, userEmail?: string): Promise<boolean> {
  const permissions = await checkProjectPermissions(projectId, userId, userEmail);
  return permissions.canEdit;
}

export async function canUserDeleteProject(projectId: string, userId: string, userEmail?: string): Promise<boolean> {
  const permissions = await checkProjectPermissions(projectId, userId, userEmail);
  return permissions.canDelete;
}

/**
 * Get user's settlement member info including permissions
 */
export async function getUserSettlementPermissions(userId: string): Promise<{
  isCoOwner: boolean;
  isOfficer: boolean;
  memberId: string | null;
}> {
  const supabase = createServerClient();
  
  if (!supabase) {
    return { isCoOwner: false, isOfficer: false, memberId: null };
  }

  try {
    const { data: member, error } = await supabase
      .from('settlement_members')
      .select('id, co_owner_permission, officer_permission')
      .eq('supabase_user_id', userId)
      .single();

    if (error || !member) {
      return { isCoOwner: false, isOfficer: false, memberId: null };
    }

    return {
      isCoOwner: Boolean(member.co_owner_permission),
      isOfficer: Boolean(member.officer_permission),
      memberId: member.id
    };
    
  } catch (error) {
    console.error('Error getting user settlement permissions:', error);
    return { isCoOwner: false, isOfficer: false, memberId: null };
  }
}