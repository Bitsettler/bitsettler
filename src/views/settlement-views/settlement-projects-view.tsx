'use client';

import { useState, useEffect } from 'react';
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
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/container';
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Completed' | 'Cancelled'>('Active');
  const [priorityFilter, setPriorityFilter] = useState<'all' | '1' | '2' | '3' | '4' | '5'>('all');

  // Fetch projects from API
  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        includeItems: 'true',
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });

      const response = await fetch(`/api/settlement/projects?${params}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch projects');
      }

      setProjects(result.data || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err instanceof Error ? err.message : 'Failed to load projects');
      setProjects([]); // Reset to empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Load projects on mount and when status filter changes
  useEffect(() => {
    fetchProjects();
  }, [statusFilter]);

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
      await fetchProjects();
      
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
          contributionType: contributionData.itemName.trim(),
          quantity: contributionData.quantity,
          notes: contributionData.notes.trim()
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to add contribution');
      }

      // Reset form and refresh projects
      setContributionData({ projectId: '', itemName: '', quantity: 1, notes: '' });
      setContributingTo(null);
      await fetchProjects();
      
    } catch (err) {
      console.error('Error adding contribution:', err);
      setError(err instanceof Error ? err.message : 'Failed to add contribution');
    } finally {
      setIsContributing(false);
    }
  };

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'Cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return 'border-red-300 text-red-700';
    if (priority >= 3) return 'border-orange-300 text-orange-700';
    return 'border-gray-300 text-gray-700';
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
                <Button variant="outline" size="sm" onClick={fetchProjects} className="mt-4">
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
          
          {/* Quick Create Toggle */}
          <Button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            variant={showCreateForm ? "secondary" : "default"}
            className="transition-all"
          >
            {showCreateForm ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </>
            )}
          </Button>
        </div>

        {/* Quick Create Form */}
        {showCreateForm && (
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
                    onChange={(e) => setCreateData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-priority">Priority</Label>
                  <Select 
                    value={createData.priority.toString()} 
                    onValueChange={(value) => setCreateData(prev => ({ ...prev, priority: parseInt(value) }))}
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
              
              <div className="space-y-2">
                <Label htmlFor="project-description">Description (Optional)</Label>
                <Textarea
                  id="project-description"
                  placeholder="Describe the project goals and requirements..."
                  value={createData.description}
                  onChange={(e) => setCreateData(prev => ({ ...prev, description: e.target.value }))}
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
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={(value: any) => setPriorityFilter(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="5">Critical</SelectItem>
                  <SelectItem value="4">High</SelectItem>
                  <SelectItem value="3">Medium</SelectItem>
                  <SelectItem value="2">Low-Medium</SelectItem>
                  <SelectItem value="1">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">
                  {Array.isArray(projects) ? projects.filter(p => p.status === 'Active').length : 0}
                </div>
                <div className="text-sm text-blue-600">Active</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">
                  {Array.isArray(projects) ? projects.filter(p => p.status === 'Completed').length : 0}
                </div>
                <div className="text-sm text-green-600">Completed</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="text-2xl font-bold text-orange-600">
                  {Array.isArray(projects) && projects.length > 0 ? Math.round(projects.reduce((sum, p) => sum + p.completionPercentage, 0) / projects.length) : 0}%
                </div>
                <div className="text-sm text-orange-600">Avg Progress</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-2xl font-bold text-purple-600">
                  {Array.isArray(projects) ? projects.reduce((sum, p) => sum + (p.items?.reduce((itemSum, item) => itemSum + item.requiredQuantity, 0) || 0), 0).toLocaleString() : '0'}
                </div>
                <div className="text-sm text-purple-600">Total Items</div>
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
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-green-800">Quick Contribute</h4>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => setContributingTo(null)}
                            className="h-6 w-6 p-0 text-green-600"
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
                        onClick={() => router.push(`/en/settlement/projects/${project.id}`)}
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
    </Container>
  );
}