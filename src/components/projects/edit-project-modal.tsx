'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Trash2, Archive, Save, AlertTriangle } from 'lucide-react';
import { type ProjectWithItems } from '@/lib/spacetime-db-new/modules';

interface EditProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectWithItems | null;
  onProjectUpdated: () => void;
  onProjectDeleted: () => void;
  userPermissions: {
    canEdit: boolean;
    canArchive: boolean;
    canDelete: boolean;
    isOwner: boolean;
    isCoOwner: boolean;
  };
}

export function EditProjectModal({ 
  open, 
  onOpenChange, 
  project, 
  onProjectUpdated, 
  onProjectDeleted,
  userPermissions 
}: EditProjectModalProps) {
  const { data: session } = useSession();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'Active' as 'Active' | 'Completed' | 'Cancelled',
    priority: 3
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Initialize form data when project changes
  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        description: project.description || '',
        status: project.status,
        priority: project.priority
      });
    }
  }, [project]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    }
    
    if (!session?.user) {
      newErrors.auth = 'You must be signed in to edit projects';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !project) return;
    if (!session?.user) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/settlement/projects/${project.short_id || project.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` }),
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          status: formData.status,
          priority: formData.priority
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update project');
      }
      
      onOpenChange(false);
      onProjectUpdated();
    } catch (error) {
      console.error('Error updating project:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to update project. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async () => {
    if (!project || !session?.user) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/settlement/projects/${project.short_id || project.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` }),
        },
        body: JSON.stringify({
          status: 'Cancelled'
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to archive project');
      }
      
      onOpenChange(false);
      onProjectUpdated();
    } catch (error) {
      console.error('Error archiving project:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to archive project. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!project || !session?.user) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/settlement/projects/${project.short_id || project.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` }),
        },
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete project');
      }
      
      setShowDeleteDialog(false);
      onOpenChange(false);
      onProjectDeleted();
    } catch (error) {
      console.error('Error deleting project:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to delete project. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    onOpenChange(false);
  };

  if (!project) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Edit Project
              {userPermissions.isOwner && (
                <Badge variant="outline" className="text-xs">Owner</Badge>
              )}
              {userPermissions.isCoOwner && !userPermissions.isOwner && (
                <Badge variant="outline" className="text-xs">Co-Owner</Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Make changes to your project. {!userPermissions.canEdit && "You can only view this project."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Project Name */}
            <div className="space-y-2">
              <Label htmlFor="edit-name">Project Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                disabled={!userPermissions.canEdit || isSubmitting}
                placeholder="e.g., Town Center Expansion"
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                disabled={!userPermissions.canEdit || isSubmitting}
                placeholder="Describe the project goals and requirements..."
                rows={3}
              />
            </div>

            {/* Status and Priority */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
                  disabled={!userPermissions.canEdit || isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-priority">Priority</Label>
                <Select 
                  value={formData.priority.toString()} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, priority: parseInt(value) }))}
                  disabled={!userPermissions.canEdit || isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Low</SelectItem>
                    <SelectItem value="2">Low-Medium</SelectItem>
                    <SelectItem value="3">Medium</SelectItem>
                    <SelectItem value="4">High</SelectItem>
                    <SelectItem value="5">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Error Messages */}
            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{errors.submit}</p>
              </div>
            )}

            {errors.auth && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{errors.auth}</p>
              </div>
            )}
          </form>

          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              {userPermissions.canArchive && project.status === 'Active' && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleArchive}
                  disabled={isSubmitting}
                  className="text-orange-600 border-orange-200 hover:bg-orange-50"
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </Button>
              )}

              {userPermissions.canDelete && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isSubmitting}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              
              {userPermissions.canEdit && (
                <Button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !validateForm()}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Delete Project
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{project.name}"? This action cannot be undone and will remove all project data, items, and contributions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? 'Deleting...' : 'Delete Project'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}