import { Handle, Position, NodeProps } from '@xyflow/react'

export function VideoNode({ data }: NodeProps) {
  const status = (data as any).status || 'empty'
  const statusColors: Record<string, string> = {
    empty: 'border-slate-600',
    running: 'border-pink-500',
    success: 'border-green-500',
    error: 'border-red-500',
  }

  return (
    <div className={`bg-slate-800 border-2 ${statusColors[status]} rounded-xl p-4 min-w-[220px] shadow-lg`}>
      <Handle type="target" position={Position.Left} className="!bg-pink-500" />
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-pink-400" />
        <span className="text-white font-medium text-sm">{(data as any).label || 'Video Node'}</span>
      </div>
      <div className="bg-slate-900 rounded-lg h-28 flex items-center justify-center text-slate-500 text-xs">
        {status === 'success' ? 'ویدیو آماده است' : 'خروجی ویدیو'}
      </div>
      {status === 'running' && (
        <div className="mt-2 text-xs text-pink-400">در حال تولید ویدیو...</div>
      )}
      <Handle type="source" position={Position.Right} className="!bg-pink-500" />
    </div>
  )
}
