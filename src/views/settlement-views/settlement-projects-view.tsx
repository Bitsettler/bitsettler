'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Package, 
  Filter, 
  Users, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Gift, 
  Search,
  ChevronDown,
  ChevronUp,
  Save,
  X,
  Trash2,
  Edit,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/container';
import { CreateProjectModal } from '@/components/projects/create-project-modal';
import { EditProjectModal } from '@/components/projects/edit-project-modal';
import { type ProjectWithItems } from '@/lib/spacetime-db-new/modules';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const statusIcons = {
  'Active': Clock,
  'Completed': CheckCircle2,
  'Cancelled': XCircle
};

interface QuickCreateProject {
  name: string;
  description: string;
  priority: number;
}

interface QuickContribution {
  projectId: string;
  itemName: string;
  quantity: number;
  notes: string;
}

export function SettlementProjectsView() {
  const { data: session } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectWithItems[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<ProjectWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Quick Create State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createData, setCreateData] = useState<QuickCreateProject>({
    name: '',
    description: '',
    priority: 3
  });
  const [isCreating, setIsCreating] = useState(false);
  
  // Inline Contribution State
  const [contributingTo, setContributingTo] = useState<string | null>(null);
  const [contributionData, setContributionData] = useState<QuickContribution>({
    projectId: '',
    itemName: '',
    quantity: 1,
    notes: ''
  });
  const [isContributing, setIsContributing] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Completed' | 'Cancelled'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | '1' | '2' | '3' | '4' | '5'>('all');
  
  // Refresh trigger
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Project Creation Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Project Edit Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectWithItems | null>(null);
  const [userPermissions, setUserPermissions] = useState<Record<string, {
    canEdit: boolean;
    canArchive: boolean;
    canDelete: boolean;
    isOwner: boolean;
    isCoOwner: boolean;
  }>>({});



  const handleSearchTermChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleCreateNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCreateData(prev => ({ ...prev, name: e.target.value }));
  }, []);

  const handleCreateDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCreateData(prev => ({ ...prev, description: e.target.value }));
  }, []);

  // Load projects on mount and when status filter changes
  useEffect(() => {
    if (!session?.user) {
      setError('Authentication required');
      setLoading(false);
      return;
    }

    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const params = new URLSearchParams({
          includeItems: 'true',
          ...(statusFilter !== 'all' && { status: statusFilter }),
        });

        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        
        // Add authorization header if we have an access token
        if (session.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const response = await fetch(`/api/settlement/projects?${params}`, {
          headers
        });
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch projects');
        }

        setProjects(result.data.data?.projects || []);
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError(err instanceof Error ? err.message : 'Failed to load projects');
        setProjects([]); // Reset to empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [statusFilter, session?.user?.id, refreshTrigger]);

  // Helper function to trigger refresh
  const refreshProjects = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Apply client-side filters
  useEffect(() => {
    if (!Array.isArray(projects)) return;
    let filtered = [...projects];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(project => project.priority === parseInt(priorityFilter));
    }

    setFilteredProjects(filtered);
  }, [projects, searchTerm, priorityFilter]);

  // Quick Create Project Handler
  const handleQuickCreate = async () => {
    if (!session?.user || !createData.name.trim()) return;
    
    try {
      setIsCreating(true);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Add authorization header if we have an access token
      if (session.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch('/api/settlement/projects', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: createData.name.trim(),
          description: createData.description.trim(),
          priority: createData.priority,
          items: [] // Start with empty items, user can add via inline forms
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create project');
      }

      // Reset form and refresh projects
      setCreateData({ name: '', description: '', priority: 3 });
      setShowCreateForm(false);
      refreshProjects();
      
    } catch (err) {
      console.error('Error creating project:', err);
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };

  // Quick Contribution Handler
  const handleQuickContribute = async (projectId: string) => {
    if (!session?.user || !contributionData.itemName.trim() || contributionData.quantity <= 0) return;
    
    try {
      setIsContributing(true);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Add authorization header if we have an access token
      if (session.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch('/api/settlement/contributions', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          projectId: projectId,
          contributionType: 'Direct', // Direct contribution of an item
          itemName: contributionData.itemName.trim(),
          quantity: contributionData.quantity,
          description: contributionData.notes.trim()
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to add contribution');
      }

      // Reset form and refresh projects
      setContributionData({ projectId: '', itemName: '', quantity: 1, notes: '' });
      setContributingTo(null);
      refreshProjects();
      
    } catch (err) {
      console.error('Error adding contribution:', err);
      setError(err instanceof Error ? err.message : 'Failed to add contribution');
    } finally {
      setIsContributing(false);
    }
  };

  // Load permissions for all projects
  useEffect(() => {
    if (!session?.user || !Array.isArray(projects) || projects.length === 0) return;

    const checkPermissions = async () => {
      for (const project of projects) {
        try {
          const headers: Record<string, string> = {
            'Content-Type': 'application/json'
          };
          
          // Add authorization header if we have an access token
          if (session.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
          }

          // Call the backend API to get accurate permissions including co-owner status
          const response = await fetch(`/api/settlement/projects/${project.short_id || project.id}/permissions`, {
            headers
          });
          
          if (response.ok) {
            const result = await response.json();
            
            if (result.success) {
              setUserPermissions(prev => ({
                ...prev,
                [project.id]: result.data
              }));
              continue;
            }
          }
          
          // Fallback to client-side checking if API fails
          const isOwner = project.createdBy === session.user?.email || project.createdBy === session.user?.name;
          
          const permissions = {
            canEdit: isOwner,
            canArchive: isOwner,
            canDelete: isOwner,
            isOwner,
            isCoOwner: false
          };
          
          setUserPermissions(prev => ({
            ...prev,
            [project.id]: permissions
          }));
          
        } catch (error) {
          console.error('Error checking permissions:', error);
          // Set safe fallback permissions on error
          setUserPermissions(prev => ({
            ...prev,
            [project.id]: {
              canEdit: false,
              canArchive: false,
              canDelete: false,
              isOwner: false,
              isCoOwner: false
            }
          }));
        }
      }
    };

    checkPermissions();
  }, [projects, session?.user?.id]);

  // Edit project handlers
  const handleEditProject = (project: ProjectWithItems) => {
    setEditingProject(project);
    setShowEditModal(true);
  };

  const handleProjectUpdated = () => {
    refreshProjects();
  };

  const handleProjectDeleted = () => {
    refreshProjects();
  };

  const handleDeleteProject = async (project: ProjectWithItems) => {
    if (!confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Add authorization header if we have an access token
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`/api/settlement/projects/${project.short_id || project.id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include'
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete project');
      }

      // Remove the deleted project from local state
      setProjects(prev => prev.filter(p => p.id !== project.id));
      
    } catch (err) {
      console.error('Error deleting project:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete project');
    }
  };

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-muted text-foreground border-border';
      case 'Completed': return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-800';
      case 'Cancelled': return 'bg-muted/60 text-muted-foreground border-border';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return 'border-muted-foreground/30 text-muted-foreground';
    if (priority >= 3) return 'border-muted-foreground/20 text-muted-foreground';
    return 'border-muted-foreground/10 text-muted-foreground/70';
  };

  const getPriorityLabel = (priority: number) => {
    if (priority >= 4) return 'High';
    if (priority >= 3) return 'Medium';
    return 'Low';
  };

  if (loading) {
    return (
      <Container>
        <div className="space-y-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Projects</h1>
              <p className="text-muted-foreground">Coordinate settlement projects and contributions.</p>
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <div className="space-y-6 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="text-muted-foreground">Coordinate settlement projects and contributions.</p>
          </div>
          <Card>
            <CardContent className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <Package className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-500 font-medium">Error loading projects</p>
                <p className="text-muted-foreground text-sm mt-1">{error}</p>
                <Button variant="outline" size="sm" onClick={refreshProjects} className="mt-4">
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="text-muted-foreground">Coordinate settlement projects and contributions.</p>
          </div>
          
          {/* Create Project Button */}
          <Button 
            onClick={() => setShowCreateModal(true)}
            variant="default"
            className="transition-all"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>

        {/* Quick Create Form - Disabled in favor of modal */}
        {false && showCreateForm && (
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Quick Create Project
              </CardTitle>
              <CardDescription>
                Create a new project quickly. You can add items and manage details after creation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="project-name">Project Name *</Label>
                  <Input
                    id="project-name"
                    placeholder="e.g., Town Center Expansion"
                    value={createData.name}
                    onChange={handleCreateNameChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-priority">Priority</Label>
                  <select 
                    value={createData.priority.toString()} 
                    onChange={(e) => setCreateData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                    className="w-full h-10 px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="1">Low</option>
                    <option value="2">Low-Medium</option>
                    <option value="3">Medium</option>
                    <option value="4">High</option>
                    <option value="5">Critical</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="project-description">Description (Optional)</Label>
                <Textarea
                  id="project-description"
                  placeholder="Describe the project goals and requirements..."
                  value={createData.description}
                  onChange={handleCreateDescriptionChange}
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button 
                  onClick={handleQuickCreate}
                  disabled={!createData.name.trim() || isCreating}
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isCreating ? 'Creating...' : 'Create Project'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateForm(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Project Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6 flex-col sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={handleSearchTermChange}
                  className="pl-10"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-[160px] h-10 px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="all">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <select 
                value={priorityFilter} 
                onChange={(e) => setPriorityFilter(e.target.value as any)}
                className="w-[180px] h-10 px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="all">All Priority</option>
                <option value="5">Critical</option>
                <option value="4">High</option>
                <option value="3">Medium</option>
                <option value="2">Low-Medium</option>
                <option value="1">Low</option>
              </select>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-4 mb-6">
              <div className="text-center p-4 bg-muted/30 rounded-lg border">
                <div className="text-2xl font-bold text-foreground">
                  {Array.isArray(projects) ? projects.filter(p => p.status === 'Active').length : 0}
                </div>
                <div className="text-sm text-muted-foreground">Active</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg border">
                <div className="text-2xl font-bold text-foreground">
                  {Array.isArray(projects) ? projects.filter(p => p.status === 'Completed').length : 0}
                </div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg border">
                <div className="text-2xl font-bold text-foreground">
                  {Array.isArray(projects) && projects.length > 0 ? Math.round(projects.reduce((sum, p) => sum + p.completionPercentage, 0) / projects.length) : 0}%
                </div>
                <div className="text-sm text-muted-foreground">Avg Progress</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg border">
                <div className="text-2xl font-bold text-foreground">
                  {Array.isArray(projects) ? projects.reduce((sum, p) => sum + (p.items?.reduce((itemSum, item) => itemSum + item.requiredQuantity, 0) || 0), 0).toLocaleString() : '0'}
                </div>
                <div className="text-sm text-muted-foreground">Total Items</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center min-h-[300px] text-center">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">
                {projects.length === 0 ? 'No projects yet' : `No ${statusFilter.toLowerCase()} projects`}
              </p>
              <p className="text-muted-foreground mb-4">
                {projects.length === 0 
                  ? 'Create your first project to get started.'
                  : `Projects with this status will appear here.`
                }
              </p>
              {projects.length === 0 && (
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Project
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => {
              const StatusIcon = statusIcons[project.status as keyof typeof statusIcons] || Clock;
              const isContributingToThis = contributingTo === project.id;
              
              return (
                <Card key={project.id} className="hover:shadow-lg transition-all duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2 mb-2">{project.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(project.status)}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {project.status}
                          </Badge>
                          <Badge className={getPriorityColor(project.priority)} variant="outline">
                            {getPriorityLabel(project.priority)}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Project Actions Dropdown */}
                      {userPermissions[project.id] && (userPermissions[project.id].canEdit || userPermissions[project.id].canDelete) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {userPermissions[project.id].canEdit && (
                              <DropdownMenuItem onClick={() => handleEditProject(project)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Project
                              </DropdownMenuItem>
                            )}
                            {userPermissions[project.id].canDelete && (
                              <DropdownMenuItem 
                                onClick={() => handleDeleteProject(project)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Project
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Description */}
                    {project.description && (
                      <CardDescription className="line-clamp-2">
                        {project.description}
                      </CardDescription>
                    )}

                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span className="font-medium">{project.completionPercentage}%</span>
                      </div>
                      <Progress value={project.completionPercentage} className="w-full" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          {project.totalItems > 0 
                            ? `${(project.items?.reduce((sum, item) => sum + item.currentQuantity, 0) || 0).toLocaleString()} / ${(project.items?.reduce((sum, item) => sum + item.requiredQuantity, 0) || 0).toLocaleString()} items`
                            : "No items defined"
                          }
                        </span>
                      </div>
                    </div>

                    {/* Inline Contribution Form */}
                    {isContributingToThis && project.status === 'Active' && (
                      <div className="p-3 bg-muted/50 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-foreground">Quick Contribute</h4>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => setContributingTo(null)}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid gap-2">
                          <Input
                            placeholder="Item name (e.g., Iron Ore)"
                            value={contributionData.itemName}
                            onChange={(e) => setContributionData(prev => ({ 
                              ...prev, 
                              itemName: e.target.value,
                              projectId: project.id 
                            }))}
                            className="text-sm"
                          />
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              placeholder="Qty"
                              min="1"
                              value={contributionData.quantity}
                              onChange={(e) => setContributionData(prev => ({ 
                                ...prev, 
                                quantity: parseInt(e.target.value) || 1 
                              }))}
                              className="text-sm w-20"
                            />
                            <Input
                              placeholder="Notes (optional)"
                              value={contributionData.notes}
                              onChange={(e) => setContributionData(prev => ({ 
                                ...prev, 
                                notes: e.target.value 
                              }))}
                              className="text-sm flex-1"
                            />
                          </div>
                        </div>
                        
                        <Button 
                          size="sm" 
                          onClick={() => handleQuickContribute(project.id)}
                          disabled={!contributionData.itemName.trim() || contributionData.quantity <= 0 || isContributing}
                          className="w-full"
                        >
                          <Gift className="h-4 w-4 mr-2" />
                          {isContributing ? 'Adding...' : 'Add Contribution'}
                        </Button>
                      </div>
                    )}

                    {/* Meta Info */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{project.createdBy}</span>
                      </div>
                      <span>
                        Created {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {project.status === 'Active' && !isContributingToThis && (
                        <Button 
                          size="sm" 
                          variant="default"
                          className="flex-1"
                          onClick={() => {
                            setContributingTo(project.id);
                            setContributionData({
                              projectId: project.id,
                              itemName: '',
                              quantity: 1,
                              notes: ''
                            });
                          }}
                        >
                          <Gift className="h-4 w-4 mr-1" />
                          Contribute
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => router.push(`/en/settlement/projects/${project.short_id || project.id}`)}
                        className={project.status === 'Active' && !isContributingToThis ? "" : "flex-1"}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Create Project Modal */}
      <CreateProjectModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onProjectCreated={refreshProjects}
      />
      
      {/* Edit Project Modal */}
      <EditProjectModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        project={editingProject}
        onProjectUpdated={handleProjectUpdated}
        onProjectDeleted={handleProjectDeleted}
        userPermissions={editingProject ? (userPermissions[editingProject.id] || {
          canEdit: false,
          canArchive: false,
          canDelete: false,
          isOwner: false,
          isCoOwner: false
        }) : {
          canEdit: false,
          canArchive: false,
          canDelete: false,
          isOwner: false,
          isCoOwner: false
        }}
      />
    </Container>
  );
}