'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ItemSearchCombobox } from '@/components/projects/item-search-combobox';
import { SelectedItemDisplay } from '@/components/projects/selected-item-display';

interface NewItem {
  itemName: string;
  tier: number;
  requiredQuantity: number;
  notes: string;
  category?: string;
}

interface AddItemFormProps {
  onAddItem: (item: NewItem) => Promise<void>;
  onCancel: () => void;
}

export function AddItemForm({ onAddItem, onCancel }: AddItemFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedItemValue, setSelectedItemValue] = useState('');
  const [newItem, setNewItem] = useState<NewItem>({
    itemName: '',
    tier: 1,
    requiredQuantity: 1,
    notes: '',
    category: ''
  });

  const handleItemSelect = (item: any) => {
    setNewItem(prev => ({
      ...prev,
      itemName: item.name,
      tier: item.tier,
      category: item.category
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newItem.itemName || newItem.requiredQuantity <= 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddItem(newItem);
      
      // Reset form
      setNewItem({
        itemName: '',
        tier: 1,
        requiredQuantity: 1,
        notes: '',
        category: ''
      });
      setSelectedItemValue('');
    } catch (error) {
      console.error('Failed to add item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setNewItem({
      itemName: '',
      tier: 1,
      requiredQuantity: 1,
      notes: '',
      category: ''
    });
    setSelectedItemValue('');
    onCancel();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Add New Item</CardTitle>
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Item Search */}
          <div className="space-y-2">
            <Label htmlFor="item-search">Search for Item</Label>
            <ItemSearchCombobox
              value={selectedItemValue}
              onValueChange={setSelectedItemValue}
              onItemSelect={handleItemSelect}
              placeholder="Search for any item..."
            />
          </div>

          {/* Selected Item Display */}
          {newItem.itemName && (
            <div className="space-y-2">
              <Label>Selected Item</Label>
              <SelectedItemDisplay
                itemName={newItem.itemName}
                tier={newItem.tier}
                category={newItem.category}
              />
            </div>
          )}

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Required Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={newItem.requiredQuantity}
              onChange={(e) => setNewItem(prev => ({ 
                ...prev, 
                requiredQuantity: parseInt(e.target.value) || 1 
              }))}
              placeholder="How many are needed?"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={newItem.notes}
              onChange={(e) => setNewItem(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any additional notes or requirements..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="submit" 
              disabled={!newItem.itemName || newItem.requiredQuantity <= 0 || isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Item'}
            </Button>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
