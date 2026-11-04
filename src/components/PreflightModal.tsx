import { canRun } from '../engine/preflight'
import type { PreflightIssue } from '../domain/types'

export function PreflightModal({
  open,
  issues,
  onClose,
  onConfirm,
}: {
  open: boolean
  issues: PreflightIssue[]
  onClose: () => void
  onConfirm: () => void
}) {
  if (!open) return null
  const ok = canRun(issues)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" dir="rtl">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-950 p-5 shadow-xl">
        <h2 className="mb-1 text-base font-semibold text-white">بررسی پیش از اجرا</h2>
        <p className="mb-4 text-xs text-slate-400">تا رفع موانع، درخواستی به سرویس ارسال نمی‌شود.</p>
        {issues.length === 0 && <p className="mb-4 text-sm text-emerald-400">مانعی نیست.</p>}
        <ul className="mb-4 max-h-56 space-y-2 overflow-y-auto">
          {issues.map((i, idx) => (
            <li
              key={idx}
              className={`rounded-xl border px-3 py-2 text-xs ${
                i.level === 'blocker'
                  ? 'border-red-500/40 bg-red-500/10 text-red-100'
                  : 'border-amber-500/40 bg-amber-500/10 text-amber-100'
              }`}
            >
              <div className="font-medium">{i.level === 'blocker' ? 'مانع' : 'هشدار'}</div>
              <div>{i.message}</div>
              {i.fix && <div className="mt-1 opacity-80">اصلاح: {i.fix}</div>}
            </li>
          ))}
        </ul>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl bg-slate-800 px-3 py-2 text-xs">
            بستن
          </button>
          {ok && (
            <button
              type="button"
              onClick={onConfirm}
              className="rounded-xl bg-emerald-600 px-3 py-2 text-xs text-white"
            >
              تأیید اجرا
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
