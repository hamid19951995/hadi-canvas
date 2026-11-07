const API = import.meta.env.VITE_OAUTH_API || 'http://127.0.0.1:8787'
const CLIENT_ID = import.meta.env.VITE_FIGMA_CLIENT_ID || ''

export function isFigmaOAuthConfigured() {
  return Boolean(CLIENT_ID)
}

export async function startFigmaOAuth(): Promise<{ authorizeUrl: string; state: string }> {
  const r = await fetch(`${API}/oauth/figma/start`)
  const j = await r.json()
  if (!r.ok) throw new Error(j.error || 'شروع OAuth فigma ناموفق')
  sessionStorage.setItem('hadi_oauth_state', j.state)
  sessionStorage.setItem('hadi_oauth_provider', 'figma')
  return j
}

export async function exchangeFigmaCode(code: string): Promise<{ access_token: string; expires_in?: number }> {
  const r = await fetch(`${API}/oauth/figma/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  })
  const j = await r.json()
  if (!r.ok) throw new Error(j.error || 'تبادل code فigma ناموفق')
  if (!j.access_token) throw new Error('access_token فigma دریافت نشد')
  return j
}
