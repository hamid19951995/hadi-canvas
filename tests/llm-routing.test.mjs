import test from 'node:test'
import assert from 'node:assert/strict'
import { chatCompleteWith, PROVIDER_TARGETS } from '../src/services/llm.ts'

function mockFetch(capture) {
  return async (url, init) => {
    capture.url = String(url)
    capture.headers = init.headers
    capture.body = JSON.parse(init.body)
    if (String(url).includes('/messages')) {
      return new Response(JSON.stringify({ content: [{ type: 'text', text: 'anthropic-ok' }] }), { status: 200 })
    }
    if (String(url).includes(':generateContent')) {
      return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'gemini-ok' }] } }] }), { status: 200 })
    }
    return new Response(JSON.stringify({ choices: [{ message: { content: 'openai-ok' } }] }), { status: 200 })
  }
}

test('openai-compatible providers hit their own chat/completions endpoint', async () => {
  const capture = {}
  const original = globalThis.fetch
  globalThis.fetch = mockFetch(capture)
  try {
    const text = await chatCompleteWith('openai', 'key', 'gpt-4o-mini', 'hi')
    assert.equal(text, 'openai-ok')
    assert.equal(capture.url, 'https://api.openai.com/v1/chat/completions')
    assert.equal(capture.headers.Authorization, 'Bearer key')
  } finally {
    globalThis.fetch = original
  }
})

test('anthropic uses /v1/messages with x-api-key', async () => {
  const capture = {}
  const original = globalThis.fetch
  globalThis.fetch = mockFetch(capture)
  try {
    const text = await chatCompleteWith('anthropic', 'key', 'claude-3-5-sonnet-latest', 'hi')
    assert.equal(text, 'anthropic-ok')
    assert.equal(capture.url, 'https://api.anthropic.com/v1/messages')
    assert.equal(capture.headers['x-api-key'], 'key')
    assert.ok(capture.headers['anthropic-version'])
  } finally {
    globalThis.fetch = original
  }
})

test('gemini uses generateContent with the key as a query parameter', async () => {
  const capture = {}
  const original = globalThis.fetch
  globalThis.fetch = mockFetch(capture)
  try {
    const text = await chatCompleteWith('google', 'key', 'gemini-2.0-flash', 'hi')
    assert.equal(text, 'gemini-ok')
    assert.match(capture.url, /generativelanguage\.googleapis\.com\/v1beta\/models\/gemini-2\.0-flash:generateContent\?key=key/)
  } finally {
    globalThis.fetch = original
  }
})

test('every catalogued provider has a target; only local providers may use http', () => {
  const local = new Set(['ollama', 'custom_openai'])
  for (const [id, target] of Object.entries(PROVIDER_TARGETS)) {
    assert.ok(target.baseUrl, id)
    assert.match(target.baseUrl, local.has(id) ? /^http:\/\/(127\.0\.0\.1|localhost)/ : /^https:\/\//, id)
  }
})
