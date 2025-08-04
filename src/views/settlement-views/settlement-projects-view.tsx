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
  Search,
  ChevronDown,
  ChevronUp,
  Save,
  Trash2,
  Edit,
  MoreHorizontal,
  UserPlus,
  UserMinus,
  Crown,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/container';

import { EditProjectModal } from '@/components/projects/edit-project-modal';
import { type ProjectWithItems } from '@/lib/spacetime-db-new/modules';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ItemSearchCombobox } from '@/components/projects/item-search-combobox';

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

interface ProjectItem {
  itemName: string;
  itemSlug?: string;
  itemCategory?: string;
  requiredQuantity: number;
  tier: number;
  priority: number;
  notes?: string;
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
  
  // Item management for quick create
  const [items, setItems] = useState<ProjectItem[]>([]);
  const [currentItem, setCurrentItem] = useState<ProjectItem>({
    itemName: '',
    itemSlug: '',
    itemCategory: '',
    requiredQuantity: 1,
    tier: 1,
    priority: 1,
    notes: ''
  });
  

  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Completed' | 'Cancelled' | 'myProjects'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | '1' | '2' | '3' | '4' | '5'>('all');
  
  // Refresh trigger
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Project memberships
  const [projectMemberships, setProjectMemberships] = useState<Record<string, {
    isMember: boolean;
    role: string;
    members: Array<{
      id: string;
      name: string;
      role: string;
      assignedAt: Date;
    }>;
  }>>({});
  const [joiningProject, setJoiningProject] = useState<string | null>(null);
  const [leavingProject, setLeavingProject] = useState<string | null>(null);
  

  
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

  // Item management functions
  const handleItemSelect = (selectedItem: { name: string; slug: string; category: string; tier?: number } | null) => {
    if (selectedItem) {
      setCurrentItem({
        ...currentItem,
        itemName: selectedItem.name,
        itemSlug: selectedItem.slug,
        itemCategory: selectedItem.category,
        tier: selectedItem.tier || 1
      });
    }
  };

  const validateCurrentItem = (): boolean => {
    return (
      currentItem.itemName.trim().length > 0 &&
      currentItem.requiredQuantity > 0 &&
      !items.some(item => item.itemName.toLowerCase() === currentItem.itemName.toLowerCase())
    );
  };

  const addItem = () => {
    if (validateCurrentItem()) {
      setItems([...items, { ...currentItem }]);
      setCurrentItem({
        itemName: '',
        itemSlug: '',
        itemCategory: '',
        requiredQuantity: 1,
        tier: 1,
        priority: 1,
        notes: ''
      });
    }
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Fetch project memberships - define first since other functions depend on it
  const fetchProjectMemberships = useCallback(async () => {
    if (!session?.user || projects.length === 0) return;

    try {
      // Fetch membership data for each project
      const membershipPromises = projects.map(async (project) => {
        try {
          const response = await fetch(`/api/settlement/projects/${project.id}`, {
            headers: {
              ...(session.access_token && { 'Authorization': `Bearer ${session.access_token}` })
            }
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data.assignedMembers) {
              const userMember = result.data.assignedMembers.find(
                (member: any) => member.name === session.user?.name // Simple name-based matching for now
              );
              
              return {
                projectId: project.id,
                isMember: !!userMember,
                role: userMember?.role || '',
                members: result.data.assignedMembers
              };
            }
          }
        } catch (error) {
          console.warn(`Failed to fetch memberships for project ${project.id}:`, error);
        }
        
        return {
          projectId: project.id,
          isMember: false,
          role: '',
          members: []
        };
      });

      const memberships = await Promise.all(membershipPromises);
      
      const membershipMap = memberships.reduce((acc, membership) => {
        acc[membership.projectId] = {
          isMember: membership.isMember,
          role: membership.role,
          members: membership.members
        };
        return acc;
      }, {} as typeof projectMemberships);

      setProjectMemberships(membershipMap);
      
    } catch (error) {
      console.error('Error fetching project memberships:', error);
    }
  }, [session?.user, session?.access_token]);

  // Project membership functions
  const handleJoinProject = useCallback(async (projectId: string) => {
    if (!session?.user) return;
    
    setJoiningProject(projectId);
    try {
      const response = await fetch(`/api/settlement/projects/${projectId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session.access_token && { 'Authorization': `Bearer ${session.access_token}` })
        },
        body: JSON.stringify({ role: 'Contributor' })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to join project');
      }

      // Update local state
      setProjectMemberships(prev => ({
        ...prev,
        [projectId]: {
          ...prev[projectId],
          isMember: true,
          role: 'Contributor'
        }
      }));

      // Refresh project memberships
      await fetchProjectMemberships();
      
    } catch (err) {
      console.error('Error joining project:', err);
      setError(err instanceof Error ? err.message : 'Failed to join project');
    } finally {
      setJoiningProject(null);
    }
  }, [session?.user, session?.access_token, fetchProjectMemberships]);

  const handleLeaveProject = useCallback(async (projectId: string) => {
    if (!session?.user) return;
    
    setLeavingProject(projectId);
    try {
      const response = await fetch(`/api/settlement/projects/${projectId}/leave`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(session.access_token && { 'Authorization': `Bearer ${session.access_token}` })
        }
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to leave project');
      }

      // Update local state
      setProjectMemberships(prev => ({
        ...prev,
        [projectId]: {
          ...prev[projectId],
          isMember: false,
          role: ''
        }
      }));

      // Refresh project memberships
      await fetchProjectMemberships();
      
    } catch (err) {
      console.error('Error leaving project:', err);
      setError(err instanceof Error ? err.message : 'Failed to leave project');
    } finally {
      setLeavingProject(null);
    }
  }, [session?.user, session?.access_token, fetchProjectMemberships]);

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

  // Fetch memberships once when projects are initially loaded
  useEffect(() => {
    if (projects.length > 0 && session?.user && !loading) {
      fetchProjectMemberships();
    }
  }, [projects.length, session?.user?.id, loading, fetchProjectMemberships]);

  // Apply client-side filters
  useEffect(() => {
    if (!Array.isArray(projects)) return;
    let filtered = [...projects];

    // Status filter (including myProjects)
    if (statusFilter === 'myProjects') {
      filtered = filtered.filter(project => 
        projectMemberships[project.id]?.isMember === true
      );
    } else if (statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

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
  }, [projects, searchTerm, priorityFilter, statusFilter, projectMemberships]);

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
          items: items.map(item => ({
            itemName: item.itemName,
            requiredQuantity: item.requiredQuantity,
            tier: item.tier,
            priority: item.priority,
            notes: item.notes || undefined
          }))
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create project');
      }

      // Reset form and refresh projects
      setCreateData({ name: '', description: '', priority: 3 });
      setItems([]);
      setCurrentItem({
        itemName: '',
        itemSlug: '',
        itemCategory: '',
        requiredQuantity: 1,
        tier: 1,
        priority: 1,
        notes: ''
      });
      setShowCreateForm(false);
      refreshProjects();
      
    } catch (err) {
      console.error('Error creating project:', err);
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setIsCreating(false);
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
            onClick={() => setShowCreateForm(true)}
            variant="default"
            className="transition-all"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>

        {/* Inline Create Form */}
        {showCreateForm && (
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create New Project
              </CardTitle>
              <CardDescription>
                Create a new project for your settlement. You can add items and manage details after creation.
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
              
              {/* Required Items Section */}
              <div className="space-y-4 mt-6">
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-4">Required Items</h4>
                  
                  {/* Add Item Form */}
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                    <div className="space-y-2">
                      <Label htmlFor="itemName">Item Name</Label>
                      <ItemSearchCombobox
                        value={currentItem.itemSlug || ''}
                        onValueChange={(value) => {
                          if (!value) {
                            setCurrentItem({
                              ...currentItem,
                              itemName: '',
                              itemSlug: '',
                              itemCategory: '',
                              tier: 1
                            });
                            return;
                          }
                        }}
                        onItemSelect={handleItemSelect}
                        placeholder="Search for an item..."
                      />
                      {currentItem.itemName && (
                        <p className="text-sm text-green-600">Selected: {currentItem.itemName}</p>
                      )}
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="requiredQuantity">Quantity</Label>
                        <Input
                          id="requiredQuantity"
                          type="number"
                          min="1"
                          value={currentItem.requiredQuantity}
                          onChange={(e) => setCurrentItem({
                            ...currentItem,
                            requiredQuantity: parseInt(e.target.value) || 1
                          })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="item-priority">Priority</Label>
                        <Select 
                          value={currentItem.priority.toString()} 
                          onValueChange={(value) => setCurrentItem({
                            ...currentItem,
                            priority: parseInt(value)
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Low</SelectItem>
                            <SelectItem value="2">Medium</SelectItem>
                            <SelectItem value="3">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="itemNotes">Notes (Optional)</Label>
                      <Textarea
                        id="itemNotes"
                        value={currentItem.notes}
                        onChange={(e) => setCurrentItem({
                          ...currentItem,
                          notes: e.target.value
                        })}
                        placeholder="Any special requirements..."
                        rows={2}
                      />
                    </div>
                    
                    <Button 
                      type="button"
                      onClick={addItem}
                      disabled={!validateCurrentItem()}
                      variant="outline"
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>

                  {/* Current Items List */}
                  {items.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <h5 className="font-medium text-sm">Project Items ({items.length})</h5>
                      <div className="space-y-2">
                        {items.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{item.itemName}</span>
                                <Badge variant="secondary" className="text-xs">
                                  Tier {item.tier}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {['Low', 'Medium', 'High'][item.priority - 1]}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Quantity: {item.requiredQuantity.toLocaleString()}
                                {item.notes && ` • ${item.notes}`}
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeItem(index)}
                              className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
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
                  <option value="all">All Projects</option>
                  <option value="myProjects">My Projects</option>
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

            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => {
              const StatusIcon = statusIcons[project.status as keyof typeof statusIcons] || Clock;
              
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

                    {/* Project Members */}
                    {projectMemberships[project.id]?.members?.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">Team Members</span>
                          <span className="text-muted-foreground">
                            {projectMemberships[project.id].members.length} member{projectMemberships[project.id].members.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {projectMemberships[project.id].members.slice(0, 3).map((member) => (
                            <Badge key={member.id} variant="secondary" className="text-xs">
                              {member.role === 'Leader' && <Crown className="h-3 w-3 mr-1" />}
                              {member.role === 'Observer' && <Shield className="h-3 w-3 mr-1" />}
                              {member.name}
                            </Badge>
                          ))}
                          {projectMemberships[project.id].members.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{projectMemberships[project.id].members.length - 3} more
                            </Badge>
                          )}
                        </div>
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
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => router.push(`/en/settlement/projects/${project.short_id || project.id}`)}
                        className="flex-1"
                      >
                        View Details
                      </Button>
                      
                      {/* Join/Leave Button */}
                      {session?.user && (
                        <div className="flex gap-1">
                          {projectMemberships[project.id]?.isMember ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleLeaveProject(project.id)}
                              disabled={leavingProject === project.id}
                              className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                            >
                              {leavingProject === project.id ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              ) : (
                                <UserMinus className="h-4 w-4" />
                              )}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleJoinProject(project.id)}
                              disabled={joiningProject === project.id}
                              className="text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
                            >
                              {joiningProject === project.id ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              ) : (
                                <UserPlus className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      
      
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