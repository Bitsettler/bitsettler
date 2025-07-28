'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Award, TrendingUp, Users, Target } from 'lucide-react';

export function SettlementSkillsView() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Skills</h1>
        <p className="text-muted-foreground text-sm">
          Track member skills, progression, and settlement capabilities across all professions.
        </p>
      </div>

      {/* Skills Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Skills</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">
              Across all members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Level</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7.8</div>
            <p className="text-xs text-muted-foreground">
              Settlement-wide average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Profession</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Combat</div>
            <p className="text-xs text-muted-foreground">
              15 members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Skill Points</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">
              Total earned
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Profession Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Profession Skill Distribution</CardTitle>
          <CardDescription>Settlement capabilities across different professions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { profession: 'Combat', members: 15, avgLevel: 9.1, maxLevel: 12 },
              { profession: 'Construction', members: 12, avgLevel: 8.5, maxLevel: 11 },
              { profession: 'Crafting', members: 10, avgLevel: 7.8, maxLevel: 10 },
              { profession: 'Gathering', members: 8, avgLevel: 6.2, maxLevel: 9 }
            ].map((prof) => (
              <div key={prof.profession} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{prof.profession}</span>
                    <Badge variant="outline">{prof.members} members</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Avg Level: {prof.avgLevel} / Max: {prof.maxLevel}
                  </div>
                </div>
                <Progress 
                  value={(prof.avgLevel / prof.maxLevel) * 100} 
                  className="h-2"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon Notice */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-muted-foreground" />
            Detailed Skills Tracking Coming Soon
          </CardTitle>
          <CardDescription>
            Advanced features planned for skills management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 text-sm text-muted-foreground">
            <div>
              <h4 className="font-medium text-foreground mb-2">Individual Member Skills</h4>
              <ul className="space-y-1">
                <li>• Detailed skill progression tracking</li>
                <li>• Personal skill trees and specializations</li>
                <li>• Skill comparison and recommendations</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">Settlement Capabilities</h4>
              <ul className="space-y-1">
                <li>• Required vs available skills for projects</li>
                <li>• Skill gap analysis and training priorities</li>
                <li>• Settlement expertise ratings</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 