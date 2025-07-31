'use client';

import { useState } from 'react';
import { useSession } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Package } from 'lucide-react';
import { ItemSearchCombobox } from './item-search-combobox';
import { type CreateProjectRequest } from '@/lib/spacetime-db-new/modules';

interface ProjectItem {
  itemName: string;
  itemSlug?: string;
  itemCategory?: string;
  requiredQuantity: number;
  tier: number;
  priority: number;
  notes?: string;
}

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated: () => void;
}

export function CreateProjectModal({ open, onOpenChange, onProjectCreated }: CreateProjectModalProps) {
  const { data: session } = useSession();
  
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  
  const [items, setItems] = useState<ProjectItem[]>([]);
  const [currentItem, setCurrentItem] = useState<ProjectItem>({
    itemName: '',
    itemSlug: '',
    itemCategory: '',
    requiredQuantity: 1,
    tier: 1,
    priority: 1,
    notes: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setFormData({
      name: '',
      description: ''
    });
    setItems([]);
    setCurrentItem({
      itemName: '',
      itemSlug: '',
      itemCategory: '',
      requiredQuantity: 1,
      tier: 1,
      priority: 1,
      notes: ''
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    }
    
    if (!session?.user) {
      newErrors.auth = 'You must be signed in to create projects';
    }
    
    if (items.length === 0) {
      newErrors.items = 'At least one item is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCurrentItem = (): boolean => {
    return (
      currentItem.itemName.trim().length > 0 &&
      currentItem.requiredQuantity > 0 &&
      !items.some(item => item.itemName.toLowerCase() === currentItem.itemName.toLowerCase())
    );
  };

  const handleItemSelect = (selectedItem: { name: string; slug: string; category: string; tier?: number } | null) => {
    if (selectedItem) {
      setCurrentItem({
        ...currentItem,
        itemName: selectedItem.name,
        itemSlug: selectedItem.slug,
        itemCategory: selectedItem.category,
        tier: selectedItem.tier || 1
      });
    }
  };

  const addItem = () => {
    if (validateCurrentItem()) {
      setItems([...items, { ...currentItem }]);
      setCurrentItem({
        itemName: '',
        itemSlug: '',
        itemCategory: '',
        requiredQuantity: 1,
        tier: 1,
        priority: 1,
        notes: ''
      });
    }
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!session?.user) return;
    
    setIsSubmitting(true);
    
    try {
      // Use authenticated user information
      const projectData: CreateProjectRequest = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        createdBy: session.user.name!,
        items: items.map(item => ({
          itemName: item.itemName,
          requiredQuantity: item.requiredQuantity,
          tier: item.tier,
          priority: item.priority,
          notes: item.notes || undefined,
        }))
      };

      const response = await fetch('/api/settlement/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` }),
        },
        body: JSON.stringify(projectData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create project');
      }
      
      resetForm();
      onOpenChange(false);
      onProjectCreated();
    } catch (error) {
      console.error('Error creating project:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to create project. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const getTierColor = (tier: number) => {
    const colors = {
      1: 'bg-gray-100 text-gray-800',
      2: 'bg-green-100 text-green-800',
      3: 'bg-blue-100 text-blue-800',
      4: 'bg-purple-100 text-purple-800',
      5: 'bg-orange-100 text-orange-800',
      6: 'bg-red-100 text-red-800'
    };
    return colors[tier as keyof typeof colors] || colors[1];
  };

  const getPriorityColor = (priority: number) => {
    const colors = {
      1: 'bg-green-100 text-green-800',
      2: 'bg-yellow-100 text-yellow-800',
      3: 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || colors[1];
  };

  const getPriorityLabel = (priority: number) => {
    const labels = { 1: 'Low', 2: 'Medium', 3: 'High' };
    return labels[priority as keyof typeof labels] || 'Low';
  };

  // Show sign-in message if not authenticated
  if (!session) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign In Required</DialogTitle>
            <DialogDescription>
              You need to sign in to create settlement projects.
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-muted-foreground">Please sign in to continue.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Create New Project
          </DialogTitle>
          <DialogDescription>
            Create a new settlement project to track resource needs and contributions.
            <span className="block mt-1 text-sm">
              Creating as: <span className="font-medium">{session.user.name}</span>
            </span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Project Details - Removed Created By field */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Town Hall Construction"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the project goals and requirements..."
                rows={4}
              />
            </div>
          </div>

          {/* Add Items Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Required Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add Item Form */}
              <div className="space-y-6 p-6 border rounded-lg bg-muted/50">
                <h4 className="font-medium">Add New Item</h4>
                
                {/* Item Search - Full Width */}
                <div className="space-y-2">
                  <Label htmlFor="itemName">Item Name</Label>
                  <ItemSearchCombobox
                    value={currentItem.itemSlug || ''}
                    onValueChange={(value) => {
                      // If clearing the selection
                      if (!value) {
                        setCurrentItem({
                          ...currentItem,
                          itemName: '',
                          itemSlug: '',
                          itemCategory: '',
                          tier: 1
                        });
                        return;
                      }
                    }}
                    onItemSelect={handleItemSelect}
                    placeholder="Search for an item..."
                  />
                  {currentItem.itemName && (
                    <p className="text-sm text-green-600">Selected: {currentItem.itemName}</p>
                  )}
                </div>
                
                {/* Item Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="requiredQuantity">Required Quantity</Label>
                    <Input
                      id="requiredQuantity"
                      type="number"
                      min="1"
                      value={currentItem.requiredQuantity}
                      onChange={(e) => setCurrentItem({
                        ...currentItem,
                        requiredQuantity: parseInt(e.target.value) || 1
                      })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tier">Tier</Label>
                    <Select 
                      value={currentItem.tier.toString()} 
                      onValueChange={(value) => setCurrentItem({
                        ...currentItem,
                        tier: parseInt(value)
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map(tier => (
                          <SelectItem key={tier} value={tier.toString()}>
                            Tier {tier}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select 
                      value={currentItem.priority.toString()} 
                      onValueChange={(value) => setCurrentItem({
                        ...currentItem,
                        priority: parseInt(value)
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Low</SelectItem>
                        <SelectItem value="2">Medium</SelectItem>
                        <SelectItem value="3">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="itemNotes">Notes (Optional)</Label>
                  <Textarea
                    id="itemNotes"
                    value={currentItem.notes}
                    onChange={(e) => setCurrentItem({
                      ...currentItem,
                      notes: e.target.value
                    })}
                    placeholder="Any special requirements or notes..."
                    rows={2}
                  />
                </div>
                
                <Button 
                  type="button"
                  onClick={addItem}
                  disabled={!validateCurrentItem()}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item to Project
                </Button>
              </div>

              {/* Current Items List */}
              {items.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium">Project Items ({items.length})</h4>
                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg bg-background">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{item.itemName}</span>
                            <Badge className={getTierColor(item.tier)}>
                              Tier {item.tier}
                            </Badge>
                            <Badge className={getPriorityColor(item.priority)}>
                              {getPriorityLabel(item.priority)}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Quantity: {item.requiredQuantity.toLocaleString()}
                            {item.notes && ` • ${item.notes}`}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {errors.items && (
                <p className="text-sm text-red-500">{errors.items}</p>
              )}
            </CardContent>
          </Card>

          {/* Error Display */}
          {(errors.submit || errors.auth) && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.submit || errors.auth}</p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || items.length === 0}
              className="min-w-24"
            >
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}