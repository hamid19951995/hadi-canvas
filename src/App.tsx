import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  NodeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useCallback } from 'react'
import { TextNode } from './nodes/TextNode'
import { ImageNode } from './nodes/ImageNode'
import { VideoNode } from './nodes/VideoNode'
import { MergeNode } from './nodes/MergeNode'
import { useCanvasStore } from './store/useCanvasStore'
import { runTextNode } from './services/gapgpt'

const nodeTypes: NodeTypes = {
  text: TextNode,
  image: ImageNode,
  video: VideoNode,
  merge: MergeNode,
}

export default function App() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setSelectedNodeId,
    apiKey,
    setApiKey,
    setNodeStatus,
    updateNodeData,
    addNode,
    isRunning,
    setIsRunning,
  } = useCanvasStore()

  const runSelectedGraph = useCallback(async () => {
    if (!apiKey) {
      alert('لطفاً کلید API گپ‌جی‌پی‌تی را وارد کنید')
      return
    }
    setIsRunning(true)

    try {
      for (const node of nodes) {
        if (node.type === 'text') {
          const data = node.data as any
          const prompt = data.prompt || 'سلام! یک جمله کوتاه بنویس.'
          setNodeStatus(node.id, 'running')
          try {
            const result = await runTextNode(apiKey, data.model || 'gpt-4o', prompt)
            setNodeStatus(node.id, 'success', { result })
            updateNodeData(node.id, { result })
          } catch (err: any) {
            setNodeStatus(node.id, 'error', { error: err.message })
          }
        }
      }
    } finally {
      setIsRunning(false)
    }
  }, [apiKey, nodes, setIsRunning, setNodeStatus, updateNodeData])

  return (
    <div className="w-screen h-screen bg-[#111827] flex flex-col">
      <div className="h-14 bg-[#0f172a] border-b border-slate-800 flex items-center px-4 gap-4 shrink-0">
        <span className="text-white font-semibold text-lg">GapGPT Canvas</span>
        <span className="text-slate-400 text-sm hidden sm:inline">محیط گراف‌محور چندمدلی</span>

        <div className="flex-1" />

        <input
          type="password"
          placeholder="کلید API گپ‌جی‌پی‌تی"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="bg-slate-800 text-white text-sm rounded-lg px-3 py-1.5 w-48 border border-slate-700 focus:outline-none focus:border-blue-500"
        />

        <button
          onClick={() => addNode('text', { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 })}
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-3 py-1.5 rounded-lg"
        >
          + متن
        </button>
        <button
          onClick={() => addNode('image', { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 })}
          className="bg-purple-600 hover:bg-purple-500 text-white text-sm px-3 py-1.5 rounded-lg"
        >
          + تصویر
        </button>
        <button
          onClick={() => addNode('video', { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 })}
          className="bg-pink-600 hover:bg-pink-500 text-white text-sm px-3 py-1.5 rounded-lg"
        >
          + ویدیو
        </button>
        <button
          onClick={() => addNode('merge', { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 })}
          className="bg-amber-600 hover:bg-amber-500 text-white text-sm px-3 py-1.5 rounded-lg"
        >
          + ادغام
        </button>

        <button
          onClick={runSelectedGraph}
          disabled={isRunning}
          className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm px-4 py-1.5 rounded-lg font-medium"
        >
          {isRunning ? 'در حال اجرا...' : '▶ اجرا'}
        </button>
      </div>

      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(_, node) => setSelectedNodeId(node.id)}
          nodeTypes={nodeTypes}
          fitView
          className="bg-[#111827]"
        >
          <Background color="#334155" gap={20} />
          <Controls />
          <MiniMap
            nodeColor={(n) => {
              if (n.type === 'image') return '#8b5cf6'
              if (n.type === 'video') return '#ec4899'
              if (n.type === 'merge') return '#f59e0b'
              return '#3b82f6'
            }}
            maskColor="rgba(0,0,0,0.6)"
          />
        </ReactFlow>
      </div>
    </div>
  )
}
