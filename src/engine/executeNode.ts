import type { ChatMessage, CodeFile, GNode } from '../domain/types'
import { chatCompleteWith } from '../services/llm'
import { isUsable } from '../services/connectors'
import { fetchFigmaFrameImages, parseFigmaFileKey } from '../services/figmaApi'

export interface NodeExecOutcome {
  result: string
  branch?: 'true' | 'false'
  memoryPatch?: Record<string, string>
  files?: CodeFile[]
  chatHistory?: ChatMessage[]
  /** set when a chat turn should clear the composer */
  clearPrompt?: boolean
}

export interface NodeExecOptions {
  node: GNode
  inputText: string
  apiKey: string
  provider?: string
  memory: Record<string, string>
  cancelled?: () => boolean
}

const POSITIVE = /(^|[\s،,.:;!?])(yes|true|1|بله|آره|درست|تأیید|تایید)($|[\s،,.:;!?])/i

function parseCodeBlocks(text: string): CodeFile[] {
  const files: CodeFile[] = []
  const re = /```([^\n`]*)\n([\s\S]*?)```/g
  let match: RegExpExecArray | null
  while ((match = re.exec(text))) {
    const header = (match[1] || '').trim()
    const path =
      header.includes('/') || header.includes('.')
        ? header
        : header
          ? `src/${header}`
          : `src/file-${files.length + 1}.txt`
    files.push({ path, content: match[2] || '' })
  }
  return files
}

/**
 * Execute a single graph node. This is the single source of truth used by full runs,
 * single-node runs and retries so behaviour cannot drift between those paths.
 */
export async function executeNode(opts: NodeExecOptions): Promise<NodeExecOutcome> {
  const { node, inputText, apiKey, provider, memory, cancelled } = opts
  const kind = node.data.kind
  const model = node.data.model
  const local = node.data.prompt || ''
  const mode = node.data.mode || (kind === 'agent' ? 'agent' : 'prompt')

  if (kind === 'prompt' && mode === 'prompt') {
    return { result: local }
  }
  if (kind === 'merge' || kind === 'final') {
    return { result: inputText || local || '(خالی)' }
  }
  if (kind === 'condition') {
    const text = (inputText || local).trim()
    const ok = POSITIVE.test(text)
    return {
      result: ok ? `شرط برقرار (true)\n${inputText}` : `شرط برقرار نیست (false)\n${inputText}`,
      branch: ok ? 'true' : 'false',
    }
  }
  if (kind === 'loop') {
    const max = Math.min(Math.max(Number(node.data.config?.maxIterations ?? 3) || 1, 1), 5)
    let acc = inputText || local
    for (let i = 0; i < max; i++) {
      if (cancelled?.()) break
      acc = await chatCompleteWith(
        provider,
        apiKey,
        model,
        `دور ${i + 1} از ${max}. ورودی را یک قدم بهبود بده و کوتاه برگردان:\n${acc}`,
      )
    }
    return { result: `[حلقه ${max} دور]\n${acc}` }
  }
  if (kind === 'memory') {
    const key = node.data.config?.memoryKey || 'default'
    const next = inputText.trim() || local.trim()
    if (next) return { result: next, memoryPatch: { [key]: next } }
    return { result: memory[key] || '(خالی)' }
  }
  if (kind === 'agent') {
    const goal = [local, inputText].filter(Boolean).join('\n')
    const text = await chatCompleteWith(
      provider,
      apiKey,
      model,
      `تو یک ایجنت برنامه‌ریز هستی. هدف:\n${goal}\n\n1) خلاصه هدف\n2) سه قدم پیشنهادی\n3) ریسک‌ها\nکوتاه و عملی بنویس.`,
    )
    return { result: text }
  }
  if (kind === 'figma') {
    if (!isUsable('figma')) throw new Error('Figma متصل نیست. از افزونه‌ها OAuth کنید.')
    const raw = [node.data.config?.figmaFileKey, local, inputText].filter(Boolean).join('\n')
    const key = parseFigmaFileKey(raw) || parseFigmaFileKey(inputText) || parseFigmaFileKey(local)
    if (!key) throw new Error('کلید فایل Figma یا لینک design/file را در پرامپت بگذارید')
    const nodeMatch = raw.match(/nodes?:\s*([0-9: ,-]+)/i)
    const nodeIds = nodeMatch
      ? nodeMatch[1].split(/[,\s]+/).map((s) => s.trim()).filter(Boolean)
      : undefined
    const { summary } = await fetchFigmaFrameImages(key, { nodeIds, limit: 6, scale: 1 })
    return { result: summary }
  }
  if (kind === 'code') {
    const prompt = [inputText, local].filter(Boolean).join('\n\n')
    const result = await chatCompleteWith(
      provider,
      apiKey,
      model,
      'کد را در بلوک‌های markdown با نام فایل بنویس مثلا ```src/App.tsx\n...\n```\n\n' + prompt,
    )
    const files = parseCodeBlocks(result)
    return { result, files: files.length ? files : undefined }
  }
  if (kind === 'image') {
    const prompt = [local, inputText].filter(Boolean).join('\n')
    const result = await chatCompleteWith(provider, apiKey, model, `شرح تصویر بساز:\n${prompt}`)
    return { result }
  }

  const composed = [local, inputText].filter(Boolean).join('\n\n') || 'سلام'
  const result = await chatCompleteWith(provider, apiKey, model, composed)
  if (mode === 'chat') {
    const history: ChatMessage[] = [...(node.data.chatHistory || [])]
    history.push({ role: 'user', content: local })
    history.push({ role: 'assistant', content: result })
    return { result, chatHistory: history, clearPrompt: true }
  }
  return { result }
}
