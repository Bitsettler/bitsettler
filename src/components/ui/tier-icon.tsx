'use client';

import Image from 'next/image';
import { getSettlementTierBadgeClasses } from '@/lib/settlement/tier-colors';
import { cn } from '@/lib/utils';

interface TierIconProps {
  tier: number;
  variant?: 'brico-style' | 'text-badge' | 'game-asset';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showTierText?: boolean;
}

// Convert tier number to Roman numeral (like brico.app)
function getTierRoman(tier: number): string {
  switch (tier) {
    case 0: return '0';
    case 1: return 'I';
    case 2: return 'II';
    case 3: return 'III';
    case 4: return 'IV';
    case 5: return 'V';
    case 6: return 'VI';
    case 7: return 'VII';
    case 8: return 'VIII';
    case 9: return 'IX';
    case 10: return 'X';
    default: return String(tier);
  }
}

export function TierIcon({ 
  tier, 
  variant = 'brico-style', 
  size = 'md', 
  className,
  showTierText = false 
}: TierIconProps) {
  // Size configurations
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  };

  // Text badge sizes
  const textSizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm', 
    lg: 'px-4 py-2 text-base'
  };

  if (variant === 'text-badge') {
    return (
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-md border font-medium',
          getSettlementTierBadgeClasses(tier),
          textSizeClasses[size],
          className
        )}
      >
        {showTierText ? `Tier ${tier}` : `T${tier}`}
      </span>
    );
  }

  if (variant === 'game-asset') {
    const imageSizes = {
      sm: { width: 20, height: 20 },
      md: { width: 28, height: 28 },
      lg: { width: 36, height: 36 }
    };
    const { width, height } = imageSizes[size];
    return (
      <Image
        src={`/assets/Badges/badge-tier-number-${tier}.webp`}
        alt={`Tier ${tier}`}
        width={width}
        height={height}
        className={cn('rounded', className)}
        title={`Tier ${tier}`}
      />
    );
  }

  // Default 'brico-style' variant - Roman numeral with tier color background (like brico.app!)
  const roman = getTierRoman(tier);
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-bold',
        getSettlementTierBadgeClasses(tier),
        sizeClasses[size],
        className
      )}
      title={`Tier ${tier}`}
    >
      {roman}
    </div>
  );
}

// Preset configurations for common use cases - brico.app style!
export function SettlementTierIcon({ tier, className }: { tier: number; className?: string }) {
  return <TierIcon tier={tier} variant="brico-style" size="lg" className={className} />;
}

export function ItemTierIcon({ tier, className }: { tier: number; className?: string }) {
  return <TierIcon tier={tier} variant="brico-style" size="sm" className={className} />;
}

export function ProjectTierIcon({ tier, className }: { tier: number; className?: string }) {
  return <TierIcon tier={tier} variant="brico-style" size="md" className={className} />;
}

// Text-based tier badge with CSS colors (for when you want text instead of game badges)
interface TierBadgeProps {
  tier: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showTierText?: boolean;
  variant?: 'default' | 'outline' | 'subtle';
}

export function TierBadge({ 
  tier, 
  size = 'md', 
  className,
  showTierText = true,
  variant = 'default'
}: TierBadgeProps) {
  return (
    <TierIcon 
      tier={tier} 
      variant="text-badge" 
      size={size} 
      className={className}
      showTierText={showTierText}
    />
  );
}

// Simple tier text with just color styling (no background)
export function TierText({ 
  tier, 
  className,
  showTierText = true 
}: { 
  tier: number; 
  className?: string; 
  showTierText?: boolean; 
}) {
  return (
    <span className={cn('font-medium text-muted-foreground', className)}>
      {showTierText ? `Tier ${tier}` : `T${tier}`}
    </span>
  );
}

// Tier progression display - shows multiple tiers in sequence using game badges
interface TierProgressionProps {
  currentTier: number;
  maxTier?: number;
  className?: string;
}

export function TierProgression({ currentTier, maxTier = 10, className }: TierProgressionProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {Array.from({ length: maxTier + 1 }, (_, i) => (
        <TierIcon
          key={i}
          tier={i}
          variant="brico-style"
          size="sm"
          className={cn(
            'transition-all duration-200',
            i <= currentTier 
              ? 'opacity-100 scale-100' 
              : 'opacity-30 scale-90 grayscale'
          )}
        />
      ))}
    </div>
  );
}

// Skill icon component using actual game skill assets
interface SkillIconProps {
  skillName: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SkillIcon({ skillName, size = 'md', className }: SkillIconProps) {
  const sizeClasses = {
    sm: { width: 20, height: 20 },
    md: { width: 32, height: 32 },
    lg: { width: 48, height: 48 }
  };

  const { width, height } = sizeClasses[size];
  
  // Convert skill name to icon filename format
  const iconName = `SkillIcon${skillName.charAt(0).toUpperCase() + skillName.slice(1).toLowerCase()}`;
  
  return (
    <Image
      src={`/assets/Skill/${iconName}.webp`}
      alt={`${skillName} skill icon`}
      width={width}
      height={height}
      className={cn('rounded', className)}
      onError={(e) => {
        // Fallback to generic skill icon if specific one doesn't exist
        const target = e.target as HTMLImageElement;
        target.src = '/assets/Skill/SkillIconAny.webp';
      }}
    />
  );
}