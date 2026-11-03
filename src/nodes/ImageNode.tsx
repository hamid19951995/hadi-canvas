import { Handle, Position, NodeProps } from '@xyflow/react'

export function ImageNode({ data }: NodeProps) {
  const status = (data as any).status || 'empty'
  const statusColors: Record<string, string> = {
    empty: 'border-slate-600',
    running: 'border-purple-500',
    success: 'border-green-500',
    error: 'border-red-500',
  }

  return (
    <div className={`bg-slate-800 border-2 ${statusColors[status]} rounded-xl p-4 min-w-[220px] shadow-lg`}>
      <Handle type="target" position={Position.Left} className="!bg-purple-500" />
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-purple-400" />
        <span className="text-white font-medium text-sm">{(data as any).label || 'Image Node'}</span>
      </div>
      <div className="bg-slate-900 rounded-lg h-28 flex items-center justify-center text-slate-500 text-xs">
        {status === 'success' ? 'تصویر تولید شد' : 'خروجی تصویر'}
      </div>
      {status === 'running' && (
        <div className="mt-2 text-xs text-purple-400">در حال تولید...</div>
      )}
      <Handle type="source" position={Position.Right} className="!bg-purple-500" />
    </div>
  )
}
