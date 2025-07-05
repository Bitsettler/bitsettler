import Dagre from '@dagrejs/dagre'
import { useReactFlow } from '@xyflow/react'
import { useCallback, useState } from 'react'

export const useLayoutedElements = () => {
  const { getNodes, setNodes, getEdges, fitView } = useReactFlow()
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  const getLayoutedElements = useCallback(
    (shouldFitView = false) => {
      const nodes = getNodes()
      const edges = getEdges()

      const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}))
      g.setGraph({
        rankdir: 'TB',
        ranker: 'longest-path',
        align: 'UL',
        nodesep: 40,
        ranksep: 80
      })

      edges.forEach((edge) => g.setEdge(edge.source, edge.target))
      nodes.forEach((node) =>
        g.setNode(node.id, {
          width: node.measured?.width ?? 320,
          height: node.measured?.height ?? 120
        })
      )

      Dagre.layout(g)

      const layoutedNodes = nodes.map((node) => {
        const position = g.node(node.id)
        return {
          ...node,
          position: {
            x: position.x - (node.measured?.width ?? 0) / 2,
            y: position.y - (node.measured?.height ?? 0) / 2
          }
        }
      })

      setNodes(layoutedNodes)

      // Only fit view on initial load or when explicitly requested
      if (shouldFitView || isInitialLoad) {
        fitView()
        setIsInitialLoad(false)
      }
    },
    [getNodes, getEdges, setNodes, fitView, isInitialLoad]
  )

  return { getLayoutedElements }
}
