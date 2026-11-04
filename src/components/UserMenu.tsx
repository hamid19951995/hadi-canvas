import { useEffect, useState } from 'react'
import { loadConnectorStates } from '../services/connectors'

const ACCOUNT_KEY = 'hadi_account_profile'

type Profile = { name: string; email: string }

function loadProfile(): Profile {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNT_KEY) || '{"name":"","email":""}')
  } catch {
    return { name: '', email: '' }
  }
}

export function UserMenu() {
  const [open, setOpen] = useState(false)
  const [profile, setProfile] = useState<Profile>(loadProfile)
  const [loggedIn, setLoggedIn] = useState(() => Boolean(localStorage.getItem('hadi_session')))
  const states = loadConnectorStates()
  const connected = states.filter((s) => s.status === 'connected').length

  useEffect(() => {
    if (!open) return
    setProfile(loadProfile())
  }, [open])

  const save = () => {
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(profile))
    setOpen(false)
  }

  const login = () => {
    localStorage.setItem('hadi_session', new Date().toISOString())
    setLoggedIn(true)
  }

  const logout = () => {
    localStorage.removeItem('hadi_session')
    setLoggedIn(false)
  }

  return (
    <div className="relative" dir="rtl">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 hover:border-violet-500"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-[10px] font-bold text-white">
          {(profile.name || 'U').slice(0, 1).toUpperCase()}
        </span>
        <span className="hidden sm:inline">{loggedIn ? profile.name || 'حساب' : 'ورود'}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-2xl border border-slate-700 bg-slate-950 p-3 shadow-2xl">
            <div className="mb-2 text-xs font-semibold text-white">حساب کاربری</div>
            <p className="mb-2 text-[10px] text-slate-500">{connected} اتصال‌دهنده فعال</p>
            <label className="mb-1 block text-[10px] text-slate-400">نام</label>
            <input
              className="mb-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              placeholder="نام نمایشی"
            />
            <label className="mb-1 block text-[10px] text-slate-400">ایمیل</label>
            <input
              className="mb-3 w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              placeholder="email@example.com"
            />
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={save} className="rounded-lg bg-violet-600 px-3 py-1.5 text-[11px] text-white">
                ذخیره
              </button>
              {loggedIn ? (
                <button type="button" onClick={logout} className="rounded-lg bg-slate-800 px-3 py-1.5 text-[11px]">
                  خروج
                </button>
              ) : (
                <button type="button" onClick={login} className="rounded-lg bg-emerald-700 px-3 py-1.5 text-[11px] text-white">
                  ورود محلی
                </button>
              )}
            </div>
            <p className="mt-2 text-[10px] text-slate-600">ورود محلی روی این دستگاه است. OAuth سرویس‌ها از تب افزونه‌ها.</p>
          </div>
        </>
      )}
    </div>
  )
}
