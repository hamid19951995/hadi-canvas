import type { GEdge, GNode, ExecSettings, Project } from '../domain/types'

const KEY = 'hadi_user_templates_v1'

export interface UserTemplate {
  id: string
  name: string
  description: string
  createdAt: string
  nodes: GNode[]
  edges: GEdge[]
  settings: ExecSettings
}

function uid() {
  return `ut_${Math.random().toString(36).slice(2, 9)}`
}

export function loadUserTemplates(): UserTemplate[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

function saveAll(list: UserTemplate[]) {
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 40)))
}

export function saveUserTemplate(input: {
  name: string
  description?: string
  nodes: GNode[]
  edges: GEdge[]
  settings: ExecSettings
}): UserTemplate {
  const tpl: UserTemplate = {
    id: uid(),
    name: input.name.trim() || 'الگوی بدون نام',
    description: (input.description || '').trim(),
    createdAt: new Date().toISOString(),
    nodes: JSON.parse(JSON.stringify(input.nodes)),
    edges: JSON.parse(JSON.stringify(input.edges)),
    settings: JSON.parse(JSON.stringify(input.settings)),
  }
  const all = loadUserTemplates().filter((t) => t.id !== tpl.id)
  all.unshift(tpl)
  saveAll(all)
  return tpl
}

export function deleteUserTemplate(id: string) {
  saveAll(loadUserTemplates().filter((t) => t.id !== id))
}

export function projectFromUserTemplate(tpl: UserTemplate): Project {
  // fresh ids so multiple loads don't clash
  const idMap: Record<string, string> = {}
  const nodes: GNode[] = tpl.nodes.map((n) => {
    const nid = `n_${Math.random().toString(36).slice(2, 9)}`
    idMap[n.id] = nid
    return {
      ...JSON.parse(JSON.stringify(n)),
      id: nid,
      data: {
        ...JSON.parse(JSON.stringify(n.data)),
        status: 'idle',
        result: undefined,
        error: undefined,
      },
    }
  })
  const edges: GEdge[] = tpl.edges
    .filter((e) => idMap[e.source] && idMap[e.target])
    .map((e) => ({
      ...e,
      id: `e_${Math.random().toString(36).slice(2, 9)}`,
      source: idMap[e.source],
      target: idMap[e.target],
    }))
  return {
    id: `p_${Math.random().toString(36).slice(2, 9)}`,
    name: tpl.name,
    updatedAt: new Date().toISOString(),
    nodes,
    edges,
    settings: {
      ...JSON.parse(JSON.stringify(tpl.settings)),
      memory: {},
    },
  }
}
