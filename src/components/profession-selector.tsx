'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Star, User, TrendingUp } from 'lucide-react';
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

    // If already selected, clear it
    if (isPrimary) {
      onPrimaryChange(undefined);
      return;
    }
    if (isSecondary) {
      onSecondaryChange(undefined);
      return;
    }

    // If nothing selected, set as Primary
    if (!primaryProfession && !secondaryProfession) {
      onPrimaryChange(skillName);
      return;
    }

    // If Primary is set but not Secondary, set as Secondary
    if (primaryProfession && !secondaryProfession) {
      onSecondaryChange(skillName);
      return;
    }

    // If Secondary is set but not Primary, set as Primary
    if (!primaryProfession && secondaryProfession) {
      onPrimaryChange(skillName);
      return;
    }

    // If both are set, replace Primary
    if (primaryProfession && secondaryProfession) {
      onPrimaryChange(skillName);
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
      {/* Profession Selection - Single Compact Interface */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <CardDescription className="text-center">
            Click any skill to select it. Your first selection becomes Primary (⭐), your second becomes Secondary (👤). Your highest skills are shown first.
          </CardDescription>
          {/* Skill Selection Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
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
                    "h-auto p-2 sm:p-3 flex flex-col items-center gap-1 sm:gap-2 transition-all text-xs sm:text-sm hover:scale-105 min-h-[80px] sm:min-h-[100px]",
                    ringClass,
                    bgClass
                  )}
                  onClick={() => handleSkillClick(skill.name)}
                >
                  <div className="font-medium text-center text-foreground">{skill.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Level {skill.level}
                  </div>
                  {statusIcon && (
                    <div className="flex items-center gap-1 text-xs">
                      {statusIcon}
                      <span className="font-medium">{statusText}</span>
                    </div>
                  )}
                  {!isPrimary && !isSecondary && (
                    <div className="text-xs text-muted-foreground opacity-60">
                      {!primaryProfession && !secondaryProfession ? "Primary" : 
                       primaryProfession && !secondaryProfession ? "Secondary" :
                       !primaryProfession && secondaryProfession ? "Primary" :
                       "Replace Primary"}
                    </div>
                  )}
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