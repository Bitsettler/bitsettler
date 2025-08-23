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
import Image from 'next/image';
import Link from 'next/link';
import { BricoTierBadge } from '@/components/ui/brico-tier-badge';
import { ContributionDisplay } from '@/components/projects/contribution-display';
import { resolveItemDisplay } from '@/lib/settlement/item-display';
import { SelectedItemDisplay } from '@/components/projects/selected-item-display';

interface ProjectItem {
  id: string;
  itemName: string;
  requiredQuantity: number;
  contributedQuantity: number;
  tier: number;
  priority: number;
  notes?: string;
  status: string;
}

interface MemberContribution {
  id: string;
  memberId: string;
  memberName: string;
  itemName: string | null;
  quantity: number;
  description: string | null;
  deliveryMethod: 'Dropbox' | 'Officer Handoff' | 'Added to Building' | 'Other';
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
  category?: string;
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
    notes: '',
    category: ''
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
  
  // Pagination state for performance
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20); // Show 20 items per page
  const [isCompleting, setIsCompleting] = useState(false);
  
  // Game data for item icons and links
  const gameData = useMemo(() => getCalculatorGameData(), []);
  
  // Fetch project permissions - DISABLED: Everyone has full permissions
  const fetchProjectPermissions = useCallback(() => {
    // No-op: permissions are hardcoded to true for everyone
    return Promise.resolve();
  }, []);
  
  // Function to get item icon by name (use resolver)
  const getItemIcon = useCallback((itemName: string): string => {
    return resolveItemDisplay(itemName).iconPath || '/assets/Unknown.webp';
  }, []);
  
  // Function to get item calculator link by name
  const getItemLink = useCallback((itemName: string): string | null => {
    if (!itemName) return null;
    
    // First check if the item exists in calculator data
    const calculatorItem = gameData.items.find(item => 
      item.name?.toLowerCase().trim() === itemName.toLowerCase().trim()
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
        const projectData = (result.data as any).data || result.data;
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
        tier: item.tier || 1,
        category: item.category || ''
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
        contributionType: 'Direct',
        projectId: project.id,
        projectItemId: item.id,
        itemName: item.itemName,
        quantity: amount,
        deliveryMethod: deliveryMethod,
        notes: contributionNote.trim() || ''
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to contribute');
      }

      toast.success(`Contributed ${amount} ${item.itemName}!`);
      
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
        setNewItem({ itemName: '', tier: 1, requiredQuantity: 1, notes: '', category: '' });
        
        toast.success('Item added successfully!');
        
        // Refresh project data to get the updated items list
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
          <div className="flex items-center gap-4">
            <div className="animate-pulse bg-muted rounded h-8 w-8"></div>
            <div className="flex-1">
              <div className="animate-pulse bg-muted rounded h-8 w-48 mb-2"></div>
              <div className="animate-pulse bg-muted rounded h-4 w-24"></div>
            </div>
            <div className="animate-pulse bg-muted rounded h-10 w-24"></div>
          </div>

          <div className="border rounded-lg p-6 space-y-4">
            <div className="animate-pulse bg-muted rounded h-6 w-32"></div>
            <div className="animate-pulse bg-muted rounded h-3 w-full"></div>
            <div className="flex justify-between">
              <div className="animate-pulse bg-muted rounded h-4 w-20"></div>
              <div className="animate-pulse bg-muted rounded h-4 w-16"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="border rounded-lg p-6 space-y-4">
                <div className="animate-pulse bg-muted rounded h-6 w-40"></div>
                <div className="animate-pulse bg-muted rounded h-4 w-full"></div>
                <div className="animate-pulse bg-muted rounded h-4 w-3/4"></div>
              </div>

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

  const completedItems = (project.items || []).filter(item => 
    (item.contributedQuantity || 0) >= (item.requiredQuantity || 1)
  ).length;
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
                      <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                        {project.ownerName && (
                          <span>Created by {project.ownerName}</span>
                        )}
                        <Badge variant="outline">#{project.project_number}</Badge>
                        <Badge 
                          variant={project.status === 'Active' ? 'default' : 'secondary'}
                        >
                          {project.status}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {project.status === 'Active' && (
                    <Button 
                      size="sm" 
                      onClick={handleCompleteProject}
                      disabled={isCompleting}
                    >
                      {isCompleting ? (
                        'Completing...'
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Mark Complete
                        </>
                      )}
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleArchiveProject} disabled={isArchiving}>
                        <Archive className="h-4 w-4 mr-2" />
                        {isArchiving ? 'Archiving...' : 'Archive Project'}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={handleDeleteProject} 
                        disabled={isDeleting}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {isDeleting ? 'Deleting...' : 'Delete Project'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Progress Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Progress Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Overall Progress</span>
                    <span>{overallProgress}%</span>
                  </div>
                  <Progress value={overallProgress} className="h-2" />
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{completedItems} of {totalItems} items completed</span>
                  <span>{totalItems - completedItems} remaining</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Project Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead>Contributed</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {project.items && project.items.length > 0 ? (
                    <>
                      {project.items
                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                        .map((item) => {
                          const progress = item.requiredQuantity > 0 
                            ? Math.min(100, Math.round(((item.contributedQuantity || 0) / item.requiredQuantity) * 100))
                            : 0;
                          const isCompleted = (item.contributedQuantity || 0) >= (item.requiredQuantity || 1);
                          const itemIcon = getItemIcon(item.itemName);
                          const itemLink = getItemLink(item.itemName);
                          
                          return (
                            <TableRow key={item.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="relative">
                                    <Image
                                      src={itemIcon}
                                      alt={item.itemName}
                                      width={40}
                                      height={40}
                                      className="rounded border"
                                    />
                                    <BricoTierBadge tier={item.tier} className="absolute -top-1 -right-1" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      {itemLink ? (
                                        <Link href={itemLink} className="font-medium hover:underline">
                                          {item.itemName}
                                        </Link>
                                      ) : (
                                        <span className="font-medium">{item.itemName}</span>
                                      )}
                                      {isCompleted && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                                    </div>
                                    {item.notes && (
                                      <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {editingItems[item.id] ? (
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="number"
                                      value={editingItems[item.id]}
                                      onChange={(e) => setEditingItems(prev => ({ ...prev, [item.id]: e.target.value }))}
                                      className="w-20"
                                      min="1"
                                    />
                                    <Button size="sm" onClick={() => handleSaveQuantity(item.id)}>
                                      <Check className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => handleCancelEdit(item.id)}>
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span>{item.requiredQuantity || 0}</span>
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      onClick={() => handleEditQuantity(item.id, item.requiredQuantity || 0)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <span className={isCompleted ? 'text-green-600 font-medium' : ''}>
                                  {item.contributedQuantity}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Progress value={progress} className="w-16 h-2" />
                                  <span className="text-sm">{progress}%</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleOpenContribution(item.id)}
                                  >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Contribute
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setItemToDelete({ id: item.id, name: item.itemName })}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      
                      {/* Add New Item Row */}
                      <TableRow className="border-t-2 border-dashed border-primary/30 bg-primary/5">
                        <TableCell colSpan={5} className="p-4">
                          <div className="space-y-3">
                            <h4 className="font-medium text-sm">Add New Item</h4>
                            <div className="grid gap-3 md:grid-cols-3">
                              <div className="md:col-span-2">
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
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  placeholder="Quantity"
                                  value={newItem.requiredQuantity}
                                  onChange={(e) => setNewItem(prev => ({ ...prev, requiredQuantity: parseInt(e.target.value) || 1 }))}
                                  className="w-24"
                                  min="1"
                                />
                                <Button
                                  onClick={handleAddItem}
                                  disabled={isAddingItem || !newItem.itemName}
                                  size="lg"
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
                    </>
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No items in this project yet. Add some items to get started!
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              
              {/* Pagination Controls */}
              {project.items && project.items.length > itemsPerPage && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, project.items.length)} of {project.items.length} items
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm font-medium px-3">
                      Page {currentPage} of {Math.ceil(project.items.length / itemsPerPage)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(Math.ceil(project.items.length / itemsPerPage), prev + 1))}
                      disabled={currentPage >= Math.ceil(project.items.length / itemsPerPage)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contribution History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Recent Contributions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {project.contributions && project.contributions.length > 0 ? (
                <div className="space-y-4">
                  {project.contributions
                    .sort((a, b) => new Date(b.contributedAt).getTime() - new Date(a.contributedAt).getTime())
                    .slice(0, 10)
                    .map((contribution, i) => (
                      <div key={contribution.id} className="flex items-start gap-3 p-3 rounded-lg border">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{contribution.memberName}</span>
                            {contribution.itemName && (
                              <span className="text-sm text-muted-foreground">
                                contributed {contribution.quantity}x {contribution.itemName}
                              </span>
                            )}
                          </div>
                          {contribution.description && (
                            <p className="text-sm text-muted-foreground">{contribution.description}</p>
                          )}
                          {!contribution.itemName && (
                            <p className="text-sm text-muted-foreground">General contribution</p>
                          )}
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <div>{new Date(contribution.contributedAt).toLocaleDateString()}</div>
                          <div className="text-xs">{contribution.deliveryMethod}</div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  No contributions yet. Be the first to contribute!
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Contribution Dialog */}
        {contributingItem && (
          <Dialog open={!!contributingItem} onOpenChange={handleCloseContribution}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Contribute to Project</DialogTitle>
                <DialogDescription>
                  Add your contribution to this project item.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {(() => {
                  const item = (project.items || []).find(i => i.id === contributingItem);
                  if (!item) return null;
                  
                  return (
                    <>
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <Image
                          src={getItemIcon(item.itemName)}
                          alt={item.itemName}
                          width={48}
                          height={48}
                          className="rounded border"
                        />
                        <div>
                          <h3 className="font-medium">{item.itemName}</h3>
                          <p className="text-sm text-muted-foreground">
                            {item.contributedQuantity} / {item.requiredQuantity} contributed
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Delivery Method</label>
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
                      
                      <div>
                        <label className="text-sm font-medium">Quantity</label>
                        <Input
                          type="number"
                          value={contributionAmount}
                          onChange={(e) => setContributionAmount(e.target.value)}
                          placeholder="How many are you contributing?"
                          min="1"
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Notes (Optional)</label>
                        <Textarea
                          value={contributionNote}
                          onChange={(e) => setContributionNote(e.target.value)}
                          placeholder="Any additional notes..."
                          rows={3}
                        />
                      </div>
                    </>
                  );
                })()}
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
        )}

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
