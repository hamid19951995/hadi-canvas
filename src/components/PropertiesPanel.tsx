import { useCanvasStore } from '../store/useCanvasStore'

const MODELS = ['gpt-4o', 'gpt-4o-mini', 'claude-3.5-sonnet', 'gemini-pro', 'gpt-3.5-turbo']

export function PropertiesPanel() {
  const { nodes, selectedNodeId, updateNodeData, setSelectedNodeId } = useCanvasStore()
  const node = nodes.find((n) => n.id === selectedNodeId)

  if (!node) {
    return (
      <aside className="w-[300px] shrink-0 border-l border-slate-800 bg-[#0f172a] flex flex-col">
        <div className="h-12 border-b border-slate-800 flex items-center px-4">
          <span className="text-slate-400 text-sm">ویژگی‌ها</span>
        </div>
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <p className="text-slate-500 text-sm leading-relaxed">
            یک نود را انتخاب کنید تا تنظیمات آن را ویرایش کنید.
          </p>
        </div>
      </aside>
    )
  }

  const data = node.data as Record<string, unknown>
  const type = node.type || 'text'

  const set = (patch: Record<string, unknown>) => updateNodeData(node.id, patch as any)

  return (
    <aside className="w-[300px] shrink-0 border-l border-slate-800 bg-[#0f172a] flex flex-col overflow-hidden">
      <div className="h-12 border-b border-slate-800 flex items-center justify-between px-4 shrink-0">
        <span className="text-white text-sm font-medium">ویژگی‌ها</span>
        <button
          onClick={() => setSelectedNodeId(null)}
          className="text-slate-500 hover:text-white text-xs"
        >
          بستن
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Meta */}
        <section className="space-y-1">
          <label className="text-[11px] text-slate-500 uppercase tracking-wide">نوع</label>
          <div className="text-sm text-slate-300">{typeLabel(type)}</div>
          <div className="text-[11px] text-slate-600 font-mono">id: {node.id}</div>
        </section>

        {/* Label */}
        <Field label="عنوان">
          <input
            className={inputClass}
            value={(data.label as string) || ''}
            onChange={(e) => set({ label: e.target.value })}
          />
        </Field>

        {/* Status badge */}
        <section className="space-y-1">
          <label className="text-[11px] text-slate-500 uppercase tracking-wide">وضعیت</label>
          <StatusBadge status={(data.status as string) || 'empty'} />
          {!!data.error && (
            <p className="text-xs text-red-400 mt-1 break-words">{String(data.error)}</p>
          )}
        </section>

        {/* Type-specific fields */}
        {type === 'text' && (
          <>
            <Field label="مدل">
              <select
                className={inputClass}
                value={(data.model as string) || 'gpt-4o'}
                onChange={(e) => set({ model: e.target.value })}
              >
                {MODELS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </Field>
            <Field label="پرامپت">
              <textarea
                className={`${inputClass} min-h-[120px] resize-y`}
                value={(data.prompt as string) || ''}
                onChange={(e) => set({ prompt: e.target.value })}
                placeholder="پرامپت این نود..."
              />
            </Field>
          </>
        )}

        {type === 'conditional' && (
          <Field label="شرط (متن شامل…)">
            <input
              className={inputClass}
              value={(data.condition as string) || ''}
              onChange={(e) => set({ condition: e.target.value })}
              placeholder="مثلاً: بله"
            />
          </Field>
        )}

        {type === 'loop' && (
          <Field label="تعداد تکرار">
            <input
              type="number"
              min={1}
              max={50}
              className={inputClass}
              value={Number(data.iterations) || 3}
              onChange={(e) => set({ iterations: Math.max(1, Math.min(50, Number(e.target.value) || 1)) })}
            />
          </Field>
        )}

        {type === 'file' && (
          <>
            <Field label="حالت">
              <select
                className={inputClass}
                value={(data.mode as string) || 'input'}
                onChange={(e) => set({ mode: e.target.value })}
              >
                <option value="input">ورودی</option>
                <option value="output">خروجی</option>
              </select>
            </Field>
            <Field label="نام فایل">
              <input
                className={inputClass}
                value={(data.fileName as string) || ''}
                onChange={(e) => set({ fileName: e.target.value })}
                placeholder="output.txt"
              />
            </Field>
          </>
        )}

        {(type === 'image' || type === 'video') && (
          <p className="text-xs text-slate-500 leading-relaxed">
            این نود از خروجی نودهای بالادستی به‌عنوان پرامپت استفاده می‌کند.
            اتصال API رسانه در نسخه بعدی کامل می‌شود.
          </p>
        )}

        {/* Result preview */}
        {!!data.result && (
          <Field label="آخرین خروجی">
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-slate-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
              {String(data.result)}
            </div>
          </Field>
        )}
      </div>
    </aside>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="space-y-1.5">
      <label className="text-[11px] text-slate-500 uppercase tracking-wide">{label}</label>
      {children}
    </section>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    empty: 'bg-slate-700 text-slate-300',
    running: 'bg-blue-600/30 text-blue-300',
    success: 'bg-green-600/30 text-green-300',
    error: 'bg-red-600/30 text-red-300',
  }
  const labels: Record<string, string> = {
    empty: 'خالی',
    running: 'در حال اجرا',
    success: 'موفق',
    error: 'خطا',
  }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs ${map[status] || map.empty}`}>
      {labels[status] || status}
    </span>
  )
}

function typeLabel(type: string) {
  const map: Record<string, string> = {
    text: 'نود متنی',
    image: 'نود تصویر',
    video: 'نود ویدیو',
    merge: 'نود ادغام',
    conditional: 'نود شرطی',
    loop: 'نود حلقه',
    memory: 'نود حافظه',
    file: 'نود فایل',
  }
  return map[type] || type
}

const inputClass =
  'w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500'
