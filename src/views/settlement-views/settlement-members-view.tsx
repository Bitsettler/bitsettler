'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Skeleton } from '../../components/ui/skeleton';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Container } from '../../components/container';
import { useCurrentMember } from '../../hooks/use-current-member';
import { Search, Users, UserCheck, Crown, Shield, Hammer, Package, Clock, TrendingUp, Award, Calendar } from 'lucide-react';
import { getDisplayProfession, getSecondaryProfession } from '../../lib/utils/profession-utils';
import { getMemberActivityInfo } from '../../lib/utils/member-activity';


interface SettlementMember {
  id: string;
  player_entity_id: string;
  name: string;
  top_profession: string;
  primary_profession?: string;
  secondary_profession?: string;
  highest_level: number;
  total_skills: number;
  total_level: number;
  total_xp: number;
  is_active: boolean;
  last_login_timestamp: string | null;
  joined_settlement_at: string | null;
  entity_id: string;
  // Permissions
  inventory_permission: number;
  build_permission: number;
  officer_permission: number;
  co_owner_permission: number;
}

interface MembersResponse {
  success: boolean;
  error?: string;
  data: {
    members: SettlementMember[];
    memberCount: number;
  };
}

export function SettlementMembersView() {
  const router = useRouter();
  const [members, setMembers] = useState<SettlementMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [professionFilter, setProfessionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [groupByProfession, setGroupByProfession] = useState<boolean>(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalMembers, setTotalMembers] = useState(0);
  const membersPerPage = 200; // Increased to show all members

  const { member, isLoading: memberLoading } = useCurrentMember();

  useEffect(() => {
    // Wait for member data to load before making API calls
    if (memberLoading) return;
    fetchMembers();
  }, [professionFilter, statusFilter, currentPage, member, memberLoading]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        limit: membersPerPage.toString(),
        offset: ((currentPage - 1) * membersPerPage).toString(),
        includeInactive: 'false', // Show only active settlement members (Phase 2)
      });

      if (professionFilter !== 'all') {
        params.append('profession', professionFilter);
      }

      const settlementId = member?.settlement_id;
            
      if (!settlementId) {
        throw new Error('No settlement available - please select a settlement or claim a character');
      }
      
      params.append('settlementId', settlementId);

      const response = await fetch(`/api/settlement/members?${params}`);
      const result: MembersResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch members');
      }

      setMembers(result.data.members || []);
      setTotalMembers(result.data.memberCount || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort members by search term and status (client-side)
  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase());
    const activityInfo = getMemberActivityInfo(member);
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && activityInfo.isRecentlyActive) || 
      (statusFilter === 'inactive' && !activityInfo.isRecentlyActive);
    return matchesSearch && matchesStatus;
  }).sort((a, b) => a.name.localeCompare(b.name)); // Sort A-Z by default

  // Group members by profession if enabled
  const groupedMembers = groupByProfession 
    ? filteredMembers.reduce((groups, member) => {
        const profession = getDisplayProfession(member);
        if (!groups[profession]) {
          groups[profession] = [];
        }
        groups[profession].push(member);
        return groups;
      }, {} as Record<string, SettlementMember[]>)
    : null;

  // Get unique professions for filter dropdown
  const professions = Array.from(new Set(members.map(m => m.top_profession))).sort();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getMemberRole = (member: SettlementMember) => {
    if (member.co_owner_permission >= 1) {
      return { label: 'Co-Owner', icon: Crown, variant: 'default' as const };
    }
    if (member.officer_permission >= 1) {
      return { label: 'Officer', icon: Shield, variant: 'secondary' as const };
    }
    if (member.build_permission >= 1) {
      return { label: 'Builder', icon: Hammer, variant: 'outline' as const };
    }
    if (member.inventory_permission >= 1) {
      return { label: 'Inventory', icon: Package, variant: 'outline' as const };
    }
    return { label: 'Member', icon: Users, variant: 'outline' as const };
  };

  const formatTimeAgo = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (loading) {
    return <MembersLoadingSkeleton />;
  }

  if (error) {
    return (
      <Container>
        <div className="space-y-6 py-8">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <Users className="h-5 w-5" />
                Error Loading Members
              </CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Settlement features may be disabled if Supabase is not configured.
              </p>
              <Button onClick={fetchMembers} className="mt-4">
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </Container>
    );
  }

  const totalPages = Math.ceil(totalMembers / membersPerPage);

  return (
    <Container>
      <div className="space-y-6 py-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Settlement Members</h1>
          <p className="text-muted-foreground text-sm">
            {totalMembers} total members
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <UserCheck className="h-3 w-3" />
            {members.filter(m => getMemberActivityInfo(m).isRecentlyActive).length} Recently Active
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Users className="h-3 w-3" />
            {members.filter(m => !getMemberActivityInfo(m).isRecentlyActive).length} Inactive
          </Badge>
        </div>
      </div>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Members Directory</CardTitle>
          <CardDescription>
            Manage and view all settlement members with their professions, roles, and activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6 flex-col sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search members by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={professionFilter} onValueChange={setProfessionFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Professions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Professions</SelectItem>
                {professions.map(profession => (
                  <SelectItem key={profession} value={profession}>
                    {profession}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Recently Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant={groupByProfession ? "default" : "outline"}
              size="sm"
              onClick={() => setGroupByProfession(!groupByProfession)}
            >
              {groupByProfession ? "Ungroup" : "Group by Profession"}
            </Button>
          </div>
        </CardContent>
        
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Professions</TableHead>
                <TableHead className="text-center">Role</TableHead>
                <TableHead className="text-center">Level</TableHead>
                <TableHead className="text-center">Last Active</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupByProfession && groupedMembers ? (
                // Grouped view by profession
                Object.entries(groupedMembers)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([profession, professionMembers]) => (
                    <React.Fragment key={profession}>
                      {/* Profession Group Header */}
                      <TableRow className="bg-muted/30 hover:bg-muted/40">
                        <TableCell colSpan={7} className="font-semibold text-foreground">
                          <div className="flex items-center gap-2 py-1">
                            <span className="text-lg">👥</span>
                            <span>{profession} ({professionMembers.length} member{professionMembers.length !== 1 ? 's' : ''})</span>
                          </div>
                        </TableCell>
                      </TableRow>
                      {/* Members in this profession */}
                      {professionMembers.map((member) => {
                        const memberRole = getMemberRole(member);
                        const RoleIcon = memberRole.icon;
                        return (
                          <TableRow 
                            key={member.id} 
                            className="hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => router.push(`/en/settlement/members/${encodeURIComponent(member.player_entity_id)}`)}
                          >
                            <TableCell>
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                                  {getInitials(member.name)}
                                </AvatarFallback>
                              </Avatar>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{member.name}</div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Joined {formatTimeAgo(member.joined_settlement_at)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="font-medium">
                                  {getDisplayProfession(member)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {getSecondaryProfession(member) ? `Secondary: ${getSecondaryProfession(member)}` : 'No secondary profession'}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={memberRole.variant} className="gap-1">
                                <RoleIcon className="h-3 w-3" />
                                {memberRole.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="text-sm">
                                <div className="font-medium flex items-center justify-center gap-1">
                                  <TrendingUp className="h-3 w-3" />
                                  Level {member.highest_level || 1}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {formatNumber(member.total_xp || 0)} XP
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="text-sm">
                                <div className="font-medium">{formatTimeAgo(member.last_login_timestamp)}</div>
                                {member.last_login_timestamp && (
                                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {new Date(member.last_login_timestamp).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              {(() => {
                                const activityInfo = getMemberActivityInfo(member);
                                return (
                                  <Badge variant={activityInfo.isRecentlyActive ? 'default' : 'secondary'}>
                                    {activityInfo.isRecentlyActive ? 'Recently Active' : 'Inactive'}
                                  </Badge>
                                );
                              })()}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </React.Fragment>
                  ))
              ) : (
                // Regular ungrouped view
                filteredMembers.map((member) => {
                  const memberRole = getMemberRole(member);
                  const RoleIcon = memberRole.icon;
                  return (
                    <TableRow 
                      key={member.id} 
                      className="hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/en/settlement/members/${encodeURIComponent(member.player_entity_id)}`)}
                    >
                      <TableCell>
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Joined {formatTimeAgo(member.joined_settlement_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">
                            {getDisplayProfession(member)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {getSecondaryProfession(member) ? `Secondary: ${getSecondaryProfession(member)}` : 'No secondary profession'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={memberRole.variant} className="gap-1">
                          <RoleIcon className="h-3 w-3" />
                          {memberRole.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="text-sm">
                          <div className="font-medium flex items-center justify-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            Level {member.highest_level || 1}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatNumber(member.total_xp || 0)} XP
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="text-sm">
                          <div className="font-medium">{formatTimeAgo(member.last_login_timestamp)}</div>
                          {member.last_login_timestamp && (
                            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(member.last_login_timestamp).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {(() => {
                          const activityInfo = getMemberActivityInfo(member);
                          return (
                            <Badge variant={activityInfo.isRecentlyActive ? 'default' : 'secondary'}>
                              {activityInfo.isRecentlyActive ? 'Recently Active' : 'Inactive'}
                            </Badge>
                          );
                        })()}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          
          {filteredMembers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No members found</p>
              <p className="text-sm">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <Button
                  key={`page-${page}`}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {filteredMembers.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Members Found</h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'Try adjusting your search terms.' : 'No members match the current filters.'}
            </p>
          </CardContent>
        </Card>
      )}
      </div>
    </Container>
  );
}

function MembersLoadingSkeleton() {
  return (
    <Container>
      <div className="space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-6 w-24" />
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Professions</TableHead>
                <TableHead className="text-center">Role</TableHead>
                <TableHead className="text-center">Level</TableHead>
                <TableHead className="text-center">Last Active</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  <TableCell>
                    <Skeleton className="h-10 w-10 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Skeleton className="h-6 w-20 mx-auto" />
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-16 mx-auto" />
                      <Skeleton className="h-3 w-12 mx-auto" />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-16 mx-auto" />
                      <Skeleton className="h-3 w-20 mx-auto" />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Skeleton className="h-5 w-16 mx-auto" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      </div>
    </Container>
  );
}