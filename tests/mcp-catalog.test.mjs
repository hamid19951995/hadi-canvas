import test from 'node:test'
import assert from 'node:assert/strict'
import { MCP_CATALOG, getCatalogEntry } from '../server/mcp/catalog.mjs'

test('MCP catalog has unique providers and secure remote endpoints', () => {
  const ids = MCP_CATALOG.map(item => item.id)
  assert.equal(new Set(ids).size, ids.length)
  for (const item of MCP_CATALOG) {
    assert.match(item.endpoint, /^https:\/\//)
    assert.equal(item.transport, 'streamable-http')
    assert.ok(item.docs.startsWith('https://'))
  }
})

test('unknown providers cannot be resolved', () => {
  assert.equal(getCatalogEntry('unknown-provider'), null)
})

test('Supabase catalog entry is explicitly a project-specific template', () => {
  assert.match(getCatalogEntry('supabase').endpoint, /\{project-ref\}/)
})
