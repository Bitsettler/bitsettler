'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Separator } from '../../components/ui/separator';
// import { Alert, AlertDescription } from '../../components/ui/alert';
import { CompactSettlementInviteCode } from '../../components/settlement-invite-code-compact';
import { useSelectedSettlement } from '../../hooks/use-selected-settlement';
import { 
  ArrowLeft,
  Building, 
  Users, 
  Shield,
  Database,
  RefreshCw as Refresh,
  Trash2,
  AlertTriangle,
  Info,
  Settings,
  Clock,
  Globe
} from 'lucide-react';

export function SettlementManageView() {
  const { selectedSettlement, inviteCode, regenerateInviteCode, clearSettlement } = useSelectedSettlement();

  const handleBackToDashboard = () => {
    window.location.href = '/en/settlement';
  };

  const handleSwitchSettlement = () => {
    clearSettlement();
    window.location.href = '/en/settlement';
  };

  const handleRefreshData = () => {
    // Future: Trigger data refresh
    console.log('Refreshing settlement data...');
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat().format(num);
  };

  if (!selectedSettlement) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Settlement Management</h1>
          <p className="text-muted-foreground">No settlement selected</p>
          <Button onClick={() => window.location.href = '/en/settlement'}>
            Select Settlement
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBackToDashboard}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Settlement Management</h1>
            <p className="text-muted-foreground">Administrative settings and controls</p>
          </div>
        </div>
        {inviteCode && (
          <CompactSettlementInviteCode 
            inviteCode={inviteCode}
            onRegenerate={regenerateInviteCode}
          />
        )}
      </div>

      {/* Current Settlement Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Current Settlement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <Building className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{selectedSettlement.name}</h2>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Tier {selectedSettlement.tier}</span>
                  <span>•</span>
                  <span>{formatNumber(selectedSettlement.population)} members</span>
                  <span>•</span>
                  <span>{formatNumber(selectedSettlement.tiles)} tiles</span>
                  <span>•</span>
                  <span>{formatNumber(selectedSettlement.treasury)} treasury</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Connected</Badge>
              <Badge variant="outline">ID: {selectedSettlement.id.slice(-8)}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settlement Administration */}
      <div className="grid gap-6 md:grid-cols-2">
        
        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Data Synchronization</h4>
                  <p className="text-sm text-muted-foreground">
                    Settlement data syncs every 30 minutes from BitJita
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleRefreshData}>
                  <Refresh className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Data Sources</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Globe className="h-3 w-3" />
                    <span>BitJita.com API</span>
                    <Badge variant="secondary" className="text-xs">Active</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    <span>Last sync: Just now</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Access Control */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Access Control
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium">Invite Management</h4>
                <p className="text-sm text-muted-foreground">
                  Control who can access your settlement data
                </p>
              </div>
              
              {inviteCode && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Active Invite Code</span>
                    <Badge variant="outline" className="font-mono">
                      {inviteCode.formattedCode}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Created: {new Date(inviteCode.createdAt).toLocaleDateString()}
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Future Features</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Users className="h-3 w-3" />
                    <span>Member role management</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-3 w-3" />
                    <span>Permission controls</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Settings className="h-3 w-3" />
                    <span>Admin delegations</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="h-4 w-4 text-blue-600 mt-0.5" />
              <p className="text-sm text-blue-800">
                Settlement features are currently running in demo mode. To enable full functionality, 
                configure Supabase credentials in your environment.
              </p>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <h4 className="font-medium text-sm">Application Version</h4>
              <p className="text-sm text-muted-foreground">v1.7.0</p>
            </div>
            <div className="space-y-1">
              <h4 className="font-medium text-sm">Settlement ID</h4>
              <p className="text-sm text-muted-foreground font-mono">{selectedSettlement.id}</p>
            </div>
            <div className="space-y-1">
              <h4 className="font-medium text-sm">Connection Status</h4>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Demo Mode</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
              <p className="text-sm text-red-800">
                These actions cannot be undone. Proceed with caution.
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Switch Settlement</h4>
                <p className="text-sm text-muted-foreground">
                  Disconnect from current settlement and select a different one
                </p>
              </div>
              <Button variant="outline" onClick={handleSwitchSettlement}>
                <Trash2 className="h-4 w-4 mr-2" />
                Switch Settlement
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 