import type { Edge, Node } from '@xyflow/react'
import { useEdgesState } from '@xyflow/react'
import { useEffect, useRef } from 'react'

export const useEdgeColors = (
  nodes: Node[],
  edges: Edge[],
  setEdges: ReturnType<typeof useEdgesState>[1]
) => {
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
        const isHovered = Boolean(node.data?.isHovered)
        const prevIsDone = prevNodeStates.current.get(node.id) || false
        const prevIsHovered =
          prevNodeStates.current.get(`${node.id}-hover`) || false
        currentNodeStates.set(node.id, isDone)
        currentNodeStates.set(`${node.id}-hover`, isHovered)

        if (isDone !== prevIsDone || isHovered !== prevIsHovered) {
          hasChanges = true
        }
      })

      // Only update edges if there are actual changes
      if (hasChanges) {
        const updatedEdges = edges.map((edge) => {
          const sourceNode = nodes.find((node) => node.id === edge.source)
          const targetNode = nodes.find((node) => node.id === edge.target)
          const isSourceDone = Boolean(sourceNode?.data?.isDone)
          const isTargetHovered = Boolean(targetNode?.data?.isHovered)

          let strokeColor = '#6b7280' // default medium gray that shows up in exports

          if (isTargetHovered) {
            strokeColor = '#3b82f6' // Blue when target (crafted item) is hovered
          } else if (isSourceDone) {
            strokeColor = '#22c55e' // Green when source (material) is done
          }

          return {
            ...edge,
            style: {
              ...edge.style,
              stroke: strokeColor
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
