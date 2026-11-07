import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'
import { TEMPLATE_META } from '../templates/catalog'
import { downloadTemplateFile, userTemplateToFile } from '../services/templateShare'
import { downloadProjectFile } from '../services/projectShare'

export function ProjectsPage() {
  const projects = useStore((s) => s.projects)
  const refresh = useStore((s) => s.refresh)
  const createProject = useStore((s) => s.createProject)
  const openProject = useStore((s) => s.openProject)
  const deleteProject = useStore((s) => s.deleteProject)
  const loadTemplate = useStore((s) => s.loadTemplate)
  const userTemplates = useStore((s) => s.userTemplates)
  const refreshUserTemplates = useStore((s) => s.refreshUserTemplates)
  const loadUserTemplate = useStore((s) => s.loadUserTemplate)
  const removeUserTemplate = useStore((s) => s.removeUserTemplate)
  const importTemplateJson = useStore((s) => s.importTemplateJson)
  const importProjectJson = useStore((s) => s.importProjectJson)
  const [name, setName] = useState('')

  useEffect(() => {
    refresh()
    refreshUserTemplates()
  }, [refresh, refreshUserTemplates])

  return (
    <div className="min-h-screen bg-hadi-bg" dir="rtl">
      <header className="border-b border-slate-800 px-6 py-4">
        <div className="text-lg font-semibold text-white">hadi-canvas</div>
        <div className="text-xs text-slate-400">استودیوی یکپارچه · تبدیل ایده به خروجی قابل تحویل</div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="mb-2 text-2xl font-semibold text-white">پروژه‌ها</h1>
        <p className="mb-8 text-sm text-slate-400">
          ساخت پروژه فقط محیط کار می‌سازد و به‌خودی‌خود مدل اجرا یا اعتبار مصرف نمی‌کند.
        </p>

        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="mb-2 text-sm font-medium text-white">پروژه تازه</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="نام پروژه"
              className="mb-3 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            />
            <button
              type="button"
              onClick={() => createProject(name)}
              className="mb-2 w-full rounded-xl bg-violet-600 py-2 text-sm text-white hover:bg-violet-500"
            >
              ساخت و ورود به بوم
            </button>
            <label className="flex w-full cursor-pointer items-center justify-center rounded-xl border border-slate-700 py-2 text-xs text-slate-300 hover:border-violet-500">
              ورود فایل پروژه (.hadi-project.json)
              <input
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  const raw = await f.text()
                  const err = importProjectJson(raw)
                  if (err) alert(err)
                  e.target.value = ''
                }}
              />
            </label>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:col-span-1">
            <div className="mb-3 text-sm font-medium text-white">الگوهای آماده</div>
            <div className="grid max-h-64 gap-2 overflow-auto">
              {TEMPLATE_META.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => loadTemplate(tpl.id)}
                  className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-right hover:border-violet-500"
                >
                  <div className="text-sm text-white">{tpl.name}</div>
                  <p className="mt-1 text-[11px] text-slate-400">{tpl.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {tpl.tags.map((tag) => (
                      <span key={tag} className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                        {tag}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-300">الگوهای من</h2>
            <div className="flex gap-2">
              <label className="cursor-pointer text-xs text-violet-300 hover:text-white">
                ورود فایل الگو
                <input
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0]
                    if (!f) return
                    const raw = await f.text()
                    const err = importTemplateJson(raw)
                    if (err) alert(err)
                    else alert('الگو وارد شد')
                    e.target.value = ''
                  }}
                />
              </label>
              <button type="button" onClick={() => refreshUserTemplates()} className="text-xs text-slate-500 hover:text-white">
                تازه‌سازی
              </button>
            </div>
          </div>
          {userTemplates.length === 0 ? (
            <p className="rounded-2xl border border-slate-800 p-4 text-xs text-slate-500">
              هنوز الگوی شخصی ندارید. از داخل استودیو «ذخیره به‌عنوان الگو» را بزنید.
            </p>
          ) : (
            <ul className="space-y-2">
              {userTemplates.map((tpl) => (
                <li
                  key={tpl.id}
                  className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3"
                >
                  <button type="button" className="flex-1 text-right" onClick={() => loadUserTemplate(tpl.id)}>
                    <div className="text-sm text-white">{tpl.name}</div>
                    <div className="text-[11px] text-slate-500">
                      {tpl.nodes.length} گره
                      {tpl.description ? ` · ${tpl.description}` : ''}
                    </div>
                  </button>
                  <button
                    type="button"
                    className="text-xs text-slate-300 hover:text-white"
                    onClick={() => downloadTemplateFile(userTemplateToFile(tpl))}
                  >
                    خروجی
                  </button>
                  <button
                    type="button"
                    className="text-xs text-red-300 hover:text-red-200"
                    onClick={() => {
                      if (confirm('حذف این الگو؟')) removeUserTemplate(tpl.id)
                    }}
                  >
                    حذف
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-300">فهرست پروژه‌ها</h2>
          <button type="button" onClick={() => refresh()} className="text-xs text-slate-500 hover:text-white">
            تازه‌سازی
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 p-8 text-center text-sm text-slate-400">
            هنوز پروژه‌ای نیست.
          </div>
        ) : (
          <ul className="space-y-2">
            {projects.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3"
              >
                <button type="button" className="flex-1 text-right" onClick={() => openProject(p.id)}>
                  <div className="text-sm text-white">{p.name}</div>
                  <div className="text-[11px] text-slate-500">
                    {p.nodes.length} گره · {new Date(p.updatedAt).toLocaleString('fa-IR')}
                  </div>
                </button>
                <button
                  type="button"
                  className="text-xs text-slate-300 hover:text-white"
                  onClick={() => downloadProjectFile(p)}
                >
                  خروجی
                </button>
                <button
                  type="button"
                  className="text-xs text-red-300 hover:text-red-200"
                  onClick={() => {
                    if (confirm('حذف پروژه؟')) deleteProject(p.id)
                  }}
                >
                  حذف
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
