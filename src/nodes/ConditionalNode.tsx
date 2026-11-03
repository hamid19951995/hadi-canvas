import { Handle, Position, NodeProps } from '@xyflow/react'

export function ConditionalNode({ data }: NodeProps) {
  const status = (data as any).status || 'empty'
  const statusColors: Record<string, string> = {
    empty: 'border-slate-600',
    running: 'border-orange-500',
    success: 'border-green-500',
    error: 'border-red-500',
  }

  return (
    <div className={`bg-slate-800 border-2 ${statusColors[status]} rounded-xl p-4 min-w-[240px] shadow-lg`}>
      <Handle type="target" position={Position.Left} className="!bg-orange-500" />

      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-orange-400" />
        <span className="text-white font-medium text-sm">{(data as any).label || 'شرطی'}</span>
      </div>

      <div className="bg-slate-900 rounded-lg p-2 text-xs text-slate-300 mb-2">
        {(data as any).condition || 'شرط: شامل «بله» باشد'}
      </div>

      <div className="flex justify-between text-[10px] text-slate-400 px-1">
        <span className="text-green-400">True ↓</span>
        <span className="text-red-400">False ↓</span>
      </div>

      {status === 'running' && <div className="mt-2 text-xs text-orange-400">در حال ارزیابی...</div>}
      {status === 'success' && <div className="mt-2 text-xs text-green-400">مسیر انتخاب شد</div>}

      <Handle type="source" position={Position.Right} id="true" className="!bg-green-500" style={{ top: '40%' }} />
      <Handle type="source" position={Position.Right} id="false" className="!bg-red-500" style={{ top: '70%' }} />
    </div>
  )
}
