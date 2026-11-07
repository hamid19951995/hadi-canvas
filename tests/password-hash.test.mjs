import test from 'node:test'
import assert from 'node:assert/strict'
import { hashPassword, verifyPassword } from '../server/auth/password.mjs'

test('passwords are salted, hashed and verified without storing plaintext', async () => {
  const first = await hashPassword('correct horse battery staple')
  const second = await hashPassword('correct horse battery staple')
  assert.notEqual(first, second)
  assert.notEqual(first, 'correct horse battery staple')
  assert.equal(await verifyPassword('correct horse battery staple', first), true)
  assert.equal(await verifyPassword('wrong password value', first), false)
})
test('password policy and malformed hashes are rejected', async () => {
  await assert.rejects(hashPassword('short'), /12 to 128/)
  assert.equal(await verifyPassword('any password', 'invalid$hash'), false)
})
