/**
 * OAuth token exchange for hadi-canvas (GitHub + Figma + Canva).
 * Secrets stay on the server — never in the Vite bundle.
 */
import http from 'node:http'
import { URL } from 'node:url'

const PORT = Number(process.env.OAUTH_PORT || 8787)
const REDIRECT_URI = process.env.OAUTH_REDIRECT_URI || 'http://localhost:5173/oauth/callback'

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || ''
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || ''
const FIGMA_CLIENT_ID = process.env.FIGMA_CLIENT_ID || ''
const FIGMA_CLIENT_SECRET = process.env.FIGMA_CLIENT_SECRET || ''
const FIGMA_REDIRECT = process.env.FIGMA_REDIRECT_URI || REDIRECT_URI
const CANVA_CLIENT_ID = process.env.CANVA_CLIENT_ID || ''
const CANVA_CLIENT_SECRET = process.env.CANVA_CLIENT_SECRET || ''
const CANVA_REDIRECT = process.env.CANVA_REDIRECT_URI || REDIRECT_URI

function json(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })
  res.end(JSON.stringify(body))
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return json(res, 204, {})

  const url = new URL(req.url || '/', `http://127.0.0.1:${PORT}`)

  if (req.method === 'GET' && url.pathname === '/health') {
    return json(res, 200, {
      ok: true,
      githubConfigured: Boolean(GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET),
      figmaConfigured: Boolean(FIGMA_CLIENT_ID && FIGMA_CLIENT_SECRET),
      canvaConfigured: Boolean(CANVA_CLIENT_ID && CANVA_CLIENT_SECRET),
      redirectUri: REDIRECT_URI,
    })
  }

  // --- GitHub ---
  if (req.method === 'GET' && url.pathname === '/oauth/github/start') {
    if (!GITHUB_CLIENT_ID) return json(res, 400, { error: 'GITHUB_CLIENT_ID تنظیم نشده' })
    const state = url.searchParams.get('state') || `gh_${Math.random().toString(36).slice(2)}`
    const auth = new URL('https://github.com/login/oauth/authorize')
    auth.searchParams.set('client_id', GITHUB_CLIENT_ID)
    auth.searchParams.set('redirect_uri', REDIRECT_URI)
    auth.searchParams.set('scope', url.searchParams.get('scope') || 'read:user repo')
    auth.searchParams.set('state', state)
    return json(res, 200, { authorizeUrl: auth.toString(), state, provider: 'github' })
  }

  if (req.method === 'POST' && url.pathname === '/oauth/github/token') {
    if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
      return json(res, 400, { error: 'GITHUB_CLIENT_ID/SECRET روی سرور تنظیم نشده' })
    }
    const raw = await readBody(req)
    let code
    try {
      code = JSON.parse(raw).code
    } catch {
      return json(res, 400, { error: 'body نامعتبر' })
    }
    if (!code) return json(res, 400, { error: 'code لازم است' })
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: REDIRECT_URI,
      }),
    })
    const data = await tokenRes.json()
    if (data.error) return json(res, 400, { error: data.error_description || data.error })
    return json(res, 200, { access_token: data.access_token, provider: 'github' })
  }

  // --- Figma ---
  if (req.method === 'GET' && url.pathname === '/oauth/figma/start') {
    if (!FIGMA_CLIENT_ID) return json(res, 400, { error: 'FIGMA_CLIENT_ID تنظیم نشده' })
    const state = url.searchParams.get('state') || `fg_${Math.random().toString(36).slice(2)}`
    const auth = new URL('https://www.figma.com/oauth')
    auth.searchParams.set('client_id', FIGMA_CLIENT_ID)
    auth.searchParams.set('redirect_uri', FIGMA_REDIRECT)
    auth.searchParams.set('scope', url.searchParams.get('scope') || 'file_content:read')
    auth.searchParams.set('state', state)
    auth.searchParams.set('response_type', 'code')
    return json(res, 200, { authorizeUrl: auth.toString(), state, provider: 'figma' })
  }

  if (req.method === 'POST' && url.pathname === '/oauth/figma/token') {
    if (!FIGMA_CLIENT_ID || !FIGMA_CLIENT_SECRET) {
      return json(res, 400, { error: 'FIGMA_CLIENT_ID/SECRET روی سرور تنظیم نشده' })
    }
    const raw = await readBody(req)
    let code
    try {
      code = JSON.parse(raw).code
    } catch {
      return json(res, 400, { error: 'body نامعتبر' })
    }
    if (!code) return json(res, 400, { error: 'code لازم است' })
    const body = new URLSearchParams({
      client_id: FIGMA_CLIENT_ID,
      client_secret: FIGMA_CLIENT_SECRET,
      redirect_uri: FIGMA_REDIRECT,
      code,
      grant_type: 'authorization_code',
    })
    const tokenRes = await fetch('https://api.figma.com/v1/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    const data = await tokenRes.json()
    if (!data.access_token) return json(res, 400, { error: data.message || data.error || 'Figma token failed' })
    return json(res, 200, {
      access_token: data.access_token,
      expires_in: data.expires_in,
      provider: 'figma',
    })
  }

  // --- Canva (Authorization Code with PKCE-ready skeleton) ---
  if (req.method === 'GET' && url.pathname === '/oauth/canva/start') {
    if (!CANVA_CLIENT_ID) return json(res, 400, { error: 'CANVA_CLIENT_ID تنظیم نشده' })
    const state = url.searchParams.get('state') || `cv_${Math.random().toString(36).slice(2)}`
    // Canva uses https://www.canva.com/api/oauth/authorize
    const auth = new URL('https://www.canva.com/api/oauth/authorize')
    const challenge = url.searchParams.get('code_challenge')
    if (!challenge) return json(res, 400, { error: 'code_challenge (PKCE) لازم است' })
    auth.searchParams.set('code_challenge', challenge)
    auth.searchParams.set('code_challenge_method', url.searchParams.get('code_challenge_method') || 'S256')
    auth.searchParams.set('scope', url.searchParams.get('scope') || 'design:content:read')
    auth.searchParams.set('response_type', 'code')
    auth.searchParams.set('client_id', CANVA_CLIENT_ID)
    auth.searchParams.set('redirect_uri', CANVA_REDIRECT)
    auth.searchParams.set('state', state)
    return json(res, 200, {
      authorizeUrl: auth.toString(),
      state,
      provider: 'canva',
      note: 'PKCE S256 from client',
    })
  }

  if (req.method === 'POST' && url.pathname === '/oauth/canva/token') {
    if (!CANVA_CLIENT_ID || !CANVA_CLIENT_SECRET) {
      return json(res, 400, { error: 'CANVA_CLIENT_ID/SECRET روی سرور تنظیم نشده' })
    }
    const raw = await readBody(req)
    let payload
    try {
      payload = JSON.parse(raw)
    } catch {
      return json(res, 400, { error: 'body نامعتبر' })
    }
    if (!payload.code) return json(res, 400, { error: 'code لازم است' })
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: payload.code,
      redirect_uri: CANVA_REDIRECT,
      code_verifier: payload.code_verifier || '',
      client_id: CANVA_CLIENT_ID,
      client_secret: CANVA_CLIENT_SECRET,
    })
    const tokenRes = await fetch('https://api.canva.com/rest/v1/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    const data = await tokenRes.json()
    if (!data.access_token) {
      return json(res, 400, { error: data.error_description || data.error || 'Canva token failed' })
    }
    return json(res, 200, {
      access_token: data.access_token,
      expires_in: data.expires_in,
      provider: 'canva',
    })
  }

  json(res, 404, { error: 'not found' })
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[hadi-oauth] http://127.0.0.1:${PORT}`)
  console.log(`[hadi-oauth] GitHub: ${Boolean(GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET)}`)
  console.log(`[hadi-oauth] Figma: ${Boolean(FIGMA_CLIENT_ID && FIGMA_CLIENT_SECRET)}`)
  console.log(`[hadi-oauth] Canva: ${Boolean(CANVA_CLIENT_ID && CANVA_CLIENT_SECRET)}`)
})
