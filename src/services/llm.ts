/** OpenAI-compatible + native provider routing — respects the selected provider from the connector registry */

export type LlmProtocol = 'openai' | 'anthropic' | 'gemini'

export interface LlmTarget {
  baseUrl: string
  protocol: LlmProtocol
}

const BASE_KEY = 'hadi_llm_base_url'

/** Default endpoints per provider. Anthropic and Gemini use their native protocols. */
export const PROVIDER_TARGETS: Record<string, LlmTarget> = {
  gapgpt: { baseUrl: 'https://api.gapgpt.app/v1', protocol: 'openai' },
  openai: { baseUrl: 'https://api.openai.com/v1', protocol: 'openai' },
  openrouter: { baseUrl: 'https://openrouter.ai/api/v1', protocol: 'openai' },
  deepseek: { baseUrl: 'https://api.deepseek.com/v1', protocol: 'openai' },
  ollama: { baseUrl: 'http://127.0.0.1:11434/v1', protocol: 'openai' },
  custom_openai: { baseUrl: 'http://127.0.0.1:8080/v1', protocol: 'openai' },
  anthropic: { baseUrl: 'https://api.anthropic.com/v1', protocol: 'anthropic' },
  google: { baseUrl: 'https://generativelanguage.googleapis.com/v1beta', protocol: 'gemini' },
}

export function getLlmBaseUrl(): string {
  try {
    return localStorage.getItem(BASE_KEY) || 'https://api.gapgpt.app/v1'
  } catch {
    return 'https://api.gapgpt.app/v1'
  }
}

export function setLlmBaseUrl(url: string) {
  localStorage.setItem(BASE_KEY, url.replace(/\/$/, ''))
}

/** Base URL for a provider. custom_openai/ollama honour the user-configured local base URL. */
export function baseUrlFor(provider?: string): string {
  if (!provider) return getLlmBaseUrl()
  const target = PROVIDER_TARGETS[provider]
  if (!target) return getLlmBaseUrl()
  if (provider === 'custom_openai' || provider === 'ollama') {
    try {
      const override = localStorage.getItem(BASE_KEY)
      if (override) return override.replace(/\/$/, '')
    } catch {
      /* ignore storage errors */
    }
  }
  return target.baseUrl
}

export function protocolFor(provider?: string): LlmProtocol {
  return (provider && PROVIDER_TARGETS[provider]?.protocol) || 'openai'
}

function errorDetail(status: number, body: string) {
  return `خطای API (${status}): ${body.slice(0, 200)}`
}

async function openAiChat(base: string, apiKey: string, model: string, prompt: string): Promise<string> {
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: model || 'gpt-4o-mini', messages: [{ role: 'user', content: prompt || 'سلام' }] }),
  })
  if (!res.ok) throw new Error(errorDetail(res.status, await res.text().catch(() => '')))
  const json = await res.json()
  return json.choices?.[0]?.message?.content || ''
}

async function anthropicChat(base: string, apiKey: string, model: string, prompt: string): Promise<string> {
  const res = await fetch(`${base}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: model || 'claude-3-5-sonnet-latest',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt || 'سلام' }],
    }),
  })
  if (!res.ok) throw new Error(errorDetail(res.status, await res.text().catch(() => '')))
  const json = await res.json()
  return (json.content || []).map((part: { text?: string }) => part.text || '').join('')
}

async function geminiChat(base: string, apiKey: string, model: string, prompt: string): Promise<string> {
  const name = model || 'gemini-2.0-flash'
  const res = await fetch(`${base}/models/${encodeURIComponent(name)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt || 'سلام' }] }] }),
  })
  if (!res.ok) throw new Error(errorDetail(res.status, await res.text().catch(() => '')))
  const json = await res.json()
  return (json.candidates?.[0]?.content?.parts || []).map((part: { text?: string }) => part.text || '').join('')
}

/** Send a completion for an explicit provider. Falls back to the configured base URL when provider is unknown. */
export async function chatCompleteWith(
  provider: string | undefined,
  apiKey: string,
  model: string,
  prompt: string,
): Promise<string> {
  if (!apiKey) {
    return `[نمونه محلی — کلید API تنظیم نشده]\n\n${(prompt || '').slice(0, 500)}`
  }
  const base = baseUrlFor(provider)
  switch (protocolFor(provider)) {
    case 'anthropic':
      return anthropicChat(base, apiKey, model, prompt)
    case 'gemini':
      return geminiChat(base, apiKey, model, prompt)
    default:
      return openAiChat(base, apiKey, model, prompt)
  }
}

/** Backwards-compatible helper used by tests/tools that only know a key. */
export async function chatComplete(apiKey: string, model: string, prompt: string): Promise<string> {
  return chatCompleteWith(undefined, apiKey, model, prompt)
}
