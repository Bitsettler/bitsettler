'use client';

import { useState, useMemo } from 'react';
import { Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { BricoTierBadge } from '@/components/ui/brico-tier-badge';
import { resolveItemDisplay } from '@/lib/settlement/item-display';
import Image from 'next/image';

interface ProjectItem {
  id: string;
  itemName: string;
  requiredQuantity: number;
  contributedQuantity: number;
  tier: number;
}

interface ContributeItemDialogProps {
  item: ProjectItem | null;
  isOpen: boolean;
  onClose: () => void;
  onContribute: (contribution: {
    itemId: string;
    quantity: number;
    deliveryMethod: string;
    notes: string;
  }) => Promise<void>;
}

export function ContributeItemDialog({ 
  item, 
  isOpen, 
  onClose, 
  onContribute 
}: ContributeItemDialogProps) {
  const [quantity, setQuantity] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('Dropbox');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageAttempts, setImageAttempts] = useState(0);

  // Smart icon path generation with fallback system
  const itemIcon = useMemo(() => {
    if (!item) return '/assets/Unknown.webp';
    if (imageError && imageAttempts > 1) return '/assets/Unknown.webp';
    
    if (imageAttempts === 1) {
      // Try Cargo folder on first retry
      const cleanName = item.itemName.replace(/^(Basic|Simple|Fine|Exquisite|Peerless|Infused|Rough|Sturdy|Advanced|Comprehensive|Essential|Novice|Proficient|Beginner's)\s+/, '');
      const cleanAssetName = cleanName.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
      return `/assets/GeneratedIcons/Cargo/${cleanAssetName}.webp`;
    }
    
    // Remove quality prefixes and clean the name
    const qualityPrefixes = ['Basic', 'Simple', 'Fine', 'Exquisite', 'Peerless', 'Infused', 'Rough', 'Sturdy', 'Advanced', 'Comprehensive', 'Essential', 'Novice', 'Proficient', "Beginner's"];
    
    let cleanName = item.itemName;
    for (const prefix of qualityPrefixes) {
      if (cleanName.startsWith(prefix + ' ')) {
        cleanName = cleanName.substring(prefix.length + 1);
        break;
      }
    }
    
    // Handle plural to singular conversions for common cases
    if (cleanName.endsWith(' Carvings')) {
      cleanName = cleanName.replace(' Carvings', ' Carving');
    }
    
    // Handle roots - use the proper cargo asset
    if (cleanName.endsWith(' Roots') || cleanName.endsWith(' Root')) {
      // All root items use the PlantRoots cargo asset
      return '/assets/GeneratedIcons/Cargo/PlantRoots.webp';
    }
    
    // Handle filaments - use the generic filament asset
    if (cleanName.includes('Filament')) {
      if (cleanName.includes('Plant') || cleanName.includes('Wispweave')) {
        return '/assets/GeneratedIcons/Items/FilamentPlant.webp';
      }
      return '/assets/GeneratedIcons/Items/Filament.webp';
    }
    
    // Handle crushed items - map to appropriate crushed assets
    if (cleanName.startsWith('Crushed ')) {
      if (cleanName.includes('Shell') || cleanName.includes('Seashell')) {
        return '/assets/GeneratedIcons/Items/CrushedSeashell.webp';
      }
      // For other crushed items, try to find the specific crushed version
      const crushedName = cleanName.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
      return `/assets/GeneratedIcons/Items/${crushedName}.webp`;
    }
    
    // Handle shells - map to shell assets
    if (cleanName.includes('Shell') && !cleanName.startsWith('Crushed')) {
      if (cleanName.includes('Seashell') || cleanName === 'Shell') {
        return '/assets/GeneratedIcons/Items/Seashell.webp';
      }
      if (cleanName.includes('Crab')) {
        return '/assets/GeneratedIcons/Items/SwarmCrabShell.webp';
      }
      // Generic shell fallback
      return '/assets/GeneratedIcons/Items/Seashell.webp';
    }
    
    // Handle bark - all bark items use the generic Bark asset
    if (cleanName.includes('Bark')) {
      return '/assets/GeneratedIcons/Items/Bark.webp';
    }
    
    // Handle hair - map to appropriate hair assets
    if (cleanName.includes('Hair')) {
      if (cleanName.includes('Rabbit')) {
        return '/assets/GeneratedIcons/Items/RabbitHair.webp';
      }
      // Generic hair for all other hair items (Animal Hair, etc.)
      return '/assets/GeneratedIcons/Items/Hair.webp';
    }
    
    // Handle flowers - map to appropriate flower assets
    if (cleanName.includes('Flower')) {
      if (cleanName.includes('Snowdrop')) {
        return '/assets/GeneratedIcons/Items/SnowdropFlower.webp';
      }
      // Generic flowers for all other flower items
      return '/assets/GeneratedIcons/Items/Flowers.webp';
    }
    
    // Handle salt - map to appropriate salt assets
    if (cleanName.includes('Salt')) {
      if (cleanName.includes('Hideworking')) {
        return '/assets/GeneratedIcons/Items/HideworkingSalt.webp';
      }
      // Generic salt for other salt items
      return '/assets/GeneratedIcons/Items/Salt.webp';
    }
    
    // Handle bulbs - use generic flower asset as fallback
    if (cleanName.includes('Bulb') || cleanName.includes('bulb')) {
      // No specific bulb assets found, use flowers as closest match
      return '/assets/GeneratedIcons/Items/Flowers.webp';
    }
    
    // Handle ore chunks - most don't have separate chunk files, use the base ore
    if (cleanName.endsWith(' Ore Chunk')) {
      const baseName = cleanName.replace(' Ore Chunk', ' Ore');
      const baseCleanName = baseName.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
      // Only Copper, Iron, and Tin have separate chunk files
      if (['CopperOre', 'IronOre', 'TinOre'].includes(baseCleanName)) {
        cleanName = cleanName; // Keep as chunk
      } else {
        cleanName = baseName; // Use base ore file
      }
    }
    
    // Handle other common patterns from Material Calculator
    // HexCoin variations
    if (cleanName.includes('HexCoin[') || cleanName.includes('Hex Coin[')) {
      cleanName = 'Hex Coin';
    }
    
    // Handle cosmetic items that might have different paths
    if (cleanName === 'Leather Bonnet') {
      return '/assets/GeneratedIcons/Other/Cosmetics/Head/Hat_BurlapBonnet.webp';
    }
    if (cleanName === 'Leather Gloves') {
      return '/assets/GeneratedIcons/Other/Cosmetics/Hands/Hands_BasicGloves.webp';
    }
    
    // Remove spaces and special characters
    cleanName = cleanName.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
    return `/assets/GeneratedIcons/Items/${cleanName}.webp`;
  }, [item?.itemName, imageError]);

  if (!item) return null;

  const remaining = Math.max(0, item.requiredQuantity - (item.contributedQuantity || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseInt(quantity);
    if (isNaN(amount) || amount <= 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onContribute({
        itemId: item.id,
        quantity: amount,
        deliveryMethod,
        notes: notes.trim()
      });
      
      // Reset form
      setQuantity('');
      setDeliveryMethod('Dropbox');
      setNotes('');
      onClose();
    } catch (error) {
      console.error('Failed to contribute:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setQuantity('');
    setDeliveryMethod('Dropbox');
    setNotes('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Contribute Item
          </DialogTitle>
          <DialogDescription>
            Add your contribution to help complete this project item.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Item Info */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <div className="relative h-10 w-10 flex-shrink-0">
              <Image
                src={itemIcon}
                alt={item.itemName}
                fill
                sizes="40px"
                className="object-contain rounded"
                onError={() => {
                  if (imageAttempts === 0) {
                    setImageAttempts(1);
                  } else {
                    setImageError(true);
                  }
                }}
                unoptimized={itemIcon.includes('/assets/')}
              />
            </div>
            <div className="flex-1">
              <div className="font-medium">{item.itemName}</div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BricoTierBadge tier={item.tier} />
                <span>•</span>
                <span>{item.contributedQuantity || 0} / {item.requiredQuantity}</span>
                {remaining > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-orange-600">{remaining} needed</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="contribute-quantity">Quantity to Contribute</Label>
            <Input
              id="contribute-quantity"
              type="number"
              min="1"
              max={remaining > 0 ? remaining * 2 : 1000} // Allow over-contribution
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={`How many? (${remaining} needed)`}
              required
            />
            {remaining === 0 && (
              <p className="text-sm text-muted-foreground">
                This item is already complete, but you can still contribute extra if needed.
              </p>
            )}
          </div>

          {/* Delivery Method */}
          <div className="space-y-2">
            <Label htmlFor="delivery-method">Delivery Method</Label>
            <Select value={deliveryMethod} onValueChange={setDeliveryMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Dropbox">Dropbox</SelectItem>
                <SelectItem value="Officer Handoff">Officer Handoff</SelectItem>
                <SelectItem value="Added to Building">Added to Building</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="contribute-notes">Notes (Optional)</Label>
            <Textarea
              id="contribute-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional details about this contribution..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!quantity || parseInt(quantity) <= 0 || isSubmitting}
            >
              {isSubmitting ? 'Contributing...' : 'Contribute'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
