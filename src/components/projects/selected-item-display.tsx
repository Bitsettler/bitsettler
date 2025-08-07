'use client';

import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { BricoTierBadge } from '@/components/ui/brico-tier-badge';
import { Check } from 'lucide-react';

interface SelectedItemDisplayProps {
  itemName: string;
  tier: number;
  category?: string;
  iconPath?: string;
  className?: string;
}

export function SelectedItemDisplay({ 
  itemName, 
  tier, 
  category, 
  iconPath = '/assets/Unknown.webp',
  className = ''
}: SelectedItemDisplayProps) {
  if (!itemName) {
    return null;
  }

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border bg-card/50 ${className}`}>
      <div className="relative">
        <Image
          src={iconPath}
          alt={itemName}
          width={40}
          height={40}
          className="rounded-md border bg-muted/50"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/assets/Unknown.webp';
          }}
        />
        <div className="absolute -top-1 -right-1">
          <BricoTierBadge tier={tier} size="sm" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
          <span className="font-medium text-foreground">{itemName}</span>
        </div>
        {category && (
          <Badge variant="secondary" className="mt-1 text-xs">
            {category}
          </Badge>
        )}
      </div>
    </div>
  );
}
