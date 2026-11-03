import { Handle, Position, NodeProps } from '@xyflow/react'

function isImageUrl(value: unknown): value is string {
  return typeof value === 'string' && /^https?:\/\//i.test(value)
}

export function ImageNode({ data }: NodeProps) {
  const d = data as any
  const status = d.status || 'empty'
  const result = d.result as string | undefined
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
        <span className="text-white font-medium text-sm">{d.label || 'Image Node'}</span>
      </div>

      <div className="bg-slate-900 rounded-lg h-28 flex items-center justify-center text-slate-500 text-xs overflow-hidden">
        {status === 'success' && isImageUrl(result) ? (
          <img src={result} alt="generated" className="w-full h-full object-cover" />
        ) : status === 'success' ? (
          <span className="px-2 text-center text-green-300">تصویر آماده</span>
        ) : status === 'error' ? (
          <span className="px-2 text-center text-red-300">{d.error || 'خطا'}</span>
        ) : (
          <span>خروجی تصویر</span>
        )}
      </div>

      {status === 'running' && (
        <div className="mt-2 text-xs text-purple-400">در حال تولید...</div>
      )}
      <Handle type="source" position={Position.Right} className="!bg-purple-500" />
    </div>
  )
}
