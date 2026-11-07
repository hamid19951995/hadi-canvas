import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const api = await readFile(new URL('../server/auth/api.mjs', import.meta.url), 'utf8')
const ui = await readFile(new URL('../src/components/UserMenu.tsx', import.meta.url), 'utf8')
const schema = await readFile(new URL('../server/db/identity-auth.sql', import.meta.url), 'utf8')

test('auth API exposes registration, login, current-session and logout routes', () => {
  for (const route of ['/api/auth/register', '/api/auth/login', '/api/auth/me', '/api/auth/logout']) assert.ok(api.includes(route))
})
test('auth API uses password hashing, opaque session cookies and server-side session revocation', () => {
  assert.match(api, /hashPassword\(/)
  assert.match(api, /verifyPassword\(/)
  assert.match(api, /HttpOnly/)
  assert.match(api, /SameSite=\$\{COOKIE_SAMESITE\}/)
  assert.match(api, /'Lax'/)
  assert.match(api, /token_hash/)
  assert.match(api, /revoked_at = now\(\)/)
})
test('auth API limits body size and checks request origins', () => {
  assert.match(api, /MAX_BODY/)
  assert.match(api, /checkOrigin\(req\)/)
  assert.match(api, /AUTH_ALLOWED_ORIGINS/)
})
test('account UI calls real auth endpoints instead of localStorage fake login', () => {
  assert.match(ui, /\$\{AUTH_API\}\/api\/auth\/\$\{mode\}/)
  assert.match(ui, /setMode\('login'\)/)
  assert.match(ui, /setMode\('register'\)/)
  assert.match(ui, /credentials: 'include'/)
  assert.doesNotMatch(ui, /localStorage\.setItem\('hadi_session'/)
})
test('PostgreSQL schema contains users, workspaces, memberships and revocable sessions', () => {
  for (const table of ['app_users', 'workspaces', 'workspace_memberships', 'user_sessions']) assert.match(schema, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`))
  assert.match(schema, /token_hash bytea NOT NULL UNIQUE/)
  assert.match(schema, /revoked_at timestamptz/)
})
