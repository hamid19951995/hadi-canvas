import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const api = readFileSync(new URL('../server/auth/api.mjs', import.meta.url), 'utf8')
const vite = readFileSync(new URL('../vite.config.ts', import.meta.url), 'utf8')
const userMenu = readFileSync(new URL('../src/components/UserMenu.tsx', import.meta.url), 'utf8')

test('session cookie defaults to Lax and is configurable', () => {
  assert.match(api, /AUTH_COOKIE_SAMESITE \|\| ''\)\.trim\(\) \|\| 'Lax'/)
  assert.match(api, /SameSite=\$\{COOKIE_SAMESITE\}/)
})

test('Secure is only forced for production or explicit HTTPS', () => {
  assert.match(api, /FORCE_SECURE/)
  assert.match(api, /IS_HTTPS/)
  assert.match(api, /COOKIE_SECURE = FORCE_SECURE \|\| \(COOKIE_SAMESITE\.toLowerCase\(\) === 'none' && IS_HTTPS\)/)
})

test('Vite proxies the account API so browser cookies stay same-origin', () => {
  assert.match(vite, /'\/api\/auth'/)
  assert.match(vite, /'\/api\/mcp'/)
  assert.match(vite, /preview: \{ proxy \}/)
})

test('account UI defaults to the same origin instead of a hard-coded port', () => {
  assert.match(userMenu, /import \{ AUTH_API_BASE, loadConnectorStates \}/)
  assert.match(userMenu, /const AUTH_API = AUTH_API_BASE/)
  assert.doesNotMatch(userMenu, /'http:\/\/127\.0\.0\.1:8788'/)
})

test('health reports a real database probe and can fail', () => {
  assert.match(api, /database: 'reachable'/)
  assert.match(api, /database: 'unreachable'/)
  assert.match(api, /return send\(res, 503/)
})

test('public registration can be disabled for release', () => {
  assert.match(api, /AUTH_ALLOW_REGISTRATION === '0'/)
})

test('rate limiter is bounded', () => {
  assert.match(api, /attempts\.size > 10_000/)
})
