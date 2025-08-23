'use client';

import { useState, useMemo } from 'react';
import { Plus, Package, Edit, Save, X, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { BricoTierBadge } from '@/components/ui/brico-tier-badge';
import { resolveItemDisplay } from '@/lib/settlement/item-display';
import Image from 'next/image';
import Link from 'next/link';

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

// Helper function to determine skill from item name
function getItemSkill(itemName: string): string {
  const name = itemName.toLowerCase();
  
  if (name.includes('wood') || name.includes('log') || name.includes('plank')) {
    return 'Forestry';
  } else if (name.includes('stone') || name.includes('rock') || name.includes('ore')) {
    return 'Mining';
  } else if (name.includes('cloth') || name.includes('fiber') || name.includes('thread')) {
    return 'Textiles';
  } else if (name.includes('metal') || name.includes('ingot') || name.includes('tool')) {
    return 'Smithing';
  } else if (name.includes('food') || name.includes('berry') || name.includes('seed')) {
    return 'Farming';
  } else if (name.includes('leather') || name.includes('hide') || name.includes('fur')) {
    return 'Leatherworking';
  }
  
  return 'Unknown';
}

// Helper function to get item icon and link
function getItemIcon(itemName: string): string {
  const display = resolveItemDisplay(itemName);
  return display.iconSrc || '/assets/Unknown.webp';
}

function getItemLink(itemName: string): string {
  const display = resolveItemDisplay(itemName);
  return display.link || '#';
}

export function ProjectItemsTable({ 
  items, 
  permissions, 
  onContribute, 
  onEditQuantity, 
  onRemoveItem 
}: ProjectItemsTableProps) {
  const [groupBy, setGroupBy] = useState<GroupBy>('skill');
  const [editingItems, setEditingItems] = useState<Record<string, string>>({});

  // Group items based on groupBy setting
  const groupedItems = useMemo(() => {
    if (groupBy === 'none') {
      return [{
        title: 'All Items',
        count: items.length,
        items: items.sort((a, b) => a.itemName.localeCompare(b.itemName))
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
      .map(([title, items]) => ({
        title,
        count: items.length,
        items: items.sort((a, b) => a.itemName.localeCompare(b.itemName))
      }));
  }, [items, groupBy]);

  const handleQuantityEdit = (itemId: string, value: string) => {
    setEditingItems(prev => ({ ...prev, [itemId]: value }));
  };

  const handleQuantitySave = async (itemId: string) => {
    const newQuantity = parseInt(editingItems[itemId]);
    if (!isNaN(newQuantity) && newQuantity > 0) {
      await onEditQuantity(itemId, newQuantity);
    }
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

  const renderItemRow = (item: ProjectItem) => {
    const progress = item.requiredQuantity > 0 
      ? Math.min(100, Math.round(((item.contributedQuantity || 0) / item.requiredQuantity) * 100))
      : 0;
    const isCompleted = (item.contributedQuantity || 0) >= (item.requiredQuantity || 1);
    const itemIcon = getItemIcon(item.itemName);
    const itemLink = getItemLink(item.itemName);
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
              />
            </div>
            <div className="flex flex-col">
              <Link 
                href={itemLink} 
                className="font-medium hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {item.itemName}
              </Link>
              <div className="flex items-center gap-2 mt-1">
                <BricoTierBadge tier={item.tier} />
              </div>
            </div>
          </div>
        </TableCell>
        
        <TableCell>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={editingItems[item.id]}
                onChange={(e) => handleQuantityEdit(item.id, e.target.value)}
                className="w-20"
                min="1"
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
            <div className="flex items-center gap-2">
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
        
        <TableCell>
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
        
        <TableCell>
          <div className="flex items-center gap-2">
            {permissions.canContribute && !isCompleted && (
              <Button
                size="sm"
                onClick={() => onContribute(item.id)}
              >
                <Target className="h-3 w-3 mr-1" />
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
  };

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
                  <TableHead>Item</TableHead>
                  <TableHead>Required</TableHead>
                  <TableHead>Contributed</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedItems[0].items.map(renderItemRow)}
              </TableBody>
            </Table>
          ) : (
            // Accordion for grouped display
            <Accordion type="multiple" defaultValue={groupedItems.map((_, index) => `group-${index}`)} className="space-y-4">
              {groupedItems.map((group, groupIndex) => (
                <AccordionItem key={group.title} value={`group-${groupIndex}`} className="border rounded-lg">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center justify-between w-full mr-4">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-left">{group.title}</h3>
                        <Badge variant="secondary">{group.count} items</Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-0 pb-0">
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
