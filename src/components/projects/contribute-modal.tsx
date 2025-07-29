'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Package, Gift, CheckCircle2, Info } from 'lucide-react';
import { useUserProfile } from '@/hooks/use-user-profile';
import { type ProjectDetails, type AddContributionRequest } from '@/lib/spacetime-db-new/modules';

interface ContributeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string | null;
  onContributionAdded: () => void;
}

export function ContributeModal({ open, onOpenChange, projectId, onContributionAdded }: ContributeModalProps) {
  const { profile } = useUserProfile();
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [selectedItemName, setSelectedItemName] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [contributorName, setContributorName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Helper function to safely format numbers
  const safeToLocaleString = (value: number | undefined | null): string => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0';
    }
    return value.toLocaleString();
  };

  // Load project data when modal opens
  useEffect(() => {
    if (open && projectId) {
      fetchProjectData();
      
      // Reset form
      setSelectedItemName('');
      setQuantity(1);
      // Use DisplayName from user profile, fallback to stored name if no profile
      setContributorName(profile?.displayName || localStorage.getItem('lastContributorName') || '');
      setNotes('');
      setErrors({});
    }
  }, [open, projectId, profile]);

  const fetchProjectData = async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/settlement/projects/${projectId}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch project');
      }

      setProject(result.data);
    } catch (error) {
      console.error('Error fetching project:', error);
      setErrors({ general: 'Failed to load project data' });
    } finally {
      setLoading(false);
    }
  };

  const selectedItem = project?.items.find(item => item.itemName === selectedItemName);
  const remainingNeeded = selectedItem ? Math.max(0, selectedItem.requiredQuantity - selectedItem.currentQuantity) : 0;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!selectedItemName) {
      newErrors.item = 'Please select an item to contribute';
    }
    
    if (!contributorName.trim()) {
      newErrors.contributorName = 'Contributor name is required';
    }
    
    if (quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!projectId || !project) return;
    
    setIsSubmitting(true);
    
    try {
      // Store contributor name for future use
      localStorage.setItem('lastContributorName', contributorName.trim());
      
      const contributionData: AddContributionRequest = {
        memberId: profile?.id || contributorName.trim(), // Use profile ID or name as fallback
        projectId: projectId,
        projectItemId: selectedItem?.id,
        contributionType: 'Item',
        itemName: selectedItemName,
        quantity: quantity,
        description: notes.trim() || undefined,
      };

      const response = await fetch('/api/settlement/contributions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contributionData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to add contribution');
      }
      
      // Reset form
      resetForm();
      onOpenChange(false);
      onContributionAdded();
      
    } catch (error) {
      console.error('Error adding contribution:', error);
      setErrors({ 
        submit: error instanceof Error ? error.message : 'Failed to add contribution. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    onOpenChange(false);
  };

  const resetForm = () => {
    setSelectedItemName('');
    setQuantity(1);
    setContributorName(profile?.displayName || '');
    setNotes('');
    setErrors({});
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

  const getStatusColor = (status: string) => {
    const colors = {
      'Needed': 'bg-red-100 text-red-800',
      'In Progress': 'bg-yellow-100 text-yellow-800',
      'Completed': 'bg-green-100 text-green-800'
    };
    return colors[status as keyof typeof colors] || colors['Needed'];
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Contribute to {project?.name || 'Project'}
            </DialogTitle>
            <DialogDescription>
              Loading project data...
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center items-center h-32">
            <Progress value={50} className="w-1/2" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!project) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Contribute to {projectId ? 'Project Not Found' : 'Project'}
            </DialogTitle>
            <DialogDescription>
              The project with ID "{projectId}" was not found.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center items-center h-32">
            <Progress value={50} className="w-1/2" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const availableItems = project.items.filter(item => item.status !== 'Completed');

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Contribute to {project?.name || 'Project'}
          </DialogTitle>
          <DialogDescription>
            Add your contribution to help complete this project.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Progress */}
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Project Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {project.completionPercentage}% Complete
                  </span>
                </div>
                <Progress value={project.completionPercentage} className="w-full" />
                                  <div className="text-sm text-muted-foreground">
                    {safeToLocaleString(project.totalFulfilled)} / {safeToLocaleString(project.totalRequired)} items
                  </div>
              </div>
            </CardContent>
          </Card>

          {/* Item Selection */}
          <div className="space-y-2">
            <Label htmlFor="item">Select Item to Contribute *</Label>
            {project.items.length === 0 ? (
              <div className="flex items-center gap-2 p-4 border rounded-lg bg-blue-50">
                <Info className="h-5 w-5 text-blue-600" />
                <span className="text-blue-800">No items have been defined for this project yet. The project creator needs to add items first.</span>
              </div>
            ) : availableItems.length === 0 ? (
              <div className="flex items-center gap-2 p-4 border rounded-lg bg-green-50">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-green-800">All items for this project have been completed!</span>
              </div>
            ) : (
              <Select value={selectedItemName} onValueChange={setSelectedItemName}>
                <SelectTrigger className={errors.item ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Choose an item..." />
                </SelectTrigger>
                <SelectContent>
                  {availableItems.map((item) => (
                    <SelectItem key={item.id} value={item.itemName}>
                      <div className="flex items-center gap-2 w-full">
                        <span className="flex-1">{item.itemName}</span>
                        <div className="flex gap-1">
                          <Badge className={getTierColor(item.tier)} variant="secondary">
                            T{item.tier}
                          </Badge>
                          <Badge className={getStatusColor(item.status)} variant="secondary">
                            {item.status}
                          </Badge>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.item && <p className="text-sm text-red-500">{errors.item}</p>}
          </div>

          {/* Selected Item Details */}
          {selectedItem && (
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{selectedItem.itemName}</h4>
                      <div className="flex gap-2 mt-1">
                        <Badge className={getTierColor(selectedItem.tier)}>
                          Tier {selectedItem.tier}
                        </Badge>
                        <Badge className={getStatusColor(selectedItem.status)}>
                          {selectedItem.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Required:</span>
                      <div className="font-medium">{safeToLocaleString(selectedItem.requiredQuantity)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Current:</span>
                      <div className="font-medium">{safeToLocaleString(selectedItem.currentQuantity)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Remaining:</span>
                      <div className="font-medium text-orange-600">{safeToLocaleString(remainingNeeded)}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Item Progress</span>
                      <span>{Math.round((selectedItem.currentQuantity / selectedItem.requiredQuantity) * 100)}%</span>
                    </div>
                    <Progress 
                      value={(selectedItem.currentQuantity / selectedItem.requiredQuantity) * 100} 
                      className="w-full"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contribution Details */}
          {selectedItem && availableItems.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity to Contribute *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max={remainingNeeded > 0 ? remainingNeeded : undefined}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className={errors.quantity ? 'border-red-500' : ''}
                  />
                  {remainingNeeded > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Max needed: {safeToLocaleString(remainingNeeded)}
                    </p>
                  )}
                  {errors.quantity && <p className="text-sm text-red-500">{errors.quantity}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contributorName">Your Name *</Label>
                  <Input
                    id="contributorName"
                    value={contributorName}
                    onChange={(e) => setContributorName(e.target.value)}
                    placeholder="Enter your name"
                    className={errors.contributorName ? 'border-red-500' : ''}
                  />
                  {errors.contributorName && <p className="text-sm text-red-500">{errors.contributorName}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about your contribution..."
                  rows={2}
                />
              </div>

              {/* Contribution Summary */}
              {quantity > 0 && contributorName && selectedItem && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-800">Contribution Summary</span>
                    </div>
                    <div className="text-sm text-blue-700">
                      <strong>{contributorName}</strong> will contribute{' '}
                      <strong>{safeToLocaleString(quantity)} {selectedItem.itemName}</strong>
                      {remainingNeeded > 0 && quantity >= remainingNeeded && (
                        <span className="text-green-700 font-medium"> (This will complete the item!)</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || availableItems.length === 0 || !selectedItem}
            >
              {isSubmitting ? 'Adding...' : 'Add Contribution'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}