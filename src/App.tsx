import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  NodeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useCallback, useEffect, useRef } from 'react'
import { TextNode } from './nodes/TextNode'
import { ImageNode } from './nodes/ImageNode'
import { VideoNode } from './nodes/VideoNode'
import { MergeNode } from './nodes/MergeNode'
import { ConditionalNode } from './nodes/ConditionalNode'
import { LoopNode } from './nodes/LoopNode'
import { MemoryNode } from './nodes/MemoryNode'
import { FileNode } from './nodes/FileNode'
import { PropertiesPanel } from './components/PropertiesPanel'
import { useCanvasStore } from './store/useCanvasStore'
import { executeGraph, GraphCycleError } from './engine/graphEngine'
import { readProjectFile } from './services/projectStorage'

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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setSelectedNodeId,
    apiKey,
    setApiKey,
    updateNodeData,
    addNode,
    isRunning,
    setIsRunning,
    projectName,
    setProjectName,
    saveProject,
    loadProject,
    loadFromStorage,
  } = useCanvasStore()

  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  const runGraph = useCallback(async () => {
    // apiKey optional when server has HADI_API_KEY
    if (!nodes.length) {
      alert('نودی برای اجرا وجود ندارد')
      return
    }

    setIsRunning(true)
    try {
      await executeGraph(nodes, edges, {
        apiKey,
        results: new Map(),
        onNodeUpdate: (id, patch) => {
          updateNodeData(id, patch as any)
        },
      })
    } catch (err) {
      if (err instanceof GraphCycleError) {
        alert(err.message)
      } else {
        alert(err instanceof Error ? err.message : 'خطا در اجرای گراف')
      }
    } finally {
      setIsRunning(false)
    }
  }, [apiKey, nodes, edges, setIsRunning, updateNodeData])

  const handleSave = () => {
    saveProject(false)
    alert('پروژه در مرورگر ذخیره شد')
  }

  const handleExport = () => saveProject(true)
  const handleImportClick = () => fileInputRef.current?.click()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const project = await readProjectFile(file)
      loadProject(project)
      alert(`پروژه «${project.name}» بارگذاری شد`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'خطا در بارگذاری فایل')
    }
    e.target.value = ''
  }

  const randomPos = () => ({
    x: 80 + Math.random() * 400,
    y: 80 + Math.random() * 300,
  })

  return (
    <div className="w-screen h-screen bg-[#111827] flex flex-col" dir="rtl">
      <div className="h-14 bg-[#0f172a] border-b border-slate-800 flex items-center px-3 gap-2 shrink-0 overflow-x-auto">
        <span className="text-white font-semibold text-lg shrink-0">Hadi</span>

        <input
          className="bg-transparent text-slate-300 text-sm border border-slate-700 rounded px-2 py-1 w-36 focus:outline-none focus:border-blue-500 shrink-0"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          title="نام پروژه"
        />

        <div className="flex gap-1 shrink-0">
          <button onClick={handleSave} className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-2.5 py-1.5 rounded-lg">ذخیره</button>
          <button onClick={handleExport} className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-2.5 py-1.5 rounded-lg">خروجی JSON</button>
          <button onClick={handleImportClick} className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-2.5 py-1.5 rounded-lg">بارگذاری</button>
          <input ref={fileInputRef} type="file" accept=".json,.hadi.json,application/json" className="hidden" onChange={handleFileChange} />
        </div>

        <div className="flex-1" />

        <input
          type="password"
          placeholder="کلید API (اختیاری اگر سرور دارد)"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="bg-slate-800 text-white text-sm rounded-lg px-3 py-1.5 w-48 border border-slate-700 focus:outline-none focus:border-blue-500 shrink-0"
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
          onClick={runGraph}
          disabled={isRunning}
          className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm px-4 py-1.5 rounded-lg font-medium shrink-0"
        >
          {isRunning ? 'در حال اجرا...' : '▶ اجرای گراف'}
        </button>
      </div>

      {/* LTR shell so panel stays on the physical right */}
      <div className="flex-1 flex min-h-0" dir="ltr">
        <div className="flex-1 min-w-0">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            onPaneClick={() => setSelectedNodeId(null)}
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

        <div dir="rtl">
          <PropertiesPanel />
        </div>
      </div>
    </div>
  )
}
