/** OpenAI-compatible chat — respects per-provider base URL from localStorage */

const BASE_KEY = 'hadi_llm_base_url'

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

export async function chatComplete(apiKey: string, model: string, prompt: string): Promise<string> {
  if (!apiKey) {
    return `[نمونه محلی — کلید API تنظیم نشده]\n\n${prompt.slice(0, 500)}`
  }
  const base = getLlmBaseUrl()
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt || 'سلام' }],
    }),
  })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`خطای API (${res.status}): ${t.slice(0, 120)}`)
  }
  const json = await res.json()
  return json.choices?.[0]?.message?.content || ''
}
