'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from '@/hooks/use-auth';
import { useCurrentMember } from '@/hooks/use-current-member';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Package, 
  Clock, 
  CheckCircle2, 
  Filter,
  Search,
  ChevronRight,
  Minus,
  Target,
  MoreHorizontal,
  Trash2,
  Archive,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/container';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { getSettlementTierBadgeClasses } from '@/lib/settlement/tier-colors';
import { BricoTierBadge } from '@/components/ui/brico-tier-badge';

interface ProjectWithItems {
  id: string;
  short_id: string;
  name: string;
  description?: string;
  priority: number;
  status: 'Active' | 'Completed';
  completionPercentage: number;
  totalItems: number;
  completedItems: number;
  items: Array<{
    id: string;
    itemName: string;
    requiredQuantity: number;
    currentQuantity: number;
    tier: number;
    status: string;
  }>;
  created_by: string;
  created_at: string;
  project_number: number;
  ownerName?: string;
}

interface QuickCreateData {
  name: string;
  priority: number;
}

const priorityLabels = {
  1: { label: 'Low', color: 'bg-gray-100 text-gray-800' },
  2: { label: 'Normal', color: 'bg-blue-100 text-blue-800' },
  3: { label: 'High', color: 'bg-orange-100 text-orange-800' },
  4: { label: 'Urgent', color: 'bg-red-100 text-red-800' },
  5: { label: 'Critical', color: 'bg-purple-100 text-purple-800' }
};



export function SettlementProjectsView() {
  const { data: session } = useSession();
  const { member, isLoading: memberLoading } = useCurrentMember();
  const router = useRouter();
  
  // Core state
  const [projects, setProjects] = useState<ProjectWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Quick create state
  const [createData, setCreateData] = useState<QuickCreateData>({ name: '', priority: 3 });
  const [createDescription, setCreateDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | '1' | '2' | '3' | '4' | '5'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Completed'>('Active');
  

  
  // Project management state
  const [deletingProject, setDeletingProject] = useState<string | null>(null);
  const [archivingProject, setArchivingProject] = useState<string | null>(null);
  const [completingProject, setCompletingProject] = useState<string | null>(null);
  
  // Create inline form state
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    if (!session?.user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        includeItems: 'true',
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });

      const result = await api.get(`/api/settlement/projects?${params}`);
      
      if (result.success) {
        setProjects(result.data?.data?.projects || []);
      } else {
        throw new Error(result.error || 'Failed to fetch projects');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, statusFilter]);

  // Load projects on mount and when dependencies change
  useEffect(() => {
    if (session?.user?.id) {
      fetchProjects();
    }
  }, [session?.user?.id, statusFilter]);

  // Quick create and close form
  const handleQuickCreateAndClose = async () => {
    await handleQuickCreate();
    setShowCreateForm(false);
    setCreateData({ name: '', priority: 3 });
    setCreateDescription('');
  };

  // Quick create project
  const handleQuickCreate = async () => {
    if (!createData.name.trim()) {
      toast.error('Project name is required');
      return;
    }

    if (!member?.id) {
      toast.error('Member information not available. Please try again.');
      return;
    }

    setIsCreating(true);
    try {
      const result = await api.post('/api/settlement/projects', {
        name: createData.name.trim(),
        description: createDescription.trim() || null,
        priority: createData.priority,
        createdByMemberId: member.id, // Required field
        items: [] // Start with empty items, user adds them in detail view
      });

      if (result.success) {
        // Reset form
        setCreateData({ name: '', priority: 3 });
        setCreateDescription('');
        
        // Navigate to project detail page for adding items
        const projectNumber = result.data?.project?.project_number;
        
        if (projectNumber) {
          router.push(`/en/settlement/projects/${projectNumber}`);
        } else {
          toast.error('Project created but could not navigate to it. Please refresh the page.');
        }
        
        toast.success('Project created! Add items to get started.');
      } else {
        throw new Error(result.error || 'Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };



  // Delete project from main view
  const handleDeleteProject = async (projectId: string, projectName: string) => {
    setDeletingProject(projectId);
    try {
      const result = await api.delete(`/api/settlement/projects/${projectId}`);

      if (result.success) {
        // Remove from local state immediately
        setProjects(prev => prev.filter(p => p.short_id !== projectId));
        toast.success('Project deleted successfully!');
      } else {
        throw new Error(result.error || 'Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project. Please try again.');
    } finally {
      setDeletingProject(null);
    }
  };

  // Archive project from main view
  const handleArchiveProject = async (projectId: string) => {
    setArchivingProject(projectId);
    try {
      const result = await api.put(`/api/settlement/projects/${projectId}`, {
        status: 'Completed'
      });

      if (result.success) {
        // Update local state immediately
        setProjects(prev => prev.map(p => 
          p.short_id === projectId 
            ? { ...p, status: 'Completed' as const }
            : p
        ));
        toast.success('Project archived successfully!');
      } else {
        throw new Error(result.error || 'Failed to archive project');
      }
    } catch (error) {
      console.error('Error archiving project:', error);
      toast.error('Failed to archive project. Please try again.');
    } finally {
      setArchivingProject(null);
    }
  };

  // Complete project from main view
  const handleCompleteProject = async (projectId: string) => {
    setCompletingProject(projectId);
    try {
      const result = await api.put(`/api/settlement/projects/${projectId}`, {
        status: 'Completed'
      });

      if (result.success) {
        // Update local state immediately
        setProjects(prev => prev.map(p => 
          p.short_id === projectId 
            ? { ...p, status: 'Completed' as const }
            : p
        ));
        toast.success('Project marked as completed!');
      } else {
        throw new Error(result.error || 'Failed to complete project');
      }
    } catch (error) {
      console.error('Error completing project:', error);
      toast.error('Failed to complete project. Please try again.');
    } finally {
      setCompletingProject(null);
    }
  };

  // Filter projects
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.project_number.toString().includes(searchTerm);
    const matchesPriority = priorityFilter === 'all' || project.priority.toString() === priorityFilter;
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    
    return matchesSearch && matchesPriority && matchesStatus;
  });

  // Calculate stats
  const stats = {
    active: projects.filter(p => p.status === 'Active').length,
    completed: projects.filter(p => p.status === 'Completed').length,
    avgProgress: projects.length > 0 
      ? Math.round(projects.reduce((sum, p) => sum + p.completionPercentage, 0) / projects.length)
      : 0,
    totalItems: projects.reduce((sum, p) => sum + p.totalItems, 0)
  };

  if (loading || memberLoading) {
    return (
      <Container>
        <div className="space-y-6 py-8">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96" />
          </div>
          
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <div className="py-8 text-center">
          <p className="text-red-500 mb-4">Error loading projects: {error}</p>
          <Button onClick={fetchProjects}>Try Again</Button>
        </div>
      </Container>
    );
  }

  if (!member?.id) {
    return (
      <Container>
        <div className="py-8 text-center">
          <p className="text-muted-foreground mb-4">You need to be a settlement member to view and create projects.</p>
          <Button onClick={() => router.push('/en/settlement')}>Go to Settlement</Button>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-6 py-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">Coordinate settlement projects and contributions.</p>
        </div>



        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold">{stats.active}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Progress</p>
                  <p className="text-2xl font-bold">{stats.avgProgress}%</p>
                </div>
                <Target className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                  <p className="text-2xl font-bold">{stats.totalItems}</p>
                </div>
                <Package className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
          
          {/* Status Filter Chips */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            {(['all', 'Active', 'Completed'] as const).map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {status === 'all' ? 'All' : status}
              </Button>
            ))}
          </div>
          
          {/* Priority Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Priority:</span>
            <Select value={priorityFilter} onValueChange={(value: any) => setPriorityFilter(value)}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="1">Low</SelectItem>
                <SelectItem value="2">Normal</SelectItem>
                <SelectItem value="3">High</SelectItem>
                <SelectItem value="4">Urgent</SelectItem>
                <SelectItem value="5">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Create New Project Card */}
          <Card className={`border-2 border-dashed transition-all duration-200 ${
            showCreateForm 
              ? 'border-primary bg-background' 
              : 'border-primary/30 bg-primary/5 hover:bg-primary/10 cursor-pointer'
          }`}>
            <CardContent className="pt-6">
              {!showCreateForm ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 group" onClick={() => setShowCreateForm(true)}>
                  <div className="rounded-full bg-primary/20 p-4 mb-4 group-hover:bg-primary/30 transition-colors">
                    <Plus className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Create New Project</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start a new settlement project
                  </p>
                  <div className="text-xs text-muted-foreground">
                    Click to get started
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">New Project</h3>
                    <Button variant="ghost" size="sm" onClick={() => {
                      setShowCreateForm(false);
                      setCreateData({ name: '', priority: 3 });
                      setCreateDescription('');
                    }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <Input
                        placeholder="Project name (e.g., Town Hall Construction)"
                        value={createData.name}
                        onChange={(e) => setCreateData(prev => ({ ...prev, name: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setShowCreateForm(false);
                            setCreateData({ name: '', priority: 3 });
                            setCreateDescription('');
                          }
                        }}
                        autoFocus
                      />
                    </div>
                    
                    <div>
                      <Input
                        placeholder="Description (optional)"
                        value={createDescription}
                        onChange={(e) => setCreateDescription(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !isCreating && createData.name.trim()) {
                            handleQuickCreateAndClose();
                          } else if (e.key === 'Escape') {
                            setShowCreateForm(false);
                            setCreateData({ name: '', priority: 3 });
                            setCreateDescription('');
                          }
                        }}
                      />
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Select value={createData.priority.toString()} onValueChange={(value) => setCreateData(prev => ({ ...prev, priority: parseInt(value) }))}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Low</SelectItem>
                          <SelectItem value="2">Normal</SelectItem>
                          <SelectItem value="3">High</SelectItem>
                          <SelectItem value="4">Urgent</SelectItem>
                          <SelectItem value="5">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button
                        onClick={handleQuickCreateAndClose}
                        disabled={isCreating || !createData.name.trim() || memberLoading || !member?.id}
                        className="flex-1"
                      >
                        {isCreating ? 'Creating...' : 'Create & Add Items'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {filteredProjects.map((project) => (
            <Card 
              key={project.id} 
              className="hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              onClick={() => router.push(`/en/settlement/projects/${project.project_number}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold line-clamp-2">
                      {project.name}
                    </CardTitle>
                    {project.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <Badge variant="outline" className="text-xs font-mono bg-muted/50 text-muted-foreground border-muted-foreground/20">
                        #{project.project_number}
                      </Badge>
                      {project.ownerName && (
                        <Badge variant="outline" className="text-xs font-mono bg-muted/50 text-muted-foreground border-muted-foreground/20">
                          {project.ownerName}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={priorityLabels[project.priority as keyof typeof priorityLabels]?.color || 'bg-gray-100 text-gray-800'}>
                      {priorityLabels[project.priority as keyof typeof priorityLabels]?.label || 'Unknown'}
                    </Badge>
                    
                    {/* Project Actions Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {project.status === 'Active' && (
                          <>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCompleteProject(project.id);
                              }}
                              disabled={completingProject === project.id}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              {completingProject === project.id ? 'Completing...' : 'Mark Completed'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleArchiveProject(project.id);
                              }}
                              disabled={archivingProject === project.id}
                            >
                              <Archive className="h-4 w-4 mr-2" />
                              {archivingProject === project.id ? 'Archiving...' : 'Archive'}
                            </DropdownMenuItem>
                          </>
                        )}
                        
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
                                Are you sure you want to delete "{project.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteProject(project.id, project.name)}
                                disabled={deletingProject === project.id}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {deletingProject === project.id ? 'Deleting...' : 'Delete'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm text-muted-foreground">
                    {project.completedItems}/{project.totalItems} items
                  </span>
                  <span className="text-sm font-medium">{project.completionPercentage}%</span>
                </div>
                
                <Progress value={project.completionPercentage} className="mt-2" />
              </CardHeader>

              <CardContent className="pt-0">
                {/* Project Requirements - Show up to 5 items with detailed information */}
                {project.items && project.items.length > 0 ? (
                  (() => {
                    const incompleteItems = project.items.filter(item => item.currentQuantity < item.requiredQuantity);
                    
                    return (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-3">
                          <Target className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-muted-foreground">
                            Item Progress
                          </span>
                        </div>
                        
                        {/* Show only incomplete items */}
                        {incompleteItems
                          .slice(0, 5)
                          .map((item) => {
                        const remaining = item.requiredQuantity - item.currentQuantity;
                        const isCompleted = item.currentQuantity >= item.requiredQuantity;
                        const progressPercentage = Math.min(100, Math.round((item.currentQuantity / item.requiredQuantity) * 100));
                        
                        return (
                          <div key={item.id} className="bg-muted/50 rounded-lg p-3 space-y-2">
                            {/* Item header with name, tier, and status */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <h4 className="text-sm font-medium truncate">{item.itemName}</h4>
                                <BricoTierBadge tier={item.tier} size="sm" />
                                {isCompleted && (
                                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                                )}
                              </div>
                              <div className="text-xs font-medium text-muted-foreground">
                                {progressPercentage}%
                              </div>
                            </div>
                            
                            {/* Progress bar */}
                            <div className="w-full bg-background rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all ${
                                  isCompleted ? 'bg-green-600' : 'bg-blue-600'
                                }`}
                                style={{ width: `${progressPercentage}%` }}
                              />
                            </div>
                            
                            {/* Quantity details */}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="font-medium">
                                {item.currentQuantity.toLocaleString()} / {item.requiredQuantity.toLocaleString()}
                              </span>
                              {isCompleted && (
                                <span className="text-green-600 font-medium">Complete</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    
                        {/* Show additional incomplete items indicator if there are more than 5 */}
                        {incompleteItems.length > 5 && (
                          <div className="text-center py-2">
                            <p className="text-xs text-muted-foreground">
                              +{incompleteItems.length - 5} more incomplete item{incompleteItems.length - 5 === 1 ? '' : 's'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Click to view all requirements
                            </p>
                          </div>
                        )}
                        
                        {/* Show completion message when all items are complete */}
                        {incompleteItems.length === 0 && (
                          <div className="text-center py-6">
                            <CheckCircle2 className="h-8 w-8 mx-auto text-green-600 mb-2" />
                            <p className="text-sm font-medium text-green-600">All items completed!</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              This project is ready for completion
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-center py-6">
                    <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No items added yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Click to add project requirements
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProjects.length === 0 && !loading && (
          <Card className="md:col-span-2 lg:col-span-2">
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No projects found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || priorityFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters to see more projects.'
                  : 'Click the "Create New Project" card to get started.'}
              </p>
              {(searchTerm || priorityFilter !== 'all' || statusFilter !== 'all') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setPriorityFilter('all');
                    setStatusFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}
        

      </div>
    </Container>
  );
}