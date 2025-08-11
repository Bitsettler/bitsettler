'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronRight, Hammer, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { CraftingPlan, CraftingStep } from '@/lib/depv2/types'
import { ItemBadge } from './ItemBadge'

interface CraftingStepsPanelProps {
  plan: CraftingPlan
  maxDisplaySteps?: number
}

function CraftingStepComponent({ step, isLast }: { step: CraftingStep; isLast: boolean }) {
  const [isOpen, setIsOpen] = useState(step.depth <= 1) // Auto-expand first 2 levels
  
  const indentClass = `ml-${Math.min(step.depth * 4, 16)}` // Max indent to prevent excessive nesting
  const hasIngredients = step.ingredients && step.ingredients.length > 0
  
  return (
    <div className={`${indentClass} ${!isLast ? 'border-l border-muted' : ''} pl-4`}>
      <div className="flex items-center gap-2 py-2">
        {/* Step Icon */}
        <div className={`p-1 rounded ${step.action === 'craft' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
          {step.action === 'craft' ? <Hammer size={14} /> : <Package size={14} />}
        </div>
        
        {/* Step Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {step.action === 'craft' ? 'Craft' : 'Gather'} {step.quantity}× {step.itemName}
            </span>
            {step.skill && (
              <Badge variant="secondary" className="text-xs">
                {step.skill}
              </Badge>
            )}
            {step.tier && (
              <Badge variant="outline" className="text-xs">
                T{step.tier}
              </Badge>
            )}
          </div>
        </div>
        
        {/* Expand/Collapse for steps with ingredients */}
        {hasIngredients && (
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        )}
      </div>
      
      {/* Ingredients (collapsible) */}
      {hasIngredients && (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleContent className="ml-6 mt-2 space-y-1">
            <div className="text-xs text-muted-foreground mb-2">Requires:</div>
            {step.ingredients!.map((ingredient) => (
              <div key={ingredient.itemId} className="text-sm">
                <ItemBadge id={ingredient.itemId} qty={ingredient.quantity} />
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  )
}

export default function CraftingStepsPanel({ 
  plan, 
  maxDisplaySteps = 50 
}: CraftingStepsPanelProps) {
  const [showAll, setShowAll] = useState(false)
  
  // Sort steps by depth (dependencies first) for logical order
  const sortedSteps = [...plan.steps].sort((a, b) => {
    if (a.depth !== b.depth) return b.depth - a.depth // Deeper first (dependencies)
    return a.id.localeCompare(b.id) // Stable sort by ID
  })
  
  const displaySteps = showAll ? sortedSteps : sortedSteps.slice(0, maxDisplaySteps)
  const hasMoreSteps = sortedSteps.length > maxDisplaySteps
  
  // Group steps by action for summary
  const gatherSteps = plan.steps.filter(s => s.action === 'gather')
  const craftSteps = plan.steps.filter(s => s.action === 'craft')
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Hammer size={20} />
          Crafting Steps
        </CardTitle>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>{gatherSteps.length} gather steps</span>
          <span>{craftSteps.length} craft steps</span>
          <span>{plan.totalSteps} total actions</span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-1">
        {displaySteps.map((step, index) => (
          <CraftingStepComponent 
            key={step.id} 
            step={step} 
            isLast={index === displaySteps.length - 1}
          />
        ))}
        
        {hasMoreSteps && !showAll && (
          <div className="pt-4 text-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowAll(true)}
            >
              Show {sortedSteps.length - maxDisplaySteps} more steps
            </Button>
          </div>
        )}
        
        {showAll && hasMoreSteps && (
          <div className="pt-4 text-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowAll(false)}
            >
              Show fewer steps
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
