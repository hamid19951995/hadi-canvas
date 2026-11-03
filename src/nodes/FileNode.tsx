import { Handle, Position, NodeProps } from '@xyflow/react'

export function FileNode({ data }: NodeProps) {
  const status = (data as any).status || 'empty'
  const mode = (data as any).mode || 'input' // 'input' | 'output'
  const fileName = (data as any).fileName as string | undefined
  const statusColors: Record<string, string> = {
    empty: 'border-slate-600',
    running: 'border-emerald-500',
    success: 'border-green-500',
    error: 'border-red-500',
  }

  return (
    <div className={`bg-slate-800 border-2 ${statusColors[status]} rounded-xl p-4 min-w-[240px] shadow-lg`}>
      <Handle type="target" position={Position.Left} className="!bg-emerald-500" />

      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-emerald-400" />
        <span className="text-white font-medium text-sm">
          {(data as any).label || (mode === 'input' ? 'ورودی فایل' : 'خروجی فایل')}
        </span>
      </div>

      <div className="bg-slate-900 rounded-lg p-2 text-xs text-slate-300 min-h-[48px] flex items-center justify-center">
        {fileName ? (
          <span className="text-emerald-300">{fileName}</span>
        ) : (
          <span className="text-slate-500">
            {mode === 'input' ? 'فایل را انتخاب کنید' : 'خروجی ذخیره می‌شود'}
          </span>
        )}
      </div>

      {status === 'running' && <div className="mt-2 text-xs text-emerald-400">در حال پردازش فایل...</div>}
      {status === 'success' && <div className="mt-2 text-xs text-green-400">آماده</div>}

      <Handle type="source" position={Position.Right} className="!bg-emerald-500" />
    </div>
  )
}
