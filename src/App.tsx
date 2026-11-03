import { ReactFlow, Background, Controls, MiniMap, Node, Edge } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useCallback, useState } from 'react'
import { TextNode } from './nodes/TextNode'
import { ImageNode } from './nodes/ImageNode'

const nodeTypes = {
  text: TextNode,
  image: ImageNode,
}

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'text',
    position: { x: 100, y: 100 },
    data: { label: 'مدل متنی', model: 'GPT', prompt: '', status: 'empty' },
  },
  {
    id: '2',
    type: 'image',
    position: { x: 450, y: 100 },
    data: { label: 'تولید تصویر', status: 'empty' },
  },
]

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
]

export default function App() {
  const [nodes, setNodes] = useState(initialNodes)
  const [edges, setEdges] = useState(initialEdges)

  const onNodesChange = useCallback((changes: any) => {
    setNodes((nds) => {
      // simple apply for now
      return nds
    })
  }, [])

  return (
    <div className="w-screen h-screen bg-[#111827]">
      <div className="h-14 bg-[#0f172a] border-b border-slate-800 flex items-center px-6">
        <span className="text-white font-semibold text-lg">GapGPT Canvas</span>
        <span className="ml-4 text-slate-400 text-sm">محیط گراف‌محور چندمدلی</span>
      </div>
      <div className="h-[calc(100vh-56px)]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          className="bg-[#111827]"
        >
          <Background color="#334155" gap={20} />
          <Controls />
          <MiniMap
            nodeColor={(n) => (n.type === 'image' ? '#8b5cf6' : '#3b82f6')}
            maskColor="rgba(0,0,0,0.6)"
          />
        </ReactFlow>
      </div>
    </div>
  )
}
