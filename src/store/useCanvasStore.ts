import { create } from 'zustand'
import { Node, Edge, Connection, addEdge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from '@xyflow/react'
import {
  createProject,
  saveToLocalStorage,
  loadFromLocalStorage,
  downloadProjectJson,
  type CanvasProject,
} from '../services/projectStorage'
import { runTextNode, chatCompletion, type ChatMessage } from '../services/gapgpt'

export type NodeStatus = 'empty' | 'running' | 'success' | 'error'

export interface CanvasNodeData {
  label: string
  model?: string
  prompt?: string
  models?: string[]
  chatModel?: string
  chatMessages?: ChatMessage[]
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
  runParallelBuild: (promptNodeId: string) => Promise<void>
  sendNodeChat: (nodeId: string, userText: string, agentMode: boolean) => Promise<void>
  applyChatSuggestion: (nodeId: string) => Promise<void>
}

const APP_SYSTEM = `تو یک مهندس فرانت‌اند هستی. فقط یک فایل HTML کامل و قابل اجرا تولید کن (با CSS و JS درون‌خطی).
زبان رابط: فارسی و dir=rtl مگر خلافش خواسته شود.
خروجی را داخل بلوک markdown با برچسب html بگذار.
هیچ توضیح اضافه‌ای بیرون از بلوک کد ننویس.`

const CHAT_SYSTEM = `تو دستیار hadi-canvas هستی. کوتاه و مفید پاسخ بده. روی ایده کاربر برای ساخت اپ/محتوا تمرکز کن.`

const AGENT_SYSTEM = `تو ایجنت hadi-canvas هستی.
با کاربر درباره ایده صحبت کن و پیشنهاد عملی بده.
وقتی پیشنهاد نهایی برای «پرامپت ساخت» آماده شد، آن را داخل بلوک زیر بگذار:

\`\`\`prompt
متن پرامپت نهایی اینجا
\`\`\`

اگر کاربر گفت «اعمال کن» فقط همان پرامپت نهایی را داخل بلوک prompt بگذار و توضیح اضافه نده.`

const defaultNodes: Node[] = [
  {
    id: 'prompt',
    type: 'prompt',
    position: { x: 280, y: 40 },
    data: {
      label: 'پرامپت اصلی',
      prompt: 'یک ماشین حساب ساده با ظاهر مدرن بساز',
      models: ['gpt-4o', 'gpt-4o-mini'],
      chatMessages: [],
      status: 'empty',
    },
  },
]

const defaultEdges: Edge[] = []

let nodeIdCounter = 10

function syncCounter(nodes: Node[]) {
  let max = 0
  for (const n of nodes) {
    const num = parseInt(n.id.replace(/\D/g, ''), 10)
    if (!Number.isNaN(num) && num > max) max = num
  }
  nodeIdCounter = Math.max(10, max + 1)
}

const NODE_LABELS: Record<string, string> = {
  prompt: 'پرامپت اصلی',
  text: 'مدل متنی',
  image: 'تولید تصویر',
  video: 'تولید ویدیو',
  merge: 'ادغام نتایج',
  conditional: 'شرطی',
  loop: 'حلقه',
  memory: 'حافظه',
  file: 'فایل',
  appOutput: 'خروجی اپ',
}

function readApiKey() {
  return (
    localStorage.getItem('hadi_api_key') ||
    localStorage.getItem('gapgpt_api_key') ||
    ''
  )
}

function extractPromptBlock(text: string): string | null {
  const m = text.match(/```prompt\s*([\s\S]*?)```/i)
  if (m?.[1]) return m[1].trim()
  const m2 = text.match(/```(?:text)?\s*([\s\S]*?)```/)
  if (m2?.[1] && m2[1].trim().length > 10) return m2[1].trim()
  return null
}

function isApplyCommand(text: string) {
  return /اعمال\s*کن|اعمال\s*شود|apply/i.test(text.trim())
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: defaultNodes,
  edges: defaultEdges,
  selectedNodeId: null,
  apiKey: readApiKey(),
  isRunning: false,
  projectName: 'hadi-canvas',

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
    if (type === 'text' || type === 'prompt') {
      baseData.model = 'gpt-4o'
      baseData.prompt = ''
      if (type === 'prompt') {
        baseData.models = ['gpt-4o']
        baseData.chatMessages = []
      }
    }
    if (type === 'conditional') baseData.condition = 'شامل «بله» باشد'
    if (type === 'loop') baseData.iterations = 3
    if (type === 'file') baseData.mode = 'input'

    set({ nodes: [...get().nodes, { id, type, position, data: baseData }] })
  },

  setIsRunning: (running) => set({ isRunning: running }),

  saveProject: (download = false) => {
    const { nodes, edges, projectName } = get()
    const project = createProject(nodes, edges, projectName || 'hadi-canvas')
    saveToLocalStorage(project)
    if (download) downloadProjectJson(project)
  },

  loadProject: (project) => {
    syncCounter(project.nodes)
    set({
      nodes: project.nodes,
      edges: project.edges,
      projectName: project.name || 'hadi-canvas',
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

  runParallelBuild: async (promptNodeId) => {
    const state = get()
    const promptNode = state.nodes.find((n) => n.id === promptNodeId)
    if (!promptNode) return

    const d = promptNode.data as CanvasNodeData
    const userPrompt = (d.prompt || '').trim()
    if (!userPrompt) {
      alert('ابتدا پرامپت را بنویسید')
      return
    }
    const models = (d.models && d.models.length ? d.models : ['gpt-4o']) as string[]

    set({ isRunning: true })
    get().updateNodeData(promptNodeId, { status: 'running' })

    const origin = promptNode.position
    const created: { modelId: string; outId: string; model: string }[] = []
    let nodes = [...get().nodes]
    let edges = [...get().edges]

    models.forEach((model, i) => {
      const modelId = `m${nodeIdCounter++}`
      const outId = `o${nodeIdCounter++}`
      const x = origin.x - 120 + i * 280
      const yModel = origin.y + 220
      const yOut = yModel + 200

      nodes.push({
        id: modelId,
        type: 'text',
        position: { x, y: yModel },
        data: {
          label: `مدل · ${model}`,
          model,
          prompt: userPrompt,
          status: 'running',
        },
      })
      nodes.push({
        id: outId,
        type: 'appOutput',
        position: { x: x + 10, y: yOut },
        data: {
          label: `خروجی · ${model}`,
          model,
          status: 'running',
        },
      })
      edges.push(
        { id: `e-${promptNodeId}-${modelId}`, source: promptNodeId, target: modelId, animated: true },
        { id: `e-${modelId}-${outId}`, source: modelId, target: outId, animated: true }
      )
      created.push({ modelId, outId, model })
    })

    set({ nodes, edges })

    await Promise.all(
      created.map(async ({ modelId, outId, model }) => {
        try {
          const result = await runTextNode(
            get().apiKey,
            model,
            userPrompt,
            APP_SYSTEM
          )
          get().updateNodeData(modelId, { status: 'success', result })
          get().updateNodeData(outId, { status: 'success', result, model })
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err)
          get().updateNodeData(modelId, { status: 'error', error: message })
          get().updateNodeData(outId, { status: 'error', error: message })
        }
      })
    )

    get().updateNodeData(promptNodeId, { status: 'success' })
    set({ isRunning: false })
  },

  sendNodeChat: async (nodeId, userText, agentMode) => {
    const node = get().nodes.find((n) => n.id === nodeId)
    if (!node) return
    const d = node.data as CanvasNodeData
    const prev = (d.chatMessages || []) as ChatMessage[]
    const model = d.chatModel || d.model || 'gpt-4o'

    // If user says apply, run apply path
    if (isApplyCommand(userText)) {
      const withUser = [...prev, { role: 'user' as const, content: userText }]
      get().updateNodeData(nodeId, { chatMessages: withUser })
      await get().applyChatSuggestion(nodeId)
      return
    }

    const nextMessages: ChatMessage[] = [
      ...prev,
      { role: 'user', content: userText },
    ]
    get().updateNodeData(nodeId, { chatMessages: nextMessages })

    try {
      const system = agentMode ? AGENT_SYSTEM : CHAT_SYSTEM
      const apiMessages: ChatMessage[] = [
        { role: 'system', content: system },
        ...nextMessages,
      ]
      const res = await chatCompletion(get().apiKey, {
        model,
        messages: apiMessages,
        temperature: agentMode ? 0.5 : 0.7,
      })
      const reply = res.choices?.[0]?.message?.content || 'پاسخی دریافت نشد.'
      get().updateNodeData(nodeId, {
        chatMessages: [...nextMessages, { role: 'assistant', content: reply }],
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      get().updateNodeData(nodeId, {
        chatMessages: [
          ...nextMessages,
          { role: 'assistant', content: `خطا: ${message}` },
        ],
      })
    }
  },

  applyChatSuggestion: async (nodeId) => {
    const node = get().nodes.find((n) => n.id === nodeId)
    if (!node) return
    const d = node.data as CanvasNodeData
    const msgs = (d.chatMessages || []) as ChatMessage[]
    const lastAssistant = [...msgs].reverse().find((m) => m.role === 'assistant')
    if (!lastAssistant) {
      alert('پیشنهادی از مدل نیست. اول چت کنید.')
      return
    }

    let promptText = extractPromptBlock(lastAssistant.content)
    if (!promptText) {
      // ask model to extract final prompt
      try {
        const res = await chatCompletion(get().apiKey, {
          model: d.chatModel || d.model || 'gpt-4o',
          messages: [
            {
              role: 'system',
              content:
                'فقط پرامپت نهایی ساخت را داخل ```prompt بنویس. هیچ متن دیگری ننویس.',
            },
            {
              role: 'user',
              content: `از این پیشنهاد، پرامپت نهایی را استخراج کن:\n\n${lastAssistant.content}`,
            },
          ],
          temperature: 0.2,
        })
        const content = res.choices?.[0]?.message?.content || ''
        promptText = extractPromptBlock(content) || content.trim()
      } catch {
        promptText = lastAssistant.content.trim()
      }
    }

    if (!promptText) {
      alert('نتوانستم پرامپت قابل اعمال پیدا کنم.')
      return
    }

    get().updateNodeData(nodeId, {
      prompt: promptText,
      chatMessages: [
        ...msgs,
        {
          role: 'assistant',
          content: `✓ روی پرامپت گره اعمال شد:\n${promptText.slice(0, 280)}${promptText.length > 280 ? '…' : ''}`,
        },
      ],
    })
  },
}))
