import type { Edge, Node } from '@xyflow/react'
import { useEdgesState } from '@xyflow/react'
import { useEffect, useRef } from 'react'

export const useEdgeColors = (nodes: Node[], edges: Edge[], setEdges: ReturnType<typeof useEdgesState>[1]) => {
  // Track previous node states to prevent unnecessary edge updates
  const prevNodeStates = useRef<Map<string, boolean>>(new Map())

  // Update edge colors when nodes change
  useEffect(() => {
    if (edges.length > 0) {
      // Check if any node's done state has actually changed
      let hasChanges = false
      const currentNodeStates = new Map<string, boolean>()

      nodes.forEach((node) => {
        const isDone = Boolean(node.data?.isDone)
        const prevIsDone = prevNodeStates.current.get(node.id) || false
        currentNodeStates.set(node.id, isDone)

        if (isDone !== prevIsDone) {
          hasChanges = true
        }
      })

      // Only update edges if there are actual changes
      if (hasChanges) {
        const updatedEdges = edges.map((edge) => {
          const targetNode = nodes.find((node) => node.id === edge.target)
          const isTargetDone = Boolean(targetNode?.data?.isDone)

          return {
            ...edge,
            style: {
              ...edge.style,
              stroke: isTargetDone ? '#22c55e' : '#64748b', // Green if done, gray if not
              strokeWidth: isTargetDone ? 3 : 2
            }
          }
        })
        setEdges(updatedEdges)

        // Update the ref with current states
        prevNodeStates.current = currentNodeStates
      }
    }
  }, [nodes, edges, setEdges])

  return { prevNodeStates }
}
