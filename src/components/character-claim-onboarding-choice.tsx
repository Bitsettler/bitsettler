'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api-client'
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Key,
  Loader2,
  Search,
  Shield,
  Sparkles,
  Sword,
  User,
  UserPlus,
  Zap,
  CheckCircle2,
  AlertCircle,
  XCircle,
  MessageSquare,
  ExternalLink
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { BitJitaPlayerSearchResponse, BitJitaPlayerSearchRawType } from '@/lib/spacetime-db-new/modules/integrations/bitjita-api';
import { Link } from '@/i18n/navigation'
import { ProfessionSelector } from '@/components/profession-selector'

interface VerificationResult {
  isClaimed: boolean
  message: string
  claimedBy?: string
  characterName?: string
}

// Settlement data types based on the API response structure
interface SettlementData {
  entityId: string;
  name: string;
  tier: number;
  treasury: number;
  supplies: number;
  tiles: number;
  regionName: string;
  regionId: string;
  isOwner: boolean;
  isEstablished: boolean;
  permissions: {
    inventory: boolean;
    build: boolean;
    officer: boolean;
    coOwner: boolean;
  };
}

interface SoloPlayerOption {
  id: 'solo';
  name: string;
  description: string;
  type: 'solo';
}

// Union type for selected settlement
type SelectedSettlement = SettlementData | SoloPlayerOption;

// Type guards
function isSoloPlayer(settlement: SelectedSettlement | null): settlement is SoloPlayerOption {
  return settlement !== null && 'type' in settlement && settlement.type === 'solo';
}

function isSettlementData(settlement: SelectedSettlement | null): settlement is SettlementData {
  return settlement !== null && 'entityId' in settlement;
}

export function CharacterClaimOnboardingChoice() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<BitJitaPlayerSearchResponse | null>(null)
  const [selectedCharacter, setSelectedCharacter] =
    useState<BitJitaPlayerSearchRawType | null>(null)
  const [isClaiming, setIsClaiming] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  
  // New state for verification flow
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
  const [verificationError, setVerificationError] = useState<string | null>(null)
  
  // Step management
  const [currentStep, setCurrentStep] = useState<'search' | 'profession-select' | 'settlement-select' | 'claiming' | 'complete'>('search')
  
  // Profession selection state
  const [primaryProfession, setPrimaryProfession] = useState<string | undefined>()
  const [secondaryProfession, setSecondaryProfession] = useState<string | undefined>()

  // Settlement selection state
  const [settlementsData, setSettlementsData] = useState<Array<SettlementData> | null>(null)
  const [selectedSettlement, setSelectedSettlement] = useState<SelectedSettlement | null>(null)
  const [isLoadingSettlements, setIsLoadingSettlements] = useState(false)
  const [isLoadingNextStep, setIsLoadingNextStep] = useState(false)

  // Solo player option
  const soloPlayerOption: SoloPlayerOption = {
    id: 'solo',
    name: 'Solo Player',
    description: 'Start your journey as a solo player and build your own settlement later',
    type: 'solo'
  }

  // Debounced search function for live search
  const searchCharacters = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults(null)
      setHasSearched(false)
      setSelectedCharacter(null)
      setVerificationResult(null)
      setVerificationError(null)
      return
    }

    setIsSearching(true)
    setSelectedCharacter(null) // Clear previous selection
    setVerificationResult(null)
    setVerificationError(null)
    try {
      const response = await fetch(
        `/api/character/search?q=${encodeURIComponent(query.trim())}`
      )
      const result = await response.json()

      if (result.success) {
        console.log(
          `✅ Found ${result.data.players.length} characters for "${query}"`
        )
        console.log('result.data.players => ', result.data.players)
        setSearchResults(result.data)
        setHasSearched(true)
      } else {
        console.error('❌ Character search failed:', result.error)
        setSearchResults(null)
        setHasSearched(true)
      }
    } catch (err) {
      console.error('❌ Network error during character search:', err)
      setSearchResults(null)
      setHasSearched(true)
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Debounce search input for live search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchCharacters(searchQuery)
    }, 500) // 500ms delay for better UX

    return () => clearTimeout(timer)
  }, [searchQuery, searchCharacters])

  const handleSelectCharacter = (character: BitJitaPlayerSearchRawType) => {
    if( selectedCharacter?.entityId !== character.entityId ) {
      setSelectedCharacter(character)
      setVerificationResult(null)
      setVerificationError(null)
      return
    }
  }

  const handleVerifyOwnership = async () => {
    if (!selectedCharacter || isVerifying) return

    setIsVerifying(true)
    setVerificationError(null)
    try {
      const result = await api.post('/api/character/verify', {
        characterId: selectedCharacter.entityId
      })

      if (result.success) {
        const data = result.data as VerificationResult
        console.log('✅ Character verification result:', data)
        setVerificationResult(data)
      } else {
        console.error('❌ Character verification failed:', result.error)
        setVerificationError(result.error || 'Verification failed')
      }
    } catch (error) {
      console.error('❌ Network error during character verification:', error)
      setVerificationError('Network error. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleClaimCharacter = async () => {
    if (!selectedCharacter || isClaiming || verificationResult?.isClaimed || !selectedSettlement) return

    setCurrentStep('claiming')
    setIsClaiming(true)
    
    try {
        const result = await api.post('/api/character/claim', {
          playerEntityId: selectedCharacter.entityId,
          primaryProfession,
          secondaryProfession,
          settlementId: isSettlementData(selectedSettlement) ? selectedSettlement.entityId : 'solo',
        })

      if (result.success) {
        console.log('✅ Character claimed successfully')
        setCurrentStep('complete')
        
        // Redirect to settlement dashboard after a short delay
        setTimeout(() => {
          window.location.href = '/en/settlement'
        }, 2000)
      } else {
        console.error('❌ Failed to claim character:', result.error)
        alert(`Failed to claim character: ${result.error}`)
        setCurrentStep('settlement-select')
      }
    } catch (error) {
      console.error('❌ Network error during character claim:', error)
      alert('Network error. Please try again.')
      setCurrentStep('settlement-select')
    } finally {
      setIsClaiming(false)
    }
  }
  const getVerificationStatusIcon = () => {
    if (!verificationResult) return null
    
    if (verificationResult.isClaimed) {
      return <XCircle size={24} className="text-red-500" />
    } else if (!verificationResult.isClaimed) {
      return <CheckCircle2 size={24} className="text-green-500" />
    }
    return <AlertCircle size={24} className="text-yellow-500" />
  }

  const handleBackToSearch = () => {
    setCurrentStep('search')
  }

  // Handle transition to settlement selection step with API call
  const handleNextToSettlementSelect = async () => {
    if (!selectedCharacter) return
    
    setIsLoadingNextStep(true)
    try {
      // Call the /character/get-settlement API
      const result = await api.post('/api/character/settlement', {
        playerEntityId: selectedCharacter.entityId,
      })
      
      if (result.success) {
        console.log('✅ Settlement data loaded successfully')      
        const settlements = (result.data as { settlements: SettlementData[] }).settlements || [];
        setSettlementsData(settlements)
        setCurrentStep('settlement-select')
      } else {
        console.error('❌ Failed to load settlement data:', result.error)
        alert(`Failed to load settlement data: ${result.error}`)
      }
    } catch (error) {
      console.error('❌ Network error loading settlement data:', error)
      alert('Network error loading settlement data. Please try again.')
    } finally {
      setIsLoadingNextStep(false)
    }
  }


  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      {/* Header */}
      <div className="space-y-4 text-center">
        <div className="flex items-center justify-center space-x-2">
          <User className="text-primary h-8 w-8" />
          <h1 className="text-3xl font-bold">Claim Your Character</h1>
        </div>
        <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
          Start by claiming your in-game character to access settlement
          management features. Search for your character name to get started.
        </p>
      </div>

      {/* Step-based content */}
      {currentStep === 'search' && (
        <>
          {/* Character Search Card */}
          <Card className="border-border hover:border-primary/50 border-2 transition-all hover:shadow-lg">
            <CardHeader className="space-y-4 text-center">
              <div className="flex justify-center">
                <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/20">
                  <UserPlus className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <div>
                <CardTitle className="text-xl">Find Your Character</CardTitle>
                <CardDescription className="text-base">
                  Search for your character by name to claim ownership and access
                  management features.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="character-search"
                  className="flex items-center space-x-2"
                >
                  <Search className="h-4 w-4" />
                  <span>Character Name</span>
                </Label>
                <div className="relative">
                  <Input
                    id="character-search"
                    placeholder="Type your character name to search..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setSelectedCharacter(null) // Clear selection when typing
                      setVerificationResult(null)
                      setVerificationError(null)
                    }}
                    className="pr-10"
                  />
                  <div className="absolute top-1/2 right-3 -translate-y-1/2 transform">
                    {isSearching ? (
                      <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="text-muted-foreground h-4 w-4" />
                    )}
                  </div>
                </div>
              </div>

              {/* Search Results */}
              {searchResults && searchResults.total > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">
                    Found {searchResults.total} character(s):
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-2 max-h-[500px] overflow-y-auto">
                    {searchResults.players.map((character) => (
                      <Card
                        key={character.entityId}
                        className={`cursor-pointer border-2 p-3 transition-all duration-200 hover:shadow-md ${
                          selectedCharacter?.entityId === character.entityId
                            ? 'border-primary bg-primary/5 shadow-lg scale-[1.02]'
                            : 'border-border hover:border-primary/50 hover:bg-muted/30'
                        }`}
                        onClick={() => handleSelectCharacter(character)}
                      >
                        <CardContent className="p-4">
                          <div className="flex flex-col items-left justify-between space-y-2">
                            <div className="flex items-center justify-start space-x-3">
                              <div className={`p-2 rounded-full transition-colors ${
                                selectedCharacter?.entityId === character.entityId
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-primary/10 text-primary'
                              }`}>
                                <User className="w-5 h-5" />
                              </div>
                              <div className='truncate'>
                                <h4 className="font-semibold">{character.username}</h4>
                              </div>
                            </div>
                            <div className="text-right text-sm text-muted-foreground">
                              <div className="flex items-center space-x-1">
                              <Activity className="h-3 w-3" />
                              <span>
                                Last active:{' '}
                                {character.lastLoginTimestamp
                                  ? new Date(character.lastLoginTimestamp).toLocaleDateString()
                                  : 'Not Found'}
                              </span>
                            </div>
                            </div>
                          </div>
                          
                          {/* Verification Status - appears when this character is selected */}
                          {selectedCharacter?.entityId === character.entityId && (
                            <div className="mt-4 pt-4 border-t border-border">
                              {verificationResult ? (
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2 text-sm">
                                    {getVerificationStatusIcon()}
                                    <span className={verificationResult.isClaimed ? 'text-red-600' : 'text-green-600'}>
                                      {verificationResult.message}
                                    </span>
                                  </div>
                                  {verificationError && (
                                    <div className="space-y-2">
                                      <div className="flex items-center space-x-2 text-sm text-red-600">
                                        <AlertCircle className="h-4 w-4" />
                                        <span>{verificationError}</span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <p className="text-xs">
                                          If this issue persists, please contact us.
                                        </p>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          asChild
                                          className="text-xs h-6"
                                        >
                                          <Link href="/contact" target="_blank">
                                            <MessageSquare className="w-3 h-3 mr-1" />
                                            Contact Us
                                            <ExternalLink className="w-3 h-3 ml-1" />
                                          </Link>
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <Button 
                                  onClick={handleVerifyOwnership} 
                                  className="w-full"
                                  size="sm"
                                  disabled={isVerifying}
                                >
                                  {isVerifying ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Verifying...
                                    </>
                                  ) : (
                                    <>
                                      <Key className="w-4 h-4 mr-2" />
                                      Verify Ownership
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          )}

                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Show helpful text when typing */}
              {searchQuery.length > 0 && searchQuery.length < 2 && !isSearching && (
                <div className="text-muted-foreground py-4 text-center">
                  <Search className="mx-auto mb-2 h-8 w-8 opacity-50" />
                  <p className="text-sm">Type at least 2 characters to search...</p>
                </div>
              )}

              {/* Show no results only after we've actually searched */}
              {searchQuery.length >= 2 &&
                searchResults && searchResults.total === 0 &&
                !isSearching &&
                hasSearched && (
                  <div className="text-muted-foreground py-4 text-center">
                    <User className="mx-auto mb-2 h-8 w-8 opacity-50" />
                    <p className="text-sm">
                      No characters found matching "{searchQuery}"
                    </p>
                    <p className="mt-1 text-xs">
                      Try a different search term or check spelling
                    </p>
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-2">
                        Having trouble finding your character?
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="text-xs"
                      >
                        <Link href="/contact" target="_blank">
                          <MessageSquare className="w-3 h-3 mr-1" />
                          Contact Us
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}

              <div className="text-muted-foreground text-sm">
                <p className="mb-1 font-medium">What happens next:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Verify character ownership</li>
                  <li>• Choose your professions</li>
                  <li>• Access character skills and stats</li>
                  <li>• Connect to settlement management</li>
                </ul>
              </div>

              {/* Next Button - appears when character is verified and available */}
              {verificationResult && !verificationResult?.isClaimed && !verificationError && selectedCharacter && (
                <Button
                  onClick={() => setCurrentStep('profession-select')}
                  className="w-full transition-all duration-200"
                  size="lg"
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Next: Choose Professions
                </Button>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Profession Selection Step */}
      {currentStep === 'profession-select' && (
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Choose Your Professions</CardTitle>
            <CardDescription>
              Define your primary and secondary professions to represent your playstyle
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Selected Character Summary */}
            {selectedCharacter && (
              <Card className="bg-primary/5">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{selectedCharacter.username}</h3>
                      <p className="text-sm text-muted-foreground">
                        Ready to claim and set up your professions
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Profession Selector */}
            <ProfessionSelector
              primaryProfession={primaryProfession}
              secondaryProfession={secondaryProfession}
              onPrimaryChange={setPrimaryProfession}
              onSecondaryChange={setSecondaryProfession}
              allowNone={true}
            />

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={handleBackToSearch}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Character Selection
              </Button>
              
              <Button 
                onClick={handleNextToSettlementSelect}
                className="min-w-[200px]"
                disabled={isClaiming || isLoadingNextStep}
              >
                {isLoadingNextStep ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Next: Choose Settlement
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settlement Selection Step */}
      {currentStep === 'settlement-select' && (
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
                        <Button variant="outline" onClick={() => setCurrentStep('profession-select')}>
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Back to Professions
                        </Button>

                        <Button
                          onClick={handleClaimCharacter}
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
                              Claim {selectedCharacter?.username}
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

      {/* Claiming Step */}
      {currentStep === 'claiming' && (
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Claiming Character</CardTitle>
            <CardDescription>
              Setting up your character and settlement access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
            <div className="text-center text-sm text-muted-foreground space-y-1">
              <p>Linking character: <strong>{selectedCharacter?.username}</strong></p>
              <p>Setting up professions...</p>
              <p>Updating settlement access...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Complete Step */}
      {currentStep === 'complete' && (
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 size={48} className="text-green-500" />
            </div>
            <CardTitle>Character Claimed Successfully!</CardTitle>
            <CardDescription>
              You've successfully claimed {selectedCharacter?.username}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              Redirecting to your settlement dashboard...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Benefits Section - only show on search step */}
      {currentStep === 'search' && (
        <div className="bg-muted/50 rounded-lg p-6">
          <h3 className="mb-4 flex items-center text-lg font-semibold">
            <Sparkles className="mr-2 h-5 w-5" />
            Character Management Benefits
          </h3>
          <div className="grid gap-4 text-sm md:grid-cols-3">
            <div className="space-y-1">
              <div className="flex items-center font-medium">
                <Zap className="mr-2 h-4 w-4" />
                Skill Tracking
              </div>
              <div className="text-muted-foreground">
                Monitor your character's skills and progression
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center font-medium">
                <Shield className="mr-2 h-4 w-4" />
                Settlement Access
              </div>
              <div className="text-muted-foreground">
                Manage your settlement with full permissions
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center font-medium">
                <Activity className="mr-2 h-4 w-4" />
                Activity History
              </div>
              <div className="text-muted-foreground">
                Track your contributions and activities
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help & Support Section - only show on search step */}
      {currentStep === 'search' && (
        <Card className="border-dashed border-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h3 className="flex items-center text-lg font-semibold">
                  <MessageSquare className="mr-2 h-5 w-5 text-blue-600" />
                  Need Help?
                </h3>
                <p className="text-sm text-muted-foreground">
                  Having trouble claiming your character or experiencing issues? 
                  Our support team is here to help!
                </p>
              </div>
              <Button
                variant="outline"
                asChild
                className="flex items-center space-x-2"
              >
                <Link href="/contact" target="_blank">
                  <MessageSquare className="w-4 h-4" />
                  <span>Contact Us</span>
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
