import { useState } from 'react'
import type { Project } from '../domain/types'
import { publish, requiredConfirmPhrase, type PublishTarget } from '../services/publish'

export function PublishModal({
  open,
  project,
  onClose,
}: {
  open: boolean
  project: Project
  onClose: () => void
}) {
  const [target, setTarget] = useState<PublishTarget>('download')
  const [phrase, setPhrase] = useState('')
  const [repo, setRepo] = useState('')
  const [issueTitle, setIssueTitle] = useState('')
  const [result, setResult] = useState('')
  const [resultUrl, setResultUrl] = useState('')
  const [busy, setBusy] = useState(false)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" dir="rtl">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-950 p-5">
        <h2 className="mb-1 text-base font-semibold text-white">انتشار / دریافت</h2>
        <p className="mb-4 text-xs text-slate-400">
          دانلود محلی با انتشار راه‌دور فرق دارد. برای هر ارسال بیرونی عبارت تأیید لازم است.
        </p>

        <label className="mb-2 block text-[11px] text-slate-400">هدف</label>
        <select
          className="mb-3 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          value={target}
          onChange={(e) => setTarget(e.target.value as PublishTarget)}
        >
          <option value="download">دریافت محلی (JSON)</option>
          <option value="github_gist">Gist خصوصی GitHub</option>
          <option value="github_issue">Issue در مخزن GitHub</option>
        </select>

        {target === 'github_issue' && (
          <div className="mb-3 space-y-2">
            <input
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
              placeholder="owner/repo مثلاً hamid19951995/hadi-canvas"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
            />
            <input
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
              placeholder="عنوان Issue (اختیاری)"
              value={issueTitle}
              onChange={(e) => setIssueTitle(e.target.value)}
            />
          </div>
        )}

        <label className="mb-1 block text-[11px] text-slate-400">
          عبارت تأیید: <span className="text-violet-300">{requiredConfirmPhrase()}</span>
        </label>
        <input
          className="mb-3 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
          placeholder={requiredConfirmPhrase()}
        />

        {result && (
          <div className="mb-3 text-xs text-slate-300">
            <p>{result}</p>
            {resultUrl && (
              <a href={resultUrl} target="_blank" rel="noreferrer" className="mt-1 block text-violet-300 underline">
                باز کردن لینک
              </a>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl bg-slate-800 px-3 py-2 text-xs">
            بستن
          </button>
          <button
            type="button"
            disabled={busy}
            className="rounded-xl bg-emerald-600 px-3 py-2 text-xs text-white disabled:opacity-50"
            onClick={async () => {
              setBusy(true)
              const r = await publish({
                project,
                target,
                confirmPhrase: phrase,
                repoFullName: repo,
                issueTitle,
              })
              setResult(r.message)
              setResultUrl(r.url || '')
              setBusy(false)
            }}
          >
            {busy ? '…' : 'اجرا با تأیید'}
          </button>
        </div>
      </div>
    </div>
  )
}
