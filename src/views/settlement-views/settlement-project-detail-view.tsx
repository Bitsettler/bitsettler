'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Container } from '@/components/container';
import { ArrowLeft, Package, Users, Clock, CheckCircle2, XCircle, Gift, AlertCircle, RefreshCw, TrendingUp, User } from 'lucide-react';
import Link from 'next/link';
import { type ProjectDetails } from '@/lib/spacetime-db-new/modules';

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

interface MemberContribution {
  id: string;
  memberId: string;
  memberName: string;
  contributionType: 'Item' | 'Crafting' | 'Gathering' | 'Other';
  itemName: string | null;
  quantity: number;
  description: string | null;
  contributedAt: Date;
}

interface ProjectDetails {
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
  contributions: MemberContribution[];
  assignedMembers: Array<{
    id: string;
    name: string;
    role: string;
    assignedAt: Date;
  }>;
  totalContributions: number;
  contributingMembers: number;
}

interface ProjectDetailResponse {
  success: boolean;
  data: ProjectDetails | null;
  error?: string;
}

const statusIcons = {
  'Active': Clock,
  'Completed': CheckCircle2,
  'Cancelled': XCircle,
};

const statusColors = {
  'Active': 'text-blue-600 bg-blue-50 border-blue-200',
  'Completed': 'text-green-600 bg-green-50 border-green-200',
  'Cancelled': 'text-gray-600 bg-gray-50 border-gray-200',
};

const itemStatusColors = {
  'Needed': 'text-orange-600 bg-orange-50 border-orange-200',
  'In Progress': 'text-blue-600 bg-blue-50 border-blue-200',
  'Completed': 'text-green-600 bg-green-50 border-green-200',
};

export function SettlementProjectDetailView() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjectDetails = useCallback(async () => {
    if (!projectId) {
      setError('Project ID not found in URL');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/settlement/projects/${projectId}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch project details');
      }

      if (!result.data) {
        throw new Error('Project not found');
      }

      setProject(result.data);
    } catch (err) {
      console.error('Error fetching project details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProjectDetails();
  }, [projectId, fetchProjectDetails]);

  // Auto-refresh data when window regains focus (user comes back from contributing)
  useEffect(() => {
    const handleFocus = () => {
      if (project) {
        fetchProjectDetails();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [project, fetchProjectDetails]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32 mt-2" />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="border rounded-lg p-4">
                    <Skeleton className="h-5 w-48 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-2 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/settlement/projects">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Projects
            </Button>
          </Link>
        </div>

        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-destructive mb-4">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Failed to load project</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {error || 'Project not found'}
              </p>
              <div className="flex gap-2">
                <Button onClick={fetchProjectDetails} variant="outline" className="flex-1">
                  Try Again
                </Button>
                <Link href="/settlement/projects" className="flex-1">
                  <Button variant="default" className="w-full">
                    Back to Projects
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const StatusIcon = statusIcons[project.status];

  return (
    <Container>
      <div className="space-y-8 py-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Link href="/settlement/projects">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Projects
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
              <div className="flex items-center gap-3 mt-2">
                <Badge className={statusColors[project.status]} variant="outline">
                  {project.status === 'Active' && <Clock className="h-3 w-3 mr-1" />}
                  {project.status === 'Completed' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                  {project.status === 'Cancelled' && <XCircle className="h-3 w-3 mr-1" />}
                  {project.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Priority {project.priority}
                </span>
                <span className="text-sm text-muted-foreground">
                  Created {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchProjectDetails}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button className="gap-2" disabled>
              Edit Project
            </Button>
          </div>
        </div>

        {project.description && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">{project.description}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 md:col-span-2">
            {/* Project Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Required Items ({project.totalItems || 0})
                </CardTitle>
                <CardDescription>
                  Materials and items needed to complete this project
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!project.items || project.items.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No items defined for this project yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {project.items
                      .sort((a, b) => a.rankOrder - b.rankOrder || b.priority - a.priority)
                      .map((item) => (
                        <div key={item.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium">{item.itemName}</h4>
                              <div className="flex items-center gap-3 mt-1">
                                <Badge variant="outline" className={itemStatusColors[item.status]}>
                                  {item.status}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  Tier {item.tier}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  Priority {item.priority}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Cross-reference link to compendium */}
                              <Link 
                                href={`/compendium?search=${encodeURIComponent(item.itemName)}`}
                                className="text-xs text-primary hover:underline"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                View in Compendium →
                              </Link>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progress</span>
                              <span className="font-medium">
                                {item.currentQuantity} / {item.requiredQuantity}
                              </span>
                            </div>
                            <Progress 
                              value={(item.currentQuantity / item.requiredQuantity) * 100} 
                              className="h-2" 
                            />
                          </div>

                          {item.assignedMemberId && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <User className="h-4 w-4" />
                              <span>Assigned to member {item.assignedMemberId}</span>
                            </div>
                          )}

                          {item.notes && (
                            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
                              {item.notes}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Contributions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Recent Contributions
                </CardTitle>
                <CardDescription>
                  Latest member contributions to this project
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!project.contributions || project.contributions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No contributions recorded yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {project.contributions
                      .sort((a, b) => new Date(b.contributedAt).getTime() - new Date(a.contributedAt).getTime())
                      .slice(0, 10)
                      .map((contribution) => (
                        <div key={contribution.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{contribution.memberName}</span>
                              <Badge variant="secondary" className="text-xs">
                                {contribution.contributionType}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {contribution.itemName && (
                                <span>{contribution.quantity}x {contribution.itemName}</span>
                              )}
                              {contribution.description && (
                                <span> - {contribution.description}</span>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(contribution.contributedAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Progress Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Completion</span>
                    <span className="font-medium">{project.completionPercentage || 0}%</span>
                  </div>
                  <Progress value={project.completionPercentage || 0} className="h-3" />
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{project.completedItems || 0}</div>
                    <div className="text-xs text-muted-foreground">Completed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {(project.totalItems || 0) - (project.completedItems || 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Remaining</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Project Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Contributions</span>
                  <span className="font-medium">{project.totalContributions || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Contributing Members</span>
                  <span className="font-medium">{project.contributingMembers || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Assigned Members</span>
                  <span className="font-medium">{project.assignedMembers?.length || 0}</span>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="font-medium text-sm">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last Updated</span>
                  <span className="font-medium text-sm">
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Assigned Members */}
            {project.assignedMembers && project.assignedMembers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Assigned Members
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {project.assignedMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{member.name}</div>
                          <div className="text-xs text-muted-foreground">{member.role}</div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(member.assignedAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
} 