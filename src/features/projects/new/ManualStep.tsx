'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Package } from 'lucide-react';
import { BricoTierBadge } from '@/components/ui/brico-tier-badge';
import { ItemBadge } from '@/components/depv2/ItemBadge';
import { ItemSearchCombobox } from '@/components/projects/item-search-combobox';
import { useClaimPlayerContext } from '@/contexts/claim-player-context';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import type { ProjectSeedItem } from '@/lib/projectSeed';

interface GameItem {
  id: string;
  name: string;
  tier: number;
  category: string;
  rarity: string;
  icon_asset_name?: string;
}

interface NewItem {
  itemName: string;
  tier: number;
  requiredQuantity: number;
  notes: string;
  category?: string;
}

interface ManualStepProps {
  initialTitle?: string;
  initialItems?: ProjectSeedItem[];
  onBack: () => void;
  onItemsChange: (items: ProjectSeedItem[]) => void;
  onTitleChange: (title: string) => void;
  isReviewMode?: boolean;
}

const priorityLabels = {
  1: { label: 'Low', color: 'bg-gray-100 text-gray-800' },
  2: { label: 'Normal', color: 'bg-blue-100 text-blue-800' },
  3: { label: 'High', color: 'bg-orange-100 text-orange-800' },
  4: { label: 'Urgent', color: 'bg-red-100 text-red-800' },
  5: { label: 'Critical', color: 'bg-purple-100 text-purple-800' }
};

export default function ManualStep({
  initialTitle = '',
  initialItems = [],
  onBack,
  onItemsChange,
  onTitleChange,
  isReviewMode = false
}: ManualStepProps) {
  const router = useRouter();
  const { member } = useClaimPlayerContext();

  // Project form state
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<number>(3);

  // Items state
  const [items, setItems] = useState<ProjectSeedItem[]>(initialItems);

  // New item state
  const [newItem, setNewItem] = useState<NewItem>({
    itemName: '',
    tier: 1,
    requiredQuantity: 1,
    notes: '',
    category: ''
  });

  // UI state
  const [isCreating, setIsCreating] = useState(false);

  // Sync with parent state
  useEffect(() => {
    onTitleChange(title);
  }, [title, onTitleChange]);

  useEffect(() => {
    onItemsChange(items);
  }, [items, onItemsChange]);

  // Handle item selection from combobox
  const handleItemSelect = (item: GameItem) => {
    setNewItem(prev => ({
      ...prev,
      itemName: item.name,
      tier: item.tier,
      category: item.category
    }));
  };

  // Add new item to the list
  const handleAddItem = () => {
    if (!newItem.itemName.trim() || newItem.requiredQuantity < 1) {
      toast.error('Please select an item and enter a valid quantity');
      return;
    }

    const seedItem: ProjectSeedItem = {
      name: newItem.itemName,
      qty: newItem.requiredQuantity,
      tier: newItem.tier,
      skill: null, // We don't have skill info from the combobox
    };

    setItems(prev => [...prev, seedItem]);
    
    // Reset form
    setNewItem({
      itemName: '',
      tier: 1,
      requiredQuantity: 1,
      notes: '',
      category: ''
    });

    toast.success('Item added to project');
  };

  // Remove item from list
  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
    toast.success('Item removed from project');
  };

  // Update item quantity
  const handleUpdateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, qty: newQuantity } : item
    ));
  };

  // Create the project
  const handleCreateProject = async () => {
    if (!title.trim()) {
      toast.error('Project name is required');
      return;
    }

    if (!member?.id) {
      toast.error('Member information not available. Please try again.');
      return;
    }

    if (items.length === 0) {
      toast.error('Please add at least one item to the project');
      return;
    }

    setIsCreating(true);
    try {
      // Convert ProjectSeedItems to the API format
      const apiItems = items.map(item => ({
        itemName: item.name,
        requiredQuantity: item.qty,
        tier: item.tier || 1,
        notes: ''
      }));

      const result = await api.post('/api/settlement/projects', {
        name: title.trim(),
        description: description.trim() || null,
        priority: priority,
        createdByMemberId: member.id,
        settlementId: member.claim_settlement_id,
        items: apiItems
      });

      if (result.success) {
        toast.success('Project created successfully!');
        
        // Navigate to the project detail page
        const projectNumber = (result.data as any)?.data?.project.project_number;
        if (projectNumber) {
          router.push(`/en/settlement/projects/${projectNumber}`);
        } else {
          router.push('/en/settlement/projects');
        }
      } else {
        throw new Error(result.error || 'Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6 pb-32">
      {/* Project Details */}
      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>
            {isReviewMode 
              ? 'Review your project details before creating'
              : 'Enter the basic information for your project'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Project Name *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter project name..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority.toString()} onValueChange={(value) => setPriority(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(priorityLabels).map(([value, { label, color }]) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2">
                        <Badge className={color}>{label}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your project..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Items List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Project Items ({items.length})
          </CardTitle>
          <CardDescription>
            {isReviewMode 
              ? 'Review and edit the items in your project'
              : 'Add items that need to be collected or crafted for this project'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing Items */}
          {items.length > 0 && (
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                  {item.itemId ? (
                    <div className="flex items-center gap-3 flex-1">
                      <ItemBadge id={item.itemId} qty={item.qty} showQuantity={false} />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 flex-1">
                      <div className="relative h-8 w-8 flex-shrink-0 rounded bg-muted border">
                        <div className="w-full h-full bg-muted-foreground/20 rounded flex items-center justify-center">
                          <span className="text-sm text-muted-foreground">?</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        <div className="flex items-center gap-2 text-sm">
                          {item.tier && item.tier > 0 && (
                            <BricoTierBadge tier={item.tier} size="sm" />
                          )}
                          {item.skill && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded dark:bg-blue-900/20 dark:text-blue-400">
                              {item.skill}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      max="999999"
                      value={item.qty}
                      onChange={(e) => handleUpdateQuantity(index, Math.min(999999, parseInt(e.target.value) || 1))}
                      className="w-20 text-center"
                      placeholder="1-999,999"
                      title="Enter quantity (1 to 999,999)"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add New Item */}
          <div className="border-2 border-dashed border-muted rounded-lg p-4 space-y-4">
            <h4 className="font-medium">Add New Item</h4>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-2 space-y-2">
                <Label>Item</Label>
                <ItemSearchCombobox
                  value={newItem.itemName}
                  onValueChange={(value) => {
                    if (!value) {
                      setNewItem(prev => ({
                        ...prev,
                        itemName: '',
                        tier: 1,
                        category: ''
                      }));
                    }
                  }}
                  onItemSelect={handleItemSelect}
                  placeholder="Search for an item..."
                />
              </div>
              <div className="space-y-2">
                <Label>Quantity</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="1"
                    value={newItem.requiredQuantity}
                    onChange={(e) => setNewItem(prev => ({
                      ...prev,
                      requiredQuantity: parseInt(e.target.value) || 1
                    }))}
                  />
                  <Button 
                    onClick={handleAddItem}
                    disabled={!newItem.itemName}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {items.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No items added yet. Add your first item above.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sticky Footer - matches AutoGenerateStep style */}
      <div className="sticky bottom-0 left-0 right-0 z-10 bg-background/95 backdrop-blur-sm border-t border-border/40 p-4 shadow-lg">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="text-sm text-muted-foreground">
            {items.length > 0 ? (
              <>
                Ready to create: <strong className="text-foreground">{title || 'Untitled Project'}</strong> ({items.length} items)
              </>
            ) : (
              'Add items to continue'
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onBack} className="min-w-[80px]">
              Back
            </Button>
            <Button 
              onClick={handleCreateProject}
              disabled={isCreating || !title.trim() || items.length === 0}
              className="min-w-[140px] bg-primary hover:bg-primary/90 disabled:opacity-50"
            >
              {isCreating ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
