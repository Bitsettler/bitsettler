'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { Activity, Users, DollarSign, Package, Wifi, WifiOff, Pause, Play } from 'lucide-react';
import { 
  settlementRealtimeService, 
  SettlementActivity, 
  RealtimeEventHandlers 
} from '../lib/spacetime-db-new/modules/integrations/realtime-service';

interface LiveActivityFeedProps {
  maxItems?: number;
  autoScroll?: boolean;
  showControls?: boolean;
  className?: string;
}

export function LiveActivityFeed({ 
  maxItems = 50, 
  autoScroll = true, 
  showControls = true,
  className 
}: LiveActivityFeedProps) {
  const [activities, setActivities] = useState<SettlementActivity[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [newActivityCount, setNewActivityCount] = useState(0);

  // Initialize real-time service
  useEffect(() => {
    const handlers: RealtimeEventHandlers = {
      onActivityUpdate: (activity: SettlementActivity) => {
        if (isPaused) {
          setNewActivityCount(prev => prev + 1);
          return;
        }

        setActivities(prev => {
          const updated = [activity, ...prev];
          return updated.slice(0, maxItems);
        });

        // Auto-scroll to top if enabled
        if (autoScroll && scrollAreaRef.current) {
          setTimeout(() => {
            scrollAreaRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
          }, 100);
        }
      },
      onError: (error: Error) => {
        console.error('Real-time error:', error);
        setConnectionStatus('error');
      }
    };

    // Initialize the service
    settlementRealtimeService.initialize(handlers);

    // Check connection status periodically
    const statusInterval = setInterval(() => {
      const status = settlementRealtimeService.getStatus();
      setIsConnected(status.connected);
      setConnectionStatus(status.connected ? 'connected' : 'disconnected');
    }, 2000);

    return () => {
      clearInterval(statusInterval);
      // Don't disconnect here as other components might be using it
    };
  }, [maxItems, autoScroll, isPaused]);

  // Handle pause/resume
  const togglePause = () => {
    setIsPaused(!isPaused);
    if (isPaused) {
      setNewActivityCount(0);
    }
  };

  // Clear all activities
  const clearActivities = () => {
    setActivities([]);
    setNewActivityCount(0);
  };

  // Get icon for activity type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'member_update':
        return <Users className="h-4 w-4 text-blue-500" />;
      case 'treasury_update':
        return <DollarSign className="h-4 w-4 text-green-500" />;
      case 'project_update':
        return <Package className="h-4 w-4 text-purple-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get connection status icon
  const getConnectionIcon = () => {
    if (!isConnected) {
      return <WifiOff className="h-4 w-4 text-red-500" />;
    }
    return <Wifi className="h-4 w-4 text-green-500" />;
  };

  // Format timestamp
  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return timestamp.toLocaleDateString();
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Live Activity
            {newActivityCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                +{newActivityCount}
              </Badge>
            )}
          </CardTitle>
          
          {showControls && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                {getConnectionIcon()}
                <span className="capitalize">{connectionStatus}</span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePause}
                className="h-8 w-8 p-0"
              >
                {isPaused ? (
                  <Play className="h-4 w-4" />
                ) : (
                  <Pause className="h-4 w-4" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={clearActivities}
                className="h-8 px-2 text-xs"
              >
                Clear
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea 
          ref={scrollAreaRef}
          className="h-96 px-6 pb-4"
        >
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Activity className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No recent activity</p>
              {!isConnected && (
                <p className="text-xs mt-1">Waiting for connection...</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity, index) => (
                <div
                  key={`${activity.timestamp.getTime()}-${index}`}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getActivityIcon(activity.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTimestamp(activity.timestamp)}
                    </p>
                  </div>
                  
                  <Badge 
                    variant="outline" 
                    className="text-xs flex-shrink-0"
                  >
                    {activity.type.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 