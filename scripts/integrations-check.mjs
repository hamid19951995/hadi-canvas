#!/usr/bin/env node
/**
 * Verifies that the configured integrations are actually reachable.
 * Usage: npm run integrations:check
 * Exit code 0 = every configured integration is healthy, 1 = at least one configured integration failed.
 */
const oauthApi = (process.env.VITE_OAUTH_API || 'http://127.0.0.1:8787').replace(/\/$/, '')
const authApi = (process.env.VITE_AUTH_API || 'http://127.0.0.1:8788').replace(/\/$/, '')

async function probe(name, url, validate = () => true) {
  const started = Date.now()
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timer)
    const text = await res.text()
    let body = null
    try { body = JSON.parse(text) } catch { /* non-JSON is fine */ }
    const ok = res.ok && validate(body)
    return { name, url, ok: Boolean(ok), status: res.status, ms: Date.now() - started, detail: body }
  } catch (error) {
    return { name, url, ok: false, status: 0, ms: Date.now() - started, error: error.name === 'AbortError' ? 'timeout' : error.message }
  }
}

const results = []
results.push(await probe('oauth-broker', `${oauthApi}/health`, (body) => body?.ok === true))
results.push(await probe('auth-api', `${authApi}/health`, (body) => body?.ok === true))

const envChecks = [
  ['GITHUB_CLIENT_ID', 'GitHub OAuth'],
  ['FIGMA_CLIENT_ID', 'Figma OAuth'],
  ['CANVA_CLIENT_ID', 'Canva OAuth'],
  ['DATABASE_URL', 'PostgreSQL identity'],
  ['MCP_TOKEN_ENCRYPTION_KEY', 'MCP credential encryption'],
]

const configured = envChecks.map(([key, label]) => ({ label, key, set: Boolean(process.env[key]) }))
for (const item of configured) console.log(`${item.set ? '✓' : '·'} ${item.label}: ${item.set ? 'configured' : 'not configured (optional unless you use it)'}`)

let failed = false
for (const r of results) {
  console.log(`${r.ok ? '✓' : '✗'} ${r.name}: ${r.url} → ${r.status || r.error} (${r.ms}ms)`)
  if (!r.ok) failed = true
}

// The broker is optional; only fail when it is expected to be running.
if (failed && results.every((r) => r.status === 0)) {
  console.log('\nHint: start `npm run oauth` (broker) and `npm run auth` (account API) first.')
}
process.exit(failed ? 1 : 0)
