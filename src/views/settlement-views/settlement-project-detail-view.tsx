'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from '@/hooks/use-auth';
import { Container } from '@/components/container';
import { TooltipProvider } from '@/components/ui/tooltip';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { getCalculatorGameData } from '@/lib/spacetime-db-new/modules/calculator/flows/get-calculator-game-data';

// Import our new components
import { ProjectHeader } from '@/components/settlement/project-header';
import { ProjectItemsTable } from '@/components/settlement/project-items-table';
import { AddItemForm } from '@/components/settlement/add-item-form';
import { ContributeItemDialog } from '@/components/settlement/contribute-item-dialog';
import { ProjectContributions } from '@/components/settlement/project-contributions';

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

export function SettlementProjectDetailView() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const projectId = params.id as string;
  
  // Core state
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI state
  const [contributingItem, setContributingItem] = useState<ProjectItem | null>(null);
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  
  // Game data for item search - lazy load only when needed
  const [gameData, setGameData] = useState<any>(null);
  const [gameDataLoading, setGameDataLoading] = useState(false);
  
  // Permissions - simplified for now (everyone can do everything)
  const permissions = {
    canEdit: true,
    canArchive: true,
    canDelete: true,
    canContribute: true
  };

  // Fetch project data
  const fetchProject = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await api.get(`/api/settlement/projects/${projectId}`);
      
      if (result.success) {
        const projectData = (result.data as any).data || result.data;
        setProject(projectData);
      } else {
        setError(result.error || 'Failed to load project');
      }
    } catch (err) {
      console.error('Error fetching project:', err);
      setError('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  // Lazy load game data only when adding items
  const loadGameData = async () => {
    if (gameData || gameDataLoading) return;
    
    setGameDataLoading(true);
    try {
      const data = getCalculatorGameData();
      setGameData(data);
    } catch (error) {
      console.error('Failed to load game data:', error);
    } finally {
      setGameDataLoading(false);
    }
  };

  // Project update handler
  const handleProjectUpdate = async (updates: { name?: string; description?: string }) => {
    if (!project) return;
    
    try {
      const result = await api.put(`/api/settlement/projects/${project.id}`, updates);

      if (result.success) {
        setProject(prev => prev ? { ...prev, ...updates } : null);
        toast.success('Project updated successfully');
      } else {
        toast.error(result.error || 'Failed to update project');
      }
    } catch (error) {
      console.error('Failed to update project:', error);
      toast.error('Failed to update project');
    }
  };

  // Add item handler
  const handleAddItem = async (newItem: NewItem) => {
    if (!project) return;
    
    try {
      const result = await api.post(`/api/settlement/projects/${project.id}/items`, {
        itemName: newItem.itemName,
        requiredQuantity: newItem.requiredQuantity,
        tier: newItem.tier,
        priority: 3, // Default priority
        notes: newItem.notes
      });

      if (result.success) {
        await fetchProject(); // Refresh to get updated data
        toast.success('Item added successfully');
      } else {
        toast.error(result.error || 'Failed to add item');
      }
    } catch (error) {
      console.error('Failed to add item:', error);
      toast.error('Failed to add item');
    }
  };

  // Contribute handler - optimistic updates
  const handleContribute = async (contribution: {
    itemId: string;
    quantity: number;
    deliveryMethod: string;
    notes: string;
  }) => {
    if (!project) return;
    
    const item = project.items.find(i => i.id === contribution.itemId);
    if (!item) return;
    
    // Optimistic update - update UI immediately
    const optimisticContribution = {
      id: `temp-${Date.now()}`,
      memberId: session?.user?.id || 'unknown',
      memberName: session?.user?.name || 'You',
      itemName: item.itemName,
      quantity: contribution.quantity,
      description: contribution.notes,
      deliveryMethod: contribution.deliveryMethod as any,
      contributedAt: new Date()
    };
    
    const updatedItems = project.items.map(i => 
      i.id === contribution.itemId 
        ? { ...i, contributedQuantity: (i.contributedQuantity || 0) + contribution.quantity }
        : i
    );
    
    const updatedProject = {
      ...project,
      items: updatedItems,
      contributions: [optimisticContribution, ...project.contributions]
    };
    
    setProject(updatedProject);
    toast.success('Contribution added successfully');
    
    try {
      const result = await api.post('/api/settlement/contributions', {
        contributionType: 'Direct',
        projectId: project.id,
        projectItemId: contribution.itemId,
        itemName: item.itemName,
        quantity: contribution.quantity,
        deliveryMethod: contribution.deliveryMethod,
        notes: contribution.notes
      });
      
      if (!result.success) {
        // Revert optimistic update on failure
        setProject(project);
        toast.error(result.error || 'Failed to add contribution');
      }
    } catch (error) {
      // Revert optimistic update on error
      setProject(project);
      console.error('Failed to contribute:', error);
      toast.error('Failed to add contribution');
    }
  };

  // Edit quantity handler
  const handleEditQuantity = async (itemId: string, quantity: number) => {
    if (!project) return;

    try {
      const result = await api.put(`/api/settlement/projects/${project.id}/items/${itemId}`, {
        requiredQuantity: quantity
      });

      if (result.success) {
        await fetchProject(); // Refresh to get updated data
        toast.success('Quantity updated successfully');
      } else {
        toast.error(result.error || 'Failed to update quantity');
      }
    } catch (error) {
      console.error('Failed to update quantity:', error);
      toast.error('Failed to update quantity');
    }
  };

  // Remove item handler
  const handleRemoveItem = async (itemId: string) => {
    if (!project) return;

    try {
      const result = await api.delete(`/api/settlement/projects/${project.id}/items/${itemId}`);

      if (result.success) {
        await fetchProject(); // Refresh to get updated data
        toast.success('Item removed successfully');
      } else {
        toast.error(result.error || 'Failed to remove item');
      }
    } catch (error) {
      console.error('Failed to remove item:', error);
      toast.error('Failed to remove item');
    }
  };

  // Project action handlers
  const handleArchive = async () => {
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
        toast.success('Project archived successfully!');
      } else {
        toast.error(result.error || 'Failed to archive project');
      }
    } catch (error) {
      console.error('Error archiving project:', error);
      toast.error('Failed to archive project. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!project) return;

    try {
      const result = await api.delete(`/api/settlement/projects/${projectId}`);

      if (result.success) {
        toast.success('Project deleted successfully!');
        router.push('/en/settlement/projects');
      } else {
        toast.error(result.error || 'Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project. Please try again.');
    }
  };

  const handleComplete = async () => {
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
        toast.success('Project marked as complete!');
      } else {
        toast.error(result.error || 'Failed to complete project');
      }
    } catch (error) {
      console.error('Error completing project:', error);
      toast.error('Failed to complete project. Please try again.');
    }
  };

  if (loading) {
    return (
      <TooltipProvider>
      <Container>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading project...</p>
          </div>
        </div>
      </Container>
      </TooltipProvider>
    );
  }

  if (error || !project) {
  return (
    <TooltipProvider>
      <Container>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-destructive mb-4">{error || 'Project not found'}</p>
              <button onClick={fetchProject} className="text-primary hover:underline">
                Try again
              </button>
            </div>
        </div>
      </Container>
    </TooltipProvider>
  );
}

  return (
    <TooltipProvider>
      <Container>
        <div className="space-y-6 py-8">
          {/* Project Header */}
          <ProjectHeader
            project={project}
            permissions={permissions}
            onUpdate={handleProjectUpdate}
            onArchive={handleArchive}
            onDelete={handleDelete}
            onComplete={handleComplete}
            onAddItem={() => setShowAddItemForm(true)}
          />

          {/* Add Item Form - only show when requested */}
          {showAddItemForm && (
            <AddItemForm
              onAddItem={async (item) => {
                await handleAddItem(item);
                setShowAddItemForm(false);
              }}
              gameData={gameData}
              onRequestGameData={loadGameData}
              gameDataLoading={gameDataLoading}
            />
          )}

          {/* Project Items Table */}
          <ProjectItemsTable
            items={project.items}
            permissions={permissions}
            onContribute={(itemId) => {
              const item = project.items.find(i => i.id === itemId);
              if (item) setContributingItem(item);
            }}
            onEditQuantity={handleEditQuantity}
            onRemoveItem={handleRemoveItem}
          />

        {/* Contribution History */}
          <ProjectContributions contributions={project.contributions} />

          {/* Contribute Item Dialog */}
          <ContributeItemDialog
            item={contributingItem}
            isOpen={!!contributingItem}
            onClose={() => setContributingItem(null)}
            onContribute={handleContribute}
          />
                          </div>
      </Container>
    </TooltipProvider>
  );
}
