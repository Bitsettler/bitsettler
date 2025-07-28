'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Plus, Search, Filter, CheckCircle2, Clock, XCircle } from 'lucide-react';
import Link from 'next/link';

interface ProjectItem {
  id: string;
  projectId: string;
  itemName: string;
  requiredQuantity: number;
  currentQuantity: number;
  tier: number;
  priority: number;
  rankOrder: number;
  status: 'Needed' | 'In Progress' | 'Completed';
  assignedMemberId: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ProjectWithItems {
  id: string;
  name: string;
  description: string | null;
  status: 'Active' | 'Completed' | 'Cancelled';
  priority: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  items: ProjectItem[];
  completionPercentage: number;
  totalItems: number;
  completedItems: number;
}

interface ProjectsResponse {
  success: boolean;
  data: ProjectWithItems[];
  count: number;
  pagination: {
    limit?: number;
    offset?: number;
  };
  includesItems: boolean;
  error?: string;
}

const statusIcons = {
  'Active': Clock,
  'Completed': CheckCircle2,
  'Cancelled': XCircle,
};

const statusColors = {
  'Active': 'bg-blue-500',
  'Completed': 'bg-green-500',
  'Cancelled': 'bg-gray-500',
};

export function SettlementProjectsView() {
  const [projects, setProjects] = useState<ProjectWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    fetchProjects();
  }, [statusFilter, currentPage]);

  async function fetchProjects() {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        includeItems: 'true',
        limit: itemsPerPage.toString(),
        offset: ((currentPage - 1) * itemsPerPage).toString(),
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/settlement/projects?${params}`);
      const data: ProjectsResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch projects');
      }

      setProjects(data.data || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }

  // Filter projects by search term
  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="flex gap-4">
          <Skeleton className="h-10 w-80" />
          <Skeleton className="h-10 w-40" />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
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
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-destructive mb-4">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Failed to load projects</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchProjects} variant="outline" className="w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground text-sm">
            Track and manage your settlement's active projects and their completion status.
          </p>
        </div>
        <Button className="gap-2" disabled>
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <div className="text-muted-foreground">
              {searchTerm ? (
                <>
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No projects found</p>
                  <p>Try adjusting your search terms or filters.</p>
                </>
              ) : (
                <>
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No projects yet</p>
                  <p>Settlement projects will appear here when they're created.</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => {
            const StatusIcon = statusIcons[project.status];
            return (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg leading-tight">
                        <Link 
                          href={`/settlement/projects/${project.id}`}
                          className="hover:text-primary transition-colors"
                        >
                          {project.name}
                        </Link>
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {project.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Priority {project.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                  {project.description && (
                    <CardDescription className="text-sm line-clamp-2">
                      {project.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Progress */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span className="font-medium">{project.completionPercentage}%</span>
                      </div>
                      <Progress value={project.completionPercentage} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {project.completedItems} of {project.totalItems} items completed
                      </p>
                    </div>

                    {/* Key Stats */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total Items</p>
                        <p className="font-medium">{project.totalItems}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Completed</p>
                        <p className="font-medium">{project.completedItems}</p>
                      </div>
                    </div>

                    {/* Action */}
                    <Link href={`/settlement/projects/${project.id}`}>
                      <Button variant="outline" size="sm" className="w-full mt-2">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination Info */}
      {filteredProjects.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          Showing {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
          {searchTerm && ' matching your search'}
        </div>
      )}
    </div>
  );
} 