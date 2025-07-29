'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Package, 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Archive, 
  Edit, 
  Save, 
  X,
  Gift,
  TrendingUp,
  User,
  BarChart3
} from 'lucide-react';
import { projectsStorage, type ProjectWithProgress, type Contribution } from '@/lib/local-storage/projects-storage';
import { useUserProfile } from '@/hooks/use-user-profile';

interface ProjectDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string | null;
  onProjectUpdated?: () => void;
}

const statusIcons = {
  'Active': Clock,
  'Completed': CheckCircle2,
  'Cancelled': XCircle,
  'Archived': Archive
};

export function ProjectDetailsModal({ 
  open, 
  onOpenChange, 
  projectId, 
  onProjectUpdated 
}: ProjectDetailsModalProps) {
  const { profile } = useUserProfile();
  const [project, setProject] = useState<ProjectWithProgress | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: ''
  });

  // Load project data when modal opens
  useEffect(() => {
    if (open && projectId) {
      const projectData = projectsStorage.getProjectWithProgress(projectId);
      const contributionsData = projectsStorage.getProjectContributions(projectId);
      
      setProject(projectData);
      setContributions(contributionsData);
      
      if (projectData) {
        setEditForm({
          name: projectData.name,
          description: projectData.description || ''
        });
      }
      
      setIsEditing(false);
      setActiveTab('overview');
    }
  }, [open, projectId]);

  const handleSaveEdit = () => {
    if (!project || !projectId) return;

    const updated = projectsStorage.updateProject(projectId, {
      name: editForm.name.trim(),
      description: editForm.description.trim() || null
    });

    if (updated) {
      setProject({ ...project, ...updated });
      setIsEditing(false);
      onProjectUpdated?.();
    }
  };

  const handleCancelEdit = () => {
    if (project) {
      setEditForm({
        name: project.name,
        description: project.description || ''
      });
    }
    setIsEditing(false);
  };

  const handleArchive = () => {
    if (!project || !profile?.displayName) return;

    if (confirm(`Are you sure you want to archive "${project.name}"?`)) {
      const archived = projectsStorage.archiveProject(project.id, profile.displayName);
      if (archived) {
        setProject({ ...project, ...archived });
        onProjectUpdated?.();
      }
    }
  };

  const handleUnarchive = () => {
    if (!project || !profile?.displayName) return;

    if (confirm(`Are you sure you want to restore "${project.name}" from archive?`)) {
      const updated = projectsStorage.updateProject(project.id, { 
        status: 'Completed',
        archivedAt: undefined,
        archivedBy: undefined
      });
      if (updated) {
        setProject({ ...project, ...updated });
        onProjectUpdated?.();
      }
    }
  };

  const canManageProject = project && profile?.displayName && 
    projectsStorage.canArchiveProject(project, profile.displayName);

  const getStatusColor = (status: string) => {
    const colors = {
      'Active': 'bg-blue-100 text-blue-800',
      'Completed': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800',
      'Archived': 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || colors['Active'];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Calculate contribution stats
  const contributorStats = contributions.reduce((stats, contrib) => {
    const name = contrib.contributorName;
    if (!stats[name]) {
      stats[name] = { totalQuantity: 0, contributions: 0, items: new Set() };
    }
    stats[name].totalQuantity += contrib.quantity;
    stats[name].contributions += 1;
    stats[name].items.add(contrib.itemName);
    return stats;
  }, {} as Record<string, { totalQuantity: number, contributions: number, items: Set<string> }>);

  const topContributors = Object.entries(contributorStats)
    .map(([name, stats]) => ({ 
      name, 
      ...stats, 
      uniqueItems: stats.items.size,
      items: Array.from(stats.items)
    }))
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, 5);

  if (!project) {
    return null;
  }

  const StatusIcon = statusIcons[project.status];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-2">
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="text-lg font-semibold"
                  />
                </div>
              ) : (
                <DialogTitle className="text-xl">{project.name}</DialogTitle>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getStatusColor(project.status)}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {project.status}
                </Badge>
                <Badge variant="outline">
                  {project.completionPercentage}% Complete
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              {canManageProject && !isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              {isEditing && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveEdit}
                    disabled={!editForm.name.trim()}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="items">Items</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            {canManageProject && <TabsTrigger value="management">Manage</TabsTrigger>}
          </TabsList>

          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full">
              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6 p-1">
                {/* Description */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <Textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        placeholder="Project description..."
                        rows={3}
                      />
                    ) : (
                      <p className="text-muted-foreground">
                        Created &quot;{project.name}&quot; to track resource needs and contributions.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Progress Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Progress Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Overall Progress</span>
                        <span className="font-medium">{project.completionPercentage}%</span>
                      </div>
                      <Progress value={project.completionPercentage} className="w-full" />
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{project.totalItems}</div>
                        <div className="text-sm text-muted-foreground">Item Types</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{project.completedItems}</div>
                        <div className="text-sm text-muted-foreground">Completed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{project.totalFulfilled.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">Items Contributed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{(project.totalRequired - project.totalFulfilled).toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">Items Needed</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Project Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Project Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium">Created By</div>
                          <div className="text-sm text-muted-foreground">{project.createdBy}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium">Created</div>
                          <div className="text-sm text-muted-foreground">{formatDate(project.createdAt)}</div>
                        </div>
                      </div>
                      {project.completedAt && (
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <div>
                            <div className="text-sm font-medium">Completed</div>
                            <div className="text-sm text-muted-foreground">{formatDate(project.completedAt)}</div>
                          </div>
                        </div>
                      )}
                      {project.archivedAt && (
                        <div className="flex items-center gap-3">
                          <Archive className="h-4 w-4 text-gray-500" />
                          <div>
                            <div className="text-sm font-medium">Archived</div>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(project.archivedAt)} by {project.archivedBy}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Top Contributors */}
                {topContributors.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Top Contributors
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {topContributors.map((contributor, index) => (
                          <div key={contributor.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                                {index + 1}
                              </div>
                              <div>
                                <div className="font-medium">{contributor.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {contributor.contributions} contributions • {contributor.uniqueItems} item types
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{contributor.totalQuantity.toLocaleString()}</div>
                              <div className="text-xs text-muted-foreground">items</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Items Tab */}
              <TabsContent value="items" className="space-y-4 p-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Required Items ({project.items.length})
                    </CardTitle>
                    <CardDescription>
                      Detailed breakdown of all required items and their progress
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {project.items.map((item) => {
                        const itemContributions = contributions.filter(c => c.itemName === item.itemName);
                        const progressPercentage = (item.currentQuantity / item.requiredQuantity) * 100;
                        
                        return (
                          <Card key={item.id} className="border-l-4 border-l-blue-500">
                            <CardContent className="pt-4">
                              <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h4 className="font-medium">{item.itemName}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="outline" className="text-xs">
                                        Tier {item.tier}
                                      </Badge>
                                      <Badge 
                                        variant="outline" 
                                        className={`text-xs ${
                                          item.status === 'Completed' ? 'bg-green-50 text-green-700' :
                                          item.status === 'In Progress' ? 'bg-yellow-50 text-yellow-700' :
                                          'bg-red-50 text-red-700'
                                        }`}
                                      >
                                        {item.status}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-medium">
                                      {item.currentQuantity.toLocaleString()} / {item.requiredQuantity.toLocaleString()}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {Math.round(progressPercentage)}% complete
                                    </div>
                                  </div>
                                </div>
                                
                                <Progress value={progressPercentage} className="w-full" />
                                
                                {itemContributions.length > 0 && (
                                  <div className="pt-2 border-t">
                                    <div className="text-xs font-medium text-muted-foreground mb-2">
                                      Recent Contributions ({itemContributions.length})
                                    </div>
                                    <div className="space-y-1 max-h-20 overflow-y-auto">
                                      {itemContributions.slice(0, 3).map((contrib) => (
                                        <div key={contrib.id} className="flex items-center justify-between text-xs">
                                          <span>{contrib.contributorName}</span>
                                          <span className="font-medium">+{contrib.quantity.toLocaleString()}</span>
                                        </div>
                                      ))}
                                      {itemContributions.length > 3 && (
                                        <div className="text-xs text-muted-foreground">
                                          +{itemContributions.length - 3} more contributions
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value="activity" className="space-y-4 p-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Contribution Activity ({contributions.length})
                    </CardTitle>
                    <CardDescription>
                      Complete timeline of all contributions to this project
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {contributions.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No contributions yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {contributions
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .map((contribution) => (
                            <div key={contribution.id} className="flex items-start gap-4 p-3 border rounded-lg">
                              <Gift className="h-5 w-5 text-green-500 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className="font-medium">{contribution.contributorName}</span>
                                    <span className="text-muted-foreground"> contributed </span>
                                    <span className="font-medium">{contribution.quantity.toLocaleString()}x {contribution.itemName}</span>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {formatDate(contribution.createdAt)}
                                  </div>
                                </div>
                                {contribution.notes && (
                                  <div className="text-sm text-muted-foreground mt-1">
                                    &quot;{contribution.notes}&quot;
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Management Tab */}
              {canManageProject && (
                <TabsContent value="management" className="space-y-4 p-1">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Project Management</CardTitle>
                      <CardDescription>
                        Manage project settings and archiving options
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Archive/Unarchive Section */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Archive Project</h4>
                          <p className="text-sm text-muted-foreground mb-4">
                            {project.status === 'Archived' 
                              ? 'This project is currently archived. You can restore it to continue managing it.'
                              : project.status === 'Completed'
                              ? 'Archive this completed project to move it to the archived projects section.'
                              : 'Projects can only be archived after they are completed.'
                            }
                          </p>
                          
                          {project.status === 'Archived' ? (
                            <Button
                              variant="outline"
                              onClick={handleUnarchive}
                              className="gap-2"
                            >
                              <Package className="h-4 w-4" />
                              Restore from Archive
                            </Button>
                          ) : project.status === 'Completed' ? (
                            <Button
                              variant="outline"
                              onClick={handleArchive}
                              className="gap-2"
                            >
                              <Archive className="h-4 w-4" />
                              Archive Project
                            </Button>
                          ) : (
                            <Button disabled variant="outline" className="gap-2">
                              <Archive className="h-4 w-4" />
                              Archive Project
                            </Button>
                          )}
                        </div>
                      </div>

                      <Separator />

                      {/* Project Statistics */}
                      <div className="space-y-4">
                        <h4 className="font-medium">Project Statistics</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Total Contributors</div>
                            <div className="text-2xl font-bold">
                              {new Set(contributions.map(c => c.contributorName)).size}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Total Contributions</div>
                            <div className="text-2xl font-bold">{contributions.length}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Items Contributed</div>
                            <div className="text-2xl font-bold">
                              {contributions.reduce((sum, c) => sum + c.quantity, 0).toLocaleString()}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Completion Rate</div>
                            <div className="text-2xl font-bold">{project.completionPercentage}%</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </ScrollArea>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}