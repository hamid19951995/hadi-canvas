/** Local thumbnail cache (localStorage). Keys are stable; values may be remote URL or data URL. */

const PREFIX = 'hadi_img_cache_v1:'
const INDEX_KEY = 'hadi_img_cache_index_v1'
const MAX_ENTRIES = 40
const MAX_DATA_URL_CHARS = 400_000 // skip huge payloads

export type CacheEntry = {
  src: string
  /** original remote url if src is data */
  remote?: string
  updatedAt: string
  label?: string
}

function index(): string[] {
  try {
    return JSON.parse(localStorage.getItem(INDEX_KEY) || '[]')
  } catch {
    return []
  }
}

function saveIndex(ids: string[]) {
  localStorage.setItem(INDEX_KEY, JSON.stringify(ids.slice(0, MAX_ENTRIES)))
}

export function cacheKey(fileKey: string, nodeId: string) {
  return `${fileKey}::${nodeId}`
}

export function getCached(key: string): CacheEntry | null {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? (JSON.parse(raw) as CacheEntry) : null
  } catch {
    return null
  }
}

export function setCached(key: string, entry: Omit<CacheEntry, 'updatedAt'>) {
  const full: CacheEntry = { ...entry, updatedAt: new Date().toISOString() }
  if (full.src.startsWith('data:') && full.src.length > MAX_DATA_URL_CHARS) {
    // store remote only
    full.src = entry.remote || entry.src
  }
  localStorage.setItem(PREFIX + key, JSON.stringify(full))
  const ids = index().filter((k) => k !== key)
  ids.unshift(key)
  // evict
  while (ids.length > MAX_ENTRIES) {
    const drop = ids.pop()
    if (drop) localStorage.removeItem(PREFIX + drop)
  }
  saveIndex(ids)
}

export function listCached(): { key: string; entry: CacheEntry }[] {
  return index()
    .map((key) => {
      const entry = getCached(key)
      return entry ? { key, entry } : null
    })
    .filter(Boolean) as { key: string; entry: CacheEntry }[]
}

export function clearImageCache() {
  for (const k of index()) localStorage.removeItem(PREFIX + k)
  localStorage.removeItem(INDEX_KEY)
}

/** Try to materialize remote image as data URL for offline preview. Fails silently on CORS. */
export async function warmCache(key: string, remoteUrl: string, label?: string): Promise<string> {
  const existing = getCached(key)
  if (existing?.src.startsWith('data:')) return existing.src

  setCached(key, { src: remoteUrl, remote: remoteUrl, label })

  try {
    const res = await fetch(remoteUrl, { mode: 'cors' })
    if (!res.ok) return remoteUrl
    const blob = await res.blob()
    if (blob.size > 350_000) return remoteUrl
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
    setCached(key, { src: dataUrl, remote: remoteUrl, label })
    return dataUrl
  } catch {
    return remoteUrl
  }
}

export function resolvePreviewSrc(fileKey: string, nodeId: string, fallbackUrl: string): string {
  const hit = getCached(cacheKey(fileKey, nodeId))
  return hit?.src || fallbackUrl
}
