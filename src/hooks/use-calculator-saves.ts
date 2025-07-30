'use client'

import type { Edge, Node } from '@xyflow/react'
import { useCallback, useState } from 'react'

export interface CalculatorSave {
  quantity: number
  nodes: Node[]
  edges: Edge[]
  createdAt: string
  updatedAt: string
}

export interface CalculatorSavesMap {
  [slug: string]: CalculatorSave
}

// TODO: Replace with database storage using settlement member ID
export function useCalculatorSaves() {
  const [saves, setSaves] = useState<CalculatorSavesMap>({})

  const saveCalculator = useCallback(
    (slug: string, quantity: number, nodes: Node[], edges: Edge[]) => {
      const now = new Date().toISOString()

      const newSave: CalculatorSave = {
        quantity,
        nodes: nodes.map((node) => ({
          ...node,
          // Clean up any runtime data that shouldn't be saved
          measured: undefined,
          selected: false,
          dragging: false
        })),
        edges: edges.map((edge) => ({
          ...edge,
          selected: false
        })),
        createdAt: saves[slug]?.createdAt || now, // Keep original creation time if exists
        updatedAt: now
      }

      setSaves((prevSaves) => ({
        ...prevSaves,
        [slug]: newSave
      }))
    },
    [saves]
  )

  const loadCalculator = useCallback(
    (slug: string): CalculatorSave | null => {
      return saves[slug] || null
    },
    [saves]
  )

  const deleteSave = useCallback((slug: string) => {
    setSaves((prevSaves) => {
      const newSaves = { ...prevSaves }
      delete newSaves[slug]
      return newSaves
    })
  }, [])

  const hasSave = useCallback(
    (slug: string): boolean => {
      return slug in saves
    },
    [saves]
  )

  const getAllSaves = useCallback((): CalculatorSavesMap => {
    return saves
  }, [])

  return {
    saves,
    saveCalculator,
    loadCalculator,
    deleteSave,
    hasSave,
    getAllSaves
  }
}
