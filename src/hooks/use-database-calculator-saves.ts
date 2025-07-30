'use client'

import type { Edge, Node } from '@xyflow/react'
import { useCallback, useEffect, useState } from 'react'
import { useCurrentMember } from './use-current-member'

export interface CalculatorSave {
  id: string
  member_id: string
  name: string
  recipe_data: {
    quantity: number
    nodes: Node[]
    edges: Edge[]
  }
  item_slug: string
  quantity: number
  created_at: string
  updated_at: string
}

export interface CalculatorSavesMap {
  [slug: string]: CalculatorSave
}

export function useDatabaseCalculatorSaves() {
  const { member, isClaimed } = useCurrentMember()
  const [saves, setSaves] = useState<CalculatorSavesMap>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSaves = useCallback(async () => {
    if (!member?.id) return

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/user/calculator-saves')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch calculator saves')
      }

      // Convert array to map by item_slug
      const savesMap: CalculatorSavesMap = {}
      result.data.forEach((save: CalculatorSave) => {
        savesMap[save.item_slug] = save
      })

      setSaves(savesMap)
    } catch (err) {
      console.error('Failed to fetch calculator saves:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch saves')
    } finally {
      setIsLoading(false)
    }
  }, [member?.id]) // Only recreate when member ID changes

  // Load saves from database when member is available
  useEffect(() => {
    if (isClaimed && member) {
      fetchSaves()
    } else {
      setSaves({})
    }
  }, [fetchSaves, member?.id, isClaimed]) // Include the memoized function

  const saveCalculator = useCallback(
    async (slug: string, quantity: number, nodes: Node[], edges: Edge[]) => {
      if (!member?.id) {
        throw new Error('Must be signed in to save calculations')
      }

      try {
        // Clean up runtime data
        const cleanNodes = nodes.map((node) => ({
          ...node,
          measured: undefined,
          selected: false,
          dragging: false
        }))

        const cleanEdges = edges.map((edge) => ({
          ...edge,
          selected: false
        }))

        const response = await fetch('/api/user/calculator-saves', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `${slug} (${quantity})`, // Auto-generate name
            item_slug: slug,
            quantity,
            recipe_data: {
              quantity,
              nodes: cleanNodes,
              edges: cleanEdges
            }
          })
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Failed to save calculation')
        }

        // Update local state
        setSaves((prevSaves) => ({
          ...prevSaves,
          [slug]: result.data
        }))

        return result.data
      } catch (err) {
        console.error('Failed to save calculation:', err)
        throw err
      }
    },
    [member?.id]
  )

  const loadCalculator = useCallback(
    (slug: string): CalculatorSave | null => {
      return saves[slug] || null
    },
    [saves]
  )

  const deleteSave = useCallback(
    async (slug: string) => {
      const save = saves[slug]
      if (!save) return

      try {
        const response = await fetch(`/api/user/calculator-saves/${save.id}`, {
          method: 'DELETE'
        })

        if (!response.ok) {
          const result = await response.json()
          throw new Error(result.error || 'Failed to delete save')
        }

        // Update local state
        setSaves((prevSaves) => {
          const newSaves = { ...prevSaves }
          delete newSaves[slug]
          return newSaves
        })
      } catch (err) {
        console.error('Failed to delete save:', err)
        throw err
      }
    },
    [saves]
  )

  const hasSave = useCallback(
    (slug: string): boolean => {
      return slug in saves
    },
    [saves]
  )

  const getAllSaves = useCallback((): CalculatorSavesMap => {
    return saves
  }, [saves])

  return {
    saves,
    isLoading,
    error,
    saveCalculator,
    loadCalculator,
    deleteSave,
    hasSave,
    getAllSaves,
    refetch: fetchSaves,
    canSave: isClaimed && !!member
  }
} 