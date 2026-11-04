const API = import.meta.env.VITE_OAUTH_API || 'http://127.0.0.1:8787'
const CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || ''

export function isGithubOAuthConfigured() {
  return Boolean(CLIENT_ID)
}

export async function checkOAuthServer(): Promise<{ ok: boolean; githubConfigured?: boolean; figmaConfigured?: boolean; canvaConfigured?: boolean; error?: string }> {
  try {
    const r = await fetch(`${API}/health`)
    if (!r.ok) return { ok: false, error: 'سرور OAuth پاسخ نداد' }
    const j = await r.json()
    return { ok: true, githubConfigured: j.githubConfigured, figmaConfigured: j.figmaConfigured, canvaConfigured: j.canvaConfigured }
  } catch {
    return { ok: false, error: 'سرور OAuth روی پورت 8787 در دسترس نیست. npm run oauth را اجرا کنید.' }
  }
}

export async function startGithubOAuth(): Promise<{ authorizeUrl: string; state: string }> {
  const r = await fetch(`${API}/oauth/github/start`)
  const j = await r.json()
  if (!r.ok) throw new Error(j.error || 'شروع OAuth ناموفق')
  sessionStorage.setItem('hadi_oauth_state', j.state)
  sessionStorage.setItem('hadi_oauth_provider', 'github')
  return j
}

export async function exchangeGithubCode(code: string): Promise<string> {
  const r = await fetch(`${API}/oauth/github/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  })
  const j = await r.json()
  if (!r.ok) throw new Error(j.error || 'تبادل code ناموفق')
  if (!j.access_token) throw new Error('access_token دریافت نشد')
  return j.access_token as string
}

export function githubAuthorizeUrlDirect() {
  if (!CLIENT_ID) return null
  const redirect = `${window.location.origin}/oauth/callback`
  const state = Math.random().toString(36).slice(2)
  sessionStorage.setItem('hadi_oauth_state', state)
  const u = new URL('https://github.com/login/oauth/authorize')
  u.searchParams.set('client_id', CLIENT_ID)
  u.searchParams.set('redirect_uri', redirect)
  u.searchParams.set('scope', 'read:user repo')
  u.searchParams.set('state', state)
  return u.toString()
}
