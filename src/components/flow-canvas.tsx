'use client'

import { Card, CardContent } from '@/components/ui/card'
import type { Edge, Node, NodeTypes } from '@xyflow/react'
import { Background, Controls, ReactFlow, useEdgesState, useNodesState } from '@xyflow/react'
import '@xyflow/react/dist/style.css'

interface FlowCanvasProps {
  nodes: Node[]
  edges: Edge[]
  nodeTypes: NodeTypes
  onNodesChange: ReturnType<typeof useNodesState>[2]
  onEdgesChange: ReturnType<typeof useEdgesState>[2]
  className?: string
  showControls?: boolean
  showBackground?: boolean
}

function FlowCanvasInner({
  nodes,
  edges,
  nodeTypes,
  onNodesChange,
  onEdgesChange,
  className = 'h-full',
  showControls = true,
  showBackground = true
}: FlowCanvasProps) {
  return (
    <Card className="bg-background h-full py-0">
      <CardContent className="h-full p-0">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          className={className}
          fitView
          fitViewOptions={{ padding: 0.1 }}
        >
          {showControls && <Controls className="bg-background border-border border" />}
          {showBackground && <Background />}
          {/* <MiniMap nodeStrokeWidth={3} position="top-right" /> */}
        </ReactFlow>
      </CardContent>
    </Card>
  )
}

export function FlowCanvas(props: FlowCanvasProps) {
  return <FlowCanvasInner {...props} />
}
