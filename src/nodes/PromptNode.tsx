import { useState, useRef, useEffect } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { useCanvasStore } from '../store/useCanvasStore'
import {
  ALL_MODELS,
  MODEL_CATEGORIES,
  getModelLabel,
  type ModelCategoryId,
} from '../data/models'

type Tab = 'prompt' | 'chat' | 'agent'

export function PromptNode({ id, data }: NodeProps) {
  const d = data as any
  const updateNodeData = useCanvasStore((s) => s.updateNodeData)
  const runParallelBuild = useCanvasStore((s) => s.runParallelBuild)
  const sendNodeChat = useCanvasStore((s) => s.sendNodeChat)
  const applyChatSuggestion = useCanvasStore((s) => s.applyChatSuggestion)
  const isRunning = useCanvasStore((s) => s.isRunning)
  const apiKey = useCanvasStore((s) => s.apiKey)

  const selected: string[] =
    Array.isArray(d.models) && d.models.length ? d.models : ['gpt-4o']
  const chatModel = (d.chatModel as string) || selected[0] || 'gpt-4o'
  const messages: Array<{ role: string; content: string }> = Array.isArray(d.chatMessages)
    ? d.chatMessages
    : []

  const [tab, setTab] = useState<Tab>('prompt')
  const [open, setOpen] = useState(false)
  const [activeCat, setActiveCat] = useState<ModelCategoryId | 'all'>('all')
  const [query, setQuery] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [chatBusy, setChatBusy] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, chatBusy])

  const toggleModel = (m: string) => {
    const next = selected.includes(m)
      ? selected.filter((x) => x !== m)
      : [...selected, m]
    updateNodeData(id, { models: next.length ? next : [m] })
  }

  const filtered = ALL_MODELS.filter((m) => {
    if (activeCat === 'image') return m.kind === 'image'
    if (m.kind === 'image') return false
    if (activeCat !== 'all' && m.category !== activeCat) return false
    if (!query.trim()) return true
    const q = query.trim().toLowerCase()
    return (
      m.id.toLowerCase().includes(q) ||
      m.label.toLowerCase().includes(q) ||
      m.provider.toLowerCase().includes(q)
    )
  })

  const onSendChat = async () => {
    const text = chatInput.trim()
    if (!text || chatBusy) return
    setChatInput('')
    setChatBusy(true)
    try {
      await sendNodeChat(id, text, tab === 'agent')
    } finally {
      setChatBusy(false)
    }
  }

  const onApply = async () => {
    setChatBusy(true)
    try {
      await applyChatSuggestion(id)
    } finally {
      setChatBusy(false)
    }
  }

  return (
    <div className="bg-slate-800 border-2 border-indigo-500 rounded-2xl p-4 min-w-[380px] max-w-[460px] shadow-xl relative">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
        <span className="text-white font-semibold text-sm">پرامپت اصلی</span>
        <span className="text-[11px] text-slate-500 mr-auto">hadi-canvas</span>
      </div>

      {/* tabs */}
      <div className="flex gap-1 mb-3 bg-slate-900/80 rounded-lg p-1">
        {(
          [
            ['prompt', 'پرامپت'],
            ['chat', 'چت'],
            ['agent', 'ایجنت'],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            onMouseDown={(e) => e.stopPropagation()}
            className={`flex-1 text-xs py-1.5 rounded-md transition ${
              tab === k
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'prompt' && (
        <>
          <textarea
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white min-h-[100px] resize-y focus:outline-none focus:border-indigo-500"
            placeholder="مثلاً: یک ماشین حساب ساده بساز..."
            value={d.prompt || ''}
            onChange={(e) => updateNodeData(id, { prompt: e.target.value })}
            onMouseDown={(e) => e.stopPropagation()}
          />

          <div className="mt-3" ref={panelRef}>
            <div className="text-[11px] text-slate-500 mb-1.5">مدل‌های موازی</div>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-full flex items-center justify-between gap-2 bg-slate-900 border border-slate-600 hover:border-indigo-500 rounded-xl px-3 py-2.5 text-sm text-right"
            >
              <span className="text-slate-200 truncate">
                {selected.length === 0
                  ? 'انتخاب مدل...'
                  : selected.length <= 2
                    ? selected.map(getModelLabel).join(' · ')
                    : `${selected.length} مدل انتخاب‌شده`}
              </span>
              <span className="text-slate-500 shrink-0">{open ? '▲' : '▼'}</span>
            </button>

            {selected.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {selected.map((m) => (
                  <span
                    key={m}
                    className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-indigo-600/30 border border-indigo-500/50 text-indigo-100"
                  >
                    {getModelLabel(m)}
                    <button
                      type="button"
                      className="text-indigo-300 hover:text-white leading-none"
                      onClick={() => toggleModel(m)}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {open && (
              <div
                className="absolute z-50 left-3 right-3 mt-1 bg-slate-900 border border-slate-600 rounded-xl shadow-2xl overflow-hidden"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="p-2 border-b border-slate-700">
                  <input
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                    placeholder="جستجوی مدل..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="flex gap-1 p-2 border-b border-slate-700 overflow-x-auto">
                  <CatChip active={activeCat === 'all'} onClick={() => setActiveCat('all')} label="همه" />
                  {MODEL_CATEGORIES.map((c) => (
                    <CatChip
                      key={c.id}
                      active={activeCat === c.id}
                      onClick={() => setActiveCat(c.id)}
                      label={`${c.emoji} ${c.label}`}
                    />
                  ))}
                </div>
                <div className="max-h-[220px] overflow-y-auto p-1">
                  {filtered.map((m) => {
                    const on = selected.includes(m.id)
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleModel(m.id)}
                        className={`w-full flex items-start gap-2 px-2.5 py-2 rounded-lg text-right ${
                          on
                            ? 'bg-indigo-600/30 border border-indigo-500/40'
                            : 'hover:bg-slate-800 border border-transparent'
                        }`}
                      >
                        <span
                          className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 text-[10px] ${
                            on
                              ? 'bg-indigo-500 border-indigo-400 text-white'
                              : 'border-slate-600 text-transparent'
                          }`}
                        >
                          ✓
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm text-white">{m.label}</span>
                          <span className="block text-[11px] text-slate-500 truncate">
                            {m.provider}
                            {m.description ? ` · ${m.description}` : ''}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>
                <div className="flex justify-end px-3 py-2 border-t border-slate-700">
                  <button
                    type="button"
                    className="text-xs text-indigo-400"
                    onClick={() => setOpen(false)}
                  >
                    تأیید
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={isRunning}
            onClick={() => runParallelBuild(id)}
            onMouseDown={(e) => e.stopPropagation()}
            className="mt-3 w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-xl"
          >
            {isRunning ? 'در حال ساخت واقعی...' : '▶ ساخت موازی با مدل‌های انتخابی'}
          </button>
        </>
      )}

      {(tab === 'chat' || tab === 'agent') && (
        <div onMouseDown={(e) => e.stopPropagation()}>
          {tab === 'agent' && (
            <p className="text-[11px] text-amber-300/90 mb-2 leading-relaxed">
              حالت ایجنت: مدل پیشنهاد عملی می‌دهد. با نوشتن «اعمال کن» یا دکمه زیر، روی پرامپت گره اعمال می‌شود.
            </p>
          )}

          <div className="mb-2">
            <label className="text-[11px] text-slate-500">مدل چت</label>
            <select
              className="mt-0.5 w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
              value={chatModel}
              onChange={(e) => updateNodeData(id, { chatModel: e.target.value })}
            >
              {ALL_MODELS.filter((m) => m.kind === 'text').map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-slate-950 border border-slate-700 rounded-xl h-[200px] overflow-y-auto p-2 space-y-2">
            {messages.length === 0 && (
              <p className="text-[11px] text-slate-500 text-center py-8">
                ایده را بنویسید؛ مدل پاسخ می‌دهد.
                {tab === 'agent' ? ' سپس «اعمال کن».' : ''}
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`text-xs rounded-lg px-2.5 py-1.5 whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-indigo-600/30 text-indigo-50 mr-6'
                    : 'bg-slate-800 text-slate-200 ml-6'
                }`}
              >
                {m.content}
              </div>
            ))}
            {chatBusy && (
              <div className="text-[11px] text-slate-500 px-2">در حال پاسخ...</div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="mt-2 flex gap-1.5">
            <input
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              placeholder={
                tab === 'agent'
                  ? 'ایده یا «اعمال کن»...'
                  : 'پیام به مدل...'
              }
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void onSendChat()
                }
              }}
              disabled={chatBusy}
            />
            <button
              type="button"
              disabled={chatBusy || !chatInput.trim()}
              onClick={() => void onSendChat()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs px-3 rounded-lg"
            >
              ارسال
            </button>
          </div>

          <button
            type="button"
            disabled={chatBusy || messages.length === 0}
            onClick={() => void onApply()}
            className="mt-2 w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-medium py-2 rounded-xl"
          >
            ✓ اعمال پیشنهاد روی پرامپت
          </button>
        </div>
      )}

      {!apiKey && (
        <p className="mt-2 text-[11px] text-amber-400/90 leading-relaxed">
          کلید API را در نوار بالا وارد کنید.
        </p>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-indigo-500" />
    </div>
  )
}

function CatChip({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 text-[11px] px-2.5 py-1 rounded-full border transition ${
        active
          ? 'bg-indigo-600/40 border-indigo-400 text-white'
          : 'border-slate-600 text-slate-400 hover:border-slate-400'
      }`}
    >
      {label}
    </button>
  )
}
