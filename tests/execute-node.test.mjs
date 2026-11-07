import test from 'node:test'
import assert from 'node:assert/strict'
import { executeNode } from '../src/engine/executeNode.ts'

function node(kind, data = {}) {
  return { id: 'n1', type: kind, position: { x: 0, y: 0 }, data: { kind, title: kind, prompt: '', model: 'gpt-4o-mini', status: 'idle', ...data } }
}

test('prompt nodes pass their text through without calling a provider', async () => {
  const out = await executeNode({ node: node('prompt', { prompt: 'hello world' }), inputText: '', apiKey: '', memory: {} })
  assert.equal(out.result, 'hello world')
})

test('merge and final nodes combine their visible inputs', async () => {
  const out = await executeNode({ node: node('merge'), inputText: 'a\n\nb', apiKey: '', memory: {} })
  assert.equal(out.result, 'a\n\nb')
  const empty = await executeNode({ node: node('final'), inputText: '', apiKey: '', memory: {} })
  assert.equal(empty.result, '(خالی)')
})

test('condition produces a real true/false branch', async () => {
  const yes = await executeNode({ node: node('condition'), inputText: 'این متن آماده است؟ بله', apiKey: '', memory: {} })
  assert.equal(yes.branch, 'true')
  const no = await executeNode({ node: node('condition'), inputText: 'هنوز نه', apiKey: '', memory: {} })
  assert.equal(no.branch, 'false')
  // substring "yes" inside another word must not be treated as true
  const trick = await executeNode({ node: node('condition'), inputText: 'yesterday', apiKey: '', memory: {} })
  assert.equal(trick.branch, 'false')
})

test('memory nodes write and then read the same key', async () => {
  const write = await executeNode({ node: node('memory', { config: { memoryKey: 'plan' } }), inputText: 'saved value', apiKey: '', memory: {} })
  assert.deepEqual(write.memoryPatch, { plan: 'saved value' })
  const read = await executeNode({ node: node('memory', { config: { memoryKey: 'plan' } }), inputText: '', apiKey: '', memory: { plan: 'saved value' } })
  assert.equal(read.result, 'saved value')
})

test('code nodes extract fenced files by path', async () => {
  const original = globalThis.fetch
  globalThis.fetch = async () => new Response(JSON.stringify({ choices: [{ message: { content: '```tsx src/App.tsx\nexport default 1\n```' } }] }), { status: 200 })
  try {
    const out = await executeNode({ node: node('code', { prompt: 'write code' }), inputText: '', apiKey: 'k', provider: 'openai', memory: {} })
    assert.equal(out.files?.[0].path, 'tsx src/App.tsx')
    assert.match(out.files?.[0].content || '', /export default 1/)
  } finally {
    globalThis.fetch = original
  }
})

test('without an API key execution returns the explicit local-sample marker', async () => {
  const out = await executeNode({ node: node('text', { prompt: 'hi' }), inputText: '', apiKey: '', memory: {} })
  assert.match(out.result, /نمونه محلی/)
})
