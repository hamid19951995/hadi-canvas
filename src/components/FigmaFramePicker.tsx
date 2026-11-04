import { useMemo, useState, useEffect } from 'react'

export type FrameItem = { id: string; name: string; type: string }

/** Parse frames from figma node summary text */
export function parseFramesFromResult(result?: string): FrameItem[] {
  if (!result) return []
  const items: FrameItem[] = []
  const re = /- \[(FRAME|COMPONENT|COMPONENT_SET|SECTION)\]\s+(.+?)\s+\(([^)]+)\)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(result))) {
    items.push({ type: m[1], name: m[2].trim(), id: m[3].trim() })
  }
  // unique by id
  const seen = new Set<string>()
  return items.filter((x) => {
    if (seen.has(x.id)) return false
    seen.add(x.id)
    return true
  })
}

export function FigmaFramePicker({
  result,
  busy,
  onApply,
}: {
  result?: string
  busy?: boolean
  onApply: (ids: string[]) => void
}) {
  const frames = useMemo(() => parseFramesFromResult(result), [result])
  const [selected, setSelected] = useState<Record<string, boolean>>({})

  useEffect(() => {
    // preselect first 3 frames when result changes
    const next: Record<string, boolean> = {}
    frames.slice(0, 3).forEach((f) => {
      next[f.id] = true
    })
    setSelected(next)
  }, [result])

  if (!frames.length) {
    return (
      <p className="mb-3 text-[10px] text-slate-500">
        بعد از یک اجرای موفق، فهرست فریم‌ها اینجا برای انتخاب می‌آید.
      </p>
    )
  }

  const chosen = frames.filter((f) => selected[f.id]).map((f) => f.id)

  return (
    <div className="mb-3 rounded-xl border border-slate-800 bg-slate-950/80 p-2" dir="rtl">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] text-slate-300">انتخاب فریم</span>
        <span className="text-[10px] text-slate-500">{chosen.length} انتخاب‌شده</span>
      </div>
      <ul className="mb-2 max-h-36 space-y-1 overflow-auto">
        {frames.map((f) => (
          <li key={f.id}>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-0.5 text-[11px] hover:bg-slate-900">
              <input
                type="checkbox"
                checked={!!selected[f.id]}
                onChange={(e) => setSelected((s) => ({ ...s, [f.id]: e.target.checked }))}
              />
              <span className="flex-1 truncate text-slate-200">{f.name}</span>
              <span className="text-[9px] text-slate-500">{f.type}</span>
            </label>
          </li>
        ))}
      </ul>
      <button
        type="button"
        disabled={busy || chosen.length === 0}
        className="w-full rounded-lg bg-violet-600 py-1.5 text-[11px] text-white disabled:opacity-40"
        onClick={() => onApply(chosen)}
      >
        {busy ? '…' : 'گرفتن تصویر فریم‌های انتخابی'}
      </button>
    </div>
  )
}
