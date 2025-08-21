'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface PlayerProfile {
  entityId: string
  userName: string
  lastLoginTimestamp?: string
  settlements: Array<{
    entityId: string
    name: string
    tier: number
    treasury: number
    supplies: number
    tiles: number
    regionName: string
    regionId: string
    permissions: {
      inventory: boolean
      build: boolean
      officer: boolean
      coOwner: boolean
    }
  }>
  empires: Array<{
    entityId: string
    name: string
    rank: number
    donatedShards: number
    nobleSince: string
  }>
  skills: Record<string, {
    level: number
    xp: number
    progressToNext: number
    tool?: string
    toolTier?: number
    toolRarity?: string
  }>
  exploration: {
    totalExplored: number
    totalChunks: number
    progress: number
    regions: Array<{
      name: string
      explored: number
      total: number
      progress: number
    }>
  }
  inventory?: {
    toolbelt: Array<{
      itemId: string
      name: string
      tier: number
      rarity: string
      quantity: number
    }>
    wallet: Array<{
      itemId: string
      name: string
      quantity: number
    }>
    storage: Array<{
      location: string
      items: Array<{
        itemId: string
        name: string
        tier: number
        rarity: string
        quantity: number
      }>
    }>
  }
  lastSyncedAt: string
}

export default function TestPlayerProfilePage() {
  const [playerId, setPlayerId] = useState('360287970202125909') // Default to the example player
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<PlayerProfile | null>(null)
  const [testInfo, setTestInfo] = useState<any>(null)

  const fetchPlayerProfile = async (testType: 'full' | 'skills' | 'inventory' | 'test-headers' = 'full') => {
    setLoading(true)
    setError(null)
    setProfile(null)
    setTestInfo(null)

    try {
      const response = await fetch('/api/test/player-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId,
          testType
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch player profile')
      }

      setProfile(result.data)
      setTestInfo(result.testInfo)
      console.log('Player profile data:', result.data)
      
      // Add detailed logging for debugging
      console.log('=== DETAILED DATA ANALYSIS ===')
      console.log('Entity ID:', result.data?.entityId)
      console.log('User Name:', result.data?.userName)
      console.log('Settlements:', result.data?.settlements)
      console.log('Empires:', result.data?.empires)
      console.log('Skills:', result.data?.skills)
      console.log('Exploration:', result.data?.exploration)
      console.log('Inventory:', result.data?.inventory)
      
      if (result.data?.inventory) {
        console.log('=== INVENTORY BREAKDOWN ===')
        console.log('Toolbelt:', result.data.inventory.toolbelt)
        console.log('Wallet:', result.data.inventory.wallet)
        console.log('Storage:', result.data.inventory.storage)
      }
      
      if (result.data?.skills) {
        console.log('=== SKILLS BREAKDOWN ===')
        console.log('Skills object:', result.data.skills)
        console.log('Skills keys:', Object.keys(result.data.skills))
        console.log('Skills count:', Object.keys(result.data.skills).length)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Error fetching player profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Player Profile Test</h1>
        <p className="text-muted-foreground">
          Test the new BitJita player profile API functionality
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Configuration</CardTitle>
          <CardDescription>
            Enter a BitJita player ID to test the profile fetching
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={playerId}
              onChange={(e) => setPlayerId(e.target.value)}
              placeholder="Enter BitJita player ID"
              className="flex-1"
            />
            <Button 
              onClick={() => fetchPlayerProfile('full')}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Fetch Full Profile'}
            </Button>
            <Button 
              onClick={() => fetchPlayerProfile('skills')}
              disabled={loading}
              variant="outline"
            >
              {loading ? 'Loading...' : 'Fetch Skills Only'}
            </Button>
            <Button 
              onClick={() => fetchPlayerProfile('inventory')}
              disabled={loading}
              variant="outline"
            >
              {loading ? 'Loading...' : 'Fetch Inventory'}
            </Button>
            <Button 
              onClick={() => fetchPlayerProfile('test-headers')}
              disabled={loading}
              variant="outline"
            >
              {loading ? 'Loading...' : 'Test Headers'}
            </Button>
          </div>
          
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 font-medium">Error:</p>
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {testInfo && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-blue-800 font-medium">Test Info:</p>
              <pre className="text-sm text-blue-600 mt-2">
                {JSON.stringify(testInfo, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {profile && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="settlements">Settlements</TabsTrigger>
            <TabsTrigger value="empires">Empires</TabsTrigger>
            <TabsTrigger value="exploration">Exploration</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>{profile.userName}</CardTitle>
                <CardDescription>Player ID: {profile.entityId}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{profile.skills ? Object.keys(profile.skills).length : 0}</p>
                    <p className="text-sm text-muted-foreground">Skills</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{profile.settlements ? profile.settlements.length : 0}</p>
                    <p className="text-sm text-muted-foreground">Settlements</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{profile.empires ? profile.empires.length : 0}</p>
                    <p className="text-sm text-muted-foreground">Empires</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{profile.exploration ? formatNumber(profile.exploration.totalExplored) : '0'}</p>
                    <p className="text-sm text-muted-foreground">Chunks Explored</p>
                  </div>
                </div>
                
                {profile.lastLoginTimestamp && (
                  <div>
                    <p className="text-sm text-muted-foreground">Last Login:</p>
                    <p>{formatDate(profile.lastLoginTimestamp)}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="skills">
            <Card>
              <CardHeader>
                <CardTitle>Skills & Experience</CardTitle>
                <CardDescription>
                  {profile.skills ? Object.keys(profile.skills).length : 0} skills tracked
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {profile.skills ? Object.entries(profile.skills)
                    .sort(([,a], [,b]) => b.level - a.level)
                    .map(([skillName, skillData]) => (
                      <div key={skillName} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium capitalize">{skillName}</h4>
                          <p className="text-sm text-muted-foreground">
                            Level {skillData.level} • {formatNumber(skillData.xp)} XP
                          </p>
                          {skillData.tool && (
                            <p className="text-xs text-muted-foreground">
                              Using: {skillData.tool} (T{skillData.toolTier} {skillData.toolRarity})
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary">
                            {skillData.progressToNext.toFixed(1)}% to {skillData.level + 1}
                          </Badge>
                        </div>
                      </div>
                    )) : (
                      <p className="text-muted-foreground">No skills data available</p>
                    )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settlements">
            <Card>
              <CardHeader>
                <CardTitle>Settlements</CardTitle>
                <CardDescription>
                  {profile.settlements ? profile.settlements.length : 0} settlement memberships
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {profile.settlements && profile.settlements.length > 0 ? profile.settlements.map((settlement) => (
                    <div key={settlement.entityId} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{settlement.name}</h4>
                        <Badge>T{settlement.tier}</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Treasury</p>
                          <p>{formatNumber(settlement.treasury)} coins</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Supplies</p>
                          <p>{formatNumber(settlement.supplies)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Tiles</p>
                          <p>{formatNumber(settlement.tiles)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Region</p>
                          <p>{settlement.regionName}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex gap-1">
                        {settlement.permissions.inventory && <Badge variant="outline">Inventory</Badge>}
                        {settlement.permissions.build && <Badge variant="outline">Build</Badge>}
                        {settlement.permissions.officer && <Badge variant="outline">Officer</Badge>}
                        {settlement.permissions.coOwner && <Badge variant="outline">Co-Owner</Badge>}
                      </div>
                    </div>
                  )) : (
                    <p className="text-muted-foreground">No settlement data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="empires">
            <Card>
              <CardHeader>
                <CardTitle>Empires</CardTitle>
                <CardDescription>
                  {profile.empires ? profile.empires.length : 0} empire memberships
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {profile.empires && profile.empires.length > 0 ? profile.empires.map((empire) => (
                    <div key={empire.entityId} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{empire.name}</h4>
                        <Badge>Rank {empire.rank}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Donated Shards</p>
                          <p>{formatNumber(empire.donatedShards)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Noble Since</p>
                          <p>{formatDate(empire.nobleSince)}</p>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <p className="text-muted-foreground">No empire data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="exploration">
            <Card>
              <CardHeader>
                <CardTitle>Exploration Progress</CardTitle>
                <CardDescription>
                  {profile.exploration ? `${formatNumber(profile.exploration.totalExplored)} / ${formatNumber(profile.exploration.totalChunks)} chunks explored` : 'No exploration data available'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {profile.exploration ? (
                  <div className="space-y-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${profile.exploration.progress}%` }}
                      ></div>
                    </div>
                    <p className="text-center text-sm text-muted-foreground">
                      {profile.exploration.progress.toFixed(2)}% complete
                    </p>
                    
                    {profile.exploration.regions && profile.exploration.regions.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">By Region</h4>
                        <div className="grid gap-2">
                          {profile.exploration.regions.map((region) => (
                            <div key={region.name} className="flex items-center justify-between p-2 border rounded">
                              <span className="text-sm">{region.name}</span>
                              <span className="text-sm text-muted-foreground">
                                {formatNumber(region.explored)} / {formatNumber(region.total)} ({region.progress.toFixed(1)}%)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No exploration data available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory">
            <Card>
              <CardHeader>
                <CardTitle>Inventory</CardTitle>
                <CardDescription>
                  {profile.inventory ? 'Inventory data available' : 'No inventory data available'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {profile.inventory ? (
                  <div className="space-y-6">
                    {profile.inventory.toolbelt.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Toolbelt</h4>
                        <div className="grid gap-2">
                          {profile.inventory.toolbelt.map((item) => (
                            <div key={item.itemId} className="flex items-center justify-between p-2 border rounded">
                              <span className="text-sm">{item.name}</span>
                              <div className="flex gap-2">
                                <Badge variant="outline">T{item.tier}</Badge>
                                <Badge variant="outline">{item.rarity}</Badge>
                                <span className="text-sm text-muted-foreground">x{item.quantity}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {profile.inventory.wallet.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Wallet</h4>
                        <div className="grid gap-2">
                          {profile.inventory.wallet.map((item) => (
                            <div key={item.itemId} className="flex items-center justify-between p-2 border rounded">
                              <span className="text-sm">{item.name}</span>
                              <span className="text-sm text-muted-foreground">x{item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Inventory data not included in this API response</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
