/** Plugin / connector registry — MCP-style server URL + Connect flow */

export type ConnectorId =
  | 'gapgpt'
  | 'openai'
  | 'openrouter'
  | 'github'
  | 'figma'
  | 'canva'
  | 'custom_mcp'

export type ConnectorStatus = 'disconnected' | 'connected' | 'expired' | 'error'

export type ConnectorCategory =
  | 'models'
  | 'productivity'
  | 'design'
  | 'developer'
  | 'custom'

export type AuthKind = 'api_key' | 'oauth_official' | 'mcp'

export interface ConnectorDef {
  id: ConnectorId
  label: string
  category: ConnectorCategory
  categoryLabel: string
  description: string
  /** MCP or API base URL shown on Connect card */
  serverUrl: string
  auth: AuthKind
  scopesNote: string
  docsUrl?: string
  /** ready | needs_setup | soon */
  availability: 'ready' | 'needs_setup' | 'soon'
}

export interface ConnectorState {
  id: ConnectorId
  status: ConnectorStatus
  lastCheckedAt?: string
  expiresAt?: string
  hint?: string
  message?: string
  /** optional override for custom MCP */
  serverUrl?: string
}

export const CONNECTOR_CATALOG: ConnectorDef[] = [
  {
    id: 'figma',
    label: 'Figma',
    category: 'productivity',
    categoryLabel: 'Productivity',
    description:
      'Access Figma files and design data enabling them to understand designs and generate flowcharts, code and UI implementations.',
    serverUrl: 'https://mcp.figma.com/mcp',
    auth: 'mcp',
    scopesNote: 'اتصال رسمی از طریق MCP / OAuth. فایل‌های طراحی قابل‌خواندن پس از Connect.',
    docsUrl: 'https://www.figma.com/developers',
    availability: 'ready',
  },
  {
    id: 'github',
    label: 'GitHub',
    category: 'developer',
    categoryLabel: 'Developer',
    description: 'Repositories, issues, and confirmed publish (Gist / Issue) using your GitHub account.',
    serverUrl: 'https://api.github.com',
    auth: 'oauth_official',
    scopesNote: 'OAuth رسمی GitHub با scope مخزن.',
    docsUrl: 'https://docs.github.com/en/developers/apps',
    availability: 'ready',
  },
  {
    id: 'gapgpt',
    label: 'GapGPT',
    category: 'models',
    categoryLabel: 'Models',
    description: 'Text and multi-model chat with your own GapGPT quota and API key.',
    serverUrl: 'https://api.gapgpt.app/v1',
    auth: 'api_key',
    scopesNote: 'کلید API شخصی؛ درخواست‌ها با Bearer.',
    docsUrl: 'https://gapgpt.app',
    availability: 'ready',
  },
  {
    id: 'openai',
    label: 'OpenAI',
    category: 'models',
    categoryLabel: 'Models',
    description: 'Official OpenAI Chat Completions API with your own key.',
    serverUrl: 'https://api.openai.com/v1',
    auth: 'api_key',
    scopesNote: 'کلید از platform.openai.com',
    docsUrl: 'https://platform.openai.com',
    availability: 'ready',
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    category: 'models',
    categoryLabel: 'Models',
    description: 'One key for many models via OpenRouter.',
    serverUrl: 'https://openrouter.ai/api/v1',
    auth: 'api_key',
    scopesNote: 'کلید از openrouter.ai',
    docsUrl: 'https://openrouter.ai',
    availability: 'ready',
  },
  {
    id: 'canva',
    label: 'Canva',
    category: 'design',
    categoryLabel: 'Design',
    description: 'Design templates and exports via official Canva OAuth (PKCE).',
    serverUrl: 'https://api.canva.com',
    auth: 'oauth_official',
    scopesNote: 'OAuth رسمی Canva.',
    docsUrl: 'https://www.canva.com/developers',
    availability: 'needs_setup',
  },
  {
    id: 'custom_mcp',
    label: 'افزونه MCP سفارشی',
    category: 'custom',
    categoryLabel: 'Custom',
    description: 'Connect any MCP-compatible plugin server by entering its Server URL and credentials.',
    serverUrl: 'https://',
    auth: 'mcp',
    scopesNote: 'آدرس سرور پلاگین را خودتان وارد کنید.',
    availability: 'ready',
  },
]

const STATE_KEY = 'hadi_connectors_v1'
const KEYS_PREFIX = 'hadi_ck_'
const MCP_URL_PREFIX = 'hadi_mcp_url_'

export function loadConnectorStates(): ConnectorState[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STATE_KEY) || '[]') as ConnectorState[]
    const byId = Object.fromEntries(raw.map((s) => [s.id, s]))
    return CONNECTOR_CATALOG.map((c) => {
      const s = byId[c.id]
      if (!s) return { id: c.id, status: 'disconnected' as const }
      return s
    })
  } catch {
    return CONNECTOR_CATALOG.map((c) => ({ id: c.id, status: 'disconnected' as const }))
  }
}

function saveStates(states: ConnectorState[]) {
  localStorage.setItem(STATE_KEY, JSON.stringify(states))
}

export function getApiKey(id: ConnectorId): string | null {
  return localStorage.getItem(KEYS_PREFIX + id)
}

export function setApiKey(id: ConnectorId, key: string) {
  localStorage.setItem(KEYS_PREFIX + id, key)
}

export function clearApiKey(id: ConnectorId) {
  localStorage.removeItem(KEYS_PREFIX + id)
}

export function getMcpServerUrl(id: ConnectorId, fallback: string): string {
  return localStorage.getItem(MCP_URL_PREFIX + id) || fallback
}

export function setMcpServerUrl(id: ConnectorId, url: string) {
  localStorage.setItem(MCP_URL_PREFIX + id, url.trim())
}

export function upsertState(patch: ConnectorState) {
  const all = loadConnectorStates()
  const next = all.map((s) => (s.id === patch.id ? { ...s, ...patch } : s))
  if (!next.find((s) => s.id === patch.id)) next.push(patch)
  saveStates(next)
  return next
}

export function connectWithApiKey(id: ConnectorId, key: string): ConnectorState {
  const trimmed = key.trim()
  if (!trimmed) {
    return upsertState({
      id,
      status: 'error',
      message: 'کلید خالی است',
      lastCheckedAt: new Date().toISOString(),
    })[0]
  }
  setApiKey(id, trimmed)
  const hint = '…' + trimmed.slice(-4)
  const states = upsertState({
    id,
    status: 'connected',
    hint,
    lastCheckedAt: new Date().toISOString(),
    message: undefined,
  })
  return states.find((s) => s.id === id)!
}

/** MCP-style connect: store server URL + optional token, mark connected after lightweight check */
export async function connectMcp(
  id: ConnectorId,
  serverUrl: string,
  token?: string,
): Promise<ConnectorState> {
  const url = serverUrl.trim().replace(/\/$/, '')
  if (!url.startsWith('http')) {
    const states = upsertState({
      id,
      status: 'error',
      message: 'Server URL نامعتبر است',
      lastCheckedAt: new Date().toISOString(),
    })
    return states.find((s) => s.id === id)!
  }
  setMcpServerUrl(id, url)
  if (token?.trim()) setApiKey(id, token.trim())

  // Lightweight reachability (may fail CORS in browser — still store connection intent)
  let ok = true
  let message: string | undefined
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 4000)
    await fetch(url, { method: 'GET', mode: 'no-cors', signal: ctrl.signal })
    clearTimeout(t)
  } catch {
    // CORS/opaque: still allow connect; real calls use server proxy when needed
    message = 'آدرس ذخیره شد (بررسی شبکه از مرورگر محدود است)'
  }

  const hint = token?.trim() ? '…' + token.trim().slice(-4) : url.replace(/^https?:\/\//, '').slice(0, 24)
  const states = upsertState({
    id,
    status: ok ? 'connected' : 'error',
    hint,
    serverUrl: url,
    lastCheckedAt: new Date().toISOString(),
    message,
  })
  return states.find((s) => s.id === id)!
}

export function disconnectConnector(id: ConnectorId) {
  clearApiKey(id)
  localStorage.removeItem(MCP_URL_PREFIX + id)
  return upsertState({
    id,
    status: 'disconnected',
    hint: undefined,
    message: undefined,
    serverUrl: undefined,
    lastCheckedAt: new Date().toISOString(),
  })
}

export function markOAuthConnected(id: ConnectorId, hint?: string) {
  return upsertState({
    id,
    status: 'connected',
    hint,
    lastCheckedAt: new Date().toISOString(),
  })
}

export function markExpired(id: ConnectorId, message?: string) {
  return upsertState({
    id,
    status: 'expired',
    message: message || 'اتصال منقضی شده؛ دوباره Connect کنید',
    lastCheckedAt: new Date().toISOString(),
  })
}

/** Prefer GapGPT → OpenAI → OpenRouter for LLM */
export function resolveLlmApiKey(): { provider: ConnectorId; key: string } | null {
  for (const id of ['gapgpt', 'openai', 'openrouter'] as ConnectorId[]) {
    const st = loadConnectorStates().find((s) => s.id === id)
    const key = getApiKey(id)
    if (st?.status === 'connected' && key) return { provider: id, key }
  }
  return null
}

/** ---- backward-compatible aliases used by store / APIs ---- */
export function getStoredKey(id: ConnectorId): string | null {
  return getApiKey(id)
}

export function isUsable(id: ConnectorId): boolean {
  const st = loadConnectorStates().find((s) => s.id === id)
  return st?.status === 'connected' && Boolean(getApiKey(id) || st.hint)
}

export function connectWithOAuthToken(id: ConnectorId, token: string, hint?: string): ConnectorState {
  setApiKey(id, token)
  const states = upsertState({
    id,
    status: 'connected',
    hint: hint || '…' + token.slice(-4),
    lastCheckedAt: new Date().toISOString(),
  })
  return states.find((s) => s.id === id)!
}
