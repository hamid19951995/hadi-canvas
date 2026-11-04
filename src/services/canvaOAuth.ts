const API = import.meta.env.VITE_OAUTH_API || 'http://127.0.0.1:8787'

function randomString(len = 64) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  const arr = new Uint8Array(len)
  crypto.getRandomValues(arr)
  return Array.from(arr, (b) => chars[b % chars.length]).join('')
}

async function sha256Base64Url(plain: string) {
  const data = new TextEncoder().encode(plain)
  const hash = await crypto.subtle.digest('SHA-256', data)
  const bytes = new Uint8Array(hash)
  let str = ''
  bytes.forEach((b) => {
    str += String.fromCharCode(b)
  })
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function startCanvaOAuth(): Promise<{ authorizeUrl: string; state: string }> {
  const verifier = randomString(64)
  const challenge = await sha256Base64Url(verifier)
  sessionStorage.setItem('hadi_canva_verifier', verifier)

  const r = await fetch(
    `${API}/oauth/canva/start?code_challenge=${encodeURIComponent(challenge)}&code_challenge_method=S256`
  )
  const j = await r.json()
  if (!r.ok) throw new Error(j.error || 'شروع OAuth Canva ناموفق')
  sessionStorage.setItem('hadi_oauth_state', j.state)
  sessionStorage.setItem('hadi_oauth_provider', 'canva')
  return j
}

export async function exchangeCanvaCode(code: string): Promise<{ access_token: string; expires_in?: number }> {
  const code_verifier = sessionStorage.getItem('hadi_canva_verifier') || ''
  if (!code_verifier) {
    throw new Error('code_verifier یافت نشد. جریان OAuth را از نو شروع کنید.')
  }
  const r = await fetch(`${API}/oauth/canva/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, code_verifier }),
  })
  const j = await r.json()
  if (!r.ok) throw new Error(j.error || 'تبادل code Canva ناموفق')
  if (!j.access_token) throw new Error('access_token Canva دریافت نشد')
  sessionStorage.removeItem('hadi_canva_verifier')
  return j
}

export function isCanvaOAuthConfigured() {
  return Boolean(import.meta.env.VITE_CANVA_CLIENT_ID || import.meta.env.VITE_OAUTH_API)
}
