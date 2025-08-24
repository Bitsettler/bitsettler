'use client';

import React, { useState, useMemo, memo, useCallback } from 'react';
import { Plus, Package, Edit, Save, X, Target, HandHeart, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { BricoTierBadge } from '@/components/ui/brico-tier-badge';
// No imports needed - just use simple icon paths
import Image from 'next/image';
import Link from 'next/link';
import { inferSkillFromPatterns } from '@/lib/skill-inference-patterns';
import { resolveItemDisplay } from '@/lib/settlement/item-display';

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

interface ProjectItemsTableProps {
  items: ProjectItem[];
  permissions: {
    canEdit: boolean;
    canContribute: boolean;
  };
  onContribute: (itemId: string) => void;
  onEditQuantity: (itemId: string, quantity: number) => Promise<void>;
  onRemoveItem: (itemId: string) => Promise<void>;
}

type GroupBy = 'none' | 'skill' | 'tier' | 'status';
type SortField = 'name' | 'required' | 'contributed' | 'progress' | 'tier';
type SortDirection = 'asc' | 'desc';

// Helper function to determine skill from item name using centralized patterns
function getItemSkill(itemName: string): string {
  return inferSkillFromPatterns(itemName) || 'Unknown';
}

// These helper functions are now replaced by the memoized itemDisplayData

export function ProjectItemsTable({ 
  items, 
  permissions, 
  onContribute, 
  onEditQuantity, 
  onRemoveItem 
}: ProjectItemsTableProps) {
  const [groupBy, setGroupBy] = useState<GroupBy>('skill');
  const [editingItems, setEditingItems] = useState<Record<string, string>>({});
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Auto-expand accordion groups when total items < 20
  const shouldAutoExpand = items.length < 20;

  // Sortable header component
  const SortableHeader = ({ field, children, className }: { field: SortField; children: React.ReactNode; className?: string }) => {
    const isActive = sortField === field;
    const icon = isActive ? (
      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
    ) : <ChevronsUpDown className="h-4 w-4" />;
    
    return (
      <TableHead className={className}>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 data-[state=open]:bg-accent flex items-center gap-1 p-1 hover:bg-accent"
          onClick={() => handleSort(field)}
        >
          {children}
          {icon}
        </Button>
      </TableHead>
    );
  };

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort items function
  const sortItems = (items: ProjectItem[]) => {
    return [...items].sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'name':
          aValue = a.itemName.toLowerCase();
          bValue = b.itemName.toLowerCase();
          break;
        case 'required':
          aValue = a.requiredQuantity;
          bValue = b.requiredQuantity;
          break;
        case 'contributed':
          aValue = a.contributedQuantity;
          bValue = b.contributedQuantity;
          break;
        case 'progress':
          aValue = a.requiredQuantity > 0 ? (a.contributedQuantity / a.requiredQuantity) * 100 : 0;
          bValue = b.requiredQuantity > 0 ? (b.contributedQuantity / b.requiredQuantity) * 100 : 0;
          break;
        case 'tier':
          aValue = a.tier;
          bValue = b.tier;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Group items based on groupBy setting
  const groupedItems = useMemo(() => {
    if (groupBy === 'none') {
      // Calculate overall progress for ungrouped items
      const totalRequired = items.reduce((sum, item) => sum + (item.requiredQuantity || 0), 0);
      const totalContributed = items.reduce((sum, item) => {
        const cappedContribution = Math.min(item.contributedQuantity || 0, item.requiredQuantity || 0);
        return sum + cappedContribution;
      }, 0);
      const completedItemCount = items.filter(item => 
        (item.contributedQuantity || 0) >= (item.requiredQuantity || 1)
      ).length;
      const progressPercentage = totalRequired > 0 ? Math.round((totalContributed / totalRequired) * 100) : 0;
      
      return [{
        title: 'All Items',
        count: items.length,
        items: sortItems(items),
        progressPercentage,
        totalRequired,
        totalContributed,
        completedItemCount
      }];
    }
    
    const groups: Record<string, ProjectItem[]> = {};
    
    items.forEach(item => {
      let groupKey: string;
      
      if (groupBy === 'skill') {
        groupKey = getItemSkill(item.itemName);
      } else if (groupBy === 'tier') {
        groupKey = item.tier > 0 ? `Tier ${item.tier}` : 'No Tier';
      } else if (groupBy === 'status') {
        const progress = item.requiredQuantity > 0 
          ? ((item.contributedQuantity || 0) / item.requiredQuantity) * 100 
          : 0;
        groupKey = progress >= 100 ? 'Completed' : progress > 0 ? 'In Progress' : 'Not Started';
      } else {
        groupKey = 'All Items';
      }
      
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(item);
    });
    
    return Object.entries(groups)
      .sort(([a], [b]) => {
        if (groupBy === 'tier') {
          const tierA = a.includes('Tier') ? parseInt(a.split(' ')[1]) : 999;
          const tierB = b.includes('Tier') ? parseInt(b.split(' ')[1]) : 999;
          return tierA - tierB;
        }
        return a.localeCompare(b);
      })
      .map(([title, groupItems]) => {
        // Calculate group progress based on actual contributions vs requirements
        const totalRequired = groupItems.reduce((sum, item) => sum + (item.requiredQuantity || 0), 0);
        const totalContributed = groupItems.reduce((sum, item) => {
          // Cap each item's contribution at its requirement for group calculation
          const cappedContribution = Math.min(item.contributedQuantity || 0, item.requiredQuantity || 0);
          return sum + cappedContribution;
        }, 0);
        const completedItemCount = groupItems.filter(item => 
          (item.contributedQuantity || 0) >= (item.requiredQuantity || 1)
        ).length;
        const progressPercentage = totalRequired > 0 ? Math.round((totalContributed / totalRequired) * 100) : 0;
        
        return {
          title,
          count: groupItems.length,
          items: sortItems(groupItems),
          progressPercentage,
          totalRequired,
          totalContributed,
          completedItemCount
        };
      });
  }, [items, groupBy, sortField, sortDirection]);

  const handleQuantityEdit = (itemId: string, value: string) => {
    setEditingItems(prev => ({ ...prev, [itemId]: value }));
  };

  const handleQuantitySave = async (itemId: string) => {
    const inputValue = editingItems[itemId];
    const newQuantity = parseInt(inputValue);
    
    // Comprehensive validation
    if (isNaN(newQuantity)) {
      alert('Please enter a valid number');
      return;
    }
    
    if (newQuantity < 1) {
      alert('Quantity must be at least 1');
      return;
    }
    
    // Set reasonable maximum (1 million)
    const MAX_QUANTITY = 1000000;
    if (newQuantity > MAX_QUANTITY) {
      alert(`Maximum quantity is ${MAX_QUANTITY.toLocaleString()}`);
      return;
    }
    
    // Check for scientific notation or extremely large numbers
    if (inputValue.includes('e') || inputValue.includes('E') || inputValue.length > 10) {
      alert(`Please enter a number between 1 and ${MAX_QUANTITY.toLocaleString()}`);
      return;
    }
    
    try {
      await onEditQuantity(itemId, newQuantity);
    } catch (error) {
      alert('Failed to update quantity. Please try again.');
      return;
    }
    
    // Clear editing state only on success
    setEditingItems(prev => {
      const { [itemId]: _, ...rest } = prev;
      return rest;
    });
  };

  const handleQuantityCancel = (itemId: string) => {
    setEditingItems(prev => {
      const { [itemId]: _, ...rest } = prev;
      return rest;
    });
  };

  // Simple: just generate icon paths from item names
  const getItemIcon = (itemName: string) => {
    // Remove quality prefixes and clean the name
    const qualityPrefixes = ['Basic', 'Simple', 'Fine', 'Exquisite', 'Peerless', 'Infused', 'Rough', 'Sturdy', 'Advanced', 'Comprehensive', 'Essential', 'Novice', 'Proficient', "Beginner's"];
    
    let cleanName = itemName;
    for (const prefix of qualityPrefixes) {
      if (cleanName.startsWith(prefix + ' ')) {
        cleanName = cleanName.substring(prefix.length + 1);
        break;
      }
    }
    
    // Handle plural to singular conversions for common cases
    if (cleanName.endsWith(' Carvings')) {
      cleanName = cleanName.replace(' Carvings', ' Carving');
    }
    
    // Handle specific item name mappings that don't follow the standard pattern
    if (cleanName === 'Crop Oil') {
      return '/assets/GeneratedIcons/Items/VegetableOil.webp';
    }
    if (cleanName === 'Metalworking Flux') {
      return '/assets/GeneratedIcons/Items/MetalworkersFlux.webp';
    }
    
    // Handle fish filets - all use the generic FishFilet asset
    if (cleanName.includes('Filet') || cleanName.includes('filet')) {
      return '/assets/GeneratedIcons/Items/FishFilet.webp';
    }
    
    // Handle Tree Sap - map to correct asset name
    if (cleanName === 'Tree Sap') {
      return '/assets/GeneratedIcons/Items/Sap.webp';
    }
    
    // Helper function to try multiple asset locations
    const tryAssetPaths = (baseName: string, specificPaths: string[] = []) => {
      // Try specific paths first
      for (const path of specificPaths) {
        return path;
      }
      
      // Try both Cargo and Items folders with the clean name
      const cleanAssetName = baseName.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
      
      // We'll return the Items path as default, but the image onError will handle fallbacks
      return `/assets/GeneratedIcons/Items/${cleanAssetName}.webp`;
    };
    
    // Handle roots - try cargo first, then items
    if (cleanName.endsWith(' Roots') || cleanName.endsWith(' Root')) {
      if (cleanName.includes('Plant')) {
        return '/assets/GeneratedIcons/Cargo/PlantRoots.webp';
      }
      return tryAssetPaths(cleanName);
    }
    
    // Handle filaments - use the generic filament asset
    if (cleanName.includes('Filament')) {
      if (cleanName.includes('Plant') || cleanName.includes('Wispweave')) {
        return '/assets/GeneratedIcons/Items/FilamentPlant.webp';
      }
      return '/assets/GeneratedIcons/Items/Filament.webp';
    }
    
    // Handle crushed items - map to appropriate crushed assets
    if (cleanName.startsWith('Crushed ')) {
      if (cleanName.includes('Shell') || cleanName.includes('Seashell')) {
        return '/assets/GeneratedIcons/Items/CrushedSeashell.webp';
      }
      // For other crushed items, try to find the specific crushed version
      return tryAssetPaths(cleanName);
    }
    
    // Handle shells - map to shell assets
    if (cleanName.includes('Shell') && !cleanName.startsWith('Crushed')) {
      if (cleanName.includes('Seashell') || cleanName === 'Shell') {
        return '/assets/GeneratedIcons/Items/Seashell.webp';
      }
      if (cleanName.includes('Crab')) {
        return '/assets/GeneratedIcons/Items/SwarmCrabShell.webp';
      }
      // Generic shell fallback
      return '/assets/GeneratedIcons/Items/Seashell.webp';
    }
    
    // Handle bark - all bark items use the generic Bark asset
    if (cleanName.includes('Bark')) {
      return '/assets/GeneratedIcons/Items/Bark.webp';
    }
    
    // Handle hair - map to appropriate hair assets
    if (cleanName.includes('Hair')) {
      if (cleanName.includes('Rabbit')) {
        return '/assets/GeneratedIcons/Items/RabbitHair.webp';
      }
      // Generic hair for all other hair items (Animal Hair, etc.)
      return '/assets/GeneratedIcons/Items/Hair.webp';
    }
    
    // Handle flowers - map to appropriate flower assets
    if (cleanName.includes('Flower')) {
      if (cleanName.includes('Snowdrop')) {
        return '/assets/GeneratedIcons/Items/SnowdropFlower.webp';
      }
      // Generic flowers for all other flower items
      return '/assets/GeneratedIcons/Items/Flowers.webp';
    }
    
    // Handle salt - map to appropriate salt assets
    if (cleanName.includes('Salt')) {
      if (cleanName.includes('Hideworking')) {
        return '/assets/GeneratedIcons/Items/HideworkingSalt.webp';
      }
      // Generic salt for other salt items
      return '/assets/GeneratedIcons/Items/Salt.webp';
    }
    
    // Handle bulbs - use generic flower asset as fallback
    if (cleanName.includes('Bulb') || cleanName.includes('bulb')) {
      // No specific bulb assets found, use flowers as closest match
      return '/assets/GeneratedIcons/Items/Flowers.webp';
    }
    
    // Handle ore chunks - most don't have separate chunk files, use the base ore
    if (cleanName.endsWith(' Ore Chunk')) {
      const baseName = cleanName.replace(' Ore Chunk', ' Ore');
      const baseCleanName = baseName.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
      // Only Copper, Iron, and Tin have separate chunk files
      if (['CopperOre', 'IronOre', 'TinOre'].includes(baseCleanName)) {
        cleanName = cleanName; // Keep as chunk
      } else {
        cleanName = baseName; // Use base ore file
      }
    }
    
    // Handle other common patterns from Material Calculator
    // HexCoin variations
    if (cleanName.includes('HexCoin[') || cleanName.includes('Hex Coin[')) {
      cleanName = 'Hex Coin';
    }
    
    // Handle cosmetic items that might have different paths
    if (cleanName === 'Leather Bonnet') {
      return '/assets/GeneratedIcons/Other/Cosmetics/Head/Hat_BurlapBonnet.webp';
    }
    if (cleanName === 'Leather Gloves') {
      return '/assets/GeneratedIcons/Other/Cosmetics/Hands/Hands_BasicGloves.webp';
    }
    
    // Remove spaces and special characters
    cleanName = cleanName.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
    return `/assets/GeneratedIcons/Items/${cleanName}.webp`;
  };

  const [imageAttempts, setImageAttempts] = useState<Map<string, number>>(new Map());

  const handleImageError = useCallback((itemName: string) => {
    const currentAttempts = imageAttempts.get(itemName) || 0;
    
    if (currentAttempts === 0) {
      // First failure - try Cargo folder
      setImageAttempts(prev => new Map(prev).set(itemName, 1));
    } else {
      // Second failure - mark as error (will show Unknown.webp)
      setImageErrors(prev => new Set(prev).add(itemName));
    }
  }, [imageAttempts]);

  const renderItemRow = useCallback((item: ProjectItem) => {
    const progress = item.requiredQuantity > 0 
      ? Math.min(100, Math.round(((item.contributedQuantity || 0) / item.requiredQuantity) * 100))
      : 0;
    const isCompleted = (item.contributedQuantity || 0) >= (item.requiredQuantity || 1);
    // Smart icon path generation with fallback system
    const getItemIconWithFallback = (itemName: string) => {
      if (imageErrors.has(itemName)) {
        return '/assets/Unknown.webp';
      }
      
      const attempts = imageAttempts.get(itemName) || 0;
      if (attempts === 1) {
        // Try Cargo folder on first retry
        const cleanName = itemName.replace(/^(Basic|Simple|Fine|Exquisite|Peerless|Infused|Rough|Sturdy|Advanced|Comprehensive|Essential|Novice|Proficient|Beginner's)\s+/, '');
        const cleanAssetName = cleanName.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
        return `/assets/GeneratedIcons/Cargo/${cleanAssetName}.webp`;
      }
      
      // Default to Items folder
      return getItemIcon(itemName);
    };
    
    const itemIcon = getItemIconWithFallback(item.itemName);
    const itemDisplay = resolveItemDisplay(item.itemName);
    const itemLink = itemDisplay.link || `/compendium?search=${encodeURIComponent(item.itemName)}`;
    const isEditing = editingItems[item.id] !== undefined;

    return (
      <TableRow key={item.id}>
        <TableCell>
          <div className="flex items-center gap-3">
            <div className="relative h-8 w-8 flex-shrink-0">
              <Image
                src={itemIcon}
                alt={item.itemName}
                fill
                sizes="32px"
                className="object-contain rounded"
                onError={() => handleImageError(item.itemName)}
                unoptimized={itemIcon.includes('/assets/')}
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Link 
                  href={itemLink} 
                  className="font-medium hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {item.itemName}
                </Link>
                <BricoTierBadge tier={item.tier} />
              </div>
            </div>
          </div>
        </TableCell>
        
        <TableCell className="text-center">
          {isEditing ? (
            <div className="flex items-center justify-center gap-2">
              <Input
                type="number"
                value={editingItems[item.id]}
                onChange={(e) => handleQuantityEdit(item.id, e.target.value)}
                className="w-24"
                min="1"
                max="1000000"
                placeholder="1-1M"
                title="Enter quantity (1 to 1,000,000)"
              />
              <Button
                size="sm"
                onClick={() => handleQuantitySave(item.id)}
              >
                <Save className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleQuantityCancel(item.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span>{item.requiredQuantity || 0}</span>
              {permissions.canEdit && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleQuantityEdit(item.id, item.requiredQuantity.toString())}
                >
                  <Edit className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </TableCell>
        
        <TableCell className="text-center">
          <span>{item.contributedQuantity || 0}</span>
        </TableCell>
        
        <TableCell>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{progress}%</span>
              {isCompleted && <Badge variant="secondary">Complete</Badge>}
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </TableCell>
        
        <TableCell className="text-center">
          <div className="flex items-center justify-center gap-2">
            {permissions.canContribute && !isCompleted && (
              <Button
                size="sm"
                onClick={() => onContribute(item.id)}
              >
                <HandHeart className="h-3 w-3 mr-1" />
                Contribute
              </Button>
            )}
            {permissions.canEdit && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onRemoveItem(item.id)}
              >
                Remove
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  }, [imageErrors, editingItems, permissions, handleQuantityEdit, handleQuantitySave, handleQuantityCancel, onContribute, onRemoveItem]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Project Items ({items.length})
          </CardTitle>
          
          <ToggleGroup 
            type="single" 
            value={groupBy} 
            onValueChange={(value) => value && setGroupBy(value as GroupBy)}
          >
            <ToggleGroupItem value="none" size="sm">
              Flat List
            </ToggleGroupItem>
            <ToggleGroupItem value="skill" size="sm">
              By Skill
            </ToggleGroupItem>
            <ToggleGroupItem value="tier" size="sm">
              By Tier
            </ToggleGroupItem>
            <ToggleGroupItem value="status" size="sm">
              By Status
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>
      
      <CardContent>
        {groupedItems.length > 0 ? (
          groupBy === 'none' ? (
            // Flat table for 'none' grouping
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHeader field="name" className="w-[40%]">Item</SortableHeader>
                  <SortableHeader field="required" className="w-[12%] text-center">Required</SortableHeader>
                  <SortableHeader field="contributed" className="w-[12%] text-center">Contributed</SortableHeader>
                  <SortableHeader field="progress" className="w-[20%]">Progress</SortableHeader>
                  <TableHead className="w-[16%] text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedItems[0].items.map(renderItemRow)}
              </TableBody>
            </Table>
          ) : (
            // Clean accordion with proper table headers in each section
            <Accordion 
              type="multiple" 
              defaultValue={shouldAutoExpand ? groupedItems.map((_, index) => `group-${index}`) : []} 
              className="space-y-4"
            >
              {groupedItems.map((group, groupIndex) => (
                <AccordionItem key={group.title} value={`group-${groupIndex}`} className="border rounded-lg">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center justify-between w-full mr-4">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-left">{group.title}</h3>
                        <Badge variant="secondary">{group.count} items</Badge>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all duration-300" 
                              style={{ width: `${Math.min(100, group.progressPercentage)}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground min-w-[4rem]">
                            {group.progressPercentage}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-0 pb-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <SortableHeader field="name" className="w-[40%]">Item</SortableHeader>
                          <SortableHeader field="required" className="w-[12%] text-center">Required</SortableHeader>
                          <SortableHeader field="contributed" className="w-[12%] text-center">Contributed</SortableHeader>
                          <SortableHeader field="progress" className="w-[20%]">Progress</SortableHeader>
                          <TableHead className="w-[16%] text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.items.map(renderItemRow)}
                      </TableBody>
                    </Table>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No items in this project yet. Add some items to get started!
          </div>
        )}
      </CardContent>
    </Card>
  );
}
