import { Handle, Position, NodeProps } from '@xyflow/react'

export function MemoryNode({ data }: NodeProps) {
  const status = (data as any).status || 'empty'
  const keys = (data as any).keys as string[] | undefined
  const statusColors: Record<string, string> = {
    empty: 'border-slate-600',
    running: 'border-indigo-500',
    success: 'border-green-500',
    error: 'border-red-500',
  }

  return (
    <div className={`bg-slate-800 border-2 ${statusColors[status]} rounded-xl p-4 min-w-[240px] shadow-lg`}>
      <Handle type="target" position={Position.Left} className="!bg-indigo-500" />

      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-indigo-400" />
        <span className="text-white font-medium text-sm">{(data as any).label || 'حافظه'}</span>
      </div>

      <div className="bg-slate-900 rounded-lg p-2 text-xs text-slate-300 min-h-[48px]">
        {keys && keys.length > 0 ? (
          <ul className="space-y-0.5">
            {keys.map((k) => (
              <li key={k} className="text-indigo-300">• {k}</li>
            ))}
          </ul>
        ) : (
          <span className="text-slate-500">کلید-مقدار ذخیره می‌شود</span>
        )}
      </div>

      {status === 'running' && <div className="mt-2 text-xs text-indigo-400">در حال ذخیره...</div>}
      {status === 'success' && <div className="mt-2 text-xs text-green-400">ذخیره شد</div>}

      <Handle type="source" position={Position.Right} className="!bg-indigo-500" />
    </div>
  )
}
