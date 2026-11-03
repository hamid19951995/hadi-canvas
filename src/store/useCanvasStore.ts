import { create } from 'zustand'
import { Node, Edge, Connection, addEdge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from '@xyflow/react'

export type NodeStatus = 'empty' | 'running' | 'success' | 'error'

export interface CanvasNodeData {
  label: string
  model?: string
  prompt?: string
  status: NodeStatus
  result?: string
  error?: string
}

interface CanvasState {
  nodes: Node[]
  edges: Edge[]
  selectedNodeId: string | null
  apiKey: string
  isRunning: boolean

  setNodes: (nodes: Node[]) => void
  setEdges: (edges: Edge[]) => void
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
  setSelectedNodeId: (id: string | null) => void
  setApiKey: (key: string) => void
  updateNodeData: (id: string, data: Partial<CanvasNodeData>) => void
  setNodeStatus: (id: string, status: NodeStatus, extra?: Partial<CanvasNodeData>) => void
  addNode: (type: string, position: { x: number; y: number }) => void
  setIsRunning: (running: boolean) => void
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

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: defaultNodes,
  edges: defaultEdges,
  selectedNodeId: null,
  apiKey: localStorage.getItem('gapgpt_api_key') || '',
  isRunning: false,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    })
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    })
  },

  onConnect: (connection) => {
    set({
      edges: addEdge({ ...connection, animated: true }, get().edges),
    })
  },

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  setApiKey: (key) => {
    localStorage.setItem('gapgpt_api_key', key)
    set({ apiKey: key })
  },

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
    const labels: Record<string, string> = {
      text: 'مدل متنی',
      image: 'تولید تصویر',
      video: 'تولید ویدیو',
      merge: 'ادغام نتایج',
    }
    const newNode: Node = {
      id,
      type,
      position,
      data: {
        label: labels[type] || type,
        status: 'empty',
        model: type === 'text' ? 'gpt-4o' : undefined,
        prompt: '',
      },
    }
    set({ nodes: [...get().nodes, newNode] })
  },

  setIsRunning: (running) => set({ isRunning: running }),
}))
