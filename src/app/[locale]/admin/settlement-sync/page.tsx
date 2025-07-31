'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Database, Download, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function SettlementSyncPage() {
  const [status, setStatus] = useState<'idle' | 'checking' | 'syncing' | 'complete' | 'error'>('idle');
  const [syncData, setSyncData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const checkStatus = async () => {
    setStatus('checking');
    setError(null);

    try {
      const response = await fetch('/api/admin/sync-settlements', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();
      console.log('Status check result:', result);

      if (result.success) {
        setSyncData(result.data);
        setStatus('idle');
      } else {
        setError(result.error || 'Failed to check status');
        setStatus('error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
      setStatus('error');
    }
  };

  const startSync = async () => {
    setStatus('syncing');
    setError(null);
    setProgress(0);

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 2, 95));
    }, 1000);

    try {
      const response = await fetch('/api/admin/sync-settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'full' })
      });

      const result = await response.json();
      clearInterval(progressInterval);
      setProgress(100);

      console.log('Sync result:', result);

      if (result.success) {
        setSyncData(result.data);
        setStatus('complete');
      } else {
        setError(result.error || 'Sync failed');
        setStatus('error');
      }
    } catch (err) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : 'Network error');
      setStatus('error');
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Database className="w-8 h-8" />
          <div>
            <h1 className="text-3xl font-bold">Settlement Database Sync</h1>
            <p className="text-muted-foreground">
              Populate the database with all settlements from BitJita API
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>Current Status</span>
            </CardTitle>
            <CardDescription>
              Check the current state of settlement data in the database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Button onClick={checkStatus} disabled={status === 'checking'}>
                {status === 'checking' ? 'Checking...' : 'Check Status'}
              </Button>
              
              {syncData && (
                <div className="flex items-center space-x-4">
                  <Badge variant="outline">
                    {syncData.totalSettlements || 0} settlements
                  </Badge>
                  <Badge variant={syncData.needsSync ? 'destructive' : 'secondary'}>
                    {syncData.needsSync ? 'Needs Sync' : 'Has Data'}
                  </Badge>
                </div>
              )}
            </div>

            {syncData && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-sm font-medium">Total Settlements</p>
                  <p className="text-2xl font-bold">{syncData.totalSettlements || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Last Sync</p>
                  <p className="text-sm text-muted-foreground">
                    {syncData.lastSyncTime 
                      ? new Date(syncData.lastSyncTime).toLocaleString()
                      : 'Never'
                    }
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Download className="w-5 h-5" />
              <span>Full Settlement Sync</span>
            </CardTitle>
            <CardDescription>
              Fetch all ~2,335 settlements from BitJita and populate the database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Button 
                onClick={startSync} 
                disabled={status === 'syncing'}
                className="flex items-center space-x-2"
              >
                {status === 'syncing' ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>Syncing...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Start Full Sync</span>
                  </>
                )}
              </Button>

              {status === 'complete' && (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  ✅ Sync Complete
                </Badge>
              )}
            </div>

            {status === 'syncing' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Fetching settlements from BitJita API... This may take a few minutes.
                </p>
              </div>
            )}

            {syncData && status === 'complete' && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">Sync Results</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-green-600">Settlements Found:</span>
                    <span className="ml-2 font-medium">{syncData.settlementsFound || 0}</span>
                  </div>
                  <div>
                    <span className="text-green-600">New Settlements:</span>
                    <span className="ml-2 font-medium">{syncData.settlementsAdded || 0}</span>
                  </div>
                  <div>
                    <span className="text-green-600">Updated:</span>
                    <span className="ml-2 font-medium">{syncData.settlementsUpdated || 0}</span>
                  </div>
                  <div>
                    <span className="text-green-600">Duration:</span>
                    <span className="ml-2 font-medium">{syncData.syncDurationMs || 0}ms</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {error && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                <span>Error</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>What happens during sync?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm space-y-1">
              <p>• Fetches all settlements from BitJita claims API</p>
              <p>• Stores complete settlement data (location, tier, treasury, etc.)</p>
              <p>• Generates unique invite codes for each settlement</p>
              <p>• Creates search indexes for fast settlement lookup</p>
              <p>• Updates existing settlements with latest data</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}