import { Handle, Position, NodeProps } from '@xyflow/react'

export function TextNode({ data }: NodeProps) {
  const status = (data as any).status || 'empty'
  const statusColors: Record<string, string> = {
    empty: 'border-slate-600',
    running: 'border-blue-500',
    success: 'border-green-500',
    error: 'border-red-500',
  }

  return (
    <div className={`bg-slate-800 border-2 ${statusColors[status]} rounded-xl p-4 min-w-[240px] shadow-lg`}>
      <Handle type="target" position={Position.Left} className="!bg-blue-500" />
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-blue-400" />
        <span className="text-white font-medium text-sm">{(data as any).label || 'Text Node'}</span>
      </div>
      <div className="text-xs text-slate-400 mb-2">{(data as any).model || 'Model'}</div>
      <div className="bg-slate-900 rounded-lg p-2 text-xs text-slate-300 min-h-[48px]">
        {(data as any).prompt || 'پرامپت را اینجا بنویسید...'}
      </div>
      {status === 'running' && (
        <div className="mt-2 text-xs text-blue-400">در حال اجرا...</div>
      )}
      {status === 'success' && (
        <div className="mt-2 text-xs text-green-400">آماده</div>
      )}
      <Handle type="source" position={Position.Right} className="!bg-blue-500" />
    </div>
  )
}
