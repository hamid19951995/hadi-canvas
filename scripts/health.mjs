#!/usr/bin/env node
/** Print health for the broker and account API. Exit 1 if a required service is down. */
const targets = [
  ['oauth-broker', process.env.VITE_OAUTH_API || 'http://127.0.0.1:8787'],
  ['auth-api', process.env.VITE_AUTH_API || 'http://127.0.0.1:8788'],
]

let failed = false
for (const [name, base] of targets) {
  const url = `${base.replace(/\/$/, '')}/health`
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    const body = await res.json().catch(() => ({}))
    console.log(`${res.ok ? '✓' : '✗'} ${name} ${url} → ${res.status} ${JSON.stringify(body)}`)
    if (!res.ok) failed = true
  } catch (error) {
    console.log(`✗ ${name} ${url} → unreachable (${error.message})`)
    failed = true
  }
}
process.exit(failed ? 1 : 0)
