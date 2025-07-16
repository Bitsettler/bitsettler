'use client'

import type { Edge, Node } from '@xyflow/react'
import { useCallback, useEffect, useState } from 'react'

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

const STORAGE_KEY = 'calculator-saves'

export function useCalculatorSaves() {
  const [saves, setSaves] = useState<CalculatorSavesMap>({})
  const [isInitialized, setIsInitialized] = useState(false)

  // Load saves from localStorage on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY)
      if (savedData) {
        const parsedSaves = JSON.parse(savedData) as CalculatorSavesMap
        setSaves(parsedSaves)
        console.log({ parsedSaves })
      }
      setIsInitialized(true)
    } catch (error) {
      console.error('Failed to load calculator saves:', error)
      setIsInitialized(true)
    }
  }, [])

  // Save to localStorage whenever saves change (but not on initial load)
  useEffect(() => {
    if (!isInitialized) return
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saves))
    } catch (error) {
      console.error('Failed to save calculator saves:', error)
    }
  }, [saves, isInitialized])

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
  }, [saves])

  return {
    saves,
    saveCalculator,
    loadCalculator,
    deleteSave,
    hasSave,
    getAllSaves
  }
}

