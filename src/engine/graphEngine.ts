/**
 * Graph Execution Engine — Phase 14
 * Builds a DAG from React Flow nodes/edges, topologically sorts,
 * and runs ready nodes in parallel waves.
 */

import type { Node, Edge } from '@xyflow/react'
import { runTextNode } from '../services/gapgpt'

export type NodeStatus = 'empty' | 'running' | 'success' | 'error'

export interface ExecutionContext {
  apiKey: string
  /** nodeId -> accumulated text result */
  results: Map<string, string>
  /** called whenever a node status/data changes */
  onNodeUpdate: (id: string, patch: Record<string, unknown>) => void
}

export class GraphCycleError extends Error {
  constructor(message = 'گراف دارای حلقه است و قابل اجرا نیست') {
    super(message)
    this.name = 'GraphCycleError'
  }
}

/** Build adjacency + in-degree from edges */
export function buildGraph(nodes: Node[], edges: Edge[]) {
  const nodeIds = new Set(nodes.map((n) => n.id))
  const adjacency = new Map<string, string[]>()
  const inDegree = new Map<string, number>()
  const predecessors = new Map<string, string[]>()

  for (const id of nodeIds) {
    adjacency.set(id, [])
    inDegree.set(id, 0)
    predecessors.set(id, [])
  }

  for (const e of edges) {
    if (!nodeIds.has(e.source) || !nodeIds.has(e.target)) continue
    adjacency.get(e.source)!.push(e.target)
    inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1)
    predecessors.get(e.target)!.push(e.source)
  }

  return { adjacency, inDegree, predecessors, nodeIds }
}

/** Kahn's algorithm — throws GraphCycleError if cycle detected */
export function topologicalSort(
  nodeIds: Set<string>,
  adjacency: Map<string, string[]>,
  inDegree: Map<string, number>
): string[] {
  const degree = new Map(inDegree)
  const queue: string[] = []
  const order: string[] = []

  for (const [id, d] of degree) {
    if (d === 0) queue.push(id)
  }

  while (queue.length > 0) {
    const current = queue.shift()!
    order.push(current)
    for (const next of adjacency.get(current) || []) {
      const nextDeg = (degree.get(next) || 0) - 1
      degree.set(next, nextDeg)
      if (nextDeg === 0) queue.push(next)
    }
  }

  if (order.length !== nodeIds.size) {
    throw new GraphCycleError()
  }

  return order
}

/** Group nodes into parallel waves (same wave = no mutual dependency) */
export function buildExecutionWaves(
  order: string[],
  predecessors: Map<string, string[]>
): string[][] {
  const waveIndex = new Map<string, number>()
  const waves: string[][] = []

  for (const id of order) {
    const preds = predecessors.get(id) || []
    let maxPredWave = -1
    for (const p of preds) {
      maxPredWave = Math.max(maxPredWave, waveIndex.get(p) ?? -1)
    }
    const w = maxPredWave + 1
    waveIndex.set(id, w)
    if (!waves[w]) waves[w] = []
    waves[w].push(id)
  }

  return waves
}

function collectUpstreamText(
  nodeId: string,
  predecessors: Map<string, string[]>,
  results: Map<string, string>
): string {
  const preds = predecessors.get(nodeId) || []
  const parts: string[] = []
  for (const p of preds) {
    const r = results.get(p)
    if (r) parts.push(r)
  }
  return parts.join('\n\n')
}

async function executeSingleNode(
  node: Node,
  ctx: ExecutionContext,
  predecessors: Map<string, string[]>
): Promise<void> {
  const { id, type, data } = node
  const d = data as Record<string, unknown>

  ctx.onNodeUpdate(id, { status: 'running' as NodeStatus })

  try {
    switch (type) {
      case 'text': {
        const upstream = collectUpstreamText(id, predecessors, ctx.results)
        const userPrompt = (d.prompt as string) || ''
        const prompt = upstream
          ? `${upstream}\n\n---\n${userPrompt || 'ادامه بده.'}`
          : userPrompt || 'سلام! یک جمله کوتاه بنویس.'
        const model = (d.model as string) || 'gpt-4o'
        const result = await runTextNode(ctx.apiKey, model, prompt)
        ctx.results.set(id, result)
        ctx.onNodeUpdate(id, { status: 'success' as NodeStatus, result })
        break
      }

      case 'merge': {
        const upstream = collectUpstreamText(id, predecessors, ctx.results)
        const result = upstream || '(ورودی خالی)'
        ctx.results.set(id, result)
        ctx.onNodeUpdate(id, { status: 'success' as NodeStatus, result })
        break
      }

      case 'conditional': {
        const upstream = collectUpstreamText(id, predecessors, ctx.results)
        const condition = (d.condition as string) || 'بله'
        const passed = upstream.includes(condition) || upstream.toLowerCase().includes('yes')
        const result = passed ? `TRUE: ${upstream}` : `FALSE: ${upstream}`
        ctx.results.set(id, result)
        ctx.onNodeUpdate(id, {
          status: 'success' as NodeStatus,
          result,
          branch: passed ? 'true' : 'false',
        })
        break
      }

      case 'loop': {
        const iterations = Number(d.iterations) || 3
        const upstream = collectUpstreamText(id, predecessors, ctx.results)
        let acc = upstream
        for (let i = 1; i <= iterations; i++) {
          ctx.onNodeUpdate(id, {
            status: 'running' as NodeStatus,
            currentIteration: i,
          })
          // lightweight local iteration marker (no extra API spam by default)
          acc = acc
            ? `${acc}\n[دور ${i}/${iterations}]`
            : `[دور ${i}/${iterations}]`
        }
        ctx.results.set(id, acc)
        ctx.onNodeUpdate(id, {
          status: 'success' as NodeStatus,
          result: acc,
          currentIteration: iterations,
        })
        break
      }

      case 'memory': {
        const upstream = collectUpstreamText(id, predecessors, ctx.results)
        const key = (d.label as string) || id
        ctx.results.set(id, upstream)
        ctx.onNodeUpdate(id, {
          status: 'success' as NodeStatus,
          result: upstream,
          keys: upstream ? [key] : [],
        })
        break
      }

      case 'file': {
        const upstream = collectUpstreamText(id, predecessors, ctx.results)
        const fileName = (d.fileName as string) || 'output.txt'
        ctx.results.set(id, upstream)
        ctx.onNodeUpdate(id, {
          status: 'success' as NodeStatus,
          result: upstream,
          fileName,
        })
        break
      }

      case 'image':
      case 'video': {
        // Placeholder until media endpoints are fully wired
        const upstream = collectUpstreamText(id, predecessors, ctx.results)
        const placeholder =
          type === 'image'
            ? `[تصویر] پرامپت: ${upstream.slice(0, 120) || '(خالی)'}`
            : `[ویدیو] پرامپت: ${upstream.slice(0, 120) || '(خالی)'}`
        ctx.results.set(id, placeholder)
        ctx.onNodeUpdate(id, {
          status: 'success' as NodeStatus,
          result: placeholder,
        })
        break
      }

      default: {
        ctx.onNodeUpdate(id, {
          status: 'success' as NodeStatus,
          result: collectUpstreamText(id, predecessors, ctx.results),
        })
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    ctx.onNodeUpdate(id, { status: 'error' as NodeStatus, error: message })
    // Do not rethrow — allow other parallel nodes in the wave to finish
  }
}

/**
 * Execute the full graph in parallel waves.
 * Returns final results map.
 */
export async function executeGraph(
  nodes: Node[],
  edges: Edge[],
  ctx: ExecutionContext
): Promise<Map<string, string>> {
  if (!nodes.length) return ctx.results

  const { adjacency, inDegree, predecessors, nodeIds } = buildGraph(nodes, edges)
  const order = topologicalSort(nodeIds, adjacency, inDegree)
  const waves = buildExecutionWaves(order, predecessors)
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))

  // Reset all to empty before run
  for (const id of nodeIds) {
    ctx.onNodeUpdate(id, { status: 'empty' as NodeStatus, error: undefined })
  }

  for (const wave of waves) {
    await Promise.all(
      wave.map((id) => {
        const node = nodeMap.get(id)
        if (!node) return Promise.resolve()
        return executeSingleNode(node, ctx, predecessors)
      })
    )
  }

  return ctx.results
}
