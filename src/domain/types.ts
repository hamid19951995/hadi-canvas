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

export type NodeStatus = 'idle' | 'running' | 'success' | 'error' | 'blocked' | 'skipped'

export interface PortDef {
  id: string
  label: string
  direction: 'in' | 'out'
  dataType: DataType
  required?: boolean
}

export interface NodeData {
  title: string
  kind: NodeKind
  prompt: string
  model: string
  status: NodeStatus
  error?: string
  result?: string
  /** condition: expression hint; loop: max iterations; memory: key; agent: goal */
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
  /** optional visual/logical group */
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
  /** graph-level memory bag */
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
  final: [{ id: 'in', label: 'نتیجه', direction: 'in', dataType: 'any', required: true }],
  condition: [
    { id: 'in', label: 'ورودی', direction: 'in', dataType: 'text', required: true },
    { id: 'true', label: 'درست', direction: 'out', dataType: 'text' },
    { id: 'false', label: 'نادرست', direction: 'out', dataType: 'text' },
  ],
  loop: [
    { id: 'in', label: 'ورودی', direction: 'in', dataType: 'text', required: true },
    { id: 'out', label: 'خروجی', direction: 'out', dataType: 'text' },
  ],
  memory: [
    { id: 'in', label: 'نوشتن', direction: 'in', dataType: 'text' },
    { id: 'out', label: 'خواندن', direction: 'out', dataType: 'text' },
  ],
  agent: [
    { id: 'in', label: 'هدف', direction: 'in', dataType: 'text', required: true },
    { id: 'out', label: 'پاسخ', direction: 'out', dataType: 'text' },
  ],
  figma: [
    { id: 'in', label: 'کلید فایل / لینک', direction: 'in', dataType: 'text' },
    { id: 'out', label: 'ساختار', direction: 'out', dataType: 'text' },
  ],
}

export function portsOf(kind: NodeKind) {
  return PORTS[kind]
}

export function compatible(from: DataType, to: DataType): boolean {
  if (from === 'any' || to === 'any' || from === to) return true
  if (from === 'text' && (to === 'code' || to === 'image' || to === 'bool')) return true
  if ((from === 'code' || from === 'image' || from === 'text') && to === 'bundle') return true
  if (from === 'code' && to === 'text') return true
  if (from === 'bool' && to === 'text') return true
  return false
}

export const NODE_LABELS: Record<NodeKind, string> = {
  prompt: 'پرامپت پایه',
  text: 'متن',
  image: 'تصویر',
  code: 'کد',
  merge: 'ادغام',
  final: 'خروجی نهایی',
  condition: 'شرط',
  loop: 'حلقه',
  memory: 'حافظه',
  agent: 'ایجنت',
  figma: 'Figma',
}
