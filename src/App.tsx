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
import { ConditionalNode } from './nodes/ConditionalNode'
import { LoopNode } from './nodes/LoopNode'
import { MemoryNode } from './nodes/MemoryNode'
import { FileNode } from './nodes/FileNode'
import { useCanvasStore } from './store/useCanvasStore'
import { runTextNode } from './services/gapgpt'

const nodeTypes: NodeTypes = {
  text: TextNode,
  image: ImageNode,
  video: VideoNode,
  merge: MergeNode,
  conditional: ConditionalNode,
  loop: LoopNode,
  memory: MemoryNode,
  file: FileNode,
}

const NODE_COLORS: Record<string, string> = {
  text: '#3b82f6',
  image: '#8b5cf6',
  video: '#ec4899',
  merge: '#f59e0b',
  conditional: '#f97316',
  loop: '#14b8a6',
  memory: '#6366f1',
  file: '#10b981',
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

  const randomPos = () => ({
    x: 80 + Math.random() * 400,
    y: 80 + Math.random() * 300,
  })

  return (
    <div className="w-screen h-screen bg-[#111827] flex flex-col">
      <div className="h-14 bg-[#0f172a] border-b border-slate-800 flex items-center px-3 gap-2 shrink-0 overflow-x-auto">
        <span className="text-white font-semibold text-lg shrink-0">GapGPT Canvas</span>

        <div className="flex-1" />

        <input
          type="password"
          placeholder="کلید API"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="bg-slate-800 text-white text-sm rounded-lg px-3 py-1.5 w-40 border border-slate-700 focus:outline-none focus:border-blue-500 shrink-0"
        />

        <div className="flex gap-1.5 shrink-0">
          <button onClick={() => addNode('text', randomPos())} className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-2.5 py-1.5 rounded-lg">+ متن</button>
          <button onClick={() => addNode('image', randomPos())} className="bg-purple-600 hover:bg-purple-500 text-white text-xs px-2.5 py-1.5 rounded-lg">+ تصویر</button>
          <button onClick={() => addNode('video', randomPos())} className="bg-pink-600 hover:bg-pink-500 text-white text-xs px-2.5 py-1.5 rounded-lg">+ ویدیو</button>
          <button onClick={() => addNode('merge', randomPos())} className="bg-amber-600 hover:bg-amber-500 text-white text-xs px-2.5 py-1.5 rounded-lg">+ ادغام</button>
          <button onClick={() => addNode('conditional', randomPos())} className="bg-orange-600 hover:bg-orange-500 text-white text-xs px-2.5 py-1.5 rounded-lg">+ شرطی</button>
          <button onClick={() => addNode('loop', randomPos())} className="bg-teal-600 hover:bg-teal-500 text-white text-xs px-2.5 py-1.5 rounded-lg">+ حلقه</button>
          <button onClick={() => addNode('memory', randomPos())} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-2.5 py-1.5 rounded-lg">+ حافظه</button>
          <button onClick={() => addNode('file', randomPos())} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-2.5 py-1.5 rounded-lg">+ فایل</button>
        </div>

        <button
          onClick={runSelectedGraph}
          disabled={isRunning}
          className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm px-4 py-1.5 rounded-lg font-medium shrink-0"
        >
          {isRunning ? '...' : '▶ اجرا'}
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
            nodeColor={(n) => NODE_COLORS[n.type || 'text'] || '#3b82f6'}
            maskColor="rgba(0,0,0,0.6)"
          />
        </ReactFlow>
      </div>
    </div>
  )
}
