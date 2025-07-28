'use client';

import { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Wifi, WifiOff, Activity, Clock, AlertCircle } from 'lucide-react';
import { 
  settlementRealtimeService, 
  RealtimeEventHandlers 
} from '../lib/spacetime-db-new/modules/integrations/realtime-service';

interface RealtimeStatusIndicatorProps {
  showLastUpdate?: boolean;
  showActivityCount?: boolean;
  className?: string;
}

export function RealtimeStatusIndicator({ 
  showLastUpdate = true, 
  showActivityCount = false,
  className = '' 
}: RealtimeStatusIndicatorProps) {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [activityCount, setActivityCount] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Set up activity listener if we want to count
    let handlers: RealtimeEventHandlers = {};
    
    if (showActivityCount) {
      handlers = {
        onActivityUpdate: () => {
          setActivityCount(prev => prev + 1);
          setLastUpdate(new Date());
        },
        onMemberUpdate: () => setLastUpdate(new Date()),
        onTreasuryUpdate: () => setLastUpdate(new Date()),
        onProjectUpdate: () => setLastUpdate(new Date()),
        onError: () => setConnectionStatus('error')
      };
      
      settlementRealtimeService.initialize(handlers);
    }

    // Check connection status periodically
    const statusInterval = setInterval(() => {
      const status = settlementRealtimeService.getStatus();
      setIsConnected(status.connected);
      setRetryCount(status.retryCount);
      
      if (status.connected) {
        setConnectionStatus('connected');
      } else if (status.retryCount > 0) {
        setConnectionStatus('reconnecting');
      } else {
        setConnectionStatus('disconnected');
      }
    }, 1000);

    return () => {
      clearInterval(statusInterval);
    };
  }, [showActivityCount]);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500';
      case 'reconnecting':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="h-3 w-3" />;
      case 'reconnecting':
        return <Activity className="h-3 w-3 animate-pulse" />;
      case 'error':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <WifiOff className="h-3 w-3" />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Real-time updates active';
      case 'reconnecting':
        return `Reconnecting... (attempt ${retryCount})`;
      case 'error':
        return 'Connection error - updates paused';
      default:
        return 'Real-time updates offline';
    }
  };

  const formatLastUpdate = () => {
    if (!lastUpdate) return 'No updates yet';
    
    const now = new Date();
    const diffMs = now.getTime() - lastUpdate.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);

    if (diffSecs < 30) return 'Just now';
    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    return lastUpdate.toLocaleTimeString();
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-2 ${className}`}>
            <div className="relative">
              <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
              {connectionStatus === 'connected' && (
                <div className={`absolute inset-0 w-2 h-2 rounded-full ${getStatusColor()} animate-ping opacity-50`} />
              )}
            </div>
            
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {getStatusIcon()}
              <span className="capitalize">{connectionStatus}</span>
            </div>

            {showLastUpdate && lastUpdate && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{formatLastUpdate()}</span>
              </div>
            )}

            {showActivityCount && activityCount > 0 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                {activityCount}
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p className="font-medium">{getStatusText()}</p>
            {showLastUpdate && (
              <p className="text-xs text-muted-foreground mt-1">
                Last update: {formatLastUpdate()}
              </p>
            )}
            {showActivityCount && (
              <p className="text-xs text-muted-foreground mt-1">
                Activities received: {activityCount}
              </p>
            )}
            {retryCount > 0 && (
              <p className="text-xs text-yellow-600 mt-1">
                Retry attempts: {retryCount}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 