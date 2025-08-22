'use client';

import Image from 'next/image';
import { BricoTierBadge } from '@/components/ui/brico-tier-badge';
import { resolveItemDisplay } from '@/lib/settlement/item-display';
import Link from 'next/link';

export interface ContributionDisplayProps {
  itemName: string;
  quantity: number;
  tier?: number | null;
  iconPath?: string | null;
  className?: string;
  showLink?: boolean;
}

/**
 * Compact, consistent renderer for contributed items: icon + tier badge + "qty x name"
 */
export function ContributionDisplay({ itemName, quantity, tier, iconPath, className, showLink = false }: ContributionDisplayProps) {
  const resolved = resolveItemDisplay(itemName);
  const finalIcon = iconPath || resolved.iconPath || '/assets/Unknown.webp';
  const finalTier = (tier ?? resolved.tier) || 0;
  const link = resolved.calculatorLink;

  const content = (
    <div className={`flex items-center gap-3 ${className || ''}`}>
      <div className="relative h-10 w-10 flex-shrink-0 rounded-md bg-muted p-1 border">
        <Image
          src={finalIcon}
          alt={itemName ? `${itemName} icon` : 'Item icon'}
          fill
          sizes="40px"
          className="object-contain rounded-md"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/assets/Unknown.webp';
          }}
        />
        {finalTier > 0 && (
          <div className="absolute -top-2 -right-2">
            <BricoTierBadge tier={finalTier} size="sm" />
          </div>
        )}
      </div>
      <span className="font-medium whitespace-nowrap">{quantity}x {itemName}</span>
    </div>
  );

  if (showLink && link) {
    return (
      <Link href={link} title="View in Calculator" className="hover:underline">
        {content}
      </Link>
    );
  }

  return content;
}


