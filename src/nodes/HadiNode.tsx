import { memo, useMemo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { NodeData } from '../domain/types'
import { portsOf } from '../domain/types'

const statusColor: Record<string, string> = {
  idle: '#64748b',
  running: '#3b82f6',
  success: '#22c55e',
  error: '#ef4444',
  blocked: '#f59e0b',
  skipped: '#94a3b8',
}

/** Collect http(s) image-like URLs from node result text */
function extractImageUrls(text?: string): string[] {
  if (!text) return []
  const urls = text.match(/https?:\/\/[^\s)\]]+/g) || []
  const imageLike = urls.filter((u) => {
    const low = u.toLowerCase()
    return (
      low.includes('figma.com') ||
      low.includes('/images/') ||
      /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(low) ||
      low.includes('s3.') ||
      low.includes('amazonaws')
    )
  })
  // unique, max 4
  return [...new Set(imageLike)].slice(0, 4)
}

function HadiNodeComponent({ data, selected }: NodeProps & { data: NodeData & { groupLabel?: string; groupId?: string } }) {
  const ports = portsOf(data.kind)
  const ins = ports.filter((p) => p.direction === 'in')
  const outs = ports.filter((p) => p.direction === 'out')
  const images = useMemo(() => extractImageUrls(data.result), [data.result])
  const grouped = Boolean(data.groupId)

  return (
    <div
      dir="rtl"
      className={`min-w-[200px] max-w-[260px] rounded-xl border bg-slate-900 shadow-lg ${
        selected ? 'border-violet-500 ring-2 ring-violet-500/30' : grouped ? 'border-cyan-600/70' : 'border-slate-700'
      }`}
    >
      {data.groupLabel && (
        <div className="truncate border-b border-cyan-900/50 bg-cyan-950/40 px-2 py-0.5 text-[9px] text-cyan-300">
          گروه: {data.groupLabel}
        </div>
      )}
      <div className="flex items-center gap-2 border-b border-slate-800 px-3 py-2">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: statusColor[data.status] }}
        />
        <span className="flex-1 truncate text-xs font-medium text-white">{data.title}</span>
        <span className="text-[10px] text-slate-500">{data.kind}</span>
      </div>
      <div className="space-y-1.5 px-3 py-2 text-[11px] text-slate-400">
        {data.error && <p className="text-red-300">{data.error}</p>}
        {images.length > 0 && (
          <div className="grid grid-cols-2 gap-1">
            {images.map((src) => (
              <a
                key={src}
                href={src}
                target="_blank"
                rel="noreferrer"
                className="block overflow-hidden rounded-lg border border-slate-700 bg-slate-950"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={src}
                  alt="preview"
                  className="h-16 w-full object-cover"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </a>
            ))}
          </div>
        )}
        {data.result ? (
          <p className="line-clamp-3 whitespace-pre-wrap text-slate-300">{data.result}</p>
        ) : (
          data.prompt && <p className="line-clamp-2 text-slate-500">{data.prompt}</p>
        )}
      </div>
      {ins.map((p, i) => (
        <Handle
          key={p.id}
          id={p.id}
          type="target"
          position={Position.Left}
          style={{ top: 36 + i * 16 }}
          className="!h-2.5 !w-2.5 !border-slate-900 !bg-violet-400"
          title={p.label}
        />
      ))}
      {outs.map((p, i) => (
        <Handle
          key={p.id}
          id={p.id}
          type="source"
          position={Position.Right}
          style={{ top: 36 + i * 16 }}
          className="!h-2.5 !w-2.5 !border-slate-900 !bg-emerald-400"
          title={p.label}
        />
      ))}
    </div>
  )
}

export const HadiNode = memo(HadiNodeComponent)
