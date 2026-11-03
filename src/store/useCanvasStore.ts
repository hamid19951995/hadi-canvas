import { create } from 'zustand'
import { Node, Edge, Connection, addEdge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from '@xyflow/react'
import {
  createProject,
  saveToLocalStorage,
  loadFromLocalStorage,
  downloadProjectJson,
  type CanvasProject,
} from '../services/projectStorage'

export type NodeStatus = 'empty' | 'running' | 'success' | 'error'

export interface CanvasNodeData {
  label: string
  model?: string
  prompt?: string
  status: NodeStatus
  result?: string
  error?: string
  condition?: string
  iterations?: number
  currentIteration?: number
  keys?: string[]
  mode?: 'input' | 'output'
  fileName?: string
}

interface CanvasState {
  nodes: Node[]
  edges: Edge[]
  selectedNodeId: string | null
  apiKey: string
  isRunning: boolean
  projectName: string

  setNodes: (nodes: Node[]) => void
  setEdges: (edges: Edge[]) => void
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
  setSelectedNodeId: (id: string | null) => void
  setApiKey: (key: string) => void
  setProjectName: (name: string) => void
  updateNodeData: (id: string, data: Partial<CanvasNodeData>) => void
  setNodeStatus: (id: string, status: NodeStatus, extra?: Partial<CanvasNodeData>) => void
  addNode: (type: string, position: { x: number; y: number }) => void
  setIsRunning: (running: boolean) => void
  saveProject: (download?: boolean) => void
  loadProject: (project: CanvasProject) => void
  loadFromStorage: () => boolean
}

const defaultNodes: Node[] = [
  {
    id: '1',
    type: 'text',
    position: { x: 80, y: 120 },
    data: { label: 'مدل متنی', model: 'gpt-4o', prompt: '', status: 'empty' },
  },
  {
    id: '2',
    type: 'image',
    position: { x: 420, y: 80 },
    data: { label: 'تولید تصویر', status: 'empty' },
  },
  {
    id: '3',
    type: 'video',
    position: { x: 420, y: 280 },
    data: { label: 'تولید ویدیو', status: 'empty' },
  },
  {
    id: '4',
    type: 'merge',
    position: { x: 720, y: 160 },
    data: { label: 'ادغام نتایج', status: 'empty' },
  },
]

const defaultEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e1-3', source: '1', target: '3', animated: true },
  { id: 'e2-4', source: '2', target: '4', targetHandle: 'a', animated: true },
  { id: 'e3-4', source: '3', target: '4', targetHandle: 'b', animated: true },
]

let nodeIdCounter = 5

function syncCounter(nodes: Node[]) {
  let max = 0
  for (const n of nodes) {
    const num = parseInt(n.id, 10)
    if (!Number.isNaN(num) && num > max) max = num
  }
  nodeIdCounter = max + 1
}

const NODE_LABELS: Record<string, string> = {
  text: 'مدل متنی',
  image: 'تولید تصویر',
  video: 'تولید ویدیو',
  merge: 'ادغام نتایج',
  conditional: 'شرطی',
  loop: 'حلقه',
  memory: 'حافظه',
  file: 'فایل',
}

function readApiKey() {
  return (
    localStorage.getItem('hadi_api_key') ||
    localStorage.getItem('gapgpt_api_key') ||
    ''
  )
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: defaultNodes,
  edges: defaultEdges,
  selectedNodeId: null,
  apiKey: readApiKey(),
  isRunning: false,
  projectName: 'Hadi',

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) })
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) })
  },

  onConnect: (connection) => {
    set({ edges: addEdge({ ...connection, animated: true }, get().edges) })
  },

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  setApiKey: (key) => {
    localStorage.setItem('hadi_api_key', key)
    set({ apiKey: key })
  },

  setProjectName: (name) => set({ projectName: name }),

  updateNodeData: (id, data) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...data } } : n
      ),
    })
  },

  setNodeStatus: (id, status, extra = {}) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, status, ...extra } } : n
      ),
    })
  },

  addNode: (type, position) => {
    const id = String(nodeIdCounter++)
    const baseData: Record<string, unknown> = {
      label: NODE_LABELS[type] || type,
      status: 'empty',
    }
    if (type === 'text') {
      baseData.model = 'gpt-4o'
      baseData.prompt = ''
    }
    if (type === 'conditional') {
      baseData.condition = 'شامل «بله» باشد'
    }
    if (type === 'loop') {
      baseData.iterations = 3
    }
    if (type === 'file') {
      baseData.mode = 'input'
    }

    const newNode: Node = {
      id,
      type,
      position,
      data: baseData,
    }
    set({ nodes: [...get().nodes, newNode] })
  },

  setIsRunning: (running) => set({ isRunning: running }),

  saveProject: (download = false) => {
    const { nodes, edges, projectName } = get()
    const project = createProject(nodes, edges, projectName || 'Hadi')
    saveToLocalStorage(project)
    if (download) downloadProjectJson(project)
  },

  loadProject: (project) => {
    syncCounter(project.nodes)
    set({
      nodes: project.nodes,
      edges: project.edges,
      projectName: project.name || 'Hadi',
      selectedNodeId: null,
    })
    saveToLocalStorage(project)
  },

  loadFromStorage: () => {
    const project = loadFromLocalStorage()
    if (!project) return false
    get().loadProject(project)
    return true
  },
}))
