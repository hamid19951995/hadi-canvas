import test from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { encryptSecret, decryptSecret } from '../server/mcp/crypto.mjs'

const key = randomBytes(32).toString('base64')

test('MCP credentials round-trip using authenticated encryption', () => {
  const encrypted = encryptSecret('test-token-value', key)
  assert.notEqual(encrypted.data, Buffer.from('test-token-value').toString('base64'))
  assert.equal(decryptSecret(encrypted, key), 'test-token-value')
})

test('tampered MCP credentials fail authentication', () => {
  const encrypted = encryptSecret('test-token-value', key)
  encrypted.data = Buffer.from('tampered').toString('base64')
  assert.throws(() => decryptSecret(encrypted, key))
})

test('MCP encryption rejects missing or invalid keys', () => {
  assert.throws(() => encryptSecret('token', 'bad-key'))
  assert.throws(() => encryptSecret(''))
})
