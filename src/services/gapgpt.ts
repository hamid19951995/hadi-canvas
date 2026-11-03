/**
 * Hadi — LLM API adapter (OpenAI-compatible)
 * Default provider endpoint: https://api.gapgpt.app/v1
 */

const BASE_URL = 'https://api.gapgpt.app/v1'

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

export async function chatCompletion(
  apiKey: string,
  request: ChatCompletionRequest
): Promise<ChatCompletionResponse> {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`API error ${res.status}: ${err}`)
  }

  return res.json()
}

export async function runTextNode(
  apiKey: string,
  model: string,
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  const messages: ChatMessage[] = []
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt })
  }
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
  const res = await fetch(`${BASE_URL}/images/generations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      prompt,
      n: 1,
      size: '1024x1024',
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Image generation error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return data.data?.[0]?.url ?? data.url ?? ''
}
