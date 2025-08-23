'use client';

import { useState } from 'react';
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

  if (!item) return null;

  const remaining = Math.max(0, item.requiredQuantity - (item.contributedQuantity || 0));
  const [imageError, setImageError] = useState(false);
  const itemDisplay = useMemo(() => resolveItemDisplay(item.itemName), [item.itemName]);
  const itemIcon = imageError ? '/assets/Unknown.webp' : (itemDisplay.iconSrc || '/assets/Unknown.webp');

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
                onError={() => setImageError(true)}
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
