'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Plus, Package, Filter, Users, Clock, CheckCircle2, XCircle, Gift, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateProjectModal } from '@/components/projects/create-project-modal';
import { ContributeModal } from '@/components/projects/contribute-modal';
import { Container } from '@/components/container';
import { type ProjectWithItems } from '@/lib/spacetime-db-new/modules';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

const statusIcons = {
  'Active': Clock,
  'Completed': CheckCircle2,
  'Cancelled': XCircle
};

export function SettlementProjectsView() {
  const { data: session } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectWithItems[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<ProjectWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [contributeModalOpen, setContributeModalOpen] = useState(false);
  const [selectedProjectForContribution, setSelectedProjectForContribution] = useState<string | null>(null);
  
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

      setProjects(result.data);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err instanceof Error ? err.message : 'Failed to load projects');
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

  // Create project handler
  const handleCreateProject = () => {
    if (!session?.user) {
      // Redirect to sign in if not authenticated
      router.push('/en/auth/signin');
      return;
    }
    setCreateModalOpen(true);
  };

  const handleViewDetails = (projectId: string) => {
    router.push(`/settlement/projects/${projectId}`);
  };

  const handleContribute = (projectId: string) => {
    setSelectedProjectForContribution(projectId);
    setContributeModalOpen(true);
  };

  const handleProjectCreated = () => {
    setCreateModalOpen(false);
    fetchProjects(); // Refresh the list
  };

  const handleContributionAdded = () => {
    setContributeModalOpen(false);
    setSelectedProjectForContribution(null);
    fetchProjects(); // Refresh the list
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'Active': 'bg-blue-100 text-blue-800',
      'Completed': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || colors['Active'];
  };

  const getPriorityColor = (priority: number) => {
    const colors = {
      1: 'bg-green-100 text-green-800',
      2: 'bg-yellow-100 text-yellow-800',
      3: 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || colors[1];
  };

  const getPriorityLabel = (priority: number) => {
    const labels = { 1: 'Low', 2: 'Medium', 3: 'High' };
    return labels[priority as keyof typeof labels] || 'Low';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Container>
        <div className="space-y-8 py-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          
          <div className="flex gap-4 flex-col sm:flex-row">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-32" />
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-2 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-8 py-8">
        {/* Page Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="text-muted-foreground text-sm">
              Track and manage your settlement&apos;s {statusFilter} projects and their completion status.
            </p>
          </div>
          <div className="flex gap-2">
            {/* View Mode Toggle */}
            <div className="flex bg-muted rounded-lg p-1">
              <Button
                variant={statusFilter === 'Active' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setStatusFilter('Active')}
                className="gap-2"
              >
                <Package className="h-4 w-4" />
                Active
              </Button>
              <Button
                variant={statusFilter === 'Completed' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setStatusFilter('Completed')}
                className="gap-2"
              >
                <Package className="h-4 w-4" />
                Completed
              </Button>
              <Button
                variant={statusFilter === 'Cancelled' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setStatusFilter('Cancelled')}
                className="gap-2"
              >
                <Package className="h-4 w-4" />
                Cancelled
              </Button>
            </div>
            {/* Only show create button for active projects */}
            {(statusFilter === 'Active' || statusFilter === 'all') && (
              <Button className="gap-2" onClick={handleCreateProject}>
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4 flex-col sm:flex-row">
          <div className="relative flex-1">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={`Search ${statusFilter} projects...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="1">Low Priority</SelectItem>
              <SelectItem value="2">Medium Priority</SelectItem>
              <SelectItem value="3">High Priority</SelectItem>
              <SelectItem value="4">Very High Priority</SelectItem>
              <SelectItem value="5">Critical Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Stats */}
        {projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  {statusFilter === 'Active' ? (
                    <Package className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Package className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div className="ml-2">
                    <p className="text-sm font-medium">Total {statusFilter}</p>
                    <p className="text-2xl font-bold">{projects.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            {statusFilter === 'Active' ? (
              <>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <div className="ml-2">
                        <p className="text-sm font-medium">Active</p>
                        <p className="text-2xl font-bold">{projects.filter(p => p.status === 'Active').length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <div className="ml-2">
                        <p className="text-sm font-medium">Completed</p>
                        <p className="text-2xl font-bold">{projects.filter(p => p.status === 'Completed').length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <div className="h-4 w-4 rounded-full bg-gradient-to-r from-blue-500 to-green-500" />
                      <div className="ml-2">
                        <p className="text-sm font-medium">Avg Progress</p>
                        <p className="text-2xl font-bold">
                          {projects.length > 0 ? Math.round(projects.reduce((sum, p) => sum + p.completionPercentage, 0) / projects.length) : 0}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 text-blue-500" />
                      <div className="ml-2">
                        <p className="text-sm font-medium">Unique Contributors</p>
                        <p className="text-2xl font-bold">
                          {projects.reduce((contributors, project) => {
                            // This part needs to be implemented in the API or handled by the backend
                            // For now, we'll just show a placeholder or a placeholder for contributors
                            return contributors;
                          }, new Set()).size}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-green-500" />
                      <div className="ml-2">
                        <p className="text-sm font-medium">Completion Rate</p>
                        <p className="text-2xl font-bold">
                          {Math.round(
                            projects.filter(p => p.status === 'Completed').length /
                            projects.length * 100
                          )}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 text-purple-500" />
                      <div className="ml-2">
                        <p className="text-sm font-medium">Total Items</p>
                        <p className="text-2xl font-bold">
                          {projects.reduce((sum, p) => sum + (p.items?.reduce((itemSum, item) => itemSum + item.requiredQuantity, 0) || 0), 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <div className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' ? (
                  <>
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No projects found</p>
                    <p>Try adjusting your search terms or filters.</p>
                  </>
                ) : statusFilter === 'Active' ? (
                  <>
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No active projects yet</p>
                    <p className="mb-4">Create your first settlement project to get started.</p>
                    <div className="flex gap-2 justify-center">
                      <Button onClick={handleCreateProject}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Project
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No {statusFilter.toLowerCase()} projects</p>
                    <p>Projects with this status will appear here.</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => {
              const StatusIcon = statusIcons[project.status as keyof typeof statusIcons] || Clock;
              return (
                <Card key={project.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-1">{project.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={getStatusColor(project.status)}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {project.status}
                          </Badge>
                          <Badge className={getPriorityColor(project.priority)} variant="outline">
                            {getPriorityLabel(project.priority)} Priority
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
                        <span>
                          {project.totalItems > 0 
                            ? `${project.completedItems} / ${project.totalItems} types`
                            : "Add items to track progress"
                          }
                        </span>
                      </div>
                    </div>

                    {/* Meta Info */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{project.createdBy}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          Created {new Date(project.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      {statusFilter === 'Active' ? (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => handleContribute(project.id)}
                            disabled={project.status !== 'Active'}
                          >
                            <Gift className="h-4 w-4 mr-1" />
                            Contribute
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="px-3"
                            onClick={() => handleViewDetails(project.id)}
                          >
                            View Details
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="outline" className="flex-1" disabled>
                            <Package className="h-4 w-4 mr-1" />
                            Archived
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="px-3"
                            onClick={() => handleViewDetails(project.id)}
                          >
                            View History
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Modals */}
        <CreateProjectModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          onProjectCreated={handleProjectCreated}
        />

        <ContributeModal
          open={contributeModalOpen}
          onOpenChange={setContributeModalOpen}
          projectId={selectedProjectForContribution}
          onContributionAdded={handleContributionAdded}
        />
      </div>
    </Container>
  );
} 