import { useMemo, useState } from 'react'
import { useStore } from '../store/useStore'
import type { CodeFile } from '../domain/types'

function parseFilesFromResult(result?: string): CodeFile[] {
  if (!result) return []
  const files: CodeFile[] = []
  // ```path\n code ```
  const re = /```([^\n`]*)\n([\s\S]*?)```/g
  let m: RegExpExecArray | null
  while ((m = re.exec(result))) {
    const header = (m[1] || '').trim()
    const path =
      header.includes('/') || header.includes('.')
        ? header.replace(/^(tsx?|jsx?|json|css|html|md)\s+/i, '').trim() || header
        : header
          ? `src/${header.includes('.') ? header : header + '.txt'}`
          : `src/snippet-${files.length + 1}.txt`
    files.push({ path: path || `file-${files.length + 1}.txt`, content: m[2] || '' })
  }
  if (!files.length && result.trim()) {
    files.push({ path: 'src/output.txt', content: result })
  }
  return files
}

export function CodeLab() {
  const codeLabNodeId = useStore((s) => s.codeLabNodeId)
  const project = useStore((s) => s.project)
  const closeCodeLab = useStore((s) => s.closeCodeLab)
  const updateNode = useStore((s) => s.updateNode)

  const node = project?.nodes.find((n) => n.id === codeLabNodeId)
  const files = useMemo(() => {
    if (!node) return [] as CodeFile[]
    if (node.data.files?.length) return node.data.files
    return parseFilesFromResult(node.data.result)
  }, [node])

  const [active, setActive] = useState(0)
  const [draft, setDraft] = useState('')

  if (!codeLabNodeId || !node) return null

  const current = files[active] || files[0]
  const content = draft || current?.content || ''

  const saveFile = () => {
    if (!current) return
    const next = files.map((f, i) => (i === active ? { ...f, content: draft || f.content } : f))
    updateNode(node.id, { files: next, result: next.map((f) => `\`\`\`${f.path}\n${f.content}\n\`\`\``).join('\n\n') })
    setDraft('')
  }

  const openInVSCode = () => {
    // Local VS Code deep link (if user has protocol handler)
    const payload = encodeURIComponent(JSON.stringify({ files: files.slice(0, 20) }))
    window.open(`vscode://file?hadi=${payload.slice(0, 500)}`, '_blank')
    // Also download a zip-like text bundle for local open
    const blob = new Blob(
      [files.map((f) => `// ===== ${f.path} =====\n${f.content}\n\n`).join('')],
      { type: 'text/plain;charset=utf-8' },
    )
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${node.data.title || 'code'}-bundle.txt`
    a.click()
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#0d1117] text-slate-100" dir="rtl">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-slate-800 px-3">
        <button type="button" onClick={closeCodeLab} className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs hover:bg-slate-700">
          ← بازگشت به بوم
        </button>
        <span className="text-sm font-semibold">Code Lab · {node.data.title}</span>
        <span className="text-[10px] text-slate-500">محیط تخصصی کد (شبیه IDE)</span>
        <div className="flex-1" />
        <button type="button" onClick={saveFile} className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs text-white">
          ذخیره در گره
        </button>
        <button type="button" onClick={openInVSCode} className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-200">
          خروجی برای VS Code
        </button>
      </header>
      <div className="flex min-h-0 flex-1">
        <aside className="w-56 shrink-0 overflow-y-auto border-l border-slate-800 bg-[#010409] p-2 text-[11px]">
          <div className="mb-2 px-1 text-[10px] text-slate-500">EXPLORER</div>
          {files.length === 0 && <p className="px-1 text-slate-600">فایلی نیست — گره را اجرا کنید یا کد را در نتیجه بگذارید.</p>}
          {files.map((f, i) => (
            <button
              key={f.path}
              type="button"
              onClick={() => {
                setActive(i)
                setDraft('')
              }}
              className={`mb-0.5 block w-full truncate rounded px-2 py-1 text-right font-mono ${
                i === active ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-900'
              }`}
            >
              {f.path}
            </button>
          ))}
        </aside>
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="border-b border-slate-800 px-3 py-1 font-mono text-[11px] text-slate-400">{current?.path || '—'}</div>
          <textarea
            className="min-h-0 flex-1 resize-none bg-[#0d1117] p-4 font-mono text-xs leading-relaxed text-slate-200 outline-none"
            value={draft || current?.content || ''}
            onChange={(e) => setDraft(e.target.value)}
            spellCheck={false}
            dir="ltr"
          />
        </main>
        <aside className="hidden w-72 shrink-0 flex-col border-r border-slate-800 bg-[#010409] p-3 md:flex">
          <div className="mb-2 text-[10px] text-slate-500">PREVIEW</div>
          <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-slate-800 bg-white/5 p-2 text-[11px] text-slate-300">
            {/\.html?$/i.test(current?.path || '') ? (
              <iframe title="preview" className="h-full min-h-[240px] w-full rounded bg-white" srcDoc={content} sandbox="" />
            ) : (
              <pre className="whitespace-pre-wrap font-mono text-[10px] text-slate-400">{content.slice(0, 4000) || 'پیش‌نمایش متنی'}</pre>
            )}
          </div>
          <p className="mt-2 text-[10px] text-slate-600">دابل‌کلیک گره کد = باز شدن این محیط. اتصال زنده VS Code از طریق خروجی فایل.</p>
        </aside>
      </div>
    </div>
  )
}
