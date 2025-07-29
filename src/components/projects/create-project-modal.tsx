'use client';

import { useState } from 'react';
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
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    createdBy: 'Settlement Leader'
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
      description: '',
      createdBy: 'Settlement Leader'
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
    
    if (!formData.createdBy.trim()) {
      newErrors.createdBy = 'Creator name is required';
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

  const handleItemSelect = (selectedItem: any) => {
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
      setItems([...items, { ...currentItem, itemName: currentItem.itemName.trim() }]);
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
    
    setIsSubmitting(true);
    
    try {
      const projectData: CreateProjectRequest = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        createdBy: formData.createdBy.trim(),
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
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Project Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <Label htmlFor="createdBy">Created By *</Label>
              <Input
                id="createdBy"
                value={formData.createdBy}
                onChange={(e) => setFormData({ ...formData, createdBy: e.target.value })}
                placeholder="Your name"
                className={errors.createdBy ? 'border-red-500' : ''}
              />
              {errors.createdBy && <p className="text-sm text-red-500">{errors.createdBy}</p>}
            </div>
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
                      }
                    }}
                    onItemSelect={handleItemSelect}
                    placeholder="Search items from compendium..."
                  />
                  {currentItem.itemCategory && (
                    <div className="text-xs text-muted-foreground">
                      Category: {currentItem.itemCategory}
                    </div>
                  )}
                </div>

                {/* Item Properties - Separate Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={currentItem.requiredQuantity}
                      onChange={(e) => setCurrentItem({ ...currentItem, requiredQuantity: parseInt(e.target.value) || 1 })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={currentItem.priority.toString()}
                      onValueChange={(value) => setCurrentItem({ ...currentItem, priority: parseInt(value) })}
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

                  <div className="flex items-end">
                    <Button
                      type="button"
                      onClick={addItem}
                      disabled={!validateCurrentItem()}
                      className="w-full h-10"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </div>
              </div>

              {/* Items List */}
              {items.length > 0 && (
                <div className="space-y-2">
                  <Label>Items ({items.length})</Label>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {items.map((item, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded-lg bg-background">
                        <div className="flex-1">
                          <div className="font-medium">{item.itemName}</div>
                          <div className="text-sm text-muted-foreground">
                            Quantity: {item.requiredQuantity.toLocaleString()}
                            {item.itemCategory && ` • ${item.itemCategory}`}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={getTierColor(item.tier)}>
                            T{item.tier}
                          </Badge>
                          <Badge className={getPriorityColor(item.priority)}>
                            {getPriorityLabel(item.priority)}
                          </Badge>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {errors.items && <p className="text-sm text-red-500">{errors.items}</p>}
            </CardContent>
          </Card>

          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || items.length === 0}>
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}