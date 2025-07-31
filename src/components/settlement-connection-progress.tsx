'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Users, 
  Database, 
  RefreshCw,
  Clock,
  ArrowRight,
  AlertCircle,
  Building
} from 'lucide-react';

export interface Settlement {
  id: string;
  name: string;
  tier: number;
  treasury: number;
  supplies: number;
  tiles: number;
  population: number;
}

interface SyncProgress {
  stage: 'connecting' | 'syncing-members' | 'syncing-citizens' | 'completing' | 'completed' | 'error';
  message: string;
  progress: number;
  details?: string;
  eta?: string;
}

interface SyncResult {
  success: boolean;
  data?: {
    membersFound: number;
    membersAdded: number;
    membersUpdated: number;
    citizensFound: number;
    citizensAdded: number;
    citizensUpdated: number;
    syncDurationMs: number;
    apiCallsMade: number;
  };
  error?: string;
}

interface SettlementConnectionProgressProps {
  settlement: Settlement;
  onConnectionComplete: (settlement: Settlement, syncResult: SyncResult) => void;
  onCancel: () => void;
}

export function SettlementConnectionProgress({
  settlement,
  onConnectionComplete,
  onCancel
}: SettlementConnectionProgressProps) {
  const [progress, setProgress] = useState<SyncProgress>({
    stage: 'connecting',
    message: 'Connecting to settlement...',
    progress: 0,
    details: 'Establishing connection'
  });
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [isRetrying, setIsRetrying] = useState(false);

  const syncStages: SyncProgress[] = [
    {
      stage: 'connecting',
      message: 'Connecting to settlement...',
      progress: 10,
      details: 'Establishing secure connection',
      eta: '2-3 seconds'
    },
    {
      stage: 'syncing-members',
      message: 'Syncing member data...',
      progress: 40,
      details: 'Downloading member profiles and permissions',
      eta: '5-10 seconds'
    },
    {
      stage: 'syncing-citizens',
      message: 'Syncing citizen data...',
      progress: 70,
      details: 'Updating citizen information and skills',
      eta: '3-5 seconds'
    },
    {
      stage: 'completing',
      message: 'Finalizing connection...',
      progress: 90,
      details: 'Preparing your settlement dashboard',
      eta: '1-2 seconds'
    },
    {
      stage: 'completed',
      message: 'Connection established!',
      progress: 100,
      details: 'Ready to explore your settlement'
    }
  ];

  const performSync = async () => {
    setStartTime(new Date());
    
    try {
      // Stage 1: Connecting
      setProgress(syncStages[0]);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Brief connection simulation

      // Stage 2: Syncing members
      setProgress(syncStages[1]);
      
      const response = await fetch('/api/settlement/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'onboarding',
          mode: 'full',
          settlementId: settlement.id,
          settlementName: settlement.name,
          triggeredBy: 'user_onboarding'
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to sync settlement data');
      }

      // Stage 3: Syncing citizens (this happens within the API call above)
      setProgress(syncStages[2]);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Allow UI to show this stage

      // Stage 4: Completing
      setProgress(syncStages[3]);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Stage 5: Completed
      setProgress(syncStages[4]);
      setSyncResult({ success: true, data: result.data });

      // Auto-continue after showing success briefly
      setTimeout(() => {
        onConnectionComplete(settlement, { success: true, data: result.data });
      }, 1500);

    } catch (error) {
      console.error('Settlement sync error:', error);
      
      const errorResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown sync error'
      };
      
      setProgress({
        stage: 'error',
        message: 'Connection failed',
        progress: progress.progress,
        details: errorResult.error
      });
      
      setSyncResult(errorResult);
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    setSyncResult(null);
    await performSync();
    setIsRetrying(false);
  };

  const getElapsedTime = () => {
    const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
    return `${elapsed}s`;
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  // Start sync when component mounts
  useEffect(() => {
    performSync();
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Connecting to Settlement</h1>
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Building className="h-5 w-5" />
          <span className="font-medium">{settlement.name}</span>
          <Badge variant="outline">Tier {settlement.tier}</Badge>
        </div>
      </div>

      {/* Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {progress.stage === 'error' ? (
              <XCircle className="h-5 w-5 text-destructive" />
            ) : progress.stage === 'completed' ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            )}
            {progress.message}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progress.progress} className="h-3" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{progress.details}</span>
              <div className="flex items-center gap-2">
                {progress.eta && progress.stage !== 'completed' && progress.stage !== 'error' && (
                  <>
                    <Clock className="h-3 w-3" />
                    <span>ETA: {progress.eta}</span>
                  </>
                )}
                <span>Elapsed: {getElapsedTime()}</span>
              </div>
            </div>
          </div>

          {/* Stage Details */}
          <div className="grid gap-2 md:grid-cols-4 text-sm">
            {syncStages.slice(0, 4).map((stage, index) => (
              <div 
                key={stage.stage}
                className={`flex items-center gap-2 p-2 rounded-md transition-colors ${
                  progress.stage === stage.stage 
                    ? 'bg-primary/10 text-primary' 
                    : syncStages.findIndex(s => s.stage === progress.stage) > index
                    ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
                    : 'text-muted-foreground'
                }`}
              >
                {syncStages.findIndex(s => s.stage === progress.stage) > index ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : progress.stage === stage.stage ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-current opacity-30" />
                )}
                <span className="font-medium">{stage.message.replace('...', '')}</span>
              </div>
            ))}
          </div>

          {/* Success Stats */}
          {syncResult?.success && syncResult.data && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
              <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                Sync Completed Successfully!
              </h4>
              <div className="grid gap-2 md:grid-cols-2 text-sm text-green-700 dark:text-green-300">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>
                    {formatNumber(syncResult.data.membersFound)} members 
                    ({syncResult.data.membersAdded} new, {syncResult.data.membersUpdated} updated)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  <span>
                    {formatNumber(syncResult.data.citizensFound)} citizens synced
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Completed in {Math.round(syncResult.data.syncDurationMs / 1000)}s</span>
                </div>
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  <span>{syncResult.data.apiCallsMade} API calls made</span>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {progress.stage === 'error' && (
            <div className="mt-4 p-4 bg-destructive/10 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-destructive mb-1">Connection Failed</h4>
                  <p className="text-sm text-destructive/80">{progress.details}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-center">
        {progress.stage === 'error' && (
          <>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleRetry} disabled={isRetrying}>
              {isRetrying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry Connection
                </>
              )}
            </Button>
          </>
        )}
        
        {progress.stage === 'completed' && (
          <Button 
            onClick={() => onConnectionComplete(settlement, syncResult!)} 
            size="lg"
          >
            Continue to Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
} 