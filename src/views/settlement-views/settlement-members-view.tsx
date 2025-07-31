'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Skeleton } from '../../components/ui/skeleton';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Container } from '../../components/container';
import { useSelectedSettlement } from '../../hooks/use-selected-settlement';
import { useCurrentMember } from '../../hooks/use-current-member';
import { Search, Users, UserCheck, Clock } from 'lucide-react';

interface SettlementMember {
  id: string;
  name: string;
  profession: string;
  professionLevel: number;
  lastOnline: string | null;
  isActive: boolean;
  joinDate: string;
}

interface MembersResponse {
  success: boolean;
  data: SettlementMember[];
  count: number;
  error?: string;
}

export function SettlementMembersView() {
  const [members, setMembers] = useState<SettlementMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [professionFilter, setProfessionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalMembers, setTotalMembers] = useState(0);
  const membersPerPage = 200; // Increased to show all members

  const { selectedSettlement } = useSelectedSettlement();
  const { member, isLoading: memberLoading } = useCurrentMember();

  useEffect(() => {
    // Wait for member data to load before making API calls
    if (memberLoading) return;
    fetchMembers();
  }, [professionFilter, statusFilter, currentPage, selectedSettlement, member, memberLoading]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        limit: membersPerPage.toString(),
        offset: ((currentPage - 1) * membersPerPage).toString(),
        includeInactive: 'true', // Changed to always show ALL members
      });

      if (professionFilter !== 'all') {
        params.append('profession', professionFilter);
      }

      // Add settlement ID if available - use selectedSettlement or fallback to member's settlement
      const settlementId = selectedSettlement?.id || member?.settlement_id;
      
      console.log('🔍 Settlement ID resolution:', {
        selectedSettlement: selectedSettlement?.id,
        memberSettlement: member?.settlement_id,
        finalSettlementId: settlementId,
        memberLoading
      });
      
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
      console.error('Members fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter members by search term (client-side)
  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get unique professions for filter dropdown
  const professions = Array.from(new Set(members.map(m => m.profession))).sort();

  const formatLastOnline = (lastOnline: string | null) => {
    if (!lastOnline) return 'Never';
    
    const date = new Date(lastOnline);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
          <h1 className="text-3xl font-bold">Members Directory</h1>
          <p className="text-muted-foreground text-sm">
            Manage and view all settlement members ({totalMembers} total)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <UserCheck className="h-3 w-3" />
            {members.filter(m => m.isActive).length} Active
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search members by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={professionFilter} onValueChange={setProfessionFilter}>
              <SelectTrigger className="w-full sm:w-48">
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
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Members Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredMembers.map((member) => (
          <Card key={member.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">
                    <a 
                      href={`/en/settlement/members/${encodeURIComponent(member.id)}`}
                      className="hover:text-primary hover:underline cursor-pointer"
                    >
                      {member.name}
                    </a>
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {member.profession}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Lvl {member.professionLevel}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={member.isActive ? 'default' : 'secondary'}>
                    {member.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Last Online
                  </span>
                  <span className="text-xs">
                    {formatLastOnline(member.lastOnline)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Joined</span>
                  <span className="text-xs">
                    {new Date(member.joinDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={`skeleton-${i}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      </div>
    </Container>
  );
} 