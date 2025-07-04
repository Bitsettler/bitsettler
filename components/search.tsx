'use client'

import { Button } from '@/components/ui/button'
import { MagnifyingGlass } from '@phosphor-icons/react'

export function Search() {
  return (
    <Button variant="ghost" size="sm" className="hidden md:flex">
      <MagnifyingGlass className="h-4 w-4" />
      <span className="sr-only">Search</span>
    </Button>
  )
}
