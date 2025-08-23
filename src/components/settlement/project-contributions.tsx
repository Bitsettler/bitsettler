'use client';

import { Clock, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface MemberContribution {
  id: string;
  memberId: string;
  memberName: string;
  itemName: string | null;
  quantity: number;
  description: string | null;
  deliveryMethod: 'Dropbox' | 'Officer Handoff' | 'Added to Building' | 'Other';
  contributedAt: Date;
}

interface ProjectContributionsProps {
  contributions: MemberContribution[];
}

const deliveryMethodColors = {
  'Dropbox': 'bg-blue-100 text-blue-800',
  'Officer Handoff': 'bg-green-100 text-green-800',
  'Added to Building': 'bg-purple-100 text-purple-800',
  'Other': 'bg-gray-100 text-gray-800'
};

export function ProjectContributions({ contributions }: ProjectContributionsProps) {
  const sortedContributions = contributions
    .slice()
    .sort((a, b) => new Date(b.contributedAt).getTime() - new Date(a.contributedAt).getTime());

  const totalContributions = contributions.length;
  const uniqueContributors = new Set(contributions.map(c => c.memberId)).size;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Contribution History
          </CardTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{uniqueContributors} contributors</span>
            </div>
            <span>{totalContributions} total contributions</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {sortedContributions.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contributor</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedContributions.map((contribution) => (
                <TableRow key={contribution.id}>
                  <TableCell>
                    <div className="font-medium">{contribution.memberName}</div>
                  </TableCell>
                  
                  <TableCell>
                    {contribution.itemName || 'General Contribution'}
                  </TableCell>
                  
                  <TableCell>
                    <span className="font-mono">{contribution.quantity.toLocaleString()}x</span>
                  </TableCell>
                  
                  <TableCell>
                    <Badge 
                      className={deliveryMethodColors[contribution.deliveryMethod]}
                      variant="secondary"
                    >
                      {contribution.deliveryMethod}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-sm">
                      <div>{new Date(contribution.contributedAt).toLocaleDateString()}</div>
                      <div className="text-muted-foreground">
                        {new Date(contribution.contributedAt).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {contribution.description && (
                      <div className="text-sm text-muted-foreground max-w-xs truncate">
                        {contribution.description}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No contributions yet. Be the first to contribute to this project!
          </div>
        )}
      </CardContent>
    </Card>
  );
}
