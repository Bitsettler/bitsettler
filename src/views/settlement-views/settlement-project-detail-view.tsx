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
  Search,
  Target,
  Users,
  Trash2,
  Archive,
  MoreHorizontal
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
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { ItemSearchCombobox } from '@/components/projects/item-search-combobox';
import { getCalculatorGameData } from '@/lib/spacetime-db-new/modules/calculator/flows/get-calculator-game-data';
import { getServerIconPath, cleanIconAssetName } from '@/lib/spacetime-db-new/shared/assets';
import Image from 'next/image';
import Link from 'next/link';

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

interface ProjectDetails {
  id: string;
  project_number: number;
  short_id: string;
  name: string;
  description?: string;
  priority: number;
  status: 'Active' | 'Completed' | 'Cancelled';
  completionPercentage: number;
  created_by: string;
  created_at: string;
  items: ProjectItem[];
}

interface NewItem {
  itemName: string;
  tier: number;
  requiredQuantity: number;
  notes: string;
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
  
  // Contributing state
  const [contributing, setContributing] = useState<Set<string>>(new Set());
  const [customContributions, setCustomContributions] = useState<Record<string, string>>({});
  
  // Project management state
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  
  // Game data for item icons and links
  const gameData = useMemo(() => getCalculatorGameData(), []);
  
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
      
      const result = await api.get(`/api/settlement/projects/${projectId}`);
      
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
    }
  }, [projectId]);

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

  // Quick contribute
  const handleQuickContribute = async (itemId: string, amount: number) => {
    if (!project) return;
    
    const item = (project.items || []).find(i => i.id === itemId);
    if (!item) return;
    
    const remaining = item.required_quantity - item.contributed_quantity;
    const actualAmount = Math.min(amount, remaining);
    
    if (actualAmount <= 0) return;
    
    // Optimistic update
    setContributing(prev => new Set(prev).add(itemId));
    setProject(prev => prev ? {
      ...prev,
      items: (prev.items || []).map(i => 
        i.id === itemId 
          ? { ...i, contributed_quantity: i.contributed_quantity + actualAmount }
          : i
      )
    } : null);

    try {
      const result = await api.post('/api/settlement/contributions', {
        projectId: project.id, // Use the UUID, not the project number
        itemName: item.item_name, // Use itemName instead of itemId
        quantity: actualAmount,
        contributionType: 'Direct', // Required field
        notes: ''
      });

      if (!result.success) {
        // Revert optimistic update
        setProject(prev => prev ? {
          ...prev,
          items: (prev.items || []).map(i => 
            i.id === itemId 
              ? { ...i, contributed_quantity: i.contributed_quantity - actualAmount }
              : i
          )
        } : null);
        throw new Error(result.error || 'Failed to contribute');
      }

      toast.success(`Contributed ${actualAmount} items!`);
    } catch (error) {
      console.error('Error contributing:', error);
      toast.error('Failed to contribute. Please try again.');
    } finally {
      setContributing(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  // Custom contribution
  const handleCustomContribute = async (itemId: string) => {
    const amount = parseInt(customContributions[itemId] || '0');
    if (amount > 0) {
      await handleQuickContribute(itemId, amount);
      setCustomContributions(prev => ({ ...prev, [itemId]: '' }));
    }
  };

  // Add new item
  const handleAddItem = async () => {
    if (!project || !newItem.itemName.trim()) {
      toast.error('Item name is required');
      return;
    }

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
        throw new Error(result.error || 'Failed to add item');
      }
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('Failed to add item. Please try again.');
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

  // Archive project (set status to Cancelled)
  const handleArchiveProject = async () => {
    if (!project) return;

    setIsArchiving(true);
    try {
      const result = await api.put(`/api/settlement/projects/${projectId}`, {
        status: 'Cancelled'
      });

      if (result.success) {
        setProject(prev => prev ? {
          ...prev,
          status: 'Cancelled'
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

    try {
      const result = await api.put(`/api/settlement/projects/${projectId}`, {
        status: 'Completed'
      });

      if (result.success) {
        setProject(prev => prev ? {
          ...prev,
          status: 'Completed'
        } : null);
        toast.success('Project marked as complete! 🎉');
      } else {
        throw new Error(result.error || 'Failed to complete project');
      }
    } catch (error) {
      console.error('Error completing project:', error);
      toast.error('Failed to complete project. Please try again.');
    }
  };

  if (loading) {
    return (
      <Container>
        <div className="py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
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
    <Container>
      <div className="space-y-6 py-8">
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
                      <CardTitle className="text-2xl">#{project.project_number} {project.name}</CardTitle>
                      <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    {project.description && (
                      <p className="text-muted-foreground mt-2">{project.description}</p>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Badge className={priorityLabels[project.priority as keyof typeof priorityLabels]?.color || 'bg-gray-100 text-gray-800'}>
                  {priorityLabels[project.priority as keyof typeof priorityLabels]?.label || 'Unknown'}
                </Badge>
                <Badge variant={project.status === 'Active' ? 'default' : 'secondary'}>
                  {project.status}
                </Badge>
                
                {/* Project Actions Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {project.status === 'Active' && overallProgress === 100 && (
                      <DropdownMenuItem onClick={handleCompleteProject}>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Mark Complete
                      </DropdownMenuItem>
                    )}
                    
                    {project.status === 'Active' && (
                      <DropdownMenuItem onClick={handleArchiveProject} disabled={isArchiving}>
                        <Archive className="h-4 w-4 mr-2" />
                        {isArchiving ? 'Archiving...' : 'Archive Project'}
                      </DropdownMenuItem>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-center">Progress</TableHead>
                  <TableHead className="text-center">Contribute</TableHead>
                  <TableHead className="text-center">Quick Actions</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(project.items || []).map((item) => {
                  const remaining = item.required_quantity - item.contributed_quantity;
                  const progress = Math.round((item.contributed_quantity / item.required_quantity) * 100);
                  const isComplete = item.contributed_quantity >= item.required_quantity;
                  const isContributing = contributing.has(item.id);
                  
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
                            {item.notes && (
                              <div className="text-sm text-muted-foreground">{item.notes}</div>
                            )}
                          </div>
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
                            {remaining > 0 ? `${remaining} needed` : 'Complete! ✅'}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <div className="flex items-center gap-2 justify-center">
                          <Input
                            type="number"
                            min="1"
                            max={remaining}
                            value={customContributions[item.id] || ''}
                            onChange={(e) => setCustomContributions(prev => ({ 
                              ...prev, 
                              [item.id]: e.target.value 
                            }))}
                            placeholder="Amount"
                            className="w-20 text-center"
                            disabled={isContributing || remaining <= 0}
                          />
                          <Button
                            size="sm"
                            disabled={
                              isContributing || 
                              remaining <= 0 || 
                              !customContributions[item.id] || 
                              parseInt(customContributions[item.id]) <= 0
                            }
                            onClick={() => handleCustomContribute(item.id)}
                          >
                            Add
                          </Button>
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <div className="flex items-center gap-1 justify-center">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isContributing || remaining <= 0}
                            onClick={() => handleQuickContribute(item.id, 1)}
                            className="h-8 w-8 p-0"
                          >
                            +1
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isContributing || remaining <= 0}
                            onClick={() => handleQuickContribute(item.id, 5)}
                            className="h-8 w-10 p-0 text-xs"
                          >
                            +5
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isContributing || remaining <= 0}
                            onClick={() => handleQuickContribute(item.id, remaining)}
                            className="h-8 w-12 p-0 text-xs"
                          >
                            Max
                          </Button>
                        </div>
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
                
                {/* Add Item Row */}
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
              </TableBody>
            </Table>
            
            {(project.items || []).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No items added yet. Add your first item above to get started!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
  );
}