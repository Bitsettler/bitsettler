import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDatabaseCalculatorSaves } from '@/hooks/use-database-calculator-saves'
import type { CalculatorItem } from '@/lib/spacetime-db-new/shared/dtos/calculator-dtos'
import { getTierColor } from '@/lib/spacetime-db-new/shared/utils/entities'
import { getRarityColor } from '@/lib/spacetime-db-new/shared/utils/rarity'
import { CalculatorSearchInput } from '@/views/calculator-views/calculator-search-input'
import { useReactFlow } from '@xyflow/react'
import { Save } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'

interface CalculatorHeaderProps {
  items: CalculatorItem[]
  selectedItem: CalculatorItem | undefined
  desiredQuantity: number
  onItemSelect: (slug: string) => void
  onQuantityChange: (quantity: number) => void
}

export function CalculatorHeader({
  items,
  selectedItem,
  desiredQuantity,
  onItemSelect,
  onQuantityChange
}: CalculatorHeaderProps) {
  const { saveCalculator, canSave } = useDatabaseCalculatorSaves()
  const { getNodes, getEdges } = useReactFlow()
  const [isSaving, setIsSaving] = useState(false)

  const handleQuantityInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newQuantity = parseInt(e.target.value) || 1
    onQuantityChange(newQuantity)
  }

  const handleQuantityInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const newQuantity = parseInt(e.target.value) || 1
    onQuantityChange(Math.max(1, newQuantity))
  }

  const handleSave = async () => {
    if (!canSave) {
      toast.error('You must be signed in and claim a character to save calculations.')
      return
    }

    if (!selectedItem) {
      toast.error('Cannot save: No item selected to save.')
      return
    }

    const nodes = getNodes()
    const edges = getEdges()

    if (nodes.length === 0) {
      toast.error('Cannot save: No recipe tree to save.')
      return
    }

    try {
      setIsSaving(true)
      await saveCalculator(selectedItem.slug, desiredQuantity, nodes, edges)
      toast.success(
        `Calculator saved! Saved "${selectedItem.name}" with ${desiredQuantity}x quantity.`
      )
    } catch (error) {
      console.error('Save failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to save calculator state.'
      toast.error(`Save failed: ${errorMessage}`)
    } finally {
      setIsSaving(false)
    }
  }

  // const downloadImage = (dataUrl: string, filename: string) => {
  //   const a = document.createElement('a')
  //   a.setAttribute('download', filename)
  //   a.setAttribute('href', dataUrl)
  //   a.click()
  // }

  // const downloadBlob = (blob: Blob, filename: string) => {
  //   const url = URL.createObjectURL(blob)
  //   const a = document.createElement('a')
  //   a.href = url
  //   a.download = filename
  //   document.body.appendChild(a)
  //   a.click()
  //   document.body.removeChild(a)
  //   URL.revokeObjectURL(url)
  // }

  // const handleExportImage = async () => {
  //   if (!selectedItem) {
  //     toast.error('Cannot export: No item selected.')
  //     return
  //   }

  //   const nodes = getNodes()
  //   if (nodes.length === 0) {
  //     toast.error('Cannot export: No recipe tree to export.')
  //     return
  //   }

  //   try {
  //     toast.loading('Generating image...', { id: 'export-image' })

  //     // Calculate dynamic dimensions based on node bounds
  //     const nodesBounds = getNodesBounds(nodes)
  //     const imageWidth = Math.max(1024, nodesBounds.width / 2 + 20)
  //     const imageHeight = Math.max(768, nodesBounds.height / 2 + 20)

  //     // Get viewport transformation to fit all nodes
  //     const viewport = getViewportForBounds(nodesBounds, imageWidth, imageHeight, 0.5, 2, 20)

  //     const filename = `bitcraft-guide_${selectedItem.slug}_qty-${desiredQuantity}.png`

  //     const baseExportOptions = {
  //       backgroundColor: '#ffffff',
  //       width: imageWidth,
  //       height: imageHeight,
  //       cacheBust: true,
  //       pixelRatio: 2,
  //       filter: (node: Element) => {
  //         // Filter out buttons
  //         if (node.tagName === 'BUTTON') return false

  //         // Filter out React Flow controls
  //         if (node.classList?.contains('react-flow__minimap')) return false
  //         if (node.classList?.contains('react-flow__controls')) return false
  //         if (node.classList?.contains('react-flow__panel')) return false

  //         return true
  //       },
  //       style: {
  //         width: `${imageWidth}px`,
  //         height: `${imageHeight}px`,
  //         transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`
  //       }
  //     }

  //     const viewportElement = document.querySelector('.react-flow__viewport') as HTMLElement
  //     if (!viewportElement) {
  //       throw new Error('React Flow viewport not found')
  //     }

  //     // Progressive fallback with increasing filtering
  //     const exportStrategies = [
  //       // Strategy 1: Try with minimal filtering (keep images)
  //       {
  //         name: 'PNG with images',
  //         method: () => toPng(viewportElement, baseExportOptions),
  //         extension: '.png'
  //       },

  //       // Strategy 2: Try JPEG with images
  //       {
  //         name: 'JPEG with images',
  //         method: () =>
  //           toJpeg(viewportElement, {
  //             ...baseExportOptions,
  //             quality: 0.95
  //           }),
  //         extension: '.jpg'
  //       },

  //       // Strategy 3: Try Blob with images
  //       {
  //         name: 'Blob with images',
  //         method: () => toBlob(viewportElement, baseExportOptions),
  //         extension: '.png',
  //         isBlob: true
  //       },

  //       // Strategy 4: Final fallback - PNG without images
  //       {
  //         name: 'PNG without images',
  //         method: () =>
  //           toPng(viewportElement, {
  //             ...baseExportOptions,
  //             filter: (node: Element) => {
  //               // Apply base filter first
  //               if (node.tagName === 'BUTTON') return false
  //               if (node.classList?.contains('react-flow__minimap')) return false
  //               if (node.classList?.contains('react-flow__controls')) return false
  //               if (node.classList?.contains('react-flow__panel')) return false

  //               // Additionally filter out images as last resort
  //               // if (node.tagName === 'IMG') return false

  //               return true
  //             }
  //           }),
  //         extension: '.png'
  //       }
  //     ]

  //     let lastError: Error | null = null

  //     for (const strategy of exportStrategies) {
  //       try {
  //         console.log(`Trying export strategy: ${strategy.name}`)
  //         const result = await strategy.method()

  //         if (result) {
  //           const finalFilename = filename.replace(/\.[^.]+$/, strategy.extension)

  //           if (strategy.isBlob && result instanceof Blob) {
  //             downloadBlob(result, finalFilename)
  //           } else if (typeof result === 'string') {
  //             downloadImage(result, finalFilename)
  //           }

  //           console.log(`Export successful using: ${strategy.name}`)
  //           break // Success! Exit the loop
  //         }
  //       } catch (error) {
  //         console.warn(`${strategy.name} failed:`, error)
  //         lastError = error as Error
  //         continue // Try next strategy
  //       }
  //     }

  //     // If we get here, all strategies failed
  //     if (lastError) {
  //       throw lastError
  //     }
  //     toast.success('Image downloaded successfully!', { id: 'export-image' })
  //   } catch (error) {
  //     console.error('Failed to export image:', error)
  //     const errorMessage = error instanceof Error ? error.message : 'Unknown error'

  //     if (errorMessage.includes('tainted') || errorMessage.includes('canvas')) {
  //       toast.error('Export failed: Canvas is tainted. Try refreshing the page.', { id: 'export-image' })
  //     } else if (errorMessage.includes('dataURI') || errorMessage.includes('too large')) {
  //       toast.error('Export failed: Recipe is too large. Try reducing complexity.', { id: 'export-image' })
  //     } else {
  //       toast.error(`Export failed: ${errorMessage}`, { id: 'export-image' })
  //     }
  //   }
  // }

  return (
    <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 flex items-center gap-4 p-4 pb-0 backdrop-blur">
      {/* Search Combo Box */}
      <div className="w-80">
        <CalculatorSearchInput
          items={items}
          selectedItem={selectedItem}
          onItemSelect={onItemSelect}
        />
      </div>

      <div className="text-sm">X</div>

      {/* Quantity Input */}
      <div className="w-20">
        <Input
          type="number"
          min="1"
          value={desiredQuantity}
          onChange={handleQuantityInputChange}
          onBlur={handleQuantityInputBlur}
          className="text-center"
        />
      </div>

      {/* Separator */}
      <div className="bg-border h-6 w-px" />

      {/* Item Info Badges */}
      {selectedItem && (
        <div className="flex items-center gap-2">
          {selectedItem.tier > 0 && (
            <Badge
              variant="outline"
              className={getTierColor(selectedItem.tier)}
            >
              Tier {selectedItem.tier}
            </Badge>
          )}
          <Badge
            variant="outline"
            className={getRarityColor(selectedItem.rarity)}
          >
            {selectedItem.rarity}
          </Badge>
          <Badge
            variant="outline"
            className="border-blue-200 bg-blue-50 text-blue-700"
          >
            {selectedItem.category}
          </Badge>
        </div>
      )}

      {/* Spacer to push buttons to the right */}
      <div className="flex-1" />

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <Button 
          variant="default" 
          size="sm" 
          onClick={handleSave} 
          disabled={isSaving || !canSave}
          title={!canSave ? 'Sign in and claim a character to save calculations' : undefined}
        >
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save'}
        </Button>

        {/* <Popover>
          <PopoverTrigger asChild>
            <Button variant="secondary" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56">
            <div className="space-y-2">
              <Button variant="ghost" className="w-full justify-start" onClick={handleExportImage}>
                <Download className="mr-2 h-4 w-4" />
                Export as Image
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                Share Link
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                Reset Layout
              </Button>
            </div>
          </PopoverContent>
        </Popover> */}
      </div>
    </div>
  )
}
