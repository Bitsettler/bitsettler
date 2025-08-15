'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { useCurrentMember } from '@/hooks/use-current-member';

interface SettlementData {
  entityId: string;
  name: string;
  tiles: number;
  regionName: string;
  isOwner: boolean;
  isEstablished: boolean;
}

interface SoloPlayerOption {
  type: 'solo';
}

type SelectedSettlementType = SettlementData | SoloPlayerOption | null;

export default function ClaimSettlementPage() {
  const router = useRouter();
  const { member: currentMember, isLoading: memberLoading, isSolo} = useCurrentMember();
  const [isLoadingSettlements, setIsLoadingSettlements] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [settlementsData, setSettlementsData] = useState<SettlementData[]>([]);
  const [selectedSettlement, setSelectedSettlement] = useState<SelectedSettlementType>(null);

  useEffect(() => {
    if (!memberLoading) {
      fetchSettlements();
    }
  }, [currentMember, memberLoading]);

  const fetchSettlements = async () => {
    try {
      setIsLoadingSettlements(true);

      const result = await api.post('/api/character/settlement', {
        playerEntityId: currentMember?.player_entity_id,
      })
        
        if (result.success) {
            console.log('✅ Settlement data loaded successfully')      
            const settlements = (result.data as { settlements: SettlementData[] }).settlements || [];
            setSettlementsData(settlements)
        } else {
            console.error('❌ Failed to load settlement data:', result.error)
            alert(`Failed to load settlement data: ${result.error}`)
        }

    } catch (error) {
      console.error('Error fetching settlements:', error);
      toast.error('Failed to load settlements. Please try again.');
    } finally {
      setIsLoadingSettlements(false);
    }
  };

  const soloPlayerOption: SoloPlayerOption = { type: 'solo' };

  const isSettlementData = (settlement: SelectedSettlementType): settlement is SettlementData => {
    return settlement !== null && 'entityId' in settlement;
  };

  const isSoloPlayer = (settlement: SelectedSettlementType): settlement is SoloPlayerOption => {
    return settlement !== null && 'type' in settlement && settlement.type === 'solo';
  };

  
  const handleClaimSettlement = async () => {
    if (!selectedSettlement) return;

    try {
      setIsClaiming(true);


      const result = await api.post('/api/character/claim', {
        playerEntityId: currentMember?.player_entity_id,
        settlementId: isSettlementData(selectedSettlement) ? selectedSettlement.entityId : 'solo',
      })

      if (result.success) {
        setTimeout(() => {
          window.location.href = '/en/settlement'
        }, 2000)
      } else {
        console.error('❌ Failed to claim character:', result.error)
        alert(`Failed to claim character: ${result.error}`)
      }  

      toast.success('Successfully claimed settlement!');            
    } catch (error) {
      console.error('Error claiming settlement:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to claim settlement. Please try again.');
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
        <Card>
        <CardHeader className="text-center">
            <CardTitle>Choose Your Settlement</CardTitle>
            <CardDescription>
            Select your established or joinable settlement to manage
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            {/* Two Cards Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: All Settlements */}
            <Card className="h-full">
                <CardHeader>
                <CardTitle className="text-lg">Settlements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                {isLoadingSettlements ? (
                    <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="space-y-3">
                    {/* Display all settlements */}
                    {(settlementsData || []).map((settlement: SettlementData) => {
                        // Determine if settlement is active based on conditions
                        const isActive = settlement.isOwner || (settlement.isEstablished && !settlement.isOwner);
                        
                        return (
                        <Card
                            key={settlement.entityId}
                            className={`cursor-pointer border-2 p-3 transition-all duration-200 ${
                            !isActive ? 'opacity-50 cursor-not-allowed' :
                            isSettlementData(selectedSettlement) && selectedSettlement.entityId === settlement.entityId
                                ? 'border-primary bg-primary/5 shadow-lg scale-[1.02]'
                                : 'border-border hover:border-primary/50 hover:bg-muted/30'
                            }`}
                            onClick={() => isActive && setSelectedSettlement(settlement)}
                        >
                            <CardContent className="p-3">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-sm">{settlement.name}</h4>
                                <span className="text-xs text-muted-foreground">{settlement.tiles} Tiles</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Region: {settlement.regionName}</p>
                                <div className="flex items-center gap-2">
                                {/* Role Badge */}
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                    settlement.isOwner 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                    {settlement.isOwner ? 'Owner' : 'Member'}
                                </span>
                                
                                {/* Status Badge */}
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                    settlement.isEstablished
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {settlement.isEstablished ? 'Established' : 'Not Established'}
                                </span>
                                
                                {/* Active/Inactive Badge */}
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                    isActive
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                    {isActive ? 'Active' : 'Inactive'}
                                </span>
                                </div>
                            </div>
                            </CardContent>
                        </Card>
                        );
                    })}
                    {(!settlementsData?.length) && (
                        <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">No settlements found.</p>
                        </div>
                    )}
                    </div>
                )}
                </CardContent>
            </Card>

            {/* Card 2: Solo Player Option */}
            <Card className="h-full">
                <CardHeader>
                <CardTitle className="text-lg">Solo Player</CardTitle>
                </CardHeader>
                <CardContent>
                <Card
                    className={`cursor-pointer border-2 p-4 transition-all duration-200 hover:shadow-md ${
                    isSoloPlayer(selectedSettlement)
                        ? 'border-primary bg-primary/5 shadow-lg scale-[1.02]'
                        : 'border-border hover:border-primary/50 hover:bg-muted/30'
                    }`}
                    onClick={() => setSelectedSettlement(soloPlayerOption)}
                >
                    <CardContent className="p-4">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                        <h4 className="font-semibold">Solo Player</h4>
                        <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">Independent</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                        Play independently without joining a settlement. You can always join or create a settlement later.
                        </p>
                    </div>
                    </CardContent>
                </Card>
                </CardContent>
            </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4">
            <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
            </Button>

            <Button
                onClick={handleClaimSettlement}
                className="min-w-[200px]"
                disabled={isClaiming || !selectedSettlement || (isSettlementData(selectedSettlement) && !selectedSettlement.isEstablished && !selectedSettlement.isOwner)}
            >
                {isClaiming ? (
                <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Claiming...
                </>
                ) : (
                <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Claim Settlement
                </>
                )}
            </Button>
            </div>
        </CardContent>
        </Card>
    </div>
  );
}
