import { memo, useCallback, useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { NodeData, NodeWorkMode } from '../domain/types'
import { MODEL_CATALOG, portsOf } from '../domain/types'
import { useStore } from '../store/useStore'
import { extractImageUrls } from '../utils/extractImages'

const statusColor: Record<string, string> = {
  idle: 'bg-slate-500',
  running: 'bg-sky-400 animate-pulse',
  success: 'bg-emerald-400',
  error: 'bg-red-400',
  blocked: 'bg-amber-400',
  skipped: 'bg-slate-600',
}

const modeLabel: Record<NodeWorkMode, string> = {
  prompt: 'پرامپت',
  chat: 'چت',
  agent: 'ایجنت',
}

function HadiNodeComponent({ id, data, selected }: NodeProps & { data: NodeData }) {
  const updateNode = useStore((s) => s.updateNode)
  const runSingleNode = useStore((s) => s.runSingleNode)
  const openCodeLab = useStore((s) => s.openCodeLab)
  const ports = portsOf(data.kind)
  const ins = ports.filter((p) => p.direction === 'in')
  const outs = ports.filter((p) => p.direction === 'out')
  const images = extractImageUrls(data.result || '')
  const canEditPrompt = ['prompt', 'text', 'image', 'code', 'agent', 'loop', 'condition', 'figma', 'memory'].includes(
    data.kind,
  )
  const supportsMode = ['prompt', 'text', 'agent'].includes(data.kind)
  const mode: NodeWorkMode = data.mode || (data.kind === 'agent' ? 'agent' : 'prompt')
  const [sending, setSending] = useState(false)

  const onSend = useCallback(async () => {
    if (sending || data.status === 'running') return
    setSending(true)
    try {
      await runSingleNode(id)
    } finally {
      setSending(false)
    }
  }, [id, runSingleNode, sending, data.status])

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void onSend()
    }
  }

  const files = data.files || []

  return (
    <div
      className={`min-w-[240px] max-w-[300px] rounded-xl border bg-slate-900/95 shadow-lg ${
        selected ? 'border-violet-400 ring-2 ring-violet-500/30' : 'border-slate-700'
      }`}
      onDoubleClick={(e) => {
        e.stopPropagation()
        if (data.kind === 'code') openCodeLab(id)
      }}
    >
      <div className="flex items-center gap-2 border-b border-slate-800 px-3 py-2">
        <span className={`h-2 w-2 rounded-full ${statusColor[data.status] || statusColor.idle}`} />
        <span className="flex-1 truncate text-xs font-medium text-white">{data.title}</span>
        <span className="text-[10px] text-slate-500">{data.kind}</span>
      </div>

      {supportsMode && (
        <div className="flex gap-0.5 border-b border-slate-800 px-2 py-1.5" onMouseDown={(e) => e.stopPropagation()}>
          {(['prompt', 'chat', 'agent'] as NodeWorkMode[]).map((m) => (
            <button
              key={m}
              type="button"
              className={`nodrag flex-1 rounded-md px-1 py-1 text-[10px] ${
                mode === m ? 'bg-violet-600 text-white' : 'text-slate-400 hover:bg-slate-800'
              }`}
              onClick={(e) => {
                e.stopPropagation()
                updateNode(id, { mode: m })
              }}
            >
              {modeLabel[m]}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-1.5 px-3 py-2 text-[11px] text-slate-400">
        {data.error && <p className="text-red-300">{data.error}</p>}

        {canEditPrompt && (
          <div className="nodrag nowheel space-y-1" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
            <select
              className="nodrag w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-[10px] text-slate-200"
              value={data.model || 'gpt-4o-mini'}
              onChange={(e) => updateNode(id, { model: e.target.value })}
              onClick={(e) => e.stopPropagation()}
            >
              {MODEL_CATALOG.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
            <textarea
              className="h-16 w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-[11px] text-slate-200 placeholder:text-slate-600 focus:border-violet-500 focus:outline-none"
              placeholder={
                mode === 'chat'
                  ? 'پیام چت… (Enter ارسال، Shift+Enter خط جدید)'
                  : mode === 'agent'
                    ? 'هدف ایجنت…'
                    : 'پرامپت را اینجا بنویسید…'
              }
              value={data.prompt || ''}
              rows={3}
              onChange={(e) => updateNode(id, { prompt: e.target.value })}
              onKeyDown={onKeyDown}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            />
            <button
              type="button"
              disabled={sending || data.status === 'running' || !data.prompt?.trim()}
              onClick={(e) => {
                e.stopPropagation()
                void onSend()
              }}
              className="w-full rounded-lg bg-emerald-600 py-1.5 text-[11px] font-medium text-white hover:bg-emerald-500 disabled:opacity-40"
            >
              {data.status === 'running' || sending ? 'در حال اجرا…' : mode === 'chat' ? 'ارسال پیام' : 'اجرای این گره'}
            </button>
          </div>
        )}

        {data.kind === 'code' && (
          <div className="rounded-lg border border-slate-700 bg-slate-950/80 p-2">
            <div className="mb-1 text-[10px] text-violet-300">ساختار پوشه · دابل‌کلیک = Code Lab</div>
            {files.length > 0 ? (
              <ul className="max-h-24 space-y-0.5 overflow-auto font-mono text-[10px] text-slate-300">
                {files.map((f) => (
                  <li key={f.path} className="truncate">
                    📄 {f.path}
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="font-mono text-[10px] text-slate-500">
                <li>src/</li>
                <li className="pr-2">App.tsx</li>
                <li className="pr-2">main.tsx</li>
                <li>package.json</li>
                <li className="text-slate-600">— پس از اجرا پر می‌شود —</li>
              </ul>
            )}
          </div>
        )}

        {images.length > 0 && (
          <div className="grid grid-cols-2 gap-1">
            {images.map((src) => (
              <a
                key={src}
                href={src}
                target="_blank"
                rel="noreferrer"
                className="block overflow-hidden rounded-lg border border-slate-700 bg-slate-950"
                onClick={(e) => e.stopPropagation()}
              >
                <img src={src} alt="preview" className="h-16 w-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
              </a>
            ))}
          </div>
        )}

        {data.result ? (
          <p className="line-clamp-3 whitespace-pre-wrap text-slate-300">{data.result}</p>
        ) : (
          !canEditPrompt && data.prompt && <p className="line-clamp-2 text-slate-500">{data.prompt}</p>
        )}
      </div>

      {ins.map((p, i) => (
        <Handle
          key={p.id}
          id={p.id}
          type="target"
          position={Position.Left}
          style={{ top: 40 + i * 18 }}
          className="!h-2.5 !w-2.5 !border-slate-900 !bg-violet-400"
          title={p.label}
        />
      ))}
      {outs.map((p, i) => (
        <Handle
          key={p.id}
          id={p.id}
          type="source"
          position={Position.Right}
          style={{ top: 40 + i * 18 }}
          className="!h-2.5 !w-2.5 !border-slate-900 !bg-emerald-400"
          title={p.label}
        />
      ))}
    </div>
  )
}

export const HadiNode = memo(HadiNodeComponent)
