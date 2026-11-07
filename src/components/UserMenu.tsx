import { useEffect, useState, type FormEvent } from 'react'
import { AUTH_API_BASE, loadConnectorStates } from '../services/connectors'

type User = { id: string; email: string; display_name: string }
const AUTH_API = AUTH_API_BASE

export function UserMenu() {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [user, setUser] = useState<User | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const states = loadConnectorStates()
  const connected = states.filter((s) => s.status === 'connected').length

  const refresh = async () => {
    try {
      const response = await fetch(`${AUTH_API}/api/auth/me`, { credentials: 'include' })
      if (!response.ok) { setUser(null); return }
      const data = await response.json()
      setUser(data.user ? { id: data.user.id, email: data.user.email, display_name: data.user.display_name } : null)
    } catch { setUser(null) }
  }
  useEffect(() => { void refresh() }, [])

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError('')
    try {
      const response = await fetch(`${AUTH_API}/api/auth/${mode}`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'ورود ناموفق بود')
      setUser(data.user); setPassword(''); setOpen(false)
    } catch (e) { setError(e instanceof Error ? e.message : 'ارتباط با سرور احراز هویت برقرار نشد') }
    finally { setBusy(false) }
  }
  const logout = async () => {
    try { await fetch(`${AUTH_API}/api/auth/logout`, { method: 'POST', credentials: 'include' }) } finally { setUser(null) }
  }

  return (
    <div className="relative" dir="rtl">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 hover:border-violet-500">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-[10px] font-bold text-white">{(user?.display_name || 'U').slice(0, 1).toUpperCase()}</span>
        <span className="hidden sm:inline">{user ? user.display_name || user.email : 'ورود / ثبت‌نام'}</span>
      </button>
      {open && <>
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
        <div className="absolute left-0 top-full z-50 mt-2 w-80 rounded-2xl border border-slate-700 bg-slate-950 p-4 shadow-2xl">
          <div className="mb-2 text-xs font-semibold text-white">حساب کاربری</div>
          <p className="mb-3 text-[10px] text-slate-500">{connected} اتصال‌دهنده فعال · حساب ابری</p>
          {user ? <>
            <p className="text-xs text-white">{user.display_name}</p><p className="mb-3 text-[11px] text-slate-400">{user.email}</p>
            <button type="button" onClick={() => void logout()} className="rounded-lg bg-slate-800 px-3 py-2 text-[11px] text-white">خروج از حساب</button>
          </> : <>
            <div className="mb-3 flex gap-2">
              <button type="button" onClick={() => { setMode('login'); setError('') }} className={`rounded-lg px-3 py-1.5 text-[11px] ${mode === 'login' ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-300'}`}>ورود</button>
              <button type="button" onClick={() => { setMode('register'); setError('') }} className={`rounded-lg px-3 py-1.5 text-[11px] ${mode === 'register' ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-300'}`}>ثبت‌نام</button>
            </div>
            <form onSubmit={(e) => void submit(e)} className="space-y-2">
              {mode === 'register' && <input required minLength={2} maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="نام نمایشی" className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-xs text-white" />}
              <input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ایمیل" className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-xs text-white" />
              <input required type="password" minLength={mode === 'register' ? 12 : 1} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === 'register' ? 'رمز عبور (حداقل ۱۲ نویسه)' : 'رمز عبور'} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-xs text-white" />
              {error && <p role="alert" className="text-[11px] text-rose-400">{error}</p>}
              <button disabled={busy} type="submit" className="w-full rounded-lg bg-violet-600 px-3 py-2 text-[11px] text-white disabled:opacity-50">{busy ? 'در حال بررسی…' : mode === 'login' ? 'ورود امن' : 'ایجاد حساب'}</button>
            </form>
            <p className="mt-3 text-[10px] leading-5 text-amber-400">تأیید ایمیل و بازیابی رمز عبور هنوز پیکربندی نشده‌اند؛ این نسخه برای محیط آزمایشی است.</p>
          </>}
        </div>
      </>}
    </div>
  )
}
