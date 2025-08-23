'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Calculator } from 'lucide-react';
import ManualStep from './ManualStep';
import AutoGenerateStep from './AutoGenerateStep';
import type { ProjectSeedItem } from '@/lib/projectSeed';

type Mode = 'pick' | 'manual' | 'auto' | 'review';

export default function ProjectWizard() {
  const [mode, setMode] = useState<Mode>('pick');
  const [title, setTitle] = useState('');
  const [items, setItems] = useState<ProjectSeedItem[]>([]);

  function startManual() {
    setMode('manual');
  }

  function startAuto() {
    setMode('auto');
  }

  function applyAutoResult(payload: { title: string; items: ProjectSeedItem[] }) {
    setTitle(payload.title);
    setItems(payload.items);
    setMode('review');
  }

  function goBackToPicker() {
    setMode('pick');
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        {mode !== 'pick' && (
          <Button variant="ghost" size="sm" onClick={goBackToPicker}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-bold">
            {mode === 'pick' && 'Create Project'}
            {mode === 'manual' && 'Add Items Manually'}
            {mode === 'auto' && 'Auto-Generate Supplies'}
            {mode === 'review' && 'Review & Create'}
          </h1>
          <p className="text-muted-foreground">
            {mode === 'pick' && 'Choose how you want to create your project'}
            {mode === 'manual' && 'Add items one by one to your project'}
            {mode === 'auto' && 'Use the calculator to generate a materials list'}
            {mode === 'review' && 'Review your project details before creating'}
          </p>
        </div>
      </div>

      {/* Mode Picker */}
      {mode === 'pick' && (
        <div className="grid gap-6 sm:grid-cols-2">
          <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50" onClick={startManual}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/20">
                  <Plus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">Add items manually</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add items one at a time with custom quantities. Perfect for simple projects or when you know exactly what you need.
                  </p>
                  <Button variant="outline" className="w-full">
                    Start Manual Entry
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50" onClick={startAuto}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-green-100 p-3 dark:bg-green-900/20">
                  <Calculator className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">Auto-generate supplies</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Use the calculator workflow to automatically generate a complete materials list for crafting items.
                  </p>
                  <Button variant="outline" className="w-full">
                    Use Calculator
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Manual Step */}
      {mode === 'manual' && (
        <ManualStep
          initialTitle={title}
          initialItems={items}
          onBack={goBackToPicker}
          onItemsChange={setItems}
          onTitleChange={setTitle}
        />
      )}

      {/* Auto-Generate Step */}
      {mode === 'auto' && (
        <AutoGenerateStep
          onBack={goBackToPicker}
          onUse={(seed) => applyAutoResult(seed)}
        />
      )}

      {/* Review Step */}
      {mode === 'review' && (
        <ManualStep
          initialTitle={title}
          initialItems={items}
          onBack={goBackToPicker}
          onItemsChange={setItems}
          onTitleChange={setTitle}
          isReviewMode={true}
        />
      )}
    </div>
  );
}
