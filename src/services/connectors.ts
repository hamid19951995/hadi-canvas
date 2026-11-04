/** Real connection state for external providers. No shared secrets. */

export type ConnectorId = 'gapgpt' | 'openai' | 'openrouter' | 'github' | 'figma' | 'canva'

export type ConnectorStatus = 'disconnected' | 'connected' | 'expired' | 'error'

export interface ConnectorDef {
  id: ConnectorId
  label: string
  description: string
  auth: 'api_key' | 'oauth_official'
  scopesNote: string
}

export interface ConnectorState {
  id: ConnectorId
  status: ConnectorStatus
  /** ISO date when token/key was last validated */
  lastCheckedAt?: string
  /** ISO date when considered expired (optional) */
  expiresAt?: string
  /** non-secret hint e.g. last 4 of key */
  hint?: string
  message?: string
}

export const CONNECTOR_CATALOG: ConnectorDef[] = [
  {
    id: 'gapgpt',
    label: 'GapGPT',
    description: 'چت و مدل‌های متنی با سهمیه حساب خودتان',
    auth: 'api_key',
    scopesNote: 'کلید API شخصی؛ درخواست‌ها با Bearer ارسال می‌شوند.',
  },
  {
    id: 'openai',
    label: 'OpenAI',
    description: 'API رسمی OpenAI',
    auth: 'api_key',
    scopesNote: 'کلید از platform.openai.com',
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    description: 'چندمدلی از یک کلید',
    auth: 'api_key',
    scopesNote: 'کلید از openrouter.ai',
  },
  {
    id: 'github',
    label: 'GitHub',
    description: 'مخزن، Issue، انتشار با تأیید',
    auth: 'oauth_official',
    scopesNote: 'OAuth رسمی GitHub (repo). بدون OAuth فقط وضعیت نمایشی.',
  },
  {
    id: 'figma',
    label: 'Figma',
    description: 'فایل طراحی و handoff',
    auth: 'oauth_official',
    scopesNote: 'OAuth رسمی Figma. تا راه‌اندازی سرور OAuth: قطع',
  },
  {
    id: 'canva',
    label: 'Canva',
    description: 'قالب و خروجی طراحی',
    auth: 'oauth_official',
    scopesNote: 'OAuth رسمی Canva. تا راه‌اندازی: قطع',
  },
]

const STATE_KEY = 'hadi_connectors_v1'
const KEYS_PREFIX = 'hadi_ck_'

export function loadConnectorStates(): ConnectorState[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STATE_KEY) || '[]') as ConnectorState[]
    const byId = Object.fromEntries(raw.map((s) => [s.id, s]))
    return CONNECTOR_CATALOG.map((c) => {
      const s = byId[c.id]
      if (!s) return { id: c.id, status: 'disconnected' as const }
      // expire check
      if (s.expiresAt && new Date(s.expiresAt).getTime() < Date.now()) {
        return { ...s, status: 'expired' as const, message: 'اعتبار اتصال منقضی شده' }
      }
      return s
    })
  } catch {
    return CONNECTOR_CATALOG.map((c) => ({ id: c.id, status: 'disconnected' as const }))
  }
}

function saveStates(states: ConnectorState[]) {
  localStorage.setItem(STATE_KEY, JSON.stringify(states))
}

export function getStoredKey(id: ConnectorId): string {
  return localStorage.getItem(KEYS_PREFIX + id) || ''
}

export function connectWithApiKey(id: ConnectorId, key: string): ConnectorState {
  const trimmed = key.trim()
  if (!trimmed) {
    return { id, status: 'error', message: 'کلید خالی است' }
  }
  localStorage.setItem(KEYS_PREFIX + id, trimmed)
  const hint = trimmed.length > 4 ? `…${trimmed.slice(-4)}` : '****'
  // default expiry 30 days for key-based (user can reconnect)
  const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString()
  const state: ConnectorState = {
    id,
    status: 'connected',
    lastCheckedAt: new Date().toISOString(),
    expiresAt,
    hint,
    message: undefined,
  }
  const all = loadConnectorStates().filter((s) => s.id !== id)
  all.push(state)
  saveStates(all)
  return state
}

export function connectWithOAuthToken(id: ConnectorId, token: string, expiresAt?: string): ConnectorState {
  const trimmed = token.trim()
  if (!trimmed) {
    return { id, status: 'error', message: 'توکن خالی است' }
  }
  localStorage.setItem(KEYS_PREFIX + id, trimmed)
  const hint = trimmed.length > 4 ? `…${trimmed.slice(-4)}` : '****'
  const state: ConnectorState = {
    id,
    status: 'connected',
    lastCheckedAt: new Date().toISOString(),
    expiresAt: expiresAt || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    hint,
    message: 'OAuth',
  }
  const all = loadConnectorStates().filter((s) => s.id !== id)
  all.push(state)
  saveStates(all)
  return state
}

export function disconnectConnector(id: ConnectorId): ConnectorState {
  localStorage.removeItem(KEYS_PREFIX + id)
  const state: ConnectorState = { id, status: 'disconnected', message: undefined }
  const all = loadConnectorStates().filter((s) => s.id !== id)
  all.push(state)
  saveStates(all)
  return state
}

export function isUsable(id: ConnectorId): boolean {
  const s = loadConnectorStates().find((x) => x.id === id)
  return s?.status === 'connected'
}

/** Primary LLM key: prefer gapgpt, then openai, openrouter, legacy hadi_canvas_api_key */
export function resolveLlmApiKey(): { key: string; provider: ConnectorId | 'legacy' | null } {
  for (const id of ['gapgpt', 'openai', 'openrouter'] as ConnectorId[]) {
    if (isUsable(id)) {
      const key = getStoredKey(id)
      if (key) return { key, provider: id }
    }
  }
  const legacy = localStorage.getItem('hadi_canvas_api_key') || ''
  if (legacy) return { key: legacy, provider: 'legacy' }
  return { key: '', provider: null }
}
