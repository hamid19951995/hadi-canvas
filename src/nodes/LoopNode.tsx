import { Handle, Position, NodeProps } from '@xyflow/react'

export function LoopNode({ data }: NodeProps) {
  const status = (data as any).status || 'empty'
  const iterations = (data as any).iterations ?? 3
  const statusColors: Record<string, string> = {
    empty: 'border-slate-600',
    running: 'border-teal-500',
    success: 'border-green-500',
    error: 'border-red-500',
  }

  return (
    <div className={`bg-slate-800 border-2 ${statusColors[status]} rounded-xl p-4 min-w-[240px] shadow-lg`}>
      <Handle type="target" position={Position.Left} className="!bg-teal-500" />

      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-teal-400" />
        <span className="text-white font-medium text-sm">{(data as any).label || 'حلقه'}</span>
      </div>

      <div className="bg-slate-900 rounded-lg p-2 text-xs text-slate-300 space-y-1">
        <div>تکرار: {iterations} بار</div>
        <div className="text-slate-500">{(data as any).loopCondition || 'تا شرط برقرار باشد'}</div>
      </div>

      {status === 'running' && (
        <div className="mt-2 text-xs text-teal-400">
          دور {(data as any).currentIteration || 1} از {iterations}...
        </div>
      )}
      {status === 'success' && <div className="mt-2 text-xs text-green-400">حلقه تمام شد</div>}

      <Handle type="source" position={Position.Right} className="!bg-teal-500" />
    </div>
  )
}
