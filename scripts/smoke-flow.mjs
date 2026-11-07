#!/usr/bin/env node
/**
 * Real end-to-end smoke flow against a running OAuth broker / auth API.
 * Usage: BASE_URL=http://127.0.0.1:5173 npm run smoke:flow
 * It checks: UI is served, broker health, auth health and (when DATABASE_URL + credentials exist)
 * register → me → logout → login → me using a throwaway account.
 */
const ui = (process.env.SMOKE_UI_URL || 'http://127.0.0.1:5173').replace(/\/$/, '')
const auth = (process.env.VITE_AUTH_API || 'http://127.0.0.1:8788').replace(/\/$/, '')
const broker = (process.env.VITE_OAUTH_API || 'http://127.0.0.1:8787').replace(/\/$/, '')
const results = []

async function step(name, fn, { required = true } = {}) {
  try {
    const detail = await fn()
    results.push({ name, ok: true, detail, required })
    console.log(`✓ ${name}${detail ? ` — ${detail}` : ''}`)
  } catch (error) {
    results.push({ name, ok: false, error: error.message, required })
    console.log(`${required ? '✗' : '·'} ${name} — ${error.message}`)
  }
}

async function getJson(url, options = {}) {
  const res = await fetch(url, options)
  const text = await res.text()
  let body = null
  try { body = JSON.parse(text) } catch { /* html */ }
  return { res, body, text }
}

await step('UI is served', async () => {
  const { res, text } = await getJson(ui)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  if (!/<div id="root">/.test(text)) throw new Error('index.html is missing the React root')
  return `${res.status}`
})

await step('OAuth broker health', async () => {
  const { res, body } = await getJson(`${broker}/health`)
  if (!res.ok || body?.ok !== true) throw new Error(`HTTP ${res.status}`)
  return `github=${body.githubConfigured} figma=${body.figmaConfigured} canva=${body.canvaConfigured}`
}, { required: Boolean(process.env.EXPECT_BROKER) })

await step('Account API health', async () => {
  const { res, body } = await getJson(`${auth}/health`)
  if (!res.ok || body?.ok !== true) throw new Error(`HTTP ${res.status}`)
  return body.service
}, { required: Boolean(process.env.DATABASE_URL) })

if (process.env.DATABASE_URL) {
  const email = `smoke-${Date.now()}@example.test`
  const password = 'smoke-test-password-123'
  const jar = new Map()
  const cookieHeader = () => [...jar].map(([k, v]) => `${k}=${v}`).join('; ')
  const capture = (res) => {
    const raw = res.headers.getSetCookie?.() || []
    for (const line of raw.length ? raw : [res.headers.get('set-cookie') || ''] ) {
      const [pair] = line.split(';')
      const idx = pair.indexOf('=')
      if (idx > 0) jar.set(pair.slice(0, idx), pair.slice(idx + 1))
    }
  }
  const origin = { Origin: ui, 'Content-Type': 'application/json' }

  await step('register a throwaway account', async () => {
    const { res, body } = await getJson(`${auth}/api/auth/register`, {
      method: 'POST', headers: origin,
      body: JSON.stringify({ email, password, name: 'Smoke Test' }),
    })
    capture(res)
    if (res.status !== 201) throw new Error(body?.error || `HTTP ${res.status}`)
    return body.user?.email
  })

  await step('GET /api/auth/me with the session cookie', async () => {
    const { res, body } = await getJson(`${auth}/api/auth/me`, { headers: { Cookie: cookieHeader(), Origin: ui } })
    if (!res.ok || body?.user?.email !== email) throw new Error(body?.error || `HTTP ${res.status}`)
    return body.user.email
  })

  await step('logout revokes the session', async () => {
    const { res } = await getJson(`${auth}/api/auth/logout`, { method: 'POST', headers: { ...origin, Cookie: cookieHeader() } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
  })

  await step('login again', async () => {
    const { res, body } = await getJson(`${auth}/api/auth/login`, {
      method: 'POST', headers: origin, body: JSON.stringify({ email, password }),
    })
    capture(res)
    if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`)
    return body.user?.email
  })
}

const failed = results.filter((r) => r.required && !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
if (failed.length) process.exit(1)
