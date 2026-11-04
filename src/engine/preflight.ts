import type { GEdge, GNode, PreflightIssue, ExecSettings } from '../domain/types'
import { portsOf } from '../domain/types'
import { resolveLlmApiKey, loadConnectorStates, isUsable } from '../services/connectors'

export function preflight(nodes: GNode[], edges: GEdge[], settings: ExecSettings): PreflightIssue[] {
  const issues: PreflightIssue[] = []
  if (!nodes.length) {
    issues.push({ level: 'blocker', message: 'گراف خالی است.', fix: 'گره اضافه کنید یا از الگوی مدار شروع کنید.' })
    return issues
  }

  for (const e of edges) {
    if (!e.valid) {
      issues.push({
        level: 'blocker',
        message: e.reason || 'اتصال نامعتبر',
        edgeId: e.id,
        fix: 'اتصال را حذف یا اصلاح کنید.',
      })
    }
  }

  for (const n of nodes) {
    if (n.data.kind === 'prompt' && !n.data.prompt.trim()) {
      issues.push({
        level: 'blocker',
        message: `«${n.data.title}» پرامپت خالی دارد.`,
        nodeId: n.id,
        fix: 'در پنل راست متن بنویسید.',
      })
    }
    const requiredIns = portsOf(n.data.kind).filter((p) => p.direction === 'in' && p.required)
    for (const p of requiredIns) {
      const hasEdge = edges.some((e) => e.target === n.id && e.valid && (!e.targetHandle || e.targetHandle === p.id))
      const hasLocal = !!n.data.prompt.trim()
      if (!hasEdge && !hasLocal) {
        issues.push({
          level: 'blocker',
          message: `«${n.data.title}» ورودی «${p.label}» ندارد.`,
          nodeId: n.id,
          fix: 'اتصال بکشید یا پرامپت محلی بگذارید.',
        })
      }
    }
  }

  // cycle
  const indeg: Record<string, number> = {}
  const adj: Record<string, string[]> = {}
  nodes.forEach((n) => {
    indeg[n.id] = 0
    adj[n.id] = []
  })
  edges.filter((e) => e.valid).forEach((e) => {
    if (indeg[e.target] != null) {
      indeg[e.target]++
      adj[e.source]?.push(e.target)
    }
  })
  const q = nodes.filter((n) => indeg[n.id] === 0).map((n) => n.id)
  let seen = 0
  while (q.length) {
    const u = q.shift()!
    seen++
    for (const v of adj[u] || []) {
      indeg[v]--
      if (indeg[v] === 0) q.push(v)
    }
  }
  if (seen !== nodes.length) {
    issues.push({ level: 'blocker', message: 'چرخه در گراف وجود دارد.', fix: 'یک یال را حذف کنید.' })
  }

  if (!settings.parallel) {
    issues.push({ level: 'warning', message: 'اجرا ترتیبی است؛ ممکن است کندتر باشد.' })
  }

  for (const n of nodes) {
    if (n.data.kind === 'figma' && !isUsable('figma')) {
      issues.push({
        level: 'blocker',
        message: `«${n.data.title}» نیاز به اتصال Figma دارد.`,
        nodeId: n.id,
        fix: 'از افزونه‌ها Figma را با OAuth وصل کنید.',
      })
    }
  }


  for (const n of nodes) {
    if (n.data.kind === 'loop') {
      const m = n.data.config?.maxIterations ?? 3
      if (m > 5) {
        issues.push({
          level: 'blocker',
          message: `«${n.data.title}» بیش از ۵ دور است.`,
          nodeId: n.id,
          fix: 'حداکثر دور را روی ۵ یا کمتر بگذارید.',
        })
      } else if (m > 3) {
        issues.push({
          level: 'warning',
          message: `«${n.data.title}» ${m} دور اجرا می‌شود و هزینه/زمان بیشتر می‌شود.`,
          nodeId: n.id,
        })
      }
    }
  }


  const needsLlm = nodes.some((n) => ['text', 'code', 'image'].includes(n.data.kind))
  if (needsLlm) {
    const { key, provider } = resolveLlmApiKey()
    if (!key) {
      issues.push({
        level: 'warning',
        message: 'هیچ اتصال LLM معتبری نیست؛ خروجی نمونهٔ محلی ساخته می‌شود.',
        fix: 'از افزونه‌ها GapGPT/OpenAI را با کلید خود وصل کنید.',
      })
    } else if (provider && provider !== 'legacy') {
      const st = loadConnectorStates().find((s) => s.id === provider)
      if (st?.status === 'expired') {
        issues.push({
          level: 'blocker',
          message: `اتصال ${provider} منقضی است.`,
          fix: 'دوباره وصل کنید.',
        })
      }
    }
  }

  const expired = loadConnectorStates().filter((s) => s.status === 'expired')
  for (const s of expired) {
    issues.push({
      level: 'warning',
      message: `اتصال ${s.id} منقضی شده.`,
      fix: 'از مرکز افزونه‌ها تمدید/وصل مجدد کنید.',
    })
  }

  return issues
}

export const canRun = (issues: PreflightIssue[]) => !issues.some((i) => i.level === 'blocker')
