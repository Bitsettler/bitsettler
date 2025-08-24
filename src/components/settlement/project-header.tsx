'use client';

import { useState } from 'react';
import { ArrowLeft, Edit, Save, X, Archive, Trash2, MoreHorizontal, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useRouter } from 'next/navigation';

interface ProjectHeaderProps {
  project: {
    id: string;
    project_number: number;
    short_id: string;
    name: string;
    description?: string;
    priority: number;
    status: 'Active' | 'Completed';
    completionPercentage: number;
    created_by: string;
    created_at: string;
    ownerName?: string;
  };
  permissions: {
    canEdit: boolean;
    canArchive: boolean;
    canDelete: boolean;
  };
  onUpdate: (updates: { name?: string; description?: string }) => Promise<void>;
  onArchive: () => Promise<void>;
  onDelete: () => Promise<void>;
  onComplete: () => Promise<void>;
  onAddItem: () => void;
}

const priorityLabels = {
  1: { label: 'Low', color: 'bg-gray-100 text-gray-800' },
  2: { label: 'Normal', color: 'bg-blue-100 text-blue-800' },
  3: { label: 'High', color: 'bg-orange-100 text-orange-800' },
  4: { label: 'Urgent', color: 'bg-red-100 text-red-800' },
  5: { label: 'Critical', color: 'bg-purple-100 text-purple-800' }
};

export function ProjectHeader({ 
  project, 
  permissions, 
  onUpdate, 
  onArchive, 
  onDelete, 
  onComplete,
  onAddItem 
}: ProjectHeaderProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ 
    name: project.name, 
    description: project.description || '' 
  });

  const handleSave = async () => {
    try {
      await onUpdate(editData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update project:', error);
    }
  };

  const handleCancel = () => {
    setEditData({ name: project.name, description: project.description || '' });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        onClick={() => router.back()}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Projects
      </Button>

      {/* Project Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-3">
                  <Input
                    value={editData.name}
                    onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                    className="text-2xl font-bold"
                    placeholder="Project name"
                  />
                  <Textarea
                    value={editData.description}
                    onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Project description"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSave} size="sm">
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button onClick={handleCancel} variant="outline" size="sm">
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-2xl">{project.name}</CardTitle>
                    <Badge className={priorityLabels[project.priority as keyof typeof priorityLabels]?.color}>
                      {priorityLabels[project.priority as keyof typeof priorityLabels]?.label}
                    </Badge>
                    <Badge variant={project.status === 'Active' ? 'default' : 'secondary'}>
                      {project.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">
                    Project #{project.project_number} • Created {project.created_at ? new Date(project.created_at).toLocaleDateString() : 'Unknown date'}
                    {project.ownerName && ` • by ${project.ownerName}`}
                  </p>
                  {project.description && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {project.description}
                    </p>
                  )}
                </div>
              )}
            </div>
            
            {!isEditing && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onAddItem}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
                
                {permissions.canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {project.status === 'Active' && (
                      <DropdownMenuItem onClick={onComplete}>
                        Complete Project
                      </DropdownMenuItem>
                    )}
                    {permissions.canArchive && (
                      <DropdownMenuItem onClick={onArchive}>
                        <Archive className="h-4 w-4 mr-2" />
                        Archive
                      </DropdownMenuItem>
                    )}
                    {permissions.canDelete && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Project</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this project? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Progress</span>
              <span>{project.completionPercentage}% complete</span>
            </div>
            <Progress value={project.completionPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
