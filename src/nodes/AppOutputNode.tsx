import { Handle, Position, NodeProps } from '@xyflow/react'

function extractHtml(result?: string): string | null {
  if (!result) return null
  const fenced = result.match(/```html([\s\S]*?)```/i)
  if (fenced) return fenced[1].trim()
  if (/<html[\s>]|<body[\s>]|<div[\s>]/i.test(result) && /<\/[a-z]+>/i.test(result)) {
    return result.trim()
  }
  return null
}

export function AppOutputNode({ data }: NodeProps) {
  const d = data as any
  const status = d.status || 'empty'
  const html = extractHtml(d.result)
  const statusColors: Record<string, string> = {
    empty: 'border-slate-600',
    running: 'border-cyan-500',
    success: 'border-green-500',
    error: 'border-red-500',
  }

  return (
    <div className={`bg-slate-800 border-2 ${statusColors[status]} rounded-2xl overflow-hidden min-w-[240px] max-w-[280px] shadow-xl`}>
      <Handle type="target" position={Position.Top} className="!bg-cyan-500" />
      <div className="px-3 py-2 border-b border-slate-700 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-cyan-400" />
        <span className="text-white text-sm font-medium truncate">{d.label || 'خروجی اپ'}</span>
      </div>

      <div className="h-[160px] bg-white relative">
        {status === 'running' && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-xs bg-slate-100">
            در حال تولید واقعی...
          </div>
        )}
        {status === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center text-red-600 text-xs p-3 text-center">
            {d.error || 'خطا'}
          </div>
        )}
        {status === 'success' && html && (
          <iframe
            title="preview"
            sandbox="allow-scripts"
            srcDoc={html}
            className="w-[600px] h-[420px] origin-top-left scale-[0.4] border-0 pointer-events-none"
          />
        )}
        {status === 'success' && !html && (
          <div className="p-3 text-[11px] text-slate-700 whitespace-pre-wrap overflow-auto h-full">
            {(d.result || '').slice(0, 400)}
          </div>
        )}
        {status === 'empty' && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs">
            منتظر خروجی مدل
          </div>
        )}
      </div>

      {status === 'success' && (
        <div className="px-3 py-1.5 text-[11px] text-green-400 border-t border-slate-700">
          خروجی واقعی مدل · {d.model || ''}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-cyan-500" />
    </div>
  )
}
