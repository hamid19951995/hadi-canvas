import { create } from 'zustand'
import type { GEdge, GNode, NodeKind, NodeStatus, PreflightIssue, Project } from '../domain/types'
import { compatible, portsOf } from '../domain/types'
import { preflight, canRun } from '../engine/preflight'
import { runGraph } from '../engine/runGraph'
import { chatComplete } from '../services/llm'
import { resolveLlmApiKey, isUsable } from '../services/connectors'
import { fetchFigmaFrameImages, parseFigmaFileKey } from '../services/figmaApi'
import { buildTemplate } from '../templates/catalog'
import {
  deleteUserTemplate,
  loadUserTemplates,
  projectFromUserTemplate,
  saveUserTemplate,
  type UserTemplate,
} from '../services/userTemplates'
import { parseTemplateFile, templateFileToUserTemplateShape } from '../services/templateShare'
import { parseProjectFile } from '../services/projectShare'
import { getApiKey, getVersion, loadProjects, loadRuns, loadVersions, removeProject, saveRun, saveVersion, setApiKey, uid, upsertProject, type GraphVersion, type RunRecord } from '../services/storage'

function label(kind: NodeKind) {
  const m: Record<NodeKind, string> = {
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
  return m[kind]
}

function makeNode(kind: NodeKind, pos: { x: number; y: number }, title?: string): GNode {
  const config =
    kind === 'loop'
      ? { maxIterations: 3 }
      : kind === 'memory'
        ? { memoryKey: 'default' }
        : kind === 'condition'
          ? { conditionHint: 'اگر متن شامل «بله» یا yes باشد درست است' }
          : undefined
  return {
    id: uid('n'),
    type: kind,
    position: pos,
    data: {
      title: title || label(kind),
      kind,
      prompt: kind === 'condition' ? 'شامل بله؟' : kind === 'agent' ? 'هدف را خلاصه و قدم‌ها را پیشنهاد بده' : '',
      model: 'gpt-4o-mini',
      status: 'idle',
      config,
    },
  }
}

function wire(a: GNode, b: GNode): GEdge {
  const out = portsOf(a.data.kind).find((p) => p.direction === 'out')
  const inn = portsOf(b.data.kind).find((p) => p.direction === 'in')
  const from = out?.dataType || 'any'
  const to = inn?.dataType || 'any'
  const ok = compatible(from, to)
  return {
    id: uid('e'),
    source: a.id,
    target: b.id,
    sourceHandle: out?.id,
    targetHandle: inn?.id,
    valid: ok,
    reason: ok ? undefined : `نوع ${from} با ${to} سازگار نیست`,
  }
}

type State = {
  screen: 'projects' | 'studio'
  projects: Project[]
  project: Project | null
  selectedId: string | null
  selectedIds: string[]
  apiKey: string
  issues: PreflightIssue[]
  preflightOpen: boolean
  running: boolean
  cancel: boolean
  tab: 'canvas' | 'plugins' | 'settings' | 'output' | 'history' | 'compare'
  runs: RunRecord[]
  versions: GraphVersion[]

  refresh: () => void
  createProject: (name: string) => void
  openProject: (id: string) => void
  deleteProject: (id: string) => void
  loadCircuitTemplate: () => void
  loadTemplate: (templateId: string) => void
  userTemplates: UserTemplate[]
  refreshUserTemplates: () => void
  saveAsUserTemplate: (name: string, description?: string) => string | null
  loadUserTemplate: (id: string) => void
  removeUserTemplate: (id: string) => void
  importTemplateJson: (raw: string) => string | null
  applyFigmaFrames: (nodeId: string, frameIds: string[]) => Promise<void>
  importProjectJson: (raw: string) => string | null
  lastSavedAt: string | null
  undoStack: Project[]
  redoStack: Project[]
  pushUndo: () => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  removeEdges: (ids: string[]) => void
  goProjects: () => void

  setNodes: (nodes: GNode[]) => void
  setEdges: (edges: GEdge[]) => void
  addNode: (kind: NodeKind, pos?: { x: number; y: number }) => void
  updateNode: (id: string, patch: Partial<GNode['data']> & { position?: GNode['position'] }) => void
  removeSelected: () => void
  select: (id: string | null, multi?: boolean) => void
  clearSelection: () => void
  groupSelected: (label?: string) => void
  ungroupSelected: () => void
  selectGroup: (groupId: string) => void
  searchGraph: (q: string) => { id: string; title: string; hit: string }[]
  connect: (source: string, target: string, sourceHandle?: string | null, targetHandle?: string | null) => string | null
  persist: () => void

  setApiKey: (k: string) => void
  setTab: (t: State['tab']) => void
  openPreflight: () => void
  closePreflight: () => void
  confirmRun: () => Promise<void>
  requestCancel: () => void
  setModels: (models: { id: string; count: number }[]) => void
  setParallel: (v: boolean) => void
  refreshRuns: () => void
  retryNode: (nodeId: string) => Promise<void>
  refreshVersions: () => void
  snapshotVersion: (label?: string, note?: string) => void
  restoreVersion: (versionId: string) => string | null
  duplicateNode: (id: string) => void
  focusNodeId: string | null
  setFocusNodeId: (id: string | null) => void
}

function touch(p: Project): Project {
  return { ...p, updatedAt: new Date().toISOString() }
}

export const useStore = create<State>((set, get) => ({
  screen: 'projects',
  projects: loadProjects(),
  project: null,
  selectedId: null,
  selectedIds: [],
  apiKey: getApiKey(),
  issues: [],
  preflightOpen: false,
  running: false,
  cancel: false,
  tab: 'canvas',
  runs: [],
  versions: [],
  focusNodeId: null,
  userTemplates: [],
  lastSavedAt: null,
  undoStack: [],
  redoStack: [],

  refresh: () => set({ projects: loadProjects() }),

  createProject: (name) => {
    const p: Project = {
      id: uid('p'),
      name: name.trim() || 'پروژه بدون نام',
      updatedAt: new Date().toISOString(),
      nodes: [],
      edges: [],
      settings: { parallel: true, models: [{ id: 'gpt-4o-mini', count: 1 }] },
    }
    upsertProject(p)
    set({ project: p, screen: 'studio', tab: 'canvas', selectedId: null, selectedIds: [], projects: loadProjects() })
  },

  openProject: (id) => {
    const p = loadProjects().find((x) => x.id === id)
    if (!p) return
    set({ project: p, screen: 'studio', tab: 'canvas', selectedId: null, selectedIds: [], undoStack: [], redoStack: [] })
  },

  deleteProject: (id) => {
    removeProject(id)
    const cur = get().project
    set({
      projects: loadProjects(),
      project: cur?.id === id ? null : cur,
      screen: cur?.id === id ? 'projects' : get().screen,
    })
  },

  loadCircuitTemplate: () => {
    get().loadTemplate('circuit')
  },


  refreshUserTemplates: () => set({ userTemplates: loadUserTemplates() }),

  saveAsUserTemplate: (name, description) => {
    const project = get().project
    if (!project) return 'پروژه باز نیست'
    if (!project.nodes.length) return 'گراف خالی است'
    saveUserTemplate({
      name,
      description,
      nodes: project.nodes,
      edges: project.edges,
      settings: project.settings,
    })
    set({ userTemplates: loadUserTemplates() })
    return null
  },

  loadUserTemplate: (id) => {
    const tpl = loadUserTemplates().find((t) => t.id === id)
    if (!tpl) return
    const p = projectFromUserTemplate(tpl)
    upsertProject(p)
    set({ project: p, screen: 'studio', tab: 'canvas', selectedId: null, selectedIds: [], projects: loadProjects() })
  },

  removeUserTemplate: (id) => {
    deleteUserTemplate(id)
    set({ userTemplates: loadUserTemplates() })
  },


  applyFigmaFrames: async (nodeId, frameIds) => {
    const project = get().project
    if (!project) return
    const node = project.nodes.find((n) => n.id === nodeId)
    if (!node || node.data.kind !== 'figma') return
    const basePrompt = (node.data.config?.figmaFileKey || node.data.prompt || '').replace(/nodes?:\s*[0-9: ,-]+/gi, '').trim()
    const prompt = frameIds.length
      ? `${basePrompt}\nnodes: ${frameIds.join(',')}`
      : basePrompt
    get().updateNode(nodeId, {
      prompt,
      config: { ...node.data.config, figmaFileKey: node.data.config?.figmaFileKey || basePrompt },
      status: 'idle',
      error: undefined,
    })
    await get().retryNode(nodeId)
  },


  importProjectJson: (raw) => {
    const parsed = parseProjectFile(raw)
    if (!parsed.ok) return parsed.error
    upsertProject(parsed.project)
    set({
      project: parsed.project,
      screen: 'studio',
      tab: 'canvas',
      selectedId: null,
      projects: loadProjects(),
      lastSavedAt: new Date().toISOString(),
    })
    return null
  },

  importTemplateJson: (raw) => {
    const parsed = parseTemplateFile(raw)
    if (!parsed.ok) return parsed.error
    const shape = templateFileToUserTemplateShape(parsed.file)
    saveUserTemplate({
      name: shape.name,
      description: shape.description,
      nodes: shape.nodes,
      edges: shape.edges,
      settings: shape.settings,
    })
    set({ userTemplates: loadUserTemplates() })
    return null
  },

  loadTemplate: (templateId) => {
    const p = buildTemplate(templateId)
    if (!p) return
    upsertProject(p)
    set({ project: p, screen: 'studio', tab: 'canvas', selectedId: null, selectedIds: [], projects: loadProjects() })
  },

  goProjects: () => {
    get().persist()
    set({ screen: 'projects', project: null, projects: loadProjects() })
  },

  setNodes: (nodes) => {
    const project = get().project
    if (!project) return
    const next = touch({ ...project, nodes })
    upsertProject(next)
    set({ project: next, lastSavedAt: next.updatedAt })
  },

  setEdges: (edges) => {
    const project = get().project
    if (!project) return
    const next = touch({ ...project, edges })
    upsertProject(next)
    set({ project: next, lastSavedAt: next.updatedAt })
  },

  addNode: (kind, pos) => {
    const project = get().project
    if (!project) return
    const node = makeNode(kind, pos || { x: 240 + Math.random() * 80, y: 120 + Math.random() * 80 })
    const next = touch({ ...project, nodes: [...project.nodes, node] })
    upsertProject(next)
    set({ project: next, selectedId: node.id })
  },

  updateNode: (id, patch) => {
    const project = get().project
    if (!project) return
    const nodes = project.nodes.map((n) => {
      if (n.id !== id) return n
      const { position, ...dataPatch } = patch
      return {
        ...n,
        position: position || n.position,
        data: { ...n.data, ...dataPatch },
      }
    })
    const next = touch({ ...project, nodes })
    upsertProject(next)
    set({ project: next, lastSavedAt: next.updatedAt })
  },


  pushUndo: () => {
    const p = get().project
    if (!p) return
    const snap = JSON.parse(JSON.stringify(p)) as Project
    const stack = [...get().undoStack, snap].slice(-30)
    set({ undoStack: stack, redoStack: [] })
  },

  canUndo: () => get().undoStack.length > 0,
  canRedo: () => get().redoStack.length > 0,

  undo: () => {
    const stack = get().undoStack
    const cur = get().project
    if (!stack.length || !cur) return
    const prev = stack[stack.length - 1]
    const newUndo = stack.slice(0, -1)
    const redo = [...get().redoStack, JSON.parse(JSON.stringify(cur)) as Project].slice(-30)
    upsertProject(prev)
    set({
      project: prev,
      undoStack: newUndo,
      redoStack: redo,
      lastSavedAt: prev.updatedAt,
      selectedId: null,
    })
  },

  redo: () => {
    const stack = get().redoStack
    const cur = get().project
    if (!stack.length || !cur) return
    const next = stack[stack.length - 1]
    const newRedo = stack.slice(0, -1)
    const undo = [...get().undoStack, JSON.parse(JSON.stringify(cur)) as Project].slice(-30)
    upsertProject(next)
    set({
      project: next,
      undoStack: undo,
      redoStack: newRedo,
      lastSavedAt: next.updatedAt,
      selectedId: null,
    })
  },

  removeEdges: (ids) => {
    const project = get().project
    if (!project || !ids.length) return
    get().pushUndo()
    const idset = new Set(ids)
    const edges = project.edges.filter((e) => !idset.has(e.id))
    const next = touch({ ...project, edges })
    upsertProject(next)
    set({ project: next, lastSavedAt: next.updatedAt })
  },

  removeSelected: () => {
    const { project, selectedId, selectedIds } = get()
    if (!project) return
    const ids = selectedIds.length ? selectedIds : selectedId ? [selectedId] : []
    if (!ids.length) return
    const running = project.nodes.some((n) => ids.includes(n.id) && n.data.status === 'running')
    if (running) {
      alert('یکی از گره‌ها در حال اجراست. ابتدا لغو کنید.')
      return
    }
    const outCount = project.edges.filter((e) => ids.includes(e.source)).length
    if (outCount > 0 && !confirm(`${ids.length} گره با ${outCount} اتصال خروجی حذف شود؟`)) return
    get().pushUndo()
    const idset = new Set(ids)
    const nodes = project.nodes.filter((n) => !idset.has(n.id))
    const edges = project.edges.filter((e) => !idset.has(e.source) && !idset.has(e.target))
    const next = touch({ ...project, nodes, edges })
    upsertProject(next)
    set({ project: next, selectedId: null, selectedIds: [], lastSavedAt: next.updatedAt })
  },

  select: (id, multi = false) => {
    if (!multi) {
      set({ selectedId: id, selectedIds: id ? [id] : [] })
      return
    }
    if (!id) return
    const cur = get().selectedIds
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
    set({ selectedId: next[next.length - 1] || null, selectedIds: next })
  },

  clearSelection: () => set({ selectedId: null, selectedIds: [] }),

  groupSelected: (label?: string) => {
    const { project, selectedIds } = get()
    if (!project || selectedIds.length < 2) {
      alert('حداقل دو گره انتخاب کنید (Shift+کلیک)')
      return
    }
    get().pushUndo()
    const gid = uid('g')
    const glabel = (label || '').trim() || `گروه ${selectedIds.length}`
    const nodes = project.nodes.map((n) =>
      selectedIds.includes(n.id) ? { ...n, groupId: gid, groupLabel: glabel } : n,
    )
    const next = touch({ ...project, nodes })
    upsertProject(next)
    set({ project: next, lastSavedAt: next.updatedAt })
  },

  ungroupSelected: () => {
    const { project, selectedIds, selectedId } = get()
    if (!project) return
    const ids = selectedIds.length ? selectedIds : selectedId ? [selectedId] : []
    if (!ids.length) return
    const groupIds = new Set(
      project.nodes.filter((n) => ids.includes(n.id) && n.groupId).map((n) => n.groupId as string),
    )
    if (!groupIds.size) {
      alert('گره انتخاب‌شده در گروهی نیست')
      return
    }
    get().pushUndo()
    const nodes = project.nodes.map((n) =>
      n.groupId && groupIds.has(n.groupId) ? { ...n, groupId: undefined, groupLabel: undefined } : n,
    )
    const next = touch({ ...project, nodes })
    upsertProject(next)
    set({ project: next, lastSavedAt: next.updatedAt })
  },

  selectGroup: (groupId: string) => {
    const project = get().project
    if (!project || !groupId) return
    const ids = project.nodes.filter((n) => n.groupId === groupId).map((n) => n.id)
    set({ selectedIds: ids, selectedId: ids[0] || null })
  },

  searchGraph: (q: string) => {
    const project = get().project
    if (!project) return [] as { id: string; title: string; hit: string }[]
    const s = q.trim().toLowerCase()
    if (!s) return []
    const out: { id: string; title: string; hit: string }[] = []
    for (const n of project.nodes) {
      const fields = [n.data.title, n.data.kind, n.data.prompt, n.data.result || '', n.groupLabel || '']
      const joined = fields.join('\n')
      if (!joined.toLowerCase().includes(s)) continue
      let hit = n.data.title
      if ((n.data.result || '').toLowerCase().includes(s)) {
        const r = n.data.result || ''
        const i = r.toLowerCase().indexOf(s)
        hit = r.slice(Math.max(0, i - 20), i + s.length + 40).replace(/\s+/g, ' ')
      } else if ((n.data.prompt || '').toLowerCase().includes(s)) {
        hit = `پرامپت: ${n.data.prompt.slice(0, 60)}`
      } else if ((n.groupLabel || '').toLowerCase().includes(s)) {
        hit = `گروه: ${n.groupLabel}`
      }
      out.push({ id: n.id, title: n.data.title, hit })
    }
    return out
  },


  connect: (source, target, sourceHandle, targetHandle) => {
    const project = get().project
    if (!project) return 'پروژه باز نیست'
    if (source === target) return 'اتصال به خود مجاز نیست'
    const a = project.nodes.find((n) => n.id === source)
    const b = project.nodes.find((n) => n.id === target)
    if (!a || !b) return 'گره پیدا نشد'
    const out =
      portsOf(a.data.kind).find((p) => p.direction === 'out' && (!sourceHandle || p.id === sourceHandle)) ||
      portsOf(a.data.kind).find((p) => p.direction === 'out')
    const inn =
      portsOf(b.data.kind).find((p) => p.direction === 'in' && (!targetHandle || p.id === targetHandle)) ||
      portsOf(b.data.kind).find((p) => p.direction === 'in')
    const from = out?.dataType || 'any'
    const to = inn?.dataType || 'any'
    const ok = compatible(from, to)
    const edge: GEdge = {
      id: uid('e'),
      source,
      target,
      sourceHandle: out?.id ?? sourceHandle,
      targetHandle: inn?.id ?? targetHandle,
      valid: ok,
      reason: ok ? undefined : `نوع «${from}» به «${to}» سازگار نیست`,
    }
    get().pushUndo()
    const next = touch({ ...project, edges: [...project.edges, edge] })
    upsertProject(next)
    set({ project: next, lastSavedAt: next.updatedAt })
    return ok ? null : edge.reason || 'نامعتبر'
  },

  persist: () => {
    const p = get().project
    if (p) upsertProject(p)
  },

  setApiKey: (k) => {
    setApiKey(k)
    set({ apiKey: k })
  },

  setTab: (tab) => set({ tab }),

  openPreflight: () => {
    const project = get().project
    if (!project) return
    const issues = preflight(project.nodes, project.edges, project.settings)
    set({ issues, preflightOpen: true })
  },

  closePreflight: () => set({ preflightOpen: false }),

  requestCancel: () => set({ cancel: true }),

  setModels: (models) => {
    const project = get().project
    if (!project) return
    const next = touch({ ...project, settings: { ...project.settings, models } })
    upsertProject(next)
    set({ project: next, lastSavedAt: next.updatedAt })
  },

  setParallel: (v) => {
    const project = get().project
    if (!project) return
    const next = touch({ ...project, settings: { ...project.settings, parallel: v } })
    upsertProject(next)
    set({ project: next, lastSavedAt: next.updatedAt })
  },

  refreshRuns: () => {
    const id = get().project?.id
    set({ runs: loadRuns(id) })
  },

  retryNode: async (nodeId) => {
    const project = get().project
    if (!project || get().running) return
    const node = project.nodes.find((n) => n.id === nodeId)
    if (!node) return
    set({ running: true, cancel: false })
    get().updateNode(nodeId, { status: 'running', error: undefined })
    const incoming = project.edges
      .filter((e) => e.target === nodeId && e.valid)
      .map((e) => project.nodes.find((n) => n.id === e.source)?.data.result)
      .filter(Boolean)
      .join('\n\n')
    try {
      const key = resolveLlmApiKey().key || get().apiKey
      let result = ''
      if (node.data.kind === 'prompt') result = node.data.prompt
      else if (node.data.kind === 'merge' || node.data.kind === 'final') result = incoming || node.data.prompt || '(خالی)'
      else {
        const prompt = [node.data.prompt, incoming].filter(Boolean).join('\n\n')
        result = await chatComplete(key, node.data.model, prompt)
      }
      get().updateNode(nodeId, { status: 'success', result })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      get().updateNode(nodeId, { status: 'error', error: msg })
    }
    set({ running: false })
  },


  refreshVersions: () => {
    const id = get().project?.id
    set({ versions: loadVersions(id) })
  },

  snapshotVersion: (label, note) => {
    const project = get().project
    if (!project) return
    saveVersion({
      id: uid('ver'),
      projectId: project.id,
      label: label || `نسخه ${new Date().toLocaleString('fa-IR')}`,
      createdAt: new Date().toISOString(),
      nodes: JSON.parse(JSON.stringify(project.nodes)),
      edges: JSON.parse(JSON.stringify(project.edges)),
      settings: JSON.parse(JSON.stringify(project.settings)),
      note,
    })
    set({ versions: loadVersions(project.id) })
  },

  restoreVersion: (versionId) => {
    const project = get().project
    if (!project) return 'پروژه باز نیست'
    const v = getVersion(versionId)
    if (!v || v.projectId !== project.id) return 'نسخه پیدا نشد'
    if (!confirm('بازنشانی نسخه، وضعیت فعلی بوم را عوض می‌کند. ادامه؟')) return 'لغو شد'
    const next = {
      ...project,
      nodes: JSON.parse(JSON.stringify(v.nodes)),
      edges: JSON.parse(JSON.stringify(v.edges)),
      settings: { ...project.settings, ...(v.settings as object) },
      updatedAt: new Date().toISOString(),
    }
    upsertProject(next as typeof project)
    set({ project: next as typeof project, selectedId: null, versions: loadVersions(project.id) })
    return null
  },


  setFocusNodeId: (id) => set({ focusNodeId: id }),

  duplicateNode: (id) => {
    const project = get().project
    if (!project) return
    const src = project.nodes.find((n) => n.id === id)
    if (!src) return
    get().pushUndo()
    const copy = {
      ...JSON.parse(JSON.stringify(src)),
      id: uid('n'),
      position: { x: src.position.x + 40, y: src.position.y + 40 },
      data: {
        ...JSON.parse(JSON.stringify(src.data)),
        title: src.data.title + ' (کپی)',
        status: 'idle' as const,
        result: undefined,
        error: undefined,
      },
    }
    const next = touch({ ...project, nodes: [...project.nodes, copy] })
    upsertProject(next)
    set({ project: next, selectedId: copy.id, lastSavedAt: next.updatedAt })
  },

  confirmRun: async () => {
    const project = get().project
    if (!project || get().running) return
    const issues = preflight(project.nodes, project.edges, project.settings)
    set({ issues })
    if (!canRun(issues)) return

    set({ running: true, cancel: false, preflightOpen: false })
    const resolved = resolveLlmApiKey()
    const apiKey = resolved.key || get().apiKey

    await runGraph({
      nodes: project.nodes,
      edges: project.edges,
      parallel: project.settings.parallel,
      apiKey,
      memory: { ...(project.settings.memory || {}) },
      cancelled: () => get().cancel,
      onStatus: (id, status, patch) => {
        get().updateNode(id, { status, result: patch?.result, error: patch?.error })
      },
      onMemory: (mem) => {
        const proj = get().project
        if (!proj) return
        const next = { ...proj, settings: { ...proj.settings, memory: mem }, updatedAt: new Date().toISOString() }
        upsertProject(next)
        set({ project: next })
      },
      execute: async (node, inputText, key, ctx) => {
        const kind = node.data.kind
        if (kind === 'prompt') {
          return { result: node.data.prompt }
        }
        if (kind === 'merge' || kind === 'final') {
          return { result: inputText || node.data.prompt || '(خالی)' }
        }
        if (kind === 'condition') {
          const text = (inputText || node.data.prompt || '').toLowerCase()
          const hint = (node.data.config?.conditionHint || node.data.prompt || '').toLowerCase()
          // Simple honest rule: true if input contains yes/بله/true/1
          const ok = /\b(yes|true|1|بله|آره|درست)\b/i.test(text) || (hint && text.includes('بله'))
          const branch = ok ? 'true' as const : 'false' as const
          return {
            result: ok ? `شرط برقرار (true)\n${inputText}` : `شرط برقرار نیست (false)\n${inputText}`,
            branch,
          }
        }
        if (kind === 'loop') {
          const max = Math.min(node.data.config?.maxIterations ?? 3, 5)
          let acc = inputText || node.data.prompt || ''
          for (let i = 0; i < max; i++) {
            if (get().cancel) break
            const step = await chatComplete(
              key,
              node.data.model,
              `دور ${i + 1} از ${max}. ورودی را یک قدم بهبود بده و کوتاه برگردان:\n${acc}`
            )
            acc = step
          }
          return { result: `[حلقه ${max} دور]\n${acc}` }
        }
        if (kind === 'memory') {
          const k = node.data.config?.memoryKey || 'default'
          if (inputText.trim()) {
            return {
              result: inputText,
              memoryPatch: { [k]: inputText },
            }
          }
          const stored = ctx.memory[k] || '(خالی)'
          return { result: stored }
        }
        if (kind === 'agent') {
          const goal = [node.data.prompt, inputText].filter(Boolean).join('\n')
          const text = await chatComplete(
            key,
            node.data.model,
            `تو یک ایجنت برنامه‌ریز هستی. هدف:\n${goal}\n\n1) خلاصه هدف\n2) سه قدم پیشنهادی\n3) ریسک‌ها\nکوتاه و عملی بنویس.`
          )
          return { result: text }
        }
        if (kind === 'figma') {
          if (!isUsable('figma')) {
            throw new Error('Figma متصل نیست')
          }
          const raw = [node.data.config?.figmaFileKey, node.data.prompt, inputText].filter(Boolean).join('\n')
          const key = parseFigmaFileKey(raw) || parseFigmaFileKey(inputText || '') || parseFigmaFileKey(node.data.prompt || '')
          if (!key) {
            throw new Error('کلید فایل Figma یا لینک design/file را در پرامپت بگذارید')
          }
          // optional: node ids comma-separated in prompt line "nodes: 1:2,1:3"
          const nodeMatch = raw.match(/nodes?:\s*([0-9: ,-]+)/i)
          const nodeIds = nodeMatch
            ? nodeMatch[1].split(/[,\s]+/).map((s) => s.trim()).filter(Boolean)
            : undefined
          const { summary } = await fetchFigmaFrameImages(key, { nodeIds, limit: 6, scale: 1 })
          return { result: summary }
        }
        if (kind === 'image') {
          const prompt = [node.data.prompt, inputText].filter(Boolean).join('\n')
          const text = await chatComplete(key, node.data.model, `شرح تصویر بساز:\n${prompt}`)
          return { result: text }
        }
        const prompt = [node.data.prompt, inputText].filter(Boolean).join('\n\n')
        const text = await chatComplete(key, node.data.model, prompt)
        return { result: text }
      },
    })

    const proj = get().project
    if (proj) {
      const statuses = proj.nodes.map((n) => n.data.status)
      let status: RunRecord['status'] = 'success'
      if (get().cancel) status = 'cancelled'
      else if (statuses.some((s) => s === 'error') && statuses.some((s) => s === 'success')) status = 'partial'
      else if (statuses.some((s) => s === 'error')) status = 'error'
      const final = proj.nodes.find((n) => n.data.kind === 'final')
      saveRun({
        id: uid('run'),
        projectId: proj.id,
        projectName: proj.name,
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        status,
        nodeSummary: proj.nodes.map((n) => ({
          id: n.id,
          title: n.data.title,
          status: n.data.status,
          error: n.data.error,
        })),
        finalResult: final?.data.result,
      })
      set({ runs: loadRuns(proj.id) })
      // auto version snapshot after run
      saveVersion({
        id: uid('ver'),
        projectId: proj.id,
        label: `پس از اجرا · ${status}`,
        createdAt: new Date().toISOString(),
        nodes: JSON.parse(JSON.stringify(proj.nodes)),
        edges: JSON.parse(JSON.stringify(proj.edges)),
        settings: JSON.parse(JSON.stringify(proj.settings)),
        note: 'خودکار پس از اجرا',
      })
      set({ versions: loadVersions(proj.id) })
    }
    set({ running: false, cancel: false })
  },
}))
