import { useState } from 'react'

const CATALOG = [
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { id: 'gpt-4o', label: 'GPT-4o' },
  { id: 'claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
  { id: 'gemini-pro', label: 'Gemini Pro' },
]

export function ModelsModal({
  open,
  models,
  parallel,
  onClose,
  onApply,
}: {
  open: boolean
  models: { id: string; count: number }[]
  parallel: boolean
  onClose: () => void
  onApply: (models: { id: string; count: number }[], parallel: boolean) => void
}) {
  const [local, setLocal] = useState(models)
  const [par, setPar] = useState(parallel)

  if (!open) return null

  const setCount = (id: string, count: number) => {
    setLocal((prev) => {
      const exists = prev.find((m) => m.id === id)
      if (count <= 0) return prev.filter((m) => m.id !== id)
      if (exists) return prev.map((m) => (m.id === id ? { ...m, count } : m))
      return [...prev, { id, count }]
    })
  }

  const total = local.reduce((s, m) => s + m.count, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" dir="rtl">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-950 p-5">
        <h2 className="mb-1 text-base font-semibold text-white">مدل‌ها و تعداد اجرا</h2>
        <p className="mb-4 text-xs text-slate-400">
          تعداد مدل متمایز با تعداد نوبت تولید فرق دارد. الان: {local.length} مدل · {total} نوبت
        </p>
        <ul className="mb-4 space-y-2">
          {CATALOG.map((c) => {
            const cur = local.find((m) => m.id === c.id)?.count || 0
            return (
              <li
                key={c.id}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2"
              >
                <span className="text-sm text-white">{c.label}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="h-7 w-7 rounded-lg bg-slate-800 text-sm"
                    onClick={() => setCount(c.id, cur - 1)}
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm">{cur}</span>
                  <button
                    type="button"
                    className="h-7 w-7 rounded-lg bg-slate-800 text-sm"
                    onClick={() => setCount(c.id, cur + 1)}
                  >
                    +
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
        <label className="mb-4 flex items-center gap-2 text-xs text-slate-300">
          <input type="checkbox" checked={par} onChange={(e) => setPar(e.target.checked)} />
          اجرای موازی گره‌های مستقل
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl bg-slate-800 px-3 py-2 text-xs">
            انصراف
          </button>
          <button
            type="button"
            className="rounded-xl bg-violet-600 px-3 py-2 text-xs text-white"
            onClick={() => {
              onApply(local.length ? local : [{ id: 'gpt-4o-mini', count: 1 }], par)
              onClose()
            }}
          >
            اعمال
          </button>
        </div>
      </div>
    </div>
  )
}
