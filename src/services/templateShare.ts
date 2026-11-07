import type { UserTemplate } from './userTemplates'
import type { Project } from '../domain/types'

export const TEMPLATE_FILE_KIND = 'hadi-canvas-template'
export const TEMPLATE_FILE_VERSION = 1

export interface TemplateFile {
  kind: typeof TEMPLATE_FILE_KIND
  version: number
  exportedAt: string
  template: {
    name: string
    description: string
    nodes: unknown
    edges: unknown
    settings: unknown
  }
}

export function projectToTemplateFile(project: Project, description = ''): TemplateFile {
  return {
    kind: TEMPLATE_FILE_KIND,
    version: TEMPLATE_FILE_VERSION,
    exportedAt: new Date().toISOString(),
    template: {
      name: project.name,
      description,
      nodes: JSON.parse(JSON.stringify(project.nodes)),
      edges: JSON.parse(JSON.stringify(project.edges)),
      settings: JSON.parse(JSON.stringify(project.settings)),
    },
  }
}

export function userTemplateToFile(tpl: UserTemplate): TemplateFile {
  return {
    kind: TEMPLATE_FILE_KIND,
    version: TEMPLATE_FILE_VERSION,
    exportedAt: new Date().toISOString(),
    template: {
      name: tpl.name,
      description: tpl.description,
      nodes: tpl.nodes,
      edges: tpl.edges,
      settings: tpl.settings,
    },
  }
}

export function downloadTemplateFile(file: TemplateFile) {
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${file.template.name || 'hadi-template'}.hadi-template.json`
  a.click()
  URL.revokeObjectURL(a.href)
}

export function parseTemplateFile(raw: string): { ok: true; file: TemplateFile } | { ok: false; error: string } {
  try {
    const data = JSON.parse(raw)
    if (data?.kind !== TEMPLATE_FILE_KIND) {
      return { ok: false, error: 'این فایل الگوی hadi-canvas نیست (kind نامعتبر).' }
    }
    if (!data.template?.name || !Array.isArray(data.template?.nodes)) {
      return { ok: false, error: 'ساختار الگو ناقص است.' }
    }
    return { ok: true, file: data as TemplateFile }
  } catch {
    return { ok: false, error: 'JSON نامعتبر است.' }
  }
}

export function templateFileToUserTemplateShape(file: TemplateFile): Omit<UserTemplate, 'id' | 'createdAt'> {
  return {
    name: String(file.template.name),
    description: String(file.template.description || ''),
    nodes: file.template.nodes as UserTemplate['nodes'],
    edges: file.template.edges as UserTemplate['edges'],
    settings: file.template.settings as UserTemplate['settings'],
  }
}
