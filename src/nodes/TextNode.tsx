import { Handle, Position, NodeProps } from '@xyflow/react'

export function TextNode({ data }: NodeProps) {
  const d = data as any
  const status = d.status || 'empty'
  const statusColors: Record<string, string> = {
    empty: 'border-slate-600',
    running: 'border-blue-500',
    success: 'border-green-500',
    error: 'border-red-500',
  }

  return (
    <div className={`bg-slate-800 border-2 ${statusColors[status]} rounded-xl p-4 min-w-[240px] max-w-[280px] shadow-lg`}>
      <Handle type="target" position={Position.Top} className="!bg-blue-500" />
      <Handle type="target" position={Position.Left} className="!bg-blue-500" id="in-left" />
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-blue-400" />
        <span className="text-white font-medium text-sm truncate">{d.label || 'Text Node'}</span>
      </div>
      <div className="text-xs text-slate-400 mb-2">{d.model || 'Model'}</div>
      <div className="bg-slate-900 rounded-lg p-2 text-xs text-slate-300 min-h-[48px] max-h-24 overflow-hidden">
        {status === 'success' && d.result
          ? String(d.result).slice(0, 180)
          : d.prompt || 'پرامپت را اینجا بنویسید...'}
      </div>
      {status === 'running' && <div className="mt-2 text-xs text-blue-400">در حال اجرای واقعی API...</div>}
      {status === 'success' && <div className="mt-2 text-xs text-green-400">پاسخ واقعی دریافت شد</div>}
      {status === 'error' && <div className="mt-2 text-xs text-red-400">{d.error || 'خطا'}</div>}
      <Handle type="source" position={Position.Bottom} className="!bg-blue-500" />
      <Handle type="source" position={Position.Right} className="!bg-blue-500" id="out-right" />
    </div>
  )
}
