/**
 * Project Save / Load — Phase 16
 * localStorage + JSON file export/import
 */

import type { Node, Edge } from '@xyflow/react'

export const STORAGE_KEY = 'gapgpt_canvas_project'
export const PROJECT_VERSION = 1

export interface CanvasProject {
  version: number
  name: string
  updatedAt: string
  nodes: Node[]
  edges: Edge[]
}

export function createProject(
  nodes: Node[],
  edges: Edge[],
  name = 'پروژه بدون نام'
): CanvasProject {
  return {
    version: PROJECT_VERSION,
    name,
    updatedAt: new Date().toISOString(),
    nodes,
    edges,
  }
}

export function saveToLocalStorage(project: CanvasProject): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(project))
}

export function loadFromLocalStorage(): CanvasProject | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as CanvasProject
    if (!data || !Array.isArray(data.nodes) || !Array.isArray(data.edges)) return null
    return data
  } catch {
    return null
  }
}

export function downloadProjectJson(project: CanvasProject): void {
  const blob = new Blob([JSON.stringify(project, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${sanitizeFilename(project.name)}.gapgpt.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function readProjectFile(file: File): Promise<CanvasProject> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result)) as CanvasProject
        if (!data || !Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
          reject(new Error('فرمت فایل نامعتبر است'))
          return
        }
        resolve(data)
      } catch {
        reject(new Error('خواندن فایل JSON با خطا مواجه شد'))
      }
    }
    reader.onerror = () => reject(new Error('خطا در خواندن فایل'))
    reader.readAsText(file)
  })
}

function sanitizeFilename(name: string): string {
  return (name || 'project').replace(/[^\w\u0600-\u06FF\-]+/g, '_').slice(0, 64)
}
