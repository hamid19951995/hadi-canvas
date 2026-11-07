import { useEffect, useState } from 'react'
import { exchangeGithubCode } from '../services/githubOAuth'
import { exchangeFigmaCode } from '../services/figmaOAuth'
import { exchangeCanvaCode } from '../services/canvaOAuth'
import { connectWithOAuthToken } from '../services/connectors'

export function OAuthCallbackPage() {
  const [msg, setMsg] = useState('در حال تکمیل OAuth…')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')
    const expected = sessionStorage.getItem('hadi_oauth_state')
    let provider = sessionStorage.getItem('hadi_oauth_provider') || 'github'
    if (state?.startsWith('fg_')) provider = 'figma'
    if (state?.startsWith('gh_')) provider = 'github'
    if (state?.startsWith('cv_')) provider = 'canva'

    if (!code) {
      setMsg('code در URL نیست.')
      return
    }
    if (!expected) {
      setMsg('جریان OAuth در این مرورگر شروع نشده بود؛ state قابل بررسی نیست. دوباره از داخل برنامه Connect کنید.')
      return
    }
    if (expected !== state) {
      setMsg('state نامعتبر است. دوباره تلاش کنید.')
      return
    }

    const run = async () => {
      if (provider === 'canva') {
        const tok = await exchangeCanvaCode(code)
        const exp = tok.expires_in
          ? new Date(Date.now() + tok.expires_in * 1000).toISOString()
          : undefined
        connectWithOAuthToken('canva', tok.access_token, { expiresAt: exp })
        setMsg('Canva متصل شد. در حال بازگشت…')
      } else if (provider === 'figma') {
        const tok = await exchangeFigmaCode(code)
        const exp = tok.expires_in
          ? new Date(Date.now() + tok.expires_in * 1000).toISOString()
          : undefined
        connectWithOAuthToken('figma', tok.access_token, { expiresAt: exp })
        setMsg('Figma متصل شد. در حال بازگشت…')
      } else {
        const token = await exchangeGithubCode(code)
        connectWithOAuthToken('github', token)
        setMsg('GitHub متصل شد. در حال بازگشت…')
      }
      sessionStorage.removeItem('hadi_oauth_provider')
      setTimeout(() => {
        window.location.href = '/'
      }, 800)
    }

    run().catch((e: Error) => setMsg(e.message || 'خطا'))
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b1220] p-6 text-slate-100" dir="rtl">
      <div className="max-w-md rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-sm">{msg}</div>
    </div>
  )
}
