/**
 * Hadi — LLM/Image client
 * Prefers local proxy (/api/*) so the key can stay server-side.
 */

const DIRECT_BASE = 'https://api.gapgpt.app/v1'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionRequest {
  model: string
  messages: ChatMessage[]
  temperature?: number
  max_tokens?: number
  stream?: boolean
}

export interface ChatCompletionResponse {
  id: string
  choices: Array<{
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

async function postJson(url: string, apiKey: string, body: unknown) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}`, 'x-api-key': apiKey } : {}),
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`API error ${res.status}: ${err}`)
  }
  return res.json()
}

/** Try proxy first; fall back to direct provider URL */
async function chatViaProxyOrDirect(apiKey: string, request: ChatCompletionRequest) {
  try {
    return await postJson('/api/chat', apiKey, { ...request, apiKey })
  } catch {
    return postJson(`${DIRECT_BASE}/chat/completions`, apiKey, request)
  }
}

export async function chatCompletion(
  apiKey: string,
  request: ChatCompletionRequest
): Promise<ChatCompletionResponse> {
  return chatViaProxyOrDirect(apiKey, request)
}

export async function runTextNode(
  apiKey: string,
  model: string,
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  const messages: ChatMessage[] = []
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt })
  messages.push({ role: 'user', content: prompt })

  const result = await chatCompletion(apiKey, {
    model: model || 'gpt-4o',
    messages,
    temperature: 0.7,
  })
  return result.choices?.[0]?.message?.content ?? ''
}

export async function generateImage(
  apiKey: string,
  prompt: string,
  model = 'dall-e-3'
): Promise<string> {
  let data: any
  try {
    data = await postJson('/api/images', apiKey, { prompt, model, apiKey })
  } catch {
    data = await postJson(`${DIRECT_BASE}/images/generations`, apiKey, {
      model,
      prompt,
      n: 1,
      size: '1024x1024',
    })
  }
  return data.data?.[0]?.url ?? data.url ?? ''
}
