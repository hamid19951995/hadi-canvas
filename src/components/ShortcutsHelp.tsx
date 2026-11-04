export function ShortcutsHelp({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null
  const rows: [string, string][] = [
    ['Ctrl/Cmd + Enter', 'بررسی و آماده‌سازی اجرا'],
    ['Ctrl/Cmd + S', 'ذخیره نسخه گراف'],
    ['Ctrl/Cmd + D', 'تکثیر گره انتخاب‌شده'],
    ['Ctrl/Cmd + F', 'جستجو در عنوان / پرامپت / نتیجه'],
    ['Delete / Backspace', 'حذف گره یا یال انتخاب‌شده'],
    ['Ctrl/Cmd + Z', 'Undo (تا ۳۰ مرحله)'],
    ['Ctrl/Cmd + Shift + Z / Y', 'Redo'],
    ['Shift + کلیک', 'انتخاب چند گره'],
    ['G', 'گروه‌بندی گره‌های انتخاب‌شده'],
    ['Shift + G', 'لغو گروه'],
    ['Esc', 'بستن منو / برداشتن انتخاب'],
    ['?', 'همین راهنما'],
  ]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" dir="rtl">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-950 p-5">
        <h2 className="mb-3 text-base font-semibold text-white">میانبرهای صفحه کلید</h2>
        <ul className="mb-4 space-y-2">
          {rows.map(([k, v]) => (
            <li key={k} className="flex justify-between gap-3 text-xs">
              <kbd className="shrink-0 rounded bg-slate-800 px-2 py-1 font-mono text-violet-200">{k}</kbd>
              <span className="text-left text-slate-300">{v}</span>
            </li>
          ))}
        </ul>
        <button type="button" onClick={onClose} className="rounded-xl bg-slate-800 px-3 py-2 text-xs text-white">
          بستن
        </button>
      </div>
    </div>
  )
}
