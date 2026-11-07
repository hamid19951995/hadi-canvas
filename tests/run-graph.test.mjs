import test from 'node:test'
import assert from 'node:assert/strict'
import { runGraph } from '../src/engine/runGraph.ts'

function build() {
  const n = (id, kind) => ({ id, type: kind, position: { x: 0, y: 0 }, data: { kind, title: id, prompt: '', model: 'm', status: 'idle' } })
  const e = (source, target, sourceHandle, valid = true) => ({ id: `${source}-${target}`, source, target, sourceHandle, valid })
  return { n, e }
}

test('runs every node in dependency order and collects results', async () => {
  const { n, e } = build()
  const nodes = [n('a', 'prompt'), n('b', 'merge'), n('c', 'final')]
  const edges = [e('a', 'b'), e('b', 'c')]
  const order = []
  const results = {}
  await runGraph({
    nodes, edges, parallel: false, apiKey: '', memory: {},
    execute: async (node, input) => { order.push(node.id); return { result: `${input}|${node.id}` } },
    onStatus: (id, status, patch) => { if (status === 'success') results[id] = patch.result },
    onMemory: () => {}, cancelled: () => false,
  })
  assert.deepEqual(order, ['a', 'b', 'c'])
  assert.match(results.c, /\|c$/)
})

test('a false condition skips the false branch and still completes the merge', async () => {
  const { n, e } = build()
  const nodes = [n('src', 'prompt'), n('cond', 'condition'), n('yes', 'text'), n('no', 'text'), n('merge', 'merge')]
  const edges = [e('src', 'cond'), e('cond', 'yes', 'true'), e('cond', 'no', 'false'), e('yes', 'merge'), e('no', 'merge')]
  const seen = {}
  await runGraph({
    nodes, edges, parallel: true, apiKey: '', memory: {},
    execute: async (node, input) => {
      if (node.id === 'cond') return { result: input, branch: 'false' }
      return { result: `${node.id}:${input}` }
    },
    onStatus: (id, status) => { seen[id] = status },
    onMemory: () => {}, cancelled: () => false,
  })
  assert.equal(seen.no, 'success')
  assert.equal(seen.yes, 'skipped')
  assert.equal(seen.merge, 'success')
})

test('cycles are rejected before any node runs', async () => {
  const { n, e } = build()
  const nodes = [n('a', 'text'), n('b', 'text')]
  const edges = [e('a', 'b'), e('b', 'a')]
  await assert.rejects(
    runGraph({ nodes, edges, parallel: true, apiKey: '', memory: {}, execute: async () => ({ result: '' }), onStatus: () => {}, onMemory: () => {}, cancelled: () => false }),
    /چرخه/
  )
})

test('memory patches are applied across waves', async () => {
  const { n, e } = build()
  const nodes = [n('a', 'prompt'), n('m', 'memory'), n('r', 'text')]
  const edges = [e('a', 'm'), e('m', 'r')]
  let memory = {}
  await runGraph({
    nodes, edges, parallel: false, apiKey: '', memory,
    execute: async (node, input, _k, ctx) => {
      if (node.id === 'm') return { result: input, memoryPatch: { stored: input } }
      if (node.id === 'r') return { result: `saw:${ctx.memory.stored}` }
      return { result: 'hello' }
    },
    onStatus: () => {}, onMemory: (m) => { memory = m }, cancelled: () => false,
  })
  assert.equal(memory.stored, 'hello')
})
