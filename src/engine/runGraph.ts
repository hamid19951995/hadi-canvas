import type { GEdge, GNode, NodeStatus } from '../domain/types'

export type ExecFn = (
  node: GNode,
  inputText: string,
  apiKey: string,
  ctx: { memory: Record<string, string>; branch?: string }
) => Promise<{ result: string; branch?: 'true' | 'false'; memoryPatch?: Record<string, string> }>

function waves(nodes: GNode[], edges: GEdge[]): string[][] {
  const ids = nodes.map((n) => n.id)
  const indeg: Record<string, number> = Object.fromEntries(ids.map((i) => [i, 0]))
  const adj: Record<string, string[]> = Object.fromEntries(ids.map((i) => [i, []]))
  for (const e of edges) {
    if (!e.valid) continue
    indeg[e.target]++
    adj[e.source].push(e.target)
  }
  let ready = ids.filter((id) => indeg[id] === 0)
  const out: string[][] = []
  const seen = new Set<string>()
  while (ready.length) {
    out.push([...ready])
    ready.forEach((id) => seen.add(id))
    const next: string[] = []
    for (const u of out[out.length - 1]) {
      for (const v of adj[u]) {
        indeg[v]--
        if (indeg[v] === 0 && !seen.has(v)) next.push(v)
      }
    }
    ready = next
  }
  if (seen.size !== ids.length) throw new Error('چرخه یا گره معلق')
  return out
}

export async function runGraph(opts: {
  nodes: GNode[]
  edges: GEdge[]
  parallel: boolean
  apiKey: string
  memory: Record<string, string>
  execute: ExecFn
  onStatus: (id: string, status: NodeStatus, patch?: { result?: string; error?: string }) => void
  onMemory: (mem: Record<string, string>) => void
  cancelled: () => boolean
}) {
  const { nodes, edges, parallel, apiKey, execute, onStatus, onMemory, cancelled } = opts
  let memory = { ...opts.memory }
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]))
  const results: Record<string, string> = {}
  const branchTaken: Record<string, 'true' | 'false'> = {}
  const validEdges = edges.filter((e) => e.valid)
  const skipped = new Set<string>()

  for (const wave of waves(nodes, validEdges)) {
    if (cancelled()) break
    const tasks = wave.map(async (id) => {
      if (cancelled()) return
      // skip if all incoming edges from condition false-path
      const incomingEdges = validEdges.filter((e) => e.target === id)
      if (incomingEdges.length) {
        const active = incomingEdges.filter((e) => {
          if (skipped.has(e.source)) return false
          const br = branchTaken[e.source]
          if (!br) return true
          // condition node: only follow matching handle
          if (e.sourceHandle === 'true' && br !== 'true') return false
          if (e.sourceHandle === 'false' && br !== 'false') return false
          return true
        })
        if (active.length === 0) {
          skipped.add(id)
          onStatus(id, 'skipped', { result: '(مسیر شرط رد شد)' })
          return
        }
      }

      const incoming = validEdges
        .filter((e) => e.target === id && !skipped.has(e.source))
        .filter((e) => {
          const br = branchTaken[e.source]
          if (!br) return true
          if (e.sourceHandle === 'true' && br !== 'true') return false
          if (e.sourceHandle === 'false' && br !== 'false') return false
          return true
        })
        .map((e) => results[e.source])
        .filter(Boolean)
      const inputText = incoming.join('\n\n')
      onStatus(id, 'running')
      try {
        const out = await execute(byId[id], inputText, apiKey, { memory })
        results[id] = out.result
        if (out.branch) branchTaken[id] = out.branch
        if (out.memoryPatch) {
          memory = { ...memory, ...out.memoryPatch }
          onMemory(memory)
        }
        onStatus(id, 'success', { result: out.result })
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        onStatus(id, 'error', { error: msg })
      }
    })
    if (parallel) await Promise.all(tasks)
    else for (const t of tasks) await t
  }
}
