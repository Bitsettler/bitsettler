'use client'

import { Container } from '@/components/container'
import { useRouter } from '@/i18n/navigation'
import type { CalculatorGameData } from '@/lib/spacetime-db-new/shared/dtos/calculator-dtos'
import { CalculatorSearchInput } from '@/views/calculator-views/calculator-search-input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Sparkles } from 'lucide-react'
import Link from 'next/link'

interface CalculatorIndexClientProps {
  gameData: CalculatorGameData
}

export function CalculatorIndexClient({
  gameData
}: CalculatorIndexClientProps) {
  const router = useRouter()

  const handleItemSelect = (slug: string) => {
    router.push(`/calculator/${slug}`)
  }

  return (
    <div className="bg-background min-h-screen">
      <Container className="py-12">
        <div className="mx-auto max-w-2xl text-center">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-foreground mb-4 text-4xl font-bold">
              Recipe Calculator
            </h1>
            <p className="text-muted-foreground text-lg">
              Calculate exact material requirements and visualize crafting
              dependencies for any item in BitCraft.
            </p>
          </div>

          {/* New Calculator Notice */}
          <Alert className="mb-8 max-w-2xl mx-auto">
            <Sparkles className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Try our enhanced calculator with step-by-step crafting plans and optimized materials!</span>
              <Link href="/en/calculator-new">
                <Button variant="outline" size="sm" className="ml-4">
                  Try Calculator (New)
                </Button>
              </Link>
            </AlertDescription>
          </Alert>

          {/* Search */}
          <div className="mb-8">
            <CalculatorSearchInput
              items={gameData.items}
              onItemSelect={handleItemSelect}
            />
          </div>

          {/* Instructions */}
          <div className="text-muted-foreground text-sm">
            <p>
              Search for any item above to start calculating its recipe tree and
              material requirements.
            </p>
          </div>
        </div>
      </Container>
    </div>
  )
}
