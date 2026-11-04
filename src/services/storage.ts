import type { Project } from '../domain/types'

const KEY = 'hadi_canvas_projects_v2'
const API_KEY = 'hadi_canvas_api_key'
const RUNS = 'hadi_canvas_runs_v2'

export interface GraphVersion {
  id: string
  projectId: string
  label: string
  createdAt: string
  nodes: unknown
  edges: unknown
  settings: unknown
  note?: string
}

const VERSIONS = 'hadi_canvas_versions_v2'

export function loadVersions(projectId?: string): GraphVersion[] {
  try {
    const all: GraphVersion[] = JSON.parse(localStorage.getItem(VERSIONS) || '[]')
    return projectId ? all.filter((v) => v.projectId === projectId) : all
  } catch {
    return []
  }
}

export function saveVersion(v: GraphVersion) {
  const all = loadVersions()
  all.unshift(v)
  localStorage.setItem(VERSIONS, JSON.stringify(all.slice(0, 30)))
}

export function getVersion(id: string): GraphVersion | undefined {
  return loadVersions().find((v) => v.id === id)
}


export interface RunRecord {
  id: string
  projectId: string
  projectName: string
  startedAt: string
  finishedAt: string
  status: 'success' | 'partial' | 'error' | 'cancelled'
  nodeSummary: { id: string; title: string; status: string; error?: string }[]
  finalResult?: string
}

export function loadProjects(): Project[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

export function saveProjects(list: Project[]) {
  localStorage.setItem(KEY, JSON.stringify(list))
}

export function upsertProject(p: Project) {
  const all = loadProjects().filter((x) => x.id !== p.id)
  all.unshift({ ...p, updatedAt: new Date().toISOString() })
  saveProjects(all)
}

export function removeProject(id: string) {
  saveProjects(loadProjects().filter((p) => p.id !== id))
}

export function getApiKey() {
  return localStorage.getItem(API_KEY) || ''
}

export function setApiKey(k: string) {
  localStorage.setItem(API_KEY, k)
}

export function loadRuns(projectId?: string): RunRecord[] {
  try {
    const all: RunRecord[] = JSON.parse(localStorage.getItem(RUNS) || '[]')
    return projectId ? all.filter((r) => r.projectId === projectId) : all
  } catch {
    return []
  }
}

export function saveRun(run: RunRecord) {
  const all = loadRuns()
  all.unshift(run)
  localStorage.setItem(RUNS, JSON.stringify(all.slice(0, 40)))
}

export function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}
