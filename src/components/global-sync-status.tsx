'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  Clock,
  X,
  Database,
  Users,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SyncStatus {
  isActive: boolean;
  type: 'settlement' | 'members' | 'projects' | 'treasury' | 'full' | null;
  message: string;
  progress?: number;
  startTime?: Date;
  details?: string;
  settlement?: {
    id: string;
    name: string;
  };
}

interface SyncResult {
  success: boolean;
  duration?: number;
  itemsProcessed?: number;
  error?: string;
}

interface GlobalSyncStatusProps {
  className?: string;
  position?: 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left';
  autoHide?: boolean;
  autoHideDelay?: number;
}

export function GlobalSyncStatus({ 
  className = '',
  position = 'top-right',
  autoHide = true,
  autoHideDelay = 3000
}: GlobalSyncStatusProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isActive: false,
    type: null,
    message: ''
  });
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Simulate sync status for demo - in real app this would come from context or API
  useEffect(() => {
    // Listen for settlement sync events
    const handleSettlementSync = (event: CustomEvent) => {
      setSyncStatus({
        isActive: true,
        type: 'settlement',
        message: 'Syncing settlement data...',
        startTime: new Date(),
        settlement: event.detail.settlement
      });
      setIsDismissed(false);
    };

    const handleSyncComplete = (event: CustomEvent) => {
      const result = event.detail.result;
      
      setSyncStatus(prev => ({
        ...prev,
        isActive: false,
        message: result.success ? 'Sync completed successfully' : 'Sync failed'
      }));

      setLastResult(result);

      // Auto-hide success messages
      if (autoHide && result.success) {
        setTimeout(() => {
          setIsDismissed(true);
        }, autoHideDelay);
      }
    };

    // Add event listeners
    window.addEventListener('settlement-sync-start', handleSettlementSync as any);
    window.addEventListener('settlement-sync-complete', handleSyncComplete as any);

    return () => {
      window.removeEventListener('settlement-sync-start', handleSettlementSync as any);
      window.removeEventListener('settlement-sync-complete', handleSyncComplete as any);
    };
  }, [autoHide, autoHideDelay]);

  const getElapsedTime = () => {
    if (!syncStatus.startTime) return '';
    const elapsed = Math.floor((Date.now() - syncStatus.startTime.getTime()) / 1000);
    return `${elapsed}s`;
  };

  const getPositionClasses = () => {
    const base = 'fixed z-50';
    switch (position) {
      case 'top-right':
        return `${base} top-4 right-4`;
      case 'bottom-right':
        return `${base} bottom-4 right-4`;
      case 'bottom-left':
        return `${base} bottom-4 left-4`;
      case 'top-left':
        return `${base} top-4 left-4`;
      default:
        return `${base} top-4 right-4`;
    }
  };

  const getSyncIcon = () => {
    if (syncStatus.isActive) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }
    if (lastResult?.success) {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
    if (lastResult?.success === false) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    return <Database className="h-4 w-4 text-muted-foreground" />;
  };

  const getSyncTypeIcon = () => {
    switch (syncStatus.type) {
      case 'members':
        return <Users className="h-3 w-3" />;
      case 'settlement':
        return <Database className="h-3 w-3" />;
      default:
        return <RefreshCw className="h-3 w-3" />;
    }
  };

  const handleRetrySync = () => {
    // Trigger retry sync
    window.dispatchEvent(new CustomEvent('settlement-sync-retry', {
      detail: { settlement: syncStatus.settlement }
    }));
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setLastResult(null);
  };

  // Don't show if dismissed or if there's no active sync and no recent result
  if (isDismissed || (!syncStatus.isActive && !lastResult)) {
    return null;
  }

  return (
    <div className={cn(getPositionClasses(), className)}>
      <Card className={cn(
        "w-80 shadow-lg border transition-all duration-200",
        syncStatus.isActive && "border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20",
        lastResult?.success && "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20",
        lastResult?.success === false && "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20",
        isMinimized && "w-auto"
      )}>
        <CardContent className="p-3">
          {isMinimized ? (
            // Minimized view
            <div className="flex items-center gap-2">
              {getSyncIcon()}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(false)}
                className="h-6 w-6 p-0"
              >
                <Maximize2 className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            // Full view
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getSyncIcon()}
                  <div className="flex items-center gap-1">
                    {syncStatus.type && getSyncTypeIcon()}
                    <span className="font-medium text-sm">
                      {syncStatus.isActive ? 'Syncing' : lastResult?.success ? 'Synced' : 'Sync Failed'}
                    </span>
                  </div>
                  {syncStatus.settlement && (
                    <Badge variant="outline" className="text-xs">
                      {syncStatus.settlement.name}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMinimized(true)}
                    className="h-6 w-6 p-0"
                  >
                    <Minimize2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismiss}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Status Message */}
              <div className="text-sm text-muted-foreground">
                {syncStatus.message}
                {syncStatus.details && (
                  <div className="text-xs mt-1">{syncStatus.details}</div>
                )}
              </div>

              {/* Progress Info */}
              {syncStatus.isActive && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>Elapsed: {getElapsedTime()}</span>
                  </div>
                  {syncStatus.progress && (
                    <span>{syncStatus.progress}%</span>
                  )}
                </div>
              )}

              {/* Success Stats */}
              {lastResult?.success && lastResult.itemsProcessed && (
                <div className="text-xs text-green-700 dark:text-green-300">
                  Processed {lastResult.itemsProcessed.toLocaleString()} items
                  {lastResult.duration && ` in ${Math.round(lastResult.duration / 1000)}s`}
                </div>
              )}

              {/* Error Actions */}
              {lastResult?.success === false && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetrySync}
                    className="h-7 text-xs"
                  >
                    <RefreshCw className="mr-1 h-3 w-3" />
                    Retry
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismiss}
                    className="h-7 text-xs"
                  >
                    Dismiss
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper functions to trigger sync status updates
export const triggerSyncStart = (type: SyncStatus['type'], settlement?: { id: string; name: string }, message?: string) => {
  window.dispatchEvent(new CustomEvent('settlement-sync-start', {
    detail: {
      type,
      settlement,
      message: message || `Syncing ${type} data...`
    }
  }));
};

export const triggerSyncComplete = (result: SyncResult) => {
  window.dispatchEvent(new CustomEvent('settlement-sync-complete', {
    detail: { result }
  }));
}; 