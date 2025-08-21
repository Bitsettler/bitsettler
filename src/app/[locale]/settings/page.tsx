'use client';

import { useSession } from '@/hooks/use-auth';
import { useState } from 'react';
import { Container } from '../../../components/container';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { ProfileManagement } from '../../../components/profile/profile-management';
import { SettlementManageView } from '../../../views/settlement-views/settlement-manage-view';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Separator } from '../../../components/ui/separator';
import { Checkbox } from '../../../components/ui/checkbox';
import { Label } from '../../../components/ui/label';
import { User, Building, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { useSelectedSettlement } from '../../../hooks/use-selected-settlement';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const { clearSettlement } = useSelectedSettlement();
  const [activeTab, setActiveTab] = useState('account');

  const handleSignOut = () => {
    clearSettlement();
    window.location.href = '/';
  };

  if (status === 'loading') {
    return (
      <Container>
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </Container>
    );
  }

  if (!session) {
    return (
      <Container>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-muted-foreground mb-6">You must be logged in to view this page.</p>
          <a 
            href="/en/auth/signin" 
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Sign In
          </a>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="max-w-6xl mx-auto space-y-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account, settlement, and preferences
            </p>
          </div>
          <Button onClick={handleSignOut} variant="outline" className="text-red-600 hover:text-red-700">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Tabbed Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Account & Profile
            </TabsTrigger>
            {/* <TabsTrigger value="settlement" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Settlement
            </TabsTrigger> */}
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              Preferences
            </TabsTrigger>
          </TabsList>

          {/* Account & Profile Tab */}
          <TabsContent value="account" className="space-y-6">
            <ProfileManagement />
          </TabsContent>

          {/* Settlement Tab */}
          {/* <TabsContent value="settlement" className="space-y-6">
            <SettlementManageView />
          </TabsContent> */}

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>App Preferences</CardTitle>
                <CardDescription>
                  Configure your application settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notifications">Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications about settlement updates
                      </p>
                    </div>
                    <Checkbox id="notifications" defaultChecked />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="analytics">Analytics & Tracking</Label>
                      <p className="text-sm text-muted-foreground">
                        Help improve the app by sharing usage data
                      </p>
                    </div>
                    <Checkbox id="analytics" defaultChecked />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-refresh">Auto-refresh Data</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically refresh settlement data every 5 minutes
                      </p>
                    </div>
                    <Checkbox id="auto-refresh" defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Container>
  );
} 