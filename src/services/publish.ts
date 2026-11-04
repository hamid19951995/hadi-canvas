import type { Project } from '../domain/types'
import { isUsable } from './connectors'
import { createGist, createIssue } from './githubApi'

export type PublishTarget = 'download' | 'github_gist' | 'github_issue'

export interface PublishRequest {
  project: Project
  target: PublishTarget
  confirmPhrase: string
  /** owner/repo for issue e.g. hamid19951995/hadi-canvas */
  repoFullName?: string
  issueTitle?: string
}

export interface PublishResult {
  ok: boolean
  message: string
  url?: string
}

const REQUIRED_PHRASE = 'تأیید انتشار'

export function requiredConfirmPhrase() {
  return REQUIRED_PHRASE
}

export async function publish(req: PublishRequest): Promise<PublishResult> {
  if (req.confirmPhrase.trim() !== REQUIRED_PHRASE) {
    return {
      ok: false,
      message: `برای انتشار باید دقیقاً بنویسید: ${REQUIRED_PHRASE}`,
    }
  }

  if (req.target === 'download') {
    const blob = new Blob([JSON.stringify(req.project, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${req.project.name || 'hadi'}.hadi.json`
    a.click()
    URL.revokeObjectURL(url)
    return { ok: true, message: 'فایل JSON محلی ذخیره شد. این انتشار راه‌دور نیست.' }
  }

  if (req.target === 'github_gist') {
    if (!isUsable('github')) {
      return { ok: false, message: 'اتصال GitHub متصل نیست. از افزونه‌ها OAuth کنید.' }
    }
    try {
      const gist = await createGist({
        description: `hadi-canvas · ${req.project.name}`,
        filename: `${req.project.name || 'project'}.hadi.json`,
        content: JSON.stringify(req.project, null, 2),
        public: false,
      })
      return { ok: true, message: 'Gist خصوصی ساخته شد.', url: gist.html_url }
    } catch (e: unknown) {
      return { ok: false, message: e instanceof Error ? e.message : 'Gist ناموفق' }
    }
  }

  if (req.target === 'github_issue') {
    if (!isUsable('github')) {
      return { ok: false, message: 'اتصال GitHub متصل نیست.' }
    }
    const full = (req.repoFullName || '').trim()
    const parts = full.split('/').filter(Boolean)
    if (parts.length !== 2) {
      return { ok: false, message: 'نام مخزن را به صورت owner/repo وارد کنید.' }
    }
    const final = req.project.nodes.find((n) => n.data.kind === 'final')
    const body = [
      `## hadi-canvas · ${req.project.name}`,
      '',
      final?.data.result || '_خروجی نهایی خالی است_',
      '',
      '---',
      `گره‌ها: ${req.project.nodes.length} · اتصال‌ها: ${req.project.edges.length}`,
      '',
      '<details><summary>JSON خلاصه</summary>',
      '',
      '```json',
      JSON.stringify(
        {
          name: req.project.name,
          nodes: req.project.nodes.map((n) => ({
            id: n.id,
            kind: n.data.kind,
            status: n.data.status,
            title: n.data.title,
          })),
        },
        null,
        2
      ),
      '```',
      '',
      '</details>',
    ].join('\n')

    try {
      const issue = await createIssue({
        owner: parts[0],
        repo: parts[1],
        title: req.issueTitle?.trim() || `[hadi-canvas] ${req.project.name}`,
        body,
      })
      return {
        ok: true,
        message: `Issue #${issue.number} ساخته شد.`,
        url: issue.html_url,
      }
    } catch (e: unknown) {
      return { ok: false, message: e instanceof Error ? e.message : 'Issue ناموفق' }
    }
  }

  return { ok: false, message: 'هدف انتشار نامعتبر' }
}
