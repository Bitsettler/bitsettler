'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Star, User, TrendingUp, ArrowLeftRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSkillNames } from '../hooks/use-skill-names';

interface ProfessionSelectorProps {
  primaryProfession?: string;
  secondaryProfession?: string;
  onPrimaryChange: (profession: string | undefined) => void;
  onSecondaryChange: (profession: string | undefined) => void;
  allowNone?: boolean;
  className?: string;
  memberSkills?: Record<string, number>;
}

interface Skill {
  id: string;
  name: string;
  level: number;
}

export function ProfessionSelector({
  primaryProfession,
  secondaryProfession,
  onPrimaryChange,
  onSecondaryChange,
  allowNone = true,
  className,
  memberSkills = {}
}: ProfessionSelectorProps) {
  const { skillNames, transformSkillsToNames } = useSkillNames();

  // Which slot is active for replacement when both are set
  const [activeSlot, setActiveSlot] = useState<'primary' | 'secondary'>('primary');

  // Convert member skills to a sorted list with skill names
  const availableSkills = useMemo(() => {
    if (!skillNames || Object.keys(skillNames).length === 0) return [];
    
    const skillsWithNames = transformSkillsToNames(memberSkills);
    
    // Create skill objects from available skill names
    return Object.entries(skillNames)
      .map(([skillId, skillName]) => ({
        id: skillName,
        name: skillName,
        level: skillsWithNames[skillName] || 0
      }))
      .sort((a, b) => b.level - a.level); // Sort by skill level descending
  }, [skillNames, memberSkills, transformSkillsToNames]);

  const handleSkillClick = (skillName: string) => {
    const isPrimary = primaryProfession === skillName;
    const isSecondary = secondaryProfession === skillName;

    // If clicking an already-selected skill, clear that slot and make it active
    if (isPrimary) {
      onPrimaryChange(undefined);
      setActiveSlot('primary');
      return;
    }
    if (isSecondary) {
      onSecondaryChange(undefined);
      setActiveSlot('secondary');
      return;
    }

    // If nothing selected → set Primary, then focus Secondary next
    if (!primaryProfession && !secondaryProfession) {
      onPrimaryChange(skillName);
      setActiveSlot('secondary');
      return;
    }

    // If one slot open → fill it
    if (primaryProfession && !secondaryProfession) {
      onSecondaryChange(skillName);
      setActiveSlot('secondary');
      return;
    }
    if (!primaryProfession && secondaryProfession) {
      onPrimaryChange(skillName);
      setActiveSlot('primary');
      return;
    }

    // If both set → replace active slot
    if (primaryProfession && secondaryProfession) {
      if (activeSlot === 'primary') {
        onPrimaryChange(skillName);
      } else {
        onSecondaryChange(skillName);
      }
      return;
    }
  };

  const getSkillByName = (name: string | undefined): Skill | undefined => {
    return name ? availableSkills.find(s => s.name === name) : undefined;
  };

  const selectedPrimary = getSkillByName(primaryProfession);
  const selectedSecondary = getSkillByName(secondaryProfession);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Selection header with slots */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className={cn(
            'h-9 px-3 rounded-full flex items-center gap-2 min-w-0',
            activeSlot === 'primary' && 'ring-2 ring-yellow-500'
          )}
          onClick={() => setActiveSlot('primary')}
        >
          <Star className="h-4 w-4 text-yellow-600" />
          <span className="text-sm font-medium truncate max-w-[120px] sm:max-w-[180px]">
            {primaryProfession || 'Primary'}
          </span>
          {primaryProfession && (
            <X
              className="h-3 w-3 ml-1 opacity-70 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onPrimaryChange(undefined);
                setActiveSlot('primary');
              }}
            />
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          className={cn(
            'h-9 px-3 rounded-full flex items-center gap-2 min-w-0',
            activeSlot === 'secondary' && 'ring-2 ring-blue-500'
          )}
          onClick={() => setActiveSlot('secondary')}
        >
          <User className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium truncate max-w-[120px] sm:max-w-[180px]">
            {secondaryProfession || 'Secondary'}
          </span>
          {secondaryProfession && (
            <X
              className="h-3 w-3 ml-1 opacity-70 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onSecondaryChange(undefined);
                setActiveSlot('secondary');
              }}
            />
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="ml-1"
          onClick={() => {
            // Swap values
            const p = primaryProfession;
            onPrimaryChange(secondaryProfession);
            onSecondaryChange(p);
          }}
          disabled={!primaryProfession && !secondaryProfession}
        >
          <ArrowLeftRight className="h-4 w-4 mr-1" /> Swap
        </Button>
      </div>

      {/* Profession Selection - Single Compact Interface */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <CardDescription className="text-center">
            Tap a skill to fill the highlighted slot. Highest skills are shown first.
          </CardDescription>
          {/* Skill Selection Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {availableSkills.map((skill) => {
              const isPrimary = primaryProfession === skill.name;
              const isSecondary = secondaryProfession === skill.name;
              
              let buttonVariant: "outline" | "default" | "secondary" = "outline";
              let ringClass = "";
              let bgClass = "";
              let statusIcon = null;
              let statusText = "";

              if (isPrimary) {
                buttonVariant = "outline";
                ringClass = "ring-2 ring-yellow-500";
                bgClass = "bg-yellow-500/10 border-yellow-300";
                statusIcon = <Star className="h-4 w-4 text-yellow-600" />;
                statusText = "Primary";
              } else if (isSecondary) {
                buttonVariant = "outline";
                ringClass = "ring-2 ring-blue-500";
                bgClass = "bg-blue-500/10 border-blue-300";
                statusIcon = <User className="h-4 w-4 text-blue-600" />;
                statusText = "Secondary";
              }

              return (
                <Button
                  key={skill.name}
                  variant={buttonVariant}
                  className={cn(
                    "h-auto p-3 flex flex-col items-center gap-1.5 transition-all text-xs sm:text-sm hover:scale-105 min-h-[96px] sm:min-h-[112px] w-full",
                    ringClass,
                    bgClass
                  )}
                  onClick={() => handleSkillClick(skill.name)}
                >
                  <div className="font-medium text-center text-foreground w-full leading-tight whitespace-normal break-words" title={skill.name}>{skill.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {skill.level}
                  </div>
                  {statusIcon && (
                    <div className="flex items-center gap-1 text-xs w-full justify-center">
                      {statusIcon}
                      <span className="font-medium">{statusText}</span>
                    </div>
                  )}
                  {/* No per-tile helper text when unselected to reduce noise */}
                </Button>
              );
            })}
          </div>
          
          {availableSkills.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <div className="text-sm">Loading your skills...</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}