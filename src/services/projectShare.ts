import type { Project } from '../domain/types'

export const PROJECT_FILE_KIND = 'hadi-canvas-project'
export const PROJECT_FILE_VERSION = 1

export interface ProjectFile {
  kind: typeof PROJECT_FILE_KIND
  version: number
  exportedAt: string
  project: Project
}

export function toProjectFile(project: Project): ProjectFile {
  return {
    kind: PROJECT_FILE_KIND,
    version: PROJECT_FILE_VERSION,
    exportedAt: new Date().toISOString(),
    project: JSON.parse(JSON.stringify(project)),
  }
}

export function downloadProjectFile(project: Project) {
  const file = toProjectFile(project)
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${project.name || 'hadi'}.hadi-project.json`
  a.click()
  URL.revokeObjectURL(a.href)
}

export function parseProjectFile(
  raw: string
): { ok: true; project: Project } | { ok: false; error: string } {
  try {
    const data = JSON.parse(raw)
    // accept wrapped format or raw Project
    let project: Project | null = null
    if (data?.kind === PROJECT_FILE_KIND && data.project?.nodes && data.project?.id) {
      project = data.project as Project
    } else if (data?.nodes && data?.id && data?.name) {
      project = data as Project
    }
    if (!project) return { ok: false, error: 'فایل پروژه hadi-canvas معتبر نیست.' }
    if (!Array.isArray(project.nodes) || !Array.isArray(project.edges)) {
      return { ok: false, error: 'nodes/edges نامعتبر است.' }
    }
    // strip runtime status noise on import
    project = {
      ...project,
      id: `p_${Math.random().toString(36).slice(2, 9)}`,
      updatedAt: new Date().toISOString(),
      nodes: project.nodes.map((n) => ({
        ...n,
        data: {
          ...n.data,
          status: 'idle' as const,
          error: undefined,
          result: undefined,
        },
      })),
    }
    return { ok: true, project }
  } catch {
    return { ok: false, error: 'JSON نامعتبر است.' }
  }
}
