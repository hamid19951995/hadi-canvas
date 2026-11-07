/** Plugin / connector registry — MCP-style server URL + Connect flow */

export type ConnectorId =
  | 'gapgpt'
  | 'openai'
  | 'openrouter'
  | 'anthropic'
  | 'google'
  | 'azure'
  | 'ollama'
  | 'deepseek'
  | 'github'
  | 'figma'
  | 'linear'
  | 'neon'
  | 'supabase'
  | 'canva'
  | 'custom_mcp'
  | 'custom_openai'

export type ConnectorStatus = 'disconnected' | 'connected' | 'configured' | 'expired' | 'error'

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
    id: 'linear', label: 'Linear', category: 'productivity', categoryLabel: 'Productivity',
    description: 'اتصال به issueها، پروژه‌ها و دیدگاه‌های Linear از طریق MCP رسمی.',
    serverUrl: 'https://mcp.linear.app/mcp', auth: 'mcp',
    scopesNote: 'OAuth یا توکن Linear؛ مجوزهای حساب شما اعمال می‌شود.',
    docsUrl: 'https://linear.app/docs/mcp', availability: 'ready',
  },
  {
    id: 'neon', label: 'Neon', category: 'developer', categoryLabel: 'Developer',
    description: 'اتصال MCP به پایگاه داده Neon.',
    serverUrl: 'https://mcp.neon.tech/mcp', auth: 'mcp',
    scopesNote: 'برای استفاده، مجوزهای حساب Neon لازم است.',
    docsUrl: 'https://neon.tech/docs', availability: 'ready',
  },
  {
    id: 'supabase', label: 'Supabase MCP', category: 'developer', categoryLabel: 'Developer',
    description: 'اتصال به MCP مستقرشده در پروژه Supabase شما.',
    serverUrl: 'https://{project-ref}.supabase.co/functions/v1/mcp', auth: 'mcp',
    scopesNote: 'آدرس نیازمند شناسه پروژه است و باید MCP را در پروژه خود مستقر کرده باشید.',
    docsUrl: 'https://supabase.com/docs/guides/ai-tools/byo-mcp', availability: 'needs_setup',
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
    id: 'anthropic',
    label: 'Anthropic Claude',
    category: 'models',
    categoryLabel: 'Models',
    description: 'Claude models with your Anthropic API key (OpenAI-compatible proxy or direct).',
    serverUrl: 'https://api.anthropic.com/v1',
    auth: 'api_key',
    scopesNote: 'کلید API شخصی Anthropic.',
    docsUrl: 'https://docs.anthropic.com',
    availability: 'ready',
  },
  {
    id: 'google',
    label: 'Google Gemini',
    category: 'models',
    categoryLabel: 'Models',
    description: 'Gemini via AI Studio or OpenAI-compatible gateway.',
    serverUrl: 'https://generativelanguage.googleapis.com/v1beta',
    auth: 'api_key',
    scopesNote: 'API Key از Google AI Studio.',
    docsUrl: 'https://ai.google.dev',
    availability: 'ready',
  },
  {
    id: 'azure',
    label: 'Azure OpenAI',
    category: 'models',
    categoryLabel: 'Models',
    description: 'Enterprise Azure OpenAI endpoint + key.',
    serverUrl: 'https://YOUR_RESOURCE.openai.azure.com/openai/deployments',
    auth: 'api_key',
    scopesNote: 'Endpoint و کلید Azure.',
    docsUrl: 'https://learn.microsoft.com/azure/ai-services/openai/',
    availability: 'ready',
  },
  {
    id: 'ollama',
    label: 'Ollama (Local)',
    category: 'models',
    categoryLabel: 'Models',
    description: 'Local models via Ollama OpenAI-compatible API.',
    serverUrl: 'http://127.0.0.1:11434/v1',
    auth: 'api_key',
    scopesNote: 'معمولاً کلید لازم نیست؛ در فیلد کلید مقدار ollama بگذارید.',
    docsUrl: 'https://ollama.com',
    availability: 'ready',
  },
  {
    id: 'deepseek',
    label: 'DeepSeek',
    category: 'models',
    categoryLabel: 'Models',
    description: 'DeepSeek chat and coder models.',
    serverUrl: 'https://api.deepseek.com/v1',
    auth: 'api_key',
    scopesNote: 'کلید DeepSeek.',
    docsUrl: 'https://platform.deepseek.com',
    availability: 'ready',
  },
  {
    id: 'custom_openai',
    label: 'Custom OpenAI-Compatible',
    category: 'custom',
    categoryLabel: 'Custom',
    description: 'Any local or remote server that speaks OpenAI Chat Completions.',
    serverUrl: 'http://127.0.0.1:8080/v1',
    auth: 'api_key',
    scopesNote: 'Base URL + کلید اختیاری.',
    availability: 'ready',
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

/** Empty string means "same origin" (Vite proxy in dev, reverse proxy in production). */
function viteEnv(): Record<string, string | undefined> {
  // import.meta.env only exists in Vite; guard so the module is also importable in Node tests.
  const meta = import.meta as ImportMeta & { env?: Record<string, string | undefined> }
  return meta.env || {}
}

export const AUTH_API_BASE = (viteEnv().VITE_AUTH_API || '').replace(/\/$/, '')

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
    const states = upsertState({
      id,
      status: 'error',
      message: 'کلید خالی است',
      lastCheckedAt: new Date().toISOString(),
    })
    return states.find((state) => state.id === id) || { id, status: 'error', message: 'کلید خالی است' }
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

/** Store an allowlisted MCP provider in the authenticated workspace API. No browser-side token storage or opaque no-cors success. */
export async function connectMcp(
  id: ConnectorId,
  serverUrl: string,
  token?: string,
): Promise<ConnectorState> {
  const url = serverUrl.trim().replace(/\/$/, '')
  const known = CONNECTOR_CATALOG.find((item) => item.id === id && item.auth === 'mcp')
  const supabaseMatch = id === 'supabase' ? url.match(/^https:\/\/([a-z0-9]{20})\.supabase\.co\/functions\/v1\/mcp$/) : null
  const endpointMatches = known && (url === known.serverUrl.replace(/\/$/, '') || Boolean(supabaseMatch))
  if (!endpointMatches) {
    const states = upsertState({ id, status: 'error', message: 'این MCP در فهرست امن سرور وجود ندارد یا آدرس آن تغییر کرده است', lastCheckedAt: new Date().toISOString() })
    return states.find((state) => state.id === id)!
  }
  const api = AUTH_API_BASE
  try {
    const response = await fetch(`${api}/api/mcp/connections`, {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: id, token: token?.trim() || undefined, projectRef: supabaseMatch?.[1] }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.error || `خطای سرور (${response.status})`)
    const states = upsertState({
      id, status: 'configured', hint: token?.trim() ? 'اعتبارنامه در سرور ذخیره شد' : 'نیازمند تأیید هویت ارائه‌دهنده',
      serverUrl: url, lastCheckedAt: new Date().toISOString(),
      message: 'تنظیمات ذخیره شد؛ دست‌دهی MCP و فهرست ابزارها هنوز بررسی نشده است.',
    })
    return states.find((state) => state.id === id)!
  } catch (error) {
    const states = upsertState({ id, status: 'error', message: error instanceof Error ? error.message : 'اتصال به API حساب ناموفق بود', lastCheckedAt: new Date().toISOString() })
    return states.find((state) => state.id === id)!
  }
}

export async function disconnectConnector(id: ConnectorId) {
  const knownMcp = ['figma', 'linear', 'neon', 'supabase'].includes(id)
  if (knownMcp) {
    const api = AUTH_API_BASE
    const response = await fetch(`${api}/api/mcp/connections/${id}`, { method: 'DELETE', credentials: 'include' })
    if (!response.ok && response.status !== 404) throw new Error('قطع اتصال در سرور ناموفق بود')
  }
  clearApiKey(id)
  localStorage.removeItem(MCP_URL_PREFIX + id)
  return upsertState({ id, status: 'disconnected', hint: undefined, message: undefined, serverUrl: undefined, lastCheckedAt: new Date().toISOString() })
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

/** Model providers in priority order. Any connected provider with a key can drive the graph. */
export const LLM_PROVIDERS: ConnectorId[] = [
  'gapgpt',
  'openai',
  'openrouter',
  'deepseek',
  'anthropic',
  'google',
  'ollama',
  'custom_openai',
]

export function resolveLlmApiKey(): { provider: ConnectorId; key: string } | null {
  for (const id of LLM_PROVIDERS) {
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

export function connectWithOAuthToken(
  id: ConnectorId,
  token: string,
  options: { hint?: string; expiresAt?: string } = {},
): ConnectorState {
  if (!token) throw new Error('توکن OAuth خالی است')
  setApiKey(id, token)
  const states = upsertState({
    id,
    status: 'connected',
    hint: options.hint || '…' + token.slice(-4),
    expiresAt: options.expiresAt,
    message: undefined,
    lastCheckedAt: new Date().toISOString(),
  })
  return states.find((s) => s.id === id)!
}
