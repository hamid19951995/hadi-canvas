import { Handle, Position, NodeProps } from '@xyflow/react'

export function MergeNode({ data }: NodeProps) {
  const status = (data as any).status || 'empty'
  const statusColors: Record<string, string> = {
    empty: 'border-slate-600',
    running: 'border-amber-500',
    success: 'border-green-500',
    error: 'border-red-500',
  }

  return (
    <div className={`bg-slate-800 border-2 ${statusColors[status]} rounded-xl p-4 min-w-[240px] shadow-lg`}>
      <Handle type="target" position={Position.Left} id="a" className="!bg-amber-500" style={{ top: '30%' }} />
      <Handle type="target" position={Position.Left} id="b" className="!bg-amber-500" style={{ top: '70%' }} />
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-amber-400" />
        <span className="text-white font-medium text-sm">{(data as any).label || 'Merge Node'}</span>
      </div>
      <div className="bg-slate-900 rounded-lg p-2 text-xs text-slate-300 min-h-[48px]">
        {(data as any).result || 'خروجی‌های ورودی را ادغام می‌کند'}
      </div>
      {status === 'running' && (
        <div className="mt-2 text-xs text-amber-400">در حال ادغام...</div>
      )}
      {status === 'success' && (
        <div className="mt-2 text-xs text-green-400">ادغام انجام شد</div>
      )}
      <Handle type="source" position={Position.Right} className="!bg-amber-500" />
    </div>
  )
}
