'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PROFESSIONS, Profession } from '@/constants/professions';
import { Check, X, Star, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfessionSelectorProps {
  primaryProfession?: string;
  secondaryProfession?: string;
  onPrimaryChange: (profession: string | undefined) => void;
  onSecondaryChange: (profession: string | undefined) => void;
  allowNone?: boolean;
  className?: string;
}

export function ProfessionSelector({
  primaryProfession,
  secondaryProfession,
  onPrimaryChange,
  onSecondaryChange,
  allowNone = true,
  className
}: ProfessionSelectorProps) {
  const [selectionMode, setSelectionMode] = useState<'primary' | 'secondary' | null>(null);

  const handleProfessionClick = (profession: Profession) => {
    if (selectionMode === 'primary') {
      if (primaryProfession === profession.id) {
        // Clicking the same profession deselects it
        onPrimaryChange(undefined);
      } else {
        onPrimaryChange(profession.id);
        // If we're setting the same as secondary, clear secondary
        if (secondaryProfession === profession.id) {
          onSecondaryChange(undefined);
        }
      }
      setSelectionMode(null);
    } else if (selectionMode === 'secondary') {
      if (secondaryProfession === profession.id) {
        // Clicking the same profession deselects it
        onSecondaryChange(undefined);
      } else {
        onSecondaryChange(profession.id);
        // If we're setting the same as primary, clear primary
        if (primaryProfession === profession.id) {
          onPrimaryChange(undefined);
        }
      }
      setSelectionMode(null);
    }
  };

  const handleClearPrimary = () => {
    onPrimaryChange(undefined);
  };

  const handleClearSecondary = () => {
    onSecondaryChange(undefined);
  };

  const getProfessionById = (id: string | undefined): Profession | undefined => {
    return id ? PROFESSIONS.find(p => p.id === id) : undefined;
  };

  const selectedPrimary = getProfessionById(primaryProfession);
  const selectedSecondary = getProfessionById(secondaryProfession);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Selection Status and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Your Professions
          </CardTitle>
          <CardDescription>
            Choose your primary and secondary professions to represent your playstyle and specializations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Primary Profession */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                Primary Profession
              </h4>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={selectionMode === 'primary' ? 'default' : 'outline'}
                  onClick={() => setSelectionMode(selectionMode === 'primary' ? null : 'primary')}
                >
                  {selectionMode === 'primary' ? 'Cancel' : selectedPrimary ? 'Change' : 'Select'}
                </Button>
                {selectedPrimary && allowNone && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleClearPrimary}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            {selectedPrimary ? (
              <Card className="bg-muted/50">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="relative w-12 h-12 rounded-md overflow-hidden flex items-center justify-center text-white font-semibold text-lg"
                      style={{ backgroundColor: selectedPrimary.fallbackColor }}
                    >
                      {selectedPrimary.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium">{selectedPrimary.name}</h5>
                      <p className="text-sm text-muted-foreground">{selectedPrimary.description}</p>
                    </div>
                    <Badge variant="default">Primary</Badge>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-sm text-muted-foreground p-3 border-2 border-dashed rounded-md text-center">
                No primary profession selected
              </div>
            )}
          </div>

          <Separator />

          {/* Secondary Profession */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium flex items-center gap-2">
                <User className="h-4 w-4 text-blue-500" />
                Secondary Profession
              </h4>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={selectionMode === 'secondary' ? 'default' : 'outline'}
                  onClick={() => setSelectionMode(selectionMode === 'secondary' ? null : 'secondary')}
                >
                  {selectionMode === 'secondary' ? 'Cancel' : selectedSecondary ? 'Change' : 'Select'}
                </Button>
                {selectedSecondary && allowNone && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleClearSecondary}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            {selectedSecondary ? (
              <Card className="bg-muted/50">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="relative w-12 h-12 rounded-md overflow-hidden flex items-center justify-center text-white font-semibold text-lg"
                      style={{ backgroundColor: selectedSecondary.fallbackColor }}
                    >
                      {selectedSecondary.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium">{selectedSecondary.name}</h5>
                      <p className="text-sm text-muted-foreground">{selectedSecondary.description}</p>
                    </div>
                    <Badge variant="secondary">Secondary</Badge>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-sm text-muted-foreground p-3 border-2 border-dashed rounded-md text-center">
                No secondary profession selected
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Profession Selection Grid */}
      {selectionMode && (
        <Card>
          <CardHeader>
            <CardTitle>
              Choose {selectionMode === 'primary' ? 'Primary' : 'Secondary'} Profession
            </CardTitle>
            <CardDescription>
              {selectionMode === 'primary' 
                ? 'Select your main profession that best represents your playstyle.'
                : 'Select a secondary profession to show your additional specialization.'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {PROFESSIONS.map((profession) => {
                const isAlreadySelected = 
                  (selectionMode === 'primary' && secondaryProfession === profession.id) ||
                  (selectionMode === 'secondary' && primaryProfession === profession.id);
                
                const isCurrentlySelected = 
                  (selectionMode === 'primary' && primaryProfession === profession.id) ||
                  (selectionMode === 'secondary' && secondaryProfession === profession.id);

                return (
                  <Button
                    key={profession.id}
                    variant="outline"
                    className={cn(
                      "h-auto p-3 flex flex-col items-center space-y-2 transition-all",
                      isCurrentlySelected && "ring-2 ring-primary bg-primary/10",
                      isAlreadySelected && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={() => !isAlreadySelected && handleProfessionClick(profession)}
                    disabled={isAlreadySelected}
                  >
                    <div 
                      className="relative w-12 h-12 rounded-md overflow-hidden flex items-center justify-center text-white font-semibold text-lg"
                      style={{ backgroundColor: profession.fallbackColor }}
                    >
                      {profession.name.charAt(0)}
                      {isCurrentlySelected && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <Check className="h-5 w-5 text-primary" />
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-sm">{profession.name}</div>
                      {isAlreadySelected && (
                        <div className="text-xs text-muted-foreground">
                          Already {selectionMode === 'primary' ? 'secondary' : 'primary'}
                        </div>
                      )}
                    </div>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}