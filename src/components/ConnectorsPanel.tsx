import { useEffect, useState } from 'react'
import {
  CONNECTOR_CATALOG,
  connectWithApiKey,
  disconnectConnector,
  loadConnectorStates,
  type ConnectorId,
  type ConnectorState,
} from '../services/connectors'
import {
  checkOAuthServer,
  isGithubOAuthConfigured,
  startGithubOAuth,
  githubAuthorizeUrlDirect,
} from '../services/githubOAuth'
import { validateGithubConnection } from '../services/githubApi'

export function ConnectorsPanel() {
  const [states, setStates] = useState<ConnectorState[]>([])
  const [keys, setKeys] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState('')

  const refresh = () => setStates(loadConnectorStates())

  useEffect(() => {
    refresh()
  }, [])

  const statusOf = (id: ConnectorId) => states.find((s) => s.id === id)

  const statusLabel = (s?: ConnectorState) => {
    if (!s) return 'قطع'
    if (s.status === 'connected') return 'متصل'
    if (s.status === 'expired') return 'منقضی'
    if (s.status === 'error') return 'خطا'
    return 'قطع'
  }

  const statusClass = (s?: ConnectorState) => {
    if (s?.status === 'connected') return 'text-emerald-400'
    if (s?.status === 'expired') return 'text-amber-400'
    if (s?.status === 'error') return 'text-red-400'
    return 'text-slate-500'
  }

  return (
    <div dir="rtl">
      <h1 className="mb-2 text-lg text-white">اتصال‌دهنده‌ها</h1>
      <p className="mb-4 text-xs text-slate-400">
        هر اتصال سهمیه/دسترسی حساب شماست. کلید در مرورگر شما می‌ماند و به سرور hadi-canvas فرستاده نمی‌شود مگر برای
        درخواست مستقیم به همان سرویس.
      </p>
      {msg && <p className="mb-3 text-xs text-violet-300">{msg}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        {CONNECTOR_CATALOG.map((c) => {
          const st = statusOf(c.id)
          return (
            <div key={c.id} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-medium text-white">{c.label}</div>
                  <div className="mt-0.5 text-[11px] text-slate-400">{c.description}</div>
                </div>
                <span className={`text-[11px] font-medium ${statusClass(st)}`}>{statusLabel(st)}</span>
              </div>
              <p className="mt-2 text-[10px] text-slate-500">{c.scopesNote}</p>
              {st?.hint && st.status === 'connected' && (
                <p className="mt-1 text-[10px] text-slate-500">نشانه کلید: {st.hint}</p>
              )}
              {st?.message && <p className="mt-1 text-[10px] text-amber-300">{st.message}</p>}

              {c.auth === 'api_key' ? (
                <div className="mt-3 space-y-2">
                  {st?.status !== 'connected' && (
                    <>
                      <input
                        type="password"
                        placeholder="کلید API"
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs"
                        value={keys[c.id] || ''}
                        onChange={(e) => setKeys((k) => ({ ...k, [c.id]: e.target.value }))}
                      />
                      <button
                        type="button"
                        className="w-full rounded-lg bg-violet-600 py-1.5 text-xs text-white"
                        onClick={() => {
                          const r = connectWithApiKey(c.id, keys[c.id] || '')
                          setMsg(r.status === 'connected' ? `${c.label} متصل شد` : r.message || 'خطا')
                          refresh()
                        }}
                      >
                        اتصال
                      </button>
                    </>
                  )}
                  {st?.status === 'connected' && (
                    <button
                      type="button"
                      className="w-full rounded-lg border border-slate-600 py-1.5 text-xs text-slate-300"
                      onClick={() => {
                        disconnectConnector(c.id)
                        setMsg(`${c.label} قطع شد`)
                        refresh()
                      }}
                    >
                      قطع اتصال
                    </button>
                  )}
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {c.id === 'github' ? (
                    <>
                      {st?.status === 'connected' ? (
                        <div className="space-y-2">
                          <button
                            type="button"
                            className="w-full rounded-lg bg-slate-800 py-1.5 text-xs text-slate-200"
                            onClick={async () => {
                              try {
                                const u = await validateGithubConnection()
                                setMsg(`معتبر: @${u.login}`)
                                refresh()
                              } catch (e: unknown) {
                                setMsg(e instanceof Error ? e.message : 'اعتبارسنجی ناموفق')
                                refresh()
                              }
                            }}
                          >
                            بررسی حساب GitHub
                          </button>
                          <button
                            type="button"
                            className="w-full rounded-lg border border-slate-600 py-1.5 text-xs text-slate-300"
                            onClick={() => {
                              disconnectConnector(c.id)
                              setMsg('GitHub قطع شد')
                              refresh()
                            }}
                          >
                            قطع اتصال
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="w-full rounded-lg bg-emerald-600 py-1.5 text-xs text-white"
                          onClick={async () => {
                            try {
                              const health = await checkOAuthServer()
                              if (!health.ok) {
                                setMsg(health.error || 'سرور OAuth در دسترس نیست')
                                return
                              }
                              if (!health.githubConfigured && !isGithubOAuthConfigured()) {
                                setMsg(
                                  'GITHUB_CLIENT_ID/SECRET را در .env بگذارید و npm run oauth را اجرا کنید. راهنما در README.'
                                )
                                return
                              }
                              try {
                                sessionStorage.setItem('hadi_oauth_provider', 'github')
                                const { authorizeUrl } = await startGithubOAuth()
                                window.location.href = authorizeUrl
                              } catch {
                                const direct = githubAuthorizeUrlDirect()
                                if (direct) window.location.href = direct
                                else setMsg('پیکربندی OAuth ناقص است')
                              }
                            } catch (e: unknown) {
                              setMsg(e instanceof Error ? e.message : 'خطای OAuth')
                            }
                          }}
                        >
                          ورود با GitHub (OAuth)
                        </button>
                      )}
                      <p className="text-[10px] text-slate-500">
                        نیاز به سرور محلی: <code className="text-slate-400">npm run oauth</code> + اپ OAuth در
                        GitHub با callback{' '}
                        <code className="text-slate-400">http://localhost:5173/oauth/callback</code>
                      </p>
                    </>
                  ) : c.id === 'figma' ? (
                    <>
                      {st?.status === 'connected' ? (
                        <div className="space-y-2">
                          <button
                            type="button"
                            className="w-full rounded-lg bg-slate-800 py-1.5 text-xs text-slate-200"
                            onClick={async () => {
                              try {
                                const { validateFigmaConnection } = await import('../services/figmaApi')
                                const me = await validateFigmaConnection()
                                setMsg(`Figma: ${me.handle || me.email || me.id}`)
                                refresh()
                              } catch (e: unknown) {
                                setMsg(e instanceof Error ? e.message : 'اعتبارسنجی Figma ناموفق')
                              }
                            }}
                          >
                            بررسی حساب Figma
                          </button>
                          <button
                            type="button"
                            className="w-full rounded-lg border border-slate-600 py-1.5 text-xs text-slate-300"
                            onClick={() => {
                              disconnectConnector(c.id)
                              setMsg('Figma قطع شد')
                              refresh()
                            }}
                          >
                            قطع اتصال
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="w-full rounded-lg bg-emerald-600 py-1.5 text-xs text-white"
                          onClick={async () => {
                            try {
                              const health = await checkOAuthServer()
                              if (!health.ok) {
                                setMsg(health.error || 'سرور OAuth در دسترس نیست')
                                return
                              }
                              if (!(health as { figmaConfigured?: boolean }).figmaConfigured) {
                                setMsg('FIGMA_CLIENT_ID/SECRET را در .env بگذارید و npm run oauth را اجرا کنید.')
                                return
                              }
                              const { startFigmaOAuth } = await import('../services/figmaOAuth')
                              const { authorizeUrl } = await startFigmaOAuth()
                              window.location.href = authorizeUrl
                            } catch (e: unknown) {
                              setMsg(e instanceof Error ? e.message : 'خطای OAuth فigma')
                            }
                          }}
                        >
                          ورود با Figma (OAuth)
                        </button>
                      )}
                      <p className="text-[10px] text-slate-500">
                        در Figma → Settings → Apps یک OAuth app بسازید. Callback همان
                        http://localhost:5173/oauth/callback
                      </p>
                    </>
                  ) : c.id === 'canva' ? (
                    <>
                      {st?.status === 'connected' ? (
                        <button
                          type="button"
                          className="w-full rounded-lg border border-slate-600 py-1.5 text-xs text-slate-300"
                          onClick={() => {
                            disconnectConnector(c.id)
                            setMsg('Canva قطع شد')
                            refresh()
                          }}
                        >
                          قطع اتصال
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="w-full rounded-lg bg-emerald-600 py-1.5 text-xs text-white"
                          onClick={async () => {
                            try {
                              const health = await checkOAuthServer()
                              if (!health.ok) {
                                setMsg(health.error || 'سرور OAuth در دسترس نیست')
                                return
                              }
                              if (!(health as { canvaConfigured?: boolean }).canvaConfigured) {
                                setMsg('CANVA_CLIENT_ID/SECRET را در .env بگذارید و npm run oauth را اجرا کنید.')
                                return
                              }
                              const { startCanvaOAuth } = await import('../services/canvaOAuth')
                              const { authorizeUrl } = await startCanvaOAuth()
                              window.location.href = authorizeUrl
                            } catch (e: unknown) {
                              setMsg(e instanceof Error ? e.message : 'خطای OAuth Canva')
                            }
                          }}
                        >
                          ورود با Canva (OAuth)
                        </button>
                      )}
                      <p className="text-[10px] text-slate-500">
                        PKCE (S256) در کلاینت فعال است؛ code_verifier فقط در sessionStorage می‌ماند.
                      </p>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled
                        className="w-full cursor-not-allowed rounded-lg border border-slate-700 py-1.5 text-xs text-slate-500"
                      >
                        OAuth {c.label} (پشتیبانی نشده)
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
