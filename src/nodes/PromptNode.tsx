import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react'
import { useCanvasStore } from '../store/useCanvasStore'

const MODEL_OPTIONS = [
  { id: 'gpt-4o', label: 'GPT-4o' },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { id: 'claude-3.5-sonnet', label: 'Claude 3.5' },
  { id: 'gemini-pro', label: 'Gemini Pro' },
]

export function PromptNode({ id, data }: NodeProps) {
  const d = data as any
  const updateNodeData = useCanvasStore((s) => s.updateNodeData)
  const runParallelBuild = useCanvasStore((s) => s.runParallelBuild)
  const isRunning = useCanvasStore((s) => s.isRunning)
  const apiKey = useCanvasStore((s) => s.apiKey)
  const selected: string[] = Array.isArray(d.models) && d.models.length
    ? d.models
    : ['gpt-4o']

  const toggleModel = (m: string) => {
    const next = selected.includes(m)
      ? selected.filter((x) => x !== m)
      : [...selected, m]
    updateNodeData(id, { models: next.length ? next : [m] })
  }

  return (
    <div className="bg-slate-800 border-2 border-indigo-500 rounded-2xl p-4 min-w-[340px] max-w-[420px] shadow-xl">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
        <span className="text-white font-semibold text-sm">پرامپت اصلی</span>
        <span className="text-[11px] text-slate-500 mr-auto">شروع گراف</span>
      </div>

      <textarea
        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white min-h-[100px] resize-y focus:outline-none focus:border-indigo-500"
        placeholder="مثلاً: یک ماشین حساب ساده بساز..."
        value={d.prompt || ''}
        onChange={(e) => updateNodeData(id, { prompt: e.target.value })}
        onMouseDown={(e) => e.stopPropagation()}
      />

      <div className="mt-3">
        <div className="text-[11px] text-slate-500 mb-1.5">مدل‌های موازی</div>
        <div className="flex flex-wrap gap-1.5">
          {MODEL_OPTIONS.map((m) => {
            const on = selected.includes(m.id)
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleModel(m.id)}
                onMouseDown={(e) => e.stopPropagation()}
                className={`text-xs px-2.5 py-1 rounded-full border ${
                  on
                    ? 'bg-indigo-600/40 border-indigo-400 text-white'
                    : 'border-slate-600 text-slate-400 hover:border-slate-400'
                }`}
              >
                {m.label}
              </button>
            )
          })}
        </div>
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

      {!apiKey && (
        <p className="mt-2 text-[11px] text-amber-400/90 leading-relaxed">
          کلید API را در نوار بالا بگذارید یا سرور پروکسی را با HADI_API_KEY اجرا کنید.
        </p>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-indigo-500" />
    </div>
  )
}
