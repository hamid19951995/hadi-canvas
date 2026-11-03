import { useEffect } from 'react'

export type ContextMenuItem = {
  id: string
  label: string
  onClick: () => void
}

type Props = {
  x: number
  y: number
  items: ContextMenuItem[]
  onClose: () => void
}

export function ContextMenu({ x, y, items, onClose }: Props) {
  useEffect(() => {
    const close = () => onClose()
    window.addEventListener('click', close)
    window.addEventListener('scroll', close, true)
    return () => {
      window.removeEventListener('click', close)
      window.removeEventListener('scroll', close, true)
    }
  }, [onClose])

  return (
    <div
      className="fixed z-[100] min-w-[200px] bg-slate-900 border border-slate-600 rounded-xl shadow-2xl py-1 overflow-hidden"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
      dir="rtl"
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className="w-full text-right px-3 py-2 text-sm text-slate-200 hover:bg-indigo-600/40"
          onClick={() => {
            item.onClick()
            onClose()
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
