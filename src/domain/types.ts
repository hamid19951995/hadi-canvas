export type DataType = 'text' | 'image' | 'code' | 'any' | 'bundle' | 'bool'

export type NodeKind =
  | 'prompt'
  | 'text'
  | 'image'
  | 'code'
  | 'merge'
  | 'final'
  | 'condition'
  | 'loop'
  | 'memory'
  | 'agent'
  | 'figma'

/** حالت کار داخل گره پرامپت/متن/ایجنت */
export type NodeWorkMode = 'prompt' | 'chat' | 'agent'

export type NodeStatus = 'idle' | 'running' | 'success' | 'error' | 'blocked' | 'skipped'

export interface PortDef {
  id: string
  label: string
  direction: 'in' | 'out'
  dataType: DataType
  required?: boolean
}

export interface CodeFile {
  path: string
  content: string
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface NodeData {
  title: string
  kind: NodeKind
  prompt: string
  model: string
  /** چند مدل موازی روی همین گره */
  models?: string[]
  status: NodeStatus
  error?: string
  result?: string
  /** پرامپت | چت | ایجنت */
  mode?: NodeWorkMode
  /** تاریخچه چت روی گره */
  chatHistory?: ChatMessage[]
  /** ساختار فایل برای گره کد */
  files?: CodeFile[]
  config?: {
    maxIterations?: number
    memoryKey?: string
    conditionHint?: string
    figmaFileKey?: string
  }
}

export interface GNode {
  id: string
  type: NodeKind
  position: { x: number; y: number }
  data: NodeData
  groupId?: string
  groupLabel?: string
}

export interface GEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string | null
  targetHandle?: string | null
  valid: boolean
  reason?: string
}

export interface ModelPick {
  id: string
  count: number
}

export interface ExecSettings {
  parallel: boolean
  costCap?: number
  models: ModelPick[]
  memory?: Record<string, string>
}

export interface Project {
  id: string
  name: string
  updatedAt: string
  nodes: GNode[]
  edges: GEdge[]
  settings: ExecSettings
}

export interface PreflightIssue {
  level: 'blocker' | 'warning'
  message: string
  nodeId?: string
  edgeId?: string
  fix?: string
}

export const PORTS: Record<NodeKind, PortDef[]> = {
  prompt: [{ id: 'out', label: 'خروجی', direction: 'out', dataType: 'text' }],
  text: [
    { id: 'in', label: 'ورودی', direction: 'in', dataType: 'text' },
    { id: 'out', label: 'خروجی', direction: 'out', dataType: 'text' },
  ],
  image: [
    { id: 'in', label: 'شرح', direction: 'in', dataType: 'text', required: true },
    { id: 'out', label: 'تصویر', direction: 'out', dataType: 'image' },
  ],
  code: [
    { id: 'in', label: 'مشخصات', direction: 'in', dataType: 'text', required: true },
    { id: 'out', label: 'کد', direction: 'out', dataType: 'code' },
  ],
  merge: [
    { id: 'a', label: 'الف', direction: 'in', dataType: 'any' },
    { id: 'b', label: 'ب', direction: 'in', dataType: 'any' },
    { id: 'out', label: 'خروجی', direction: 'out', dataType: 'bundle' },
  ],
  final: [{ id: 'in', label: 'ورودی', direction: 'in', dataType: 'any', required: true }],
  condition: [
    { id: 'in', label: 'ورودی', direction: 'in', dataType: 'text' },
    { id: 'true', label: 'درست', direction: 'out', dataType: 'text' },
    { id: 'false', label: 'نادرست', direction: 'out', dataType: 'text' },
  ],
  loop: [
    { id: 'in', label: 'ورودی', direction: 'in', dataType: 'text' },
    { id: 'out', label: 'خروجی', direction: 'out', dataType: 'text' },
  ],
  memory: [
    { id: 'in', label: 'نوشتن', direction: 'in', dataType: 'text' },
    { id: 'out', label: 'خواندن', direction: 'out', dataType: 'text' },
  ],
  agent: [
    { id: 'in', label: 'هدف', direction: 'in', dataType: 'text' },
    { id: 'out', label: 'برنامه', direction: 'out', dataType: 'text' },
  ],
  figma: [
    { id: 'in', label: 'لینک', direction: 'in', dataType: 'text' },
    { id: 'out', label: 'طراحی', direction: 'out', dataType: 'bundle' },
  ],
}

export function portsOf(kind: NodeKind): PortDef[] {
  return PORTS[kind] || []
}

export function compatible(from: DataType, to: DataType): boolean {
  if (to === 'any' || from === 'any') return true
  if (from === to) return true
  if (from === 'bundle') return true
  if (to === 'text' && (from === 'code' || from === 'bool')) return true
  return false
}

export const MODEL_CATALOG: { id: string; label: string; provider: string }[] = [
  { id: 'gpt-4o', label: 'GPT-4o', provider: 'OpenAI / GapGPT' },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'OpenAI / GapGPT' },
  { id: 'gpt-4.1', label: 'GPT-4.1', provider: 'OpenAI' },
  { id: 'gpt-4.1-mini', label: 'GPT-4.1 Mini', provider: 'OpenAI' },
  { id: 'o4-mini', label: 'o4-mini', provider: 'OpenAI' },
  { id: 'claude-sonnet-4', label: 'Claude Sonnet 4', provider: 'Anthropic' },
  { id: 'claude-3.5-sonnet', label: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
  { id: 'claude-3.5-haiku', label: 'Claude 3.5 Haiku', provider: 'Anthropic' },
  { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', provider: 'Google' },
  { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', provider: 'Google' },
  { id: 'llama-3.3-70b', label: 'Llama 3.3 70B', provider: 'OpenRouter / Local' },
  { id: 'qwen2.5-coder', label: 'Qwen2.5 Coder', provider: 'Local / OpenRouter' },
  { id: 'deepseek-chat', label: 'DeepSeek Chat', provider: 'DeepSeek' },
]
