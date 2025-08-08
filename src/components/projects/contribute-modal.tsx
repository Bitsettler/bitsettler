'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Package, AlertCircle, LogIn } from 'lucide-react';

import { type ProjectDetails, type AddContributionRequest } from '@/lib/spacetime-db-new/modules';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { transformProjectData } from '@/lib/utils/project-data-transform';

interface ContributeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string | null;
  selectedItemName?: string | null;
  onContributionAdded: () => void;
}

export function ContributeModal({ open, onOpenChange, projectId, selectedItemName, onContributionAdded }: ContributeModalProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [currentSelectedItem, setCurrentSelectedItem] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Helper function to safely format numbers
  const safeToLocaleString = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) {
      return '0';
    }
    return value.toLocaleString();
  };

  // Pre-select item when modal opens with a specific item
  useEffect(() => {
    if (open && selectedItemName) {
      setCurrentSelectedItem(selectedItemName);
    } else if (!open) {
      // Clear when modal closes
      setCurrentSelectedItem('');
      setQuantity(1);
      setNotes('');
      setErrors({});
    }
  }, [open, selectedItemName]);

  const fetchProjectData = useCallback(async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/settlement/projects/${projectId}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch project');
      }

      // Transform the API response to match frontend expectations
      const transformedProject = transformProjectData(result.data);
      setProject(transformedProject);
    } catch (error) {
      console.error('Error fetching project:', error);
      setErrors({ general: 'Failed to load project data' });
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Load project data when modal opens
  useEffect(() => {
    if (open && projectId) {
      fetchProjectData();
      
      // Reset form
      setCurrentSelectedItem('');
      setQuantity(1);
      setNotes('');
      setErrors({});
    }
  }, [open, projectId, fetchProjectData]);

  const selectedItem = project?.items.find(item => item.itemName === currentSelectedItem);
  const remainingNeeded = selectedItem ? Math.max(0, selectedItem.requiredQuantity - selectedItem.currentQuantity) : 0;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!currentSelectedItem) {
      newErrors.item = 'Please select an item to contribute';
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
    if (!projectId || !project || !session?.user) return;
    
    setIsSubmitting(true);
    
    try {
      const contributionData: AddContributionRequest = {
        authUser: {
          id: session.user.id!,
          name: session.user.name!,
          email: session.user.email || undefined,
          image: session.user.image || undefined,
        },
        projectId: projectId,
        projectItemId: selectedItem?.id,
        itemName: currentSelectedItem,
        quantity: quantity,
        description: notes.trim() || undefined,
      };

      const response = await fetch('/api/settlement/contributions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` }),
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
    setCurrentSelectedItem('');
    setQuantity(1);
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

  // If user is not authenticated, show sign-in prompt
  if (status === 'loading') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!session) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              Sign In Required
            </DialogTitle>
            <DialogDescription>
              You need to sign in to contribute to settlement projects.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-4 py-4">
            <Button
              onClick={() => router.push('/en/auth/signin')}
              className="w-full"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </Button>
            
            <p className="text-xs text-muted-foreground text-center">
              For now, you can sign in with any username and password
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Contribute to {project?.name || 'Project'}
            </DialogTitle>
            <DialogDescription>
              Loading project data...
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
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
              <Package className="h-5 w-5" />
              Contribute to {projectId ? 'Project Not Found' : 'Project'}
            </DialogTitle>
            <DialogDescription>
              The project with ID &quot;{projectId}&quot; was not found.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
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
            <Package className="h-5 w-5" />
            Contribute to {project?.name || 'Project'}
          </DialogTitle>
          <DialogDescription>
            Add your contribution to help complete this project.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Progress */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Project Progress</span>
              <span className="text-sm text-muted-foreground">
                {project.completionPercentage}% Complete
              </span>
            </div>
            <div className="w-full">
              <div className="w-full">
                <div className="text-sm text-muted-foreground">
                  {safeToLocaleString(project.totalFulfilled)} / {safeToLocaleString(project.totalRequired)} items
                </div>
              </div>
            </div>
          </div>

          {/* Item Selection */}
          <div className="space-y-2">
            <Label htmlFor="item">Select Item to Contribute *</Label>
            {project.items.length === 0 ? (
              <div className="flex items-center gap-2 p-4 border rounded-lg bg-blue-50">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                <span className="text-blue-800">No items have been defined for this project yet. The project creator needs to add items first.</span>
              </div>
            ) : availableItems.length === 0 ? (
              <div className="flex items-center gap-2 p-4 border rounded-lg bg-green-50">
                <AlertCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-800">All items for this project have been completed!</span>
              </div>
            ) : (
              <Select value={currentSelectedItem} onValueChange={setCurrentSelectedItem}>
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
              {quantity > 0 && session?.user?.name && selectedItem && (
                <div className="relative overflow-hidden rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-4 shadow-sm">
                  <div className="absolute right-2 top-2 opacity-10">
                    <Package className="h-12 w-12" />
                  </div>
                  
                  <div className="relative space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                        <Package className="h-4 w-4 text-green-600" />
                      </div>
                      <h3 className="font-semibold text-green-800">Contribution Summary</h3>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm text-green-700">
                        <span className="font-medium text-green-800">{session.user.name}</span> will contribute:
                      </div>
                      
                      <div className="flex items-center gap-2 rounded-md bg-white/60 p-3 border border-green-200/50">
                        <div className="flex-1">
                          <div className="font-semibold text-green-900">
                            {safeToLocaleString(quantity)} × {selectedItem.itemName}
                          </div>
                          <div className="text-xs text-green-600">
                            Tier {selectedItem.tier} • Priority {selectedItem.priority}
                          </div>
                        </div>
                        
                        {remainingNeeded > 0 && quantity >= remainingNeeded && (
                          <div className="flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1">
                            <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                            <span className="text-xs font-medium text-emerald-700">
                              Completes item!
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
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
              disabled={isSubmitting || !currentSelectedItem || quantity <= 0}
              className="min-w-24"
            >
              {isSubmitting ? 'Adding...' : 'Add Contribution'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}