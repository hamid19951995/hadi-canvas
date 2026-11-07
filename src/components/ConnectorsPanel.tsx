import { useEffect, useMemo, useState } from 'react'
import {
  CONNECTOR_CATALOG,
  connectMcp,
  connectWithApiKey,
  connectWithOAuthToken,
  disconnectConnector,
  getMcpServerUrl,
  loadConnectorStates,
  type ConnectorDef,
  type ConnectorId,
  type ConnectorState,
} from '../services/connectors'
import {
  checkOAuthServer,
  isGithubOAuthConfigured,
  startGithubOAuth,
} from '../services/githubOAuth'
import { validateGithubConnection } from '../services/githubApi'
import { isFigmaOAuthConfigured, startFigmaOAuth } from '../services/figmaOAuth'
import { validateFigmaConnection } from '../services/figmaApi'
import { isCanvaOAuthConfigured, startCanvaOAuth } from '../services/canvaOAuth'

const categoryOrder = ['productivity', 'models', 'developer', 'design', 'custom'] as const

export function ConnectorsPanel() {
  const [states, setStates] = useState<ConnectorState[]>([])
  const [selectedId, setSelectedId] = useState<ConnectorId | null>('figma')
  const [keys, setKeys] = useState<Record<string, string>>({})
  const [serverUrls, setServerUrls] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [q, setQ] = useState('')

  const refresh = () => setStates(loadConnectorStates())

  useEffect(() => {
    refresh()
    const init: Record<string, string> = {}
    for (const c of CONNECTOR_CATALOG) {
      init[c.id] = getMcpServerUrl(c.id, c.serverUrl)
    }
    setServerUrls(init)
  }, [])

  const statusOf = (id: ConnectorId) => states.find((s) => s.id === id)
  const selected = CONNECTOR_CATALOG.find((c) => c.id === selectedId) || CONNECTOR_CATALOG[0]
  const st = statusOf(selected.id)

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return CONNECTOR_CATALOG.filter(
      (c) =>
        !query ||
        c.label.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        c.categoryLabel.toLowerCase().includes(query),
    )
  }, [q])

  const grouped = useMemo(() => {
    const map = new Map<string, ConnectorDef[]>()
    for (const c of filtered) {
      const list = map.get(c.category) || []
      list.push(c)
      map.set(c.category, list)
    }
    return categoryOrder
      .filter((k) => map.has(k))
      .map((k) => ({ key: k, label: map.get(k)![0].categoryLabel, items: map.get(k)! }))
  }, [filtered])

  const statusLabel = (s?: ConnectorState) => {
    if (!s) return 'قطع'
    if (s.status === 'connected') return 'متصل'
    if (s.status === 'configured') return 'تنظیم‌شده؛ تأییدنشده'
    if (s.status === 'expired') return 'منقضی'
    if (s.status === 'error') return 'خطا'
    return 'قطع'
  }

  const statusClass = (s?: ConnectorState) => {
    if (s?.status === 'connected') return 'bg-emerald-500/15 text-emerald-400'
    if (s?.status === 'configured') return 'bg-amber-500/15 text-amber-300'
    if (s?.status === 'expired') return 'bg-amber-500/15 text-amber-400'
    if (s?.status === 'error') return 'bg-red-500/15 text-red-400'
    return 'bg-slate-800 text-slate-400'
  }

  const onConnect = async () => {
    setBusy(true)
    setMsg('')
    try {
      const c = selected
      if (c.auth === 'api_key') {
        const key = keys[c.id] || ''
        const next = connectWithApiKey(c.id, key)
        refresh()
        setMsg(next.status === 'connected' ? `${c.label} متصل شد.` : next.message || 'خطا')
        return
      }
      if (c.id === 'github') {
        const health = isGithubOAuthConfigured() ? await checkOAuthServer() : { ok: false, error: 'VITE_GITHUB_CLIENT_ID تنظیم نشده' }
        if (!health.ok || health.githubConfigured === false) {
          setMsg(health.error || 'سرور OAuth یا Client ID تنظیم نشده (npm run oauth + .env)')
          return
        }
        const started = await startGithubOAuth()
        window.location.assign(started.authorizeUrl)
        return
      }
      if (c.id === 'figma' && c.auth === 'mcp') {
        const url = serverUrls[c.id] || c.serverUrl
        const token = keys[c.id]?.trim()
        if (token) {
          // A Figma personal access token (read-only) authorizes the REST calls used by figma nodes.
          connectWithOAuthToken('figma', token)
          await validateFigmaConnection().catch(() => null)
          refresh()
          setMsg('توکن Figma ذخیره شد؛ گره‌های Figma اکنون فعال هستند (در صورت نامعتبر بودن، هنگام اجرا خطا می‌گیرید).')
          return
        }
        if (isFigmaOAuthConfigured()) {
          const started = await startFigmaOAuth()
          window.location.assign(started.authorizeUrl)
          return
        }
        const next = await connectMcp(c.id, url)
        refresh()
        setMsg(
          next.status === 'configured'
            ? `تنظیمات MCP در ${url} ذخیره شد. برای فعال‌شدن گره‌های Figma یک Personal Access Token هم وارد کنید.`
            : next.message || 'خطا در اتصال',
        )
        return
      }
      if (c.id === 'canva') {
        if (!isCanvaOAuthConfigured()) {
          setMsg('CANVA_CLIENT_ID در .env تنظیم نشده')
          return
        }
        const started = await startCanvaOAuth()
        window.location.assign(started.authorizeUrl)
        return
      }
      if (c.auth === 'mcp') {
        const url = serverUrls[c.id] || c.serverUrl
        const next = await connectMcp(c.id, url, keys[c.id])
        refresh()
        setMsg(next.status === 'connected' ? `متصل به ${url}` : next.message || 'خطا')
      }
    } finally {
      setBusy(false)
    }
  }

  const onDisconnect = () => {
    void (async () => {
      try { await disconnectConnector(selected.id); refresh(); setMsg(`${selected.label} قطع شد.`) }
      catch (error) { setMsg(error instanceof Error ? error.message : 'قطع اتصال ناموفق بود') }
    })()
  }

  return (
    <div className="flex min-h-0 flex-1 gap-0" dir="rtl">
      {/* List */}
      <div className="flex w-[320px] shrink-0 flex-col border-l border-slate-800 bg-slate-950">
        <div className="border-b border-slate-800 p-3">
          <h1 className="text-sm font-semibold text-white">پلاگین‌ها و اتصال‌دهنده‌ها</h1>
          <p className="mt-1 text-[11px] text-slate-500">مثل MCP: Server URL + Connect</p>
          <input
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200"
            placeholder="جستجو…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {grouped.map((g) => (
            <div key={g.key} className="mb-3">
              <div className="px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                {g.label}
              </div>
              {g.items.map((c) => {
                const s = statusOf(c.id)
                const active = selected.id === c.id
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className={`mb-1 flex w-full items-center gap-2 rounded-xl px-2 py-2.5 text-right transition ${
                      active ? 'bg-violet-600/20 ring-1 ring-violet-500/40' : 'hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-sm font-bold text-violet-300">
                      {c.label.slice(0, 1)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-medium text-white">{c.label}</div>
                      <div className="truncate text-[10px] text-slate-500">{c.categoryLabel}</div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] ${statusClass(s)}`}>
                      {statusLabel(s)}
                    </span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Detail card — matches Figma Connect UI pattern */}
      <div className="flex flex-1 items-start justify-center overflow-y-auto bg-slate-900/40 p-6">
        <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-950 p-5 shadow-xl">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 text-lg font-bold text-violet-300">
                {selected.label.slice(0, 1)}
              </div>
              <div>
                <div className="text-base font-semibold text-white">{selected.label}</div>
                <div className="text-xs text-slate-500">{selected.categoryLabel}</div>
              </div>
            </div>
            {st?.status === 'connected' || st?.status === 'configured' ? (
              <button
                type="button"
                onClick={onDisconnect}
                className="rounded-full border border-slate-600 px-4 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
              >
                قطع اتصال
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={onConnect}
                className="rounded-full bg-white px-4 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-100 disabled:opacity-50"
              >
                {busy ? '…' : 'Connect'}
              </button>
            )}
          </div>

          <p className="mb-5 text-sm leading-relaxed text-slate-400">{selected.description}</p>

          <div className="mb-1 text-xs font-medium text-slate-500">Server URL</div>
          <input
            className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 font-mono text-xs text-slate-200"
            value={serverUrls[selected.id] ?? selected.serverUrl}
            onChange={(e) => setServerUrls((u) => ({ ...u, [selected.id]: e.target.value }))}
            placeholder="https://mcp.example.com/mcp"
            readOnly={selected.auth === 'api_key' && selected.id !== 'custom_mcp'}
          />

          {(selected.auth === 'api_key' || selected.auth === 'mcp') && (
            <>
              <div className="mb-1 text-xs font-medium text-slate-500">
                {selected.id === 'figma' ? 'Figma Personal Access Token' : selected.auth === 'mcp' ? 'Token (اختیاری)' : 'API Key'}
              </div>
              <input
                type="password"
                className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-xs text-slate-200"
                placeholder={selected.id === 'figma' ? 'figd_… (از تنظیمات Figma)' : selected.auth === 'mcp' ? 'در صورت نیاز' : 'کلید API'}
                value={keys[selected.id] || ''}
                onChange={(e) => setKeys((k) => ({ ...k, [selected.id]: e.target.value }))}
              />
            </>
          )}

          <p className="text-[11px] leading-relaxed text-slate-500">{selected.scopesNote}</p>
          {selected.docsUrl && (
            <a
              href={selected.docsUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-[11px] text-violet-400 hover:underline"
            >
              مستندات
            </a>
          )}

          {(st?.status === 'connected' || st?.status === 'configured') && (
            <div className="mt-4 rounded-xl border border-emerald-900/50 bg-emerald-950/30 px-3 py-2 text-[11px] text-emerald-300">
              {st.status === 'configured' ? 'تنظیم‌شده (اتصال زنده هنوز تأیید نشده)' : 'متصل'}{st.hint ? ` · ${st.hint}` : ''}
              {st.serverUrl ? ` · ${st.serverUrl}` : ''}
            </div>
          )}
          {msg && <p className="mt-3 text-xs text-violet-300">{msg}</p>}

          <p className="mt-5 text-[10px] leading-relaxed text-slate-600">
            Third-party connectors are not built or maintained by Hadi Canvas. Review permissions before connecting. MCP credentials are sent to the authenticated server API and encrypted at rest; a configured entry is not proof of a live MCP session.
          </p>
        </div>
      </div>
    </div>
  )
}
