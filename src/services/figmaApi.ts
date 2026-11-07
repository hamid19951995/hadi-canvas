import { getStoredKey, isUsable, connectWithOAuthToken } from './connectors'
import { cacheKey, setCached, warmCache } from './imageCache'

async function figmaFetch<T>(path: string): Promise<T> {
  if (!isUsable('figma')) throw new Error('Figma متصل نیست. از افزونه‌ها OAuth کنید.')
  const token = getStoredKey('figma')
  if (!token) throw new Error('توکن Figma ذخیره نشده است. دوباره وصل شوید.')
  const res = await fetch(`https://api.figma.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 401) throw new Error('توکن Figma نامعتبر است. دوباره وصل شوید.')
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`Figma API ${res.status}: ${t.slice(0, 160)}`)
  }
  return res.json() as Promise<T>
}

export async function fetchFigmaMe(): Promise<{ id: string; email?: string; handle?: string }> {
  return figmaFetch('/me')
}

export async function validateFigmaConnection() {
  const me = await fetchFigmaMe()
  const token = getStoredKey('figma')
  if (!token) throw new Error('توکن Figma ذخیره نشده است.')
  connectWithOAuthToken('figma', token)
  return me
}

export function parseFigmaFileKey(input: string): string | null {
  const s = input.trim()
  if (!s) return null
  if (/^[a-zA-Z0-9]+$/.test(s) && s.length >= 8) return s
  const m = s.match(/figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/)
  return m?.[1] || null
}

interface FigmaNode {
  id: string
  name: string
  type: string
  children?: FigmaNode[]
}

interface FigmaFile {
  name: string
  lastModified?: string
  version?: string
  document?: FigmaNode
}

function collectFrames(node: FigmaNode, out: { id: string; name: string; type: string }[], limit: number) {
  if (out.length >= limit) return
  if (['FRAME', 'COMPONENT', 'COMPONENT_SET', 'SECTION'].includes(node.type)) {
    out.push({ id: node.id, name: node.name, type: node.type })
  }
  for (const c of node.children || []) {
    if (out.length >= limit) break
    collectFrames(c, out, limit)
  }
}

function walk(node: FigmaNode, depth: number, lines: string[], limit: { n: number }) {
  if (limit.n <= 0) return
  const pad = '  '.repeat(Math.min(depth, 8))
  lines.push(`${pad}- [${node.type}] ${node.name} (${node.id})`)
  limit.n--
  if (!node.children) return
  for (const c of node.children) {
    if (limit.n <= 0) {
      lines.push(`${pad}  …`)
      break
    }
    if (depth < 3 || ['PAGE', 'FRAME', 'COMPONENT', 'COMPONENT_SET', 'SECTION'].includes(c.type)) {
      walk(c, depth + 1, lines, limit)
    }
  }
}

export async function fetchFigmaFileSummary(fileKey: string): Promise<string> {
  const file = await figmaFetch<FigmaFile>(`/files/${encodeURIComponent(fileKey)}?depth=3`)
  const lines: string[] = [
    `# Figma: ${file.name}`,
    `key: ${fileKey}`,
    file.lastModified ? `modified: ${file.lastModified}` : '',
    file.version ? `version: ${file.version}` : '',
    '',
    '## ساختار (خلاصه)',
  ].filter(Boolean) as string[]

  if (file.document) walk(file.document, 0, lines, { n: 80 })
  else lines.push('(document خالی)')

  return lines.join('\n')
}

/** Export PNG URLs for up to `limit` frames (or specific node ids). */
export async function fetchFigmaFrameImages(
  fileKey: string,
  opts?: { nodeIds?: string[]; limit?: number; scale?: number }
): Promise<{ summary: string; images: { id: string; name: string; url: string }[] }> {
  const file = await figmaFetch<FigmaFile>(`/files/${encodeURIComponent(fileKey)}?depth=4`)
  const frames: { id: string; name: string; type: string }[] = []
  if (file.document) collectFrames(file.document, frames, opts?.limit ?? 6)

  let targets = frames
  if (opts?.nodeIds?.length) {
    const set = new Set(opts.nodeIds)
    targets = frames.filter((f) => set.has(f.id))
    if (!targets.length) {
      // use provided ids even if not in collected list
      targets = opts.nodeIds.map((id) => ({ id, name: id, type: 'NODE' }))
    }
  }
  targets = targets.slice(0, opts?.limit ?? 6)
  if (!targets.length) {
    return {
      summary: await fetchFigmaFileSummary(fileKey),
      images: [],
    }
  }

  const ids = targets.map((t) => t.id).join(',')
  const scale = opts?.scale ?? 1
  const imgRes = await figmaFetch<{ images: Record<string, string | null> }>(
    `/images/${encodeURIComponent(fileKey)}?ids=${encodeURIComponent(ids)}&format=png&scale=${scale}`
  )

  const images = targets
    .map((t) => ({
      id: t.id,
      name: t.name,
      url: imgRes.images[t.id] || '',
    }))
    .filter((x) => x.url)

  // local thumbnail cache (URL now; data URL if CORS allows)
  await Promise.all(
    images.map(async (im) => {
      const key = cacheKey(fileKey, im.id)
      setCached(key, { src: im.url, remote: im.url, label: im.name })
      const warmed = await warmCache(key, im.url, im.name)
      im.url = warmed
    })
  )

  const summaryLines = [
    await fetchFigmaFileSummary(fileKey),
    '',
    '## تصاویر فریم (PNG)',
    ...images.map((im) => `- ${im.name} (${im.id}): ${im.url}`),
    images.length === 0 ? '(تصویری برنگشت — دسترسی یا node id را چک کنید)' : '',
  ]

  return { summary: summaryLines.filter(Boolean).join('\n'), images }
}
