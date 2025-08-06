'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from '@/hooks/use-auth';
import { 
  ArrowLeft,
  Plus,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Edit,
  Save,
  X,
  Check,
  Search,
  Target,
  Users,
  Trash2,
  Archive,
  MoreHorizontal,
  Lock,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/container';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { ItemSearchCombobox } from '@/components/projects/item-search-combobox';
import { getCalculatorGameData } from '@/lib/spacetime-db-new/modules/calculator/flows/get-calculator-game-data';
import { getServerIconPath, cleanIconAssetName } from '@/lib/spacetime-db-new/shared/assets';
import Image from 'next/image';
import Link from 'next/link';
import { BricoTierBadge } from '@/components/ui/brico-tier-badge';

interface ProjectItem {
  id: string;
  item_name: string;
  item_slug?: string;
  item_category?: string;
  required_quantity: number;
  contributed_quantity: number;
  tier: number;
  priority: number;
  notes?: string;
  status: string;
}

interface MemberContribution {
  id: string;
  memberId: string;
  memberName: string;
  contributionType: 'Direct' | 'Crafted' | 'Purchased';
  itemName: string | null;
  quantity: number;
  description: string | null;
  contributedAt: Date;
}

interface ProjectDetails {
  id: string;
  project_number: number;
  short_id: string;
  name: string;
  description?: string;
  priority: number;
  status: 'Active' | 'Completed';
  completionPercentage: number;
  created_by: string;
  created_at: string;
  ownerName?: string;
  items: ProjectItem[];
  contributions: MemberContribution[];
}

interface NewItem {
  itemName: string;
  tier: number;
  requiredQuantity: number;
  notes: string;
}

interface ProjectPermissions {
  canEdit: boolean;
  canArchive: boolean;
  canDelete: boolean;
  canContribute: boolean;
  isOwner: boolean;
  isCoOwner: boolean;
}

const priorityLabels = {
  1: { label: 'Low', color: 'bg-gray-100 text-gray-800' },
  2: { label: 'Normal', color: 'bg-blue-100 text-blue-800' },
  3: { label: 'High', color: 'bg-orange-100 text-orange-800' },
  4: { label: 'Urgent', color: 'bg-red-100 text-red-800' },
  5: { label: 'Critical', color: 'bg-purple-100 text-purple-800' }
};



export function SettlementProjectDetailView() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const projectId = params.id as string;
  
  // Core state
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Permission state - DISABLED: Everyone can do everything
  const [permissions] = useState<ProjectPermissions>({
    canEdit: true,
    canArchive: true,
    canDelete: true,
    canContribute: true,
    isOwner: true,
    isCoOwner: true
  });
  const [permissionsLoading] = useState(false);
  
  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', description: '' });
  
  // New item state
    const [newItem, setNewItem] = useState<NewItem>({
    itemName: '',
    tier: 1,
    requiredQuantity: 1,
    notes: ''
  });
  const [isAddingItem, setIsAddingItem] = useState(false);
  
  // Item editing state
  const [editingItems, setEditingItems] = useState<Record<string, string>>({});
  
  // Contribution state
  const [contributingItem, setContributingItem] = useState<string | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');
  const [contributionNote, setContributionNote] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('Dropbox');
  
  // Project management state
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  
  // Game data for item icons and links
  const gameData = useMemo(() => getCalculatorGameData(), []);
  
  // Fetch project permissions - DISABLED: Everyone has full permissions
  const fetchProjectPermissions = useCallback(() => {
    // No-op: permissions are hardcoded to true for everyone
    return Promise.resolve();
  }, []);
  
  // Function to get item icon by name
  const getItemIcon = useCallback((itemName: string): string => {
    const item = gameData.items.find(item => 
      item.name.toLowerCase().trim() === itemName.toLowerCase().trim()
    );
    return item?.icon_asset_name || '/assets/Unknown.webp';
  }, [gameData.items]);
  
  // Function to get item calculator link by name
  const getItemLink = useCallback((itemName: string): string | null => {
    // First check if the item exists in calculator data
    const calculatorItem = gameData.items.find(item => 
      item.name.toLowerCase().trim() === itemName.toLowerCase().trim()
    );
    if (calculatorItem) {
      return `/calculator/${calculatorItem.slug}`;
    }
    return null;
  }, [gameData.items]);

  // Fetch project details
  const fetchProjectDetails = useCallback(async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Add minimum loading time to prevent flash
      const [result] = await Promise.all([
        api.get(`/api/settlement/projects/${projectId}`),
        new Promise(resolve => setTimeout(resolve, 300)) // Minimum 300ms loading
      ]);
      
      if (result.success && result.data) {
        // The actual project data is nested under result.data.data
        const projectData = result.data.data || result.data;
        setProject(projectData);
        setEditData({
          name: projectData.name,
          description: projectData.description || ''
        });
      } else {
        throw new Error(result.error || 'Project not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      fetchProjectDetails();
      // Skip permission fetching - everyone has full access
    }
  }, [projectId, fetchProjectDetails]);

  // Handle item selection from search
  const handleItemSelect = (item: any) => {
    if (item) {
      setNewItem(prev => ({
        ...prev,
        itemName: item.name,
        tier: item.tier || 1
      }));
    }
  };

  // Edit item quantity
  const handleEditQuantity = (itemId: string, quantity: number) => {
    setEditingItems(prev => ({ ...prev, [itemId]: quantity.toString() }));
  };

  const handleSaveQuantity = async (itemId: string) => {
    if (!project) return;
    
    const newQuantity = parseInt(editingItems[itemId]);
    if (isNaN(newQuantity) || newQuantity < 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    try {
      const result = await api.put(`/api/settlement/projects/${projectId}/items/${itemId}`, {
        required_quantity: newQuantity
      });

      if (result.success) {
        toast.success('Quantity updated successfully!');
        // Clear editing state
        setEditingItems(prev => {
          const newState = { ...prev };
          delete newState[itemId];
          return newState;
        });
        // Refresh project data
        await fetchProjectDetails();
      } else {
        throw new Error(result.error || 'Failed to update quantity');
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Failed to update quantity. Please try again.');
    }
  };

  const handleCancelEdit = (itemId: string) => {
    setEditingItems(prev => {
      const newState = { ...prev };
      delete newState[itemId];
      return newState;
    });
  };

  // Simple contribution system
  const handleContribute = async () => {
    if (!project || !contributingItem) return;
    
    const amount = parseInt(contributionAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const item = (project.items || []).find(i => i.id === contributingItem);
    if (!item) return;

    // Allow over-contribution - no need to check against remaining items

    try {
      const result = await api.post('/api/settlement/contributions', {
        projectId: project.id,
        itemName: item.item_name,
        quantity: amount,
        contributionType: 'Direct',
        deliveryMethod: deliveryMethod,
        notes: contributionNote.trim() || ''
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to contribute');
      }

      toast.success(`Contributed ${amount} ${item.item_name}!`);
      
      // Close dialog and reset
      setContributingItem(null);
      setContributionAmount('');
      setContributionNote('');
      setDeliveryMethod('Dropbox');
      
      // Refresh project data
      await fetchProjectDetails();
    } catch (error) {
      console.error('Error contributing:', error);
      toast.error('Failed to contribute. Please try again.');
    }
  };

  const handleOpenContribution = (itemId: string) => {
    setContributingItem(itemId);
    setContributionAmount('');
    setContributionNote('');
  };

  const handleCloseContribution = () => {
    setContributingItem(null);
    setContributionAmount('');
    setContributionNote('');
    setDeliveryMethod('Dropbox');
  };

  // Add new item
  const handleAddItem = async () => {
    if (!project || !newItem.itemName.trim()) {
      toast.error('Item name is required');
      return;
    }

    // PERMISSION CHECK DISABLED - Everyone can add items

    setIsAddingItem(true);
    try {
      const result = await api.post(`/api/settlement/projects/${projectId}/items`, {
        itemName: newItem.itemName.trim(),
        requiredQuantity: newItem.requiredQuantity,
        notes: newItem.notes.trim() || undefined,
        priority: 1,
        tier: newItem.tier
      });

      if (result.success) {
        // Reset form
        setNewItem({ itemName: '', tier: 1, requiredQuantity: 1, notes: '' });
        
        toast.success('Item added successfully!');
        
        // Immediately refresh to get actual data
        await fetchProjectDetails();
      } else {
        // Handle permission errors specifically
        if (result.error?.includes('permission') || result.error?.includes('forbidden')) {
          toast.error('Permission denied', {
            description: 'You do not have permission to add items to this project'
          });
        } else {
          throw new Error(result.error || 'Failed to add item');
        }
      }
    } catch (error) {
      console.error('Error adding item:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add item';
      
      // Show specific permission error if detected
      if (errorMessage.includes('permission') || errorMessage.includes('forbidden')) {
        toast.error('Permission denied', {
          description: 'You do not have permission to add items to this project'
        });
      } else {
        toast.error('Failed to add item. Please try again.');
      }
    } finally {
      setIsAddingItem(false);
    }
  };

  // Delete item
  const [itemToDelete, setItemToDelete] = useState<{id: string, name: string} | null>(null);
  
  const handleDeleteItem = async () => {
    if (!project || !itemToDelete) return;

    try {
      const result = await api.delete(`/api/settlement/projects/${projectId}/items/${itemToDelete.id}`);

      if (result.success) {
        toast.success('Item removed successfully!');
        setItemToDelete(null);
        
        // Immediately refresh to get updated data
        await fetchProjectDetails();
      } else {
        throw new Error(result.error || 'Failed to remove item');
      }
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Failed to remove item. Please try again.');
    }
  };

  // Save project edits
  const handleSaveEdit = async () => {
    if (!project || !editData.name.trim()) {
      toast.error('Project name is required');
      return;
    }

    try {
      const result = await api.put(`/api/settlement/projects/${projectId}`, {
        name: editData.name.trim(),
        description: editData.description.trim() || null
      });

      if (result.success) {
        setProject(prev => prev ? {
          ...prev,
          name: editData.name.trim(),
          description: editData.description.trim() || undefined
        } : null);
        setIsEditing(false);
        toast.success('Project updated successfully!');
      } else {
        throw new Error(result.error || 'Failed to update project');
      }
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project. Please try again.');
    }
  };

  // Delete project
  const handleDeleteProject = async () => {
    if (!project) return;

    setIsDeleting(true);
    try {
      const result = await api.delete(`/api/settlement/projects/${projectId}`);

      if (result.success) {
        toast.success('Project deleted successfully!');
        router.push('/en/settlement/projects');
      } else {
        throw new Error(result.error || 'Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Archive project (set status to Completed)
  const handleArchiveProject = async () => {
    if (!project) return;

    setIsArchiving(true);
    try {
      const result = await api.put(`/api/settlement/projects/${projectId}`, {
        status: 'Completed'
      });

      if (result.success) {
        setProject(prev => prev ? {
          ...prev,
          status: 'Completed'
        } : null);
        toast.success('Project archived successfully!');
      } else {
        throw new Error(result.error || 'Failed to archive project');
      }
    } catch (error) {
      console.error('Error archiving project:', error);
      toast.error('Failed to archive project. Please try again.');
    } finally {
      setIsArchiving(false);
    }
  };

  // Mark project as complete
  const handleCompleteProject = async () => {
    if (!project) return;

    setIsCompleting(true);
    try {
      const result = await api.put(`/api/settlement/projects/${projectId}`, {
        status: 'Completed'
      });

      if (result.success) {
        setProject(prev => prev ? {
          ...prev,
          status: 'Completed'
        } : null);
        toast.success('Project marked as completed! 🎉');
      } else {
        throw new Error(result.error || 'Failed to complete project');
      }
    } catch (error) {
      console.error('Error completing project:', error);
      toast.error('Failed to complete project. Please try again.');
    } finally {
      setIsCompleting(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <div className="space-y-6 py-8">
          {/* Header Skeleton */}
          <div className="flex items-center gap-4">
            <div className="animate-pulse bg-muted rounded h-8 w-8"></div>
            <div className="flex-1">
              <div className="animate-pulse bg-muted rounded h-8 w-48 mb-2"></div>
              <div className="animate-pulse bg-muted rounded h-4 w-24"></div>
            </div>
            <div className="animate-pulse bg-muted rounded h-10 w-24"></div>
          </div>

          {/* Progress Skeleton */}
          <div className="border rounded-lg p-6 space-y-4">
            <div className="animate-pulse bg-muted rounded h-6 w-32"></div>
            <div className="animate-pulse bg-muted rounded h-3 w-full"></div>
            <div className="flex justify-between">
              <div className="animate-pulse bg-muted rounded h-4 w-20"></div>
              <div className="animate-pulse bg-muted rounded h-4 w-16"></div>
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Project Info */}
              <div className="border rounded-lg p-6 space-y-4">
                <div className="animate-pulse bg-muted rounded h-6 w-40"></div>
                <div className="animate-pulse bg-muted rounded h-4 w-full"></div>
                <div className="animate-pulse bg-muted rounded h-4 w-3/4"></div>
              </div>

              {/* Items List */}
              <div className="border rounded-lg p-6 space-y-4">
                <div className="animate-pulse bg-muted rounded h-6 w-32"></div>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="animate-pulse bg-muted rounded h-12 w-12"></div>
                      <div className="flex-1">
                        <div className="animate-pulse bg-muted rounded h-5 w-32 mb-2"></div>
                        <div className="animate-pulse bg-muted rounded h-3 w-full mb-1"></div>
                        <div className="animate-pulse bg-muted rounded h-4 w-20"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="border rounded-lg p-4 space-y-4">
                <div className="animate-pulse bg-muted rounded h-6 w-24"></div>
                <div className="animate-pulse bg-muted rounded h-10 w-full"></div>
                <div className="animate-pulse bg-muted rounded h-8 w-20"></div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  if (error || !project) {
    return (
      <Container>
        <div className="py-8 text-center">
          <p className="text-red-500 mb-4">Error: {error || 'Project not found'}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </Container>
    );
  }

  const completedItems = (project.items || []).filter(item => item.contributed_quantity >= item.required_quantity).length;
  const totalItems = (project.items || []).length;
  const overallProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <TooltipProvider>
      <Container>
      <div className="space-y-6 py-8 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </div>

        {/* Project Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-3">
                    <Input
                      value={editData.name}
                      onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Project name"
                      className="text-xl font-bold"
                    />
                    <Textarea
                      value={editData.description}
                      onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Project description (optional)"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveEdit}>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-2xl">{project.name}</CardTitle>
                      <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    {project.description && (
                      <p className="text-muted-foreground mt-2">{project.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-3">
                      <Badge variant="outline" className="text-sm font-mono bg-muted/50 text-muted-foreground border-muted-foreground/20">
                        #{project.project_number}
                      </Badge>
                      {project.ownerName && (
                        <Badge variant="outline" className="text-sm font-mono bg-muted/50 text-muted-foreground border-muted-foreground/20">
                          {project.ownerName}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Badge className={priorityLabels[project.priority as keyof typeof priorityLabels]?.color || 'bg-gray-100 text-gray-800'}>
                  {priorityLabels[project.priority as keyof typeof priorityLabels]?.label || 'Unknown'}
                </Badge>
                
                {/* Project Actions Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {project.status === 'Active' && (
                      <>
                        <DropdownMenuItem onClick={handleCompleteProject} disabled={isCompleting}>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          {isCompleting ? 'Completing...' : 'Mark Completed'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleArchiveProject} disabled={isArchiving}>
                          <Archive className="h-4 w-4 mr-2" />
                          {isArchiving ? 'Archiving...' : 'Archive'}
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Project
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Project</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{project.name}"? This action cannot be undone and will remove all project data including items and contributions.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteProject}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {isDeleting ? 'Deleting...' : 'Delete Project'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Progress Overview */}
            <div className="grid gap-4 md:grid-cols-3 mt-6">
              <div className="flex items-center gap-3">
                <Target className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Progress</p>
                  <p className="text-2xl font-bold">{overallProgress}%</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Items</p>
                  <p className="text-2xl font-bold">{completedItems}/{totalItems}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="text-lg font-semibold">{project.status}</p>
                </div>
              </div>
            </div>
            
            <Progress value={overallProgress} className="mt-4" />
            
            {/* Permission Warning - DISABLED */}
          </CardHeader>
        </Card>

        {/* Items Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Required Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(project.items || []).length === 0 ? (
              /* Empty State - Clean, prominent add first item experience */
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <Package className="h-12 w-12 text-primary/60" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No items defined yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Start building your project by adding the items and resources needed to complete it.
                </p>
                
                {/* Add First Item Form */}
                <div className="max-w-2xl mx-auto space-y-4 p-6 border-2 border-dashed border-primary/20 rounded-lg bg-primary/5">
                  <h4 className="font-medium text-left">Add Your First Item</h4>
                  
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="md:col-span-2">
                      <ItemSearchCombobox
                        value={newItem.itemName}
                        onValueChange={(value) => {
                          if (!value) {
                            setNewItem(prev => ({
                              ...prev,
                              itemName: '',
                              tier: 1
                            }));
                          }
                        }}
                        onItemSelect={handleItemSelect}
                        placeholder="Search for an item..."
                      />
                      {newItem.itemName && (
                        <p className="text-sm text-green-600 mt-2 text-left">Selected: {newItem.itemName}</p>
                      )}
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <Input
                        type="number"
                        min="1"
                        value={newItem.requiredQuantity}
                        onChange={(e) => setNewItem(prev => ({ 
                          ...prev, 
                          requiredQuantity: parseInt(e.target.value) || 1 
                        }))}
                        className="w-24 text-center"
                        placeholder="Qty"
                      />
                      
                      {true ? ( // PERMISSION CHECK DISABLED
                        <Button
                          disabled={isAddingItem || !newItem.itemName.trim()}
                          onClick={handleAddItem}
                          size="lg"
                        >
                          {isAddingItem ? (
                            'Adding...'
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Item
                            </>
                          )}
                        </Button>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <Button
                                disabled={true}
                                size="lg"
                                variant="outline"
                              >
                                <Lock className="h-4 w-4 mr-2" />
                                Add Item
                              </Button>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-medium">Permission Required</p>
                            <p className="text-sm opacity-80">
                              {permissions.isOwner 
                                ? 'Contact the settlement co-owner for access' 
                                : 'Only project owners and settlement co-owners can edit projects'
                              }
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                  
                  {newItem.itemName && (
                    <div className="text-left">
                      <Input
                        placeholder="Notes (optional)"
                        value={newItem.notes}
                        onChange={(e) => setNewItem(prev => ({ ...prev, notes: e.target.value }))}
                        className="max-w-md"
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Items Table - When items exist */
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-center">Required Quantity</TableHead>
                    <TableHead className="text-center">Progress</TableHead>
                    <TableHead className="text-center">Contribute</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(project.items || []).map((item) => {
                  const remaining = item.required_quantity - item.contributed_quantity;
                  const progress = Math.round((item.contributed_quantity / item.required_quantity) * 100);
                  const isComplete = item.contributed_quantity >= item.required_quantity;
                  const isEditing = editingItems[item.id] !== undefined;
                  
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {getItemLink(item.item_name) ? (
                            <Link href={getItemLink(item.item_name)!} title="View in Calculator">
                              <div className="relative h-12 w-12 flex-shrink-0 rounded bg-muted p-1 hover:bg-muted/80 cursor-pointer">
                                <Image
                                  src={getItemIcon(item.item_name)}
                                  alt={item.item_name}
                                  fill
                                  sizes="48px"
                                  className="object-contain"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = '/assets/Unknown.webp';
                                  }}
                                />
                              </div>
                            </Link>
                          ) : (
                            <div className="relative h-12 w-12 flex-shrink-0 rounded bg-muted p-1">
                              <Image
                                src={getItemIcon(item.item_name)}
                                alt={item.item_name}
                                fill
                                sizes="48px"
                                className="object-contain"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/assets/Unknown.webp';
                                }}
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {getItemLink(item.item_name) ? (
                                <Link 
                                  href={getItemLink(item.item_name)!} 
                                  className="font-medium text-primary hover:underline"
                                  title="View in Calculator"
                                >
                                  {item.item_name}
                                </Link>
                              ) : (
                                <div className="font-medium">{item.item_name}</div>
                              )}
                              <BricoTierBadge tier={item.tier} size="sm" />
                            </div>
                            {item.notes && (
                              <div className="text-sm text-muted-foreground">{item.notes}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <div className="flex items-center gap-2 justify-center">
                          {isEditing ? (
                            <>
                              <Input
                                type="number"
                                min="1"
                                value={editingItems[item.id]}
                                onChange={(e) => setEditingItems(prev => ({ ...prev, [item.id]: e.target.value }))}
                                className="w-20 text-center"
                                autoFocus
                              />
                              <Button
                                size="sm"
                                onClick={() => handleSaveQuantity(item.id)}
                                className="h-8 w-8 p-0"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCancelEdit(item.id)}
                                className="h-8 w-8 p-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <span className="text-lg font-mono">{item.required_quantity}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditQuantity(item.id, item.required_quantity)}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                title="Edit required quantity"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <div className="space-y-2">
                          <div className="text-sm">
                            <span className={isComplete ? 'text-green-600 font-medium' : ''}>
                              {item.contributed_quantity}
                            </span>
                            <span className="text-muted-foreground"> / {item.required_quantity}</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                          <div className="text-xs text-muted-foreground">
                            {remaining === 0 && 'Complete! ✅'}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          onClick={() => handleOpenContribution(item.id)}
                          disabled={isComplete}
                          className="min-w-[80px]"
                        >
                          {isComplete ? 'Complete' : 'Contribute'}
                        </Button>
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setItemToDelete({id: item.id, name: item.item_name})}
                          title="Remove item from project"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                
                  {/* Add Another Item Row - Only shown when items exist and user has permissions */}
                  {true && ( // PERMISSION CHECK DISABLED
                  <TableRow className="border-t-2 border-dashed border-primary/30 bg-primary/5">
                    <TableCell colSpan={5} className="p-4">
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">Add Another Item</h4>
                      
                      <div className="grid gap-3 md:grid-cols-3">
                        <div className="md:col-span-2">
                          <ItemSearchCombobox
                            value={newItem.itemName}
                            onValueChange={(value) => {
                              if (!value) {
                                setNewItem(prev => ({
                                  ...prev,
                                  itemName: '',
                                  tier: 1
                                }));
                              }
                            }}
                            onItemSelect={handleItemSelect}
                            placeholder="Search for an item..."
                          />
                          {newItem.itemName && (
                            <p className="text-sm text-green-600 mt-1">Selected: {newItem.itemName}</p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="1"
                            value={newItem.requiredQuantity}
                            onChange={(e) => setNewItem(prev => ({ 
                              ...prev, 
                              requiredQuantity: parseInt(e.target.value) || 1 
                            }))}
                            className="w-20 text-center"
                            placeholder="Qty"
                          />
                          
                          <Button
                            disabled={isAddingItem || !newItem.itemName.trim()}
                            onClick={handleAddItem}
                          >
                            {isAddingItem ? (
                              'Adding...'
                            ) : (
                              <>
                                <Plus className="h-4 w-4 mr-2" />
                                Add
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      {newItem.itemName && (
                        <Input
                          placeholder="Notes (optional)"
                          value={newItem.notes}
                          onChange={(e) => setNewItem(prev => ({ ...prev, notes: e.target.value }))}
                          className="max-w-md"
                        />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
                )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Contribution History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Contribution History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {project.contributions && project.contributions.length > 0 ? (
              <div className="space-y-4">
                {project.contributions
                  .sort((a, b) => new Date(b.contributedAt).getTime() - new Date(a.contributedAt).getTime())
                  .slice(0, 20) // Show last 20 contributions
                  .map((contribution) => (
                    <div key={contribution.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{contribution.memberName}</span>
                          <Badge variant="secondary" className="text-xs">
                            {contribution.contributionType}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {contribution.deliveryMethod}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {contribution.itemName && (
                            <div className="flex items-center gap-2">
                              {(() => {
                                // Find the matching project item to get tier info
                                const projectItem = project?.items?.find(item => 
                                  item.item_name.toLowerCase() === contribution.itemName?.toLowerCase()
                                );
                                const iconPath = getItemIcon(contribution.itemName);
                                
                                return (
                                  <>
                                    <div className="relative">
                                      <Image
                                        src={iconPath}
                                        alt={contribution.itemName}
                                        width={20}
                                        height={20}
                                        className="rounded border"
                                      />
                                      {projectItem && (
                                        <div className="absolute -top-1 -right-1">
                                          <BricoTierBadge tier={projectItem.tier} size="sm" />
                                        </div>
                                      )}
                                    </div>
                                    <span className="font-medium">
                                      {contribution.quantity}x {contribution.itemName}
                                    </span>
                                  </>
                                );
                              })()}
                              {contribution.description && (
                                <span className="ml-1">- {contribution.description}</span>
                              )}
                            </div>
                          )}
                          {!contribution.itemName && (
                            <span>{contribution.quantity} items</span>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(contribution.contributedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No contributions yet. Be the first to contribute!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Contribution Dialog */}
      <Dialog open={!!contributingItem} onOpenChange={handleCloseContribution}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Contribute Items</DialogTitle>
            <DialogDescription>
              Add items to help complete this project
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {contributingItem && (
              <>
                {(() => {
                  const item = (project?.items || []).find(i => i.id === contributingItem);
                  if (!item) return null;
                  const remaining = item.required_quantity - item.contributed_quantity;
                  const iconPath = getItemIcon(item.item_name);
                  
                  return (
                    <>
                      {/* Item Display with Icon and Tier */}
                      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border">
                        <div className="relative">
                          <Image
                            src={iconPath}
                            alt={item.item_name}
                            width={48}
                            height={48}
                            className="rounded-md border"
                          />
                          <div className="absolute -top-1 -right-1">
                            <BricoTierBadge tier={item.tier} size="sm" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{item.item_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {remaining} of {item.required_quantity} still needed
                          </div>
                        </div>
                      </div>

                      {/* Field Order: Delivery Method → Amount → Note */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Delivery Method</label>
                        <Select value={deliveryMethod} onValueChange={setDeliveryMethod}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select delivery method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Dropbox">Dropbox</SelectItem>
                            <SelectItem value="Officer Handoff">Officer Handoff</SelectItem>
                            <SelectItem value="Added to Building">Added to Building</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Amount to contribute</label>
                        <Input
                          type="number"
                          min="1"
                          value={contributionAmount}
                          onChange={(e) => setContributionAmount(e.target.value)}
                          placeholder="Enter amount"
                          className="text-center"
                        />

                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Note (optional)</label>
                        <Textarea
                          value={contributionNote}
                          onChange={(e) => setContributionNote(e.target.value)}
                          placeholder="Add a note about your contribution..."
                          className="resize-none"
                          rows={2}
                        />
                      </div>
                    </>
                  );
                })()}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseContribution}>
              Cancel
            </Button>
            <Button 
              onClick={handleContribute}
              disabled={!contributionAmount || parseInt(contributionAmount) <= 0}
            >
              Contribute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Item Dialog */}
      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{itemToDelete?.name}" from this project? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteItem}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove Item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Container>
    </TooltipProvider>
  );
}