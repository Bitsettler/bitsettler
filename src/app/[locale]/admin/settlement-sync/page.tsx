'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Database, Download, CheckCircle, Clock, AlertCircle, RotateCcw, User } from 'lucide-react';

export default function SettlementSyncPage() {
  const [status, setStatus] = useState<'idle' | 'checking' | 'complete' | 'error'>('idle');
  const [syncData, setSyncData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Reset user experience states
  const [resetStatus, setResetStatus] = useState<'idle' | 'resetting' | 'complete' | 'error'>('idle');
  const [resetData, setResetData] = useState<any>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  // Clear and repull settlements states
  const [clearStatus, setClearStatus] = useState<'idle' | 'clearing' | 'complete' | 'error'>('idle');
  const [clearData, setClearData] = useState<any>(null);
  const [clearError, setClearError] = useState<string | null>(null);
  const [clearProgress, setClearProgress] = useState(0);

  // Treasury polling states
  const [treasuryStatus, setTreasuryStatus] = useState<'idle' | 'starting' | 'active' | 'stopping' | 'error'>('idle');
  const [treasuryData, setTreasuryData] = useState<any>(null);
  const [treasuryError, setTreasuryError] = useState<string | null>(null);

  const checkStatus = async () => {
    setStatus('checking');
    setError(null);

    try {
      const response = await fetch('/api/settlement/sync', {
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

  const resetUserExperience = async () => {
    setResetStatus('resetting');
    setResetError(null);

    try {
      const response = await fetch('/api/admin/reset-user-experience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();
      console.log('Reset result:', result);

      if (result.success) {
        setResetData(result.data);
        setResetStatus('complete');
      } else {
        setResetError(result.error || 'Reset failed');
        setResetStatus('error');
      }
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Network error');
      setResetStatus('error');
    }
  };

  const clearAndRepullSettlements = async () => {
    setClearStatus('clearing');
    setClearError(null);
    setClearProgress(0);

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setClearProgress(prev => Math.min(prev + 3, 95));
    }, 800);

    try {
      const response = await fetch('/api/admin/clear-and-repull-settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();
      clearInterval(progressInterval);
      setClearProgress(100);

      console.log('Clear and repull result:', result);

      if (result.success) {
        setClearData(result.data);
        setClearStatus('complete');
        // Also refresh the sync data to show updated counts
        checkStatus();
      } else {
        setClearError(result.error || 'Clear and repull failed');
        setClearStatus('error');
      }
    } catch (err) {
      clearInterval(progressInterval);
      setClearError(err instanceof Error ? err.message : 'Network error');
      setClearStatus('error');
    }
  };

  const startTreasuryPolling = async () => {
    setTreasuryStatus('starting');
    setTreasuryError(null);
    setTreasuryData(null);

    try {
      const response = await fetch('/api/settlement/treasury?action=start_polling', {
        method: 'GET'
      });

      const result = await response.json();
      console.log('Treasury polling result:', result);

      if (result.success) {
        setTreasuryStatus('active');
        setTreasuryData(result);
      } else {
        setTreasuryStatus('error');
        setTreasuryError('Failed to start treasury polling');
      }
    } catch (err) {
      setTreasuryStatus('error');
      setTreasuryError(err instanceof Error ? err.message : 'Network error');
    }
  };

  const checkTreasuryStatus = async () => {
    try {
      const response = await fetch('/api/settlement/treasury?action=polling_status');
      const result = await response.json();
      
      if (result.success && result.status?.isPolling) {
        setTreasuryStatus('active');
        setTreasuryData(result);
      } else {
        setTreasuryStatus('idle');
      }
    } catch (err) {
      console.warn('Failed to check treasury status:', err);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Database className="w-8 h-8" />
          <div>
            <h1 className="text-3xl font-bold">Admin Tools</h1>
            <p className="text-muted-foreground">
              Settlement database management and user experience tools
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
              <User className="w-5 h-5" />
              <span>Reset User Experience</span>
            </CardTitle>
            <CardDescription>
              Clear all user claims and data for fresh testing (keeps BitJita settlement data)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">⚠️ What this does:</h4>
              <div className="text-sm text-yellow-700 space-y-1">
                <p>• Clears all character claims (resets supabase_user_id to NULL)</p>
                <p>• Removes onboarding completion timestamps</p>
                <p>• Clears user activity, calculator saves, contributions</p>
                <p>• <strong>Keeps all BitJita settlement & member data intact</strong></p>
                <p>• Allows fresh settlement establishment/joining experience</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button 
                onClick={resetUserExperience} 
                disabled={resetStatus === 'resetting'}
                variant="destructive"
                className="flex items-center space-x-2"
              >
                {resetStatus === 'resetting' ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>Resetting...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset User Experience</span>
                  </>
                )}
              </Button>

              {resetStatus === 'complete' && (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  ✅ Reset Complete
                </Badge>
              )}
            </div>

            {resetData && resetStatus === 'complete' && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">Reset Results</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-green-600">Claims Reset:</span>
                    <span className="ml-2 font-medium">{resetData.resetClaims || 0}</span>
                  </div>
                  <div>
                    <span className="text-green-600">Preserved Settlements:</span>
                    <span className="ml-2 font-medium">{resetData.preserved?.settlements || 0}</span>
                  </div>
                  <div>
                    <span className="text-green-600">Available Characters:</span>
                    <span className="ml-2 font-medium">{resetData.preserved?.availableCharacters || 0}</span>
                  </div>
                  <div>
                    <span className="text-green-600">Calculator Saves Cleared:</span>
                    <span className="ml-2 font-medium">{resetData.cleanedData?.calculator_saves || 0}</span>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-blue-50 rounded text-sm text-blue-700">
                  <strong>Ready for fresh experience!</strong> You can now visit{' '}
                  <a href="/en/settlement" className="underline">/en/settlement</a> to start over.
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Download className="w-5 h-5" />
              <span>Refresh Settlement Database</span>
            </CardTitle>
            <CardDescription>
              Clear all settlement data and re-import fresh from BitJita API (~2,335 settlements)
              <br />
              <span className="text-sm text-amber-600 font-medium">⚠️ Warning: Makes ~25 API calls to BitJita</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="font-medium text-amber-800 mb-2">🔄 What this does:</h4>
              <div className="text-sm text-amber-700 space-y-1">
                <p>• Clears all existing settlement data from database</p>
                <p>• Fetches latest settlement data from BitJita API</p>
                <p>• Imports all ~2,335 settlements with fresh member rosters</p>
                <p>• Generates new invite codes and search indexes</p>
                <p>• Ensures completely up-to-date settlement information</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button 
                onClick={clearAndRepullSettlements} 
                disabled={clearStatus === 'clearing'}
                className="flex items-center space-x-2"
              >
                {clearStatus === 'clearing' ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>Refreshing Database...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Refresh Settlement Database</span>
                  </>
                )}
              </Button>

              {clearStatus === 'complete' && (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  ✅ Complete
                </Badge>
              )}
            </div>

            {clearStatus === 'clearing' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progress</span>
                  <span>{clearProgress}%</span>
                </div>
                <Progress value={clearProgress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Refreshing settlement database from BitJita API... This may take several minutes.
                </p>
              </div>
            )}

            {clearData && clearStatus === 'complete' && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">Database Refresh Results</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-green-600">Settlements Refreshed:</span>
                    <span className="ml-2 font-medium">{clearData.importResults?.settlementsAdded || 0}</span>
                  </div>
                  <div>
                    <span className="text-green-600">Members Imported:</span>
                    <span className="ml-2 font-medium">{clearData.importResults?.membersAdded || 0}</span>
                  </div>
                  <div>
                    <span className="text-green-600">Previous Data Cleared:</span>
                    <span className="ml-2 font-medium">{clearData.deletionResults?.settlements_master || 0} settlements</span>
                  </div>
                  <div>
                    <span className="text-green-600">Total Time:</span>
                    <span className="ml-2 font-medium">{Math.round((clearData.timing?.totalTimeMs || 0) / 1000)}s</span>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-blue-50 rounded text-sm text-blue-700">
                  <strong>Fresh database ready!</strong> All settlement data has been re-imported from BitJita.
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {clearError && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                <span>Database Refresh Error</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600">{clearError}</p>
            </CardContent>
          </Card>
        )}

        {resetError && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                <span>Reset Error</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600">{resetError}</p>
            </CardContent>
          </Card>
        )}

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
            <CardTitle>What happens during database refresh?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm space-y-1">
              <p>• Clears all existing settlement data from database</p>
              <p>• Fetches all settlements from BitJita claims API</p>
              <p>• Imports complete settlement data (location, tier, treasury, etc.)</p>
              <p>• Imports all member rosters with skills and professions</p>
              <p>• Generates unique invite codes for each settlement</p>
              <p>• Creates search indexes for fast settlement lookup</p>
              <p>• Ensures completely fresh, up-to-date data</p>
            </div>
          </CardContent>
        </Card>
        {/* Treasury Polling Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <RotateCcw className="w-5 h-5" />
              <span>Treasury Polling</span>
            </CardTitle>
            <CardDescription>
              Start collecting historical treasury balance data for charts and analytics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Button 
                onClick={startTreasuryPolling} 
                disabled={treasuryStatus === 'starting' || treasuryStatus === 'active'}
                className="flex items-center space-x-2"
              >
                {treasuryStatus === 'starting' ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>Starting...</span>
                  </>
                ) : treasuryStatus === 'active' ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Polling Active</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>Start Treasury Polling</span>
                  </>
                )}
              </Button>

              <Button 
                onClick={checkTreasuryStatus} 
                variant="outline"
                size="sm"
              >
                Check Status
              </Button>

              {/* Sample data creation removed for production readiness */}
            </div>

            {treasuryStatus === 'active' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h4 className="font-medium text-green-800">Treasury Polling Active</h4>
                </div>
                <p className="text-green-700 text-sm mt-1">
                  Collecting treasury balance snapshots every 5 minutes for historical charts.
                </p>
                {treasuryData?.initialSnapshot && (
                  <div className="text-green-600 text-xs mt-2">
                    Initial snapshot: {treasuryData.initialSnapshot.balance} coins
                  </div>
                )}
              </div>
            )}

            {treasuryError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <h4 className="font-medium text-red-800">Treasury Polling Error</h4>
                </div>
                <p className="text-red-700 text-sm mt-1">{treasuryError}</p>
              </div>
            )}

            <div className="text-muted-foreground text-sm">
              <p><strong>Note:</strong> Treasury polling collects balance snapshots for the treasury charts page. It only records significant changes (&gt;100 coins) or daily snapshots to avoid database clutter.</p>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}