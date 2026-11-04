import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useStore } from '../store/useStore'
import { HadiNode } from '../nodes/HadiNode'
import { PreflightModal } from '../components/PreflightModal'
import { ModelsModal } from '../components/ModelsModal'
import { ConnectorsPanel } from '../components/ConnectorsPanel'
import { PublishModal } from '../components/PublishModal'
import { ShortcutsHelp } from '../components/ShortcutsHelp'
import { FigmaFramePicker } from '../components/FigmaFramePicker'
import { downloadTemplateFile, projectToTemplateFile } from '../services/templateShare'
import { downloadProjectFile } from '../services/projectShare'
import { clearImageCache, listCached } from '../services/imageCache'
import { extractImageUrls } from '../utils/extractImages'
import { BeforeAfterSlider } from '../components/BeforeAfterSlider'
import type { NodeKind } from '../domain/types'

const nodeTypes = {
  prompt: HadiNode,
  text: HadiNode,
  image: HadiNode,
  code: HadiNode,
  merge: HadiNode,
  final: HadiNode,
  condition: HadiNode,
  loop: HadiNode,
  memory: HadiNode,
  agent: HadiNode,
  figma: HadiNode,
}

const KINDS: NodeKind[] = ['prompt', 'text', 'image', 'code', 'merge', 'final', 'condition', 'loop', 'memory', 'agent', 'figma']

export function StudioPage() {
  const project = useStore((s) => s.project)
  const selectedId = useStore((s) => s.selectedId)
  const select = useStore((s) => s.select)
  const connect = useStore((s) => s.connect)
  const setNodesStore = useStore((s) => s.setNodes)
  const addNode = useStore((s) => s.addNode)
  const updateNode = useStore((s) => s.updateNode)
  const removeSelected = useStore((s) => s.removeSelected)
  const removeEdges = useStore((s) => s.removeEdges)
  const undo = useStore((s) => s.undo)
  const redo = useStore((s) => s.redo)
  const undoStack = useStore((s) => s.undoStack)
  const redoStack = useStore((s) => s.redoStack)
  const pushUndo = useStore((s) => s.pushUndo)
  const goProjects = useStore((s) => s.goProjects)
  const openPreflight = useStore((s) => s.openPreflight)
  const closePreflight = useStore((s) => s.closePreflight)
  const confirmRun = useStore((s) => s.confirmRun)
  const preflightOpen = useStore((s) => s.preflightOpen)
  const issues = useStore((s) => s.issues)
  const running = useStore((s) => s.running)
  const lastSavedAt = useStore((s) => s.lastSavedAt)
  const requestCancel = useStore((s) => s.requestCancel)
  const apiKey = useStore((s) => s.apiKey)
  const setApiKey = useStore((s) => s.setApiKey)
  const tab = useStore((s) => s.tab)
  const setTab = useStore((s) => s.setTab)
  const setModels = useStore((s) => s.setModels)
  const setParallel = useStore((s) => s.setParallel)
  const runs = useStore((s) => s.runs)
  const refreshRuns = useStore((s) => s.refreshRuns)
  const retryNode = useStore((s) => s.retryNode)
  const [modelsOpen, setModelsOpen] = useState(false)
  const [publishOpen, setPublishOpen] = useState(false)
  const versions = useStore((s) => s.versions)
  const refreshVersions = useStore((s) => s.refreshVersions)
  const snapshotVersion = useStore((s) => s.snapshotVersion)
  const restoreVersion = useStore((s) => s.restoreVersion)
  const duplicateNode = useStore((s) => s.duplicateNode)
  const focusNodeId = useStore((s) => s.focusNodeId)
  const setFocusNodeId = useStore((s) => s.setFocusNodeId)
  const selectedIds = useStore((s) => s.selectedIds)
  const groupSelected = useStore((s) => s.groupSelected)
  const ungroupSelected = useStore((s) => s.ungroupSelected)
  const selectGroup = useStore((s) => s.selectGroup)
  const searchGraph = useStore((s) => s.searchGraph)
  const clearSelection = useStore((s) => s.clearSelection)
  const saveAsUserTemplate = useStore((s) => s.saveAsUserTemplate)
  const applyFigmaFrames = useStore((s) => s.applyFigmaFrames)
  const [cmpA, setCmpA] = useState('')
  const [cmpB, setCmpB] = useState('')
  const [cmpMode, setCmpMode] = useState<'side' | 'grid' | 'slider'>('side')
  const [sliderBefore, setSliderBefore] = useState(0)
  const [sliderAfter, setSliderAfter] = useState(0)
  const [query, setQuery] = useState('')
  const [helpOpen, setHelpOpen] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [searchHits, setSearchHits] = useState<{ id: string; title: string; hit: string }[]>([])
  const searchRef = useRef<HTMLInputElement>(null)

  const [ctx, setCtx] = useState<{ x: number; y: number } | null>(null)


  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey
      const tag = (e.target as HTMLElement)?.tagName
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable

      if (e.key === '?' && !typing) {
        e.preventDefault()
        setHelpOpen(true)
        return
      }
      if (e.key === 'Escape') {
        clearSelection()
        setSearchHits([])
        setHelpOpen(false)
        setCtx(null)
        select(null)
        setQuery('')
        return
      }
      if (!mod) return
      if (e.key === 'Enter' && tab === 'canvas') {
        e.preventDefault()
        openPreflight()
      } else if (e.key.toLowerCase() === 's' && tab === 'canvas') {
        e.preventDefault()
        snapshotVersion('میانبر')
      } else if (e.key.toLowerCase() === 'g' && !typing && tab === 'canvas') {
        e.preventDefault()
        if (e.shiftKey) ungroupSelected()
        else groupSelected()
      } else if (e.key.toLowerCase() === 'd' && selectedId && !typing) {
        e.preventDefault()
        duplicateNode(selectedId)
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault()
        searchRef.current?.focus()
      } else if (e.key.toLowerCase() === 'z' && tab === 'canvas') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      } else if (e.key.toLowerCase() === 'y' && tab === 'canvas') {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tab, selectedId, openPreflight, snapshotVersion, duplicateNode, select,
    selectedIds,
    groupSelected,
    ungroupSelected,
    selectGroup,
    searchGraph,
    clearSelection, undo, redo])

  const rfNodes = useMemo(
    () =>
      (project?.nodes || []).map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: { ...n.data, groupId: n.groupId, groupLabel: n.groupLabel },
        selected: selectedIds.includes(n.id) || n.id === selectedId || n.id === focusNodeId,
      })) as Node[],
    [project?.nodes, selectedId, selectedIds, focusNodeId, project?.updatedAt]
  )

  const rfEdges = useMemo(
    () =>
      (project?.edges || []).map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        selectable: true,
        style: { stroke: e.valid ? '#8b5cf6' : '#ef4444', strokeWidth: 2 },
        animated: !e.valid,
      })) as Edge[],
    [project?.edges, project?.updatedAt]
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(rfNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(rfEdges)

  useEffect(() => {
    setNodes(rfNodes)
    setEdges(rfEdges)
  }, [project?.id, project?.updatedAt])

  const onConnect = useCallback(
    (c: Connection) => {
      if (!c.source || !c.target) return
      const err = connect(c.source, c.target, c.sourceHandle, c.targetHandle)
      if (err) alert(err)
    },
    [connect]
  )

  const onNodeDragStop = useCallback(
    (_: unknown, _n: Node, all: Node[]) => {
      if (!project) return
      const mapped = all.map((n) => {
        const prev = project.nodes.find((x) => x.id === n.id)!
        return { ...prev, position: n.position }
      })
      setNodesStore(mapped)
    },
    [project, setNodesStore]
  )

  const selected = project?.nodes.find((n) => n.id === selectedId)


  const onNodeClick = useCallback(
    (e: React.MouseEvent, node: Node) => {
      select(node.id, Boolean(e.shiftKey))
    },
    [select],
  )

  const groups = useMemo(() => {
    const map = new Map<string, { id: string; label: string; count: number }>()
    for (const n of project?.nodes || []) {
      if (!n.groupId) continue
      const g = map.get(n.groupId) || { id: n.groupId, label: n.groupLabel || n.groupId, count: 0 }
      g.count++
      map.set(n.groupId, g)
    }
    return [...map.values()]
  }, [project?.nodes, project?.updatedAt])

  if (!project) return null

  const finalNode = project.nodes.find((n) => n.data.kind === 'final')

  return (
    <div className="flex h-screen flex-col bg-hadi-bg text-slate-100">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-slate-800 px-3" dir="rtl">
        <button type="button" onClick={goProjects} className="text-xs text-slate-400 hover:text-white">
          پروژه‌ها
        </button>
        <span className="text-sm font-semibold">hadi-canvas</span>
        <div className="mr-2 flex gap-1 rounded-xl border border-slate-800 bg-slate-900 p-0.5">
          {(
            [
              ['canvas', 'محیط استودیو'],
              ['plugins', 'افزونه‌ها'],
              ['settings', 'تنظیمات'],
              ['output', 'خروجی'],
              ['history', 'تاریخچه'],
              ['compare', 'مقایسه'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => { setTab(id); if (id === 'history') { refreshRuns(); refreshVersions() }; if (id === 'compare') refreshVersions() }}
              className={`rounded-lg px-2.5 py-1 text-xs ${
                tab === id ? 'bg-violet-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="mr-auto text-xs text-slate-500">{project.name}</span>
      </header>


      {tab === 'history' && (
        <div className="flex-1 overflow-auto p-6" dir="rtl">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-lg text-white">تاریخچه اجرا</h1>
            <button type="button" onClick={() => refreshRuns()} className="text-xs text-slate-400 hover:text-white">
              تازه‌سازی
            </button>
          </div>
          <p className="mb-4 text-xs text-slate-400">
            هر اجرا به وضعیت گره‌ها در همان لحظه وصل است. تغییر پرامپت فعلی، سابقه را عوض نمی‌کند.
          </p>
          {runs.length === 0 ? (
            <p className="text-sm text-slate-500">هنوز اجرایی ثبت نشده.</p>
          ) : (
            <ul className="space-y-3">
              {runs.map((r) => (
                <li key={r.id} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                  <div className="flex justify-between text-sm text-white">
                    <span>{r.status}</span>
                    <span className="text-xs text-slate-500">{new Date(r.finishedAt).toLocaleString('fa-IR')}</span>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-400">
                    {r.nodeSummary.map((n) => n.title + ':' + n.status).join(' · ')}
                  </div>
                  {r.finalResult && (
                    <pre className="mt-2 max-h-24 overflow-auto whitespace-pre-wrap text-[10px] text-slate-300">
                      {r.finalResult.slice(0, 400)}
                    </pre>
                  )}
                </li>
              ))}
            </ul>
          )}

          <h2 className="mb-2 mt-8 text-base text-white">نسخه‌های گراف</h2>
          <p className="mb-3 text-xs text-slate-400">
            بازنشانی نسخه، بوم فعلی را عوض می‌کند ولی رکوردهای تاریخچه اجرا را پاک نمی‌کند.
          </p>
          <button
            type="button"
            className="mb-3 rounded-lg bg-violet-600 px-3 py-1.5 text-xs text-white"
            onClick={() => snapshotVersion('دستی')}
          >
            ذخیره نسخه فعلی
          </button>
          {versions.length === 0 ? (
            <p className="text-sm text-slate-500">نسخه‌ای نیست.</p>
          ) : (
            <ul className="space-y-2">
              {versions.map((v) => (
                <li
                  key={v.id}
                  className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2"
                >
                  <div className="flex-1">
                    <div className="text-sm text-white">{v.label}</div>
                    <div className="text-[10px] text-slate-500">
                      {new Date(v.createdAt).toLocaleString('fa-IR')}
                      {v.note ? ` · ${v.note}` : ''}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="rounded-lg bg-slate-800 px-2 py-1 text-[11px] text-slate-200"
                    onClick={() => {
                      const err = restoreVersion(v.id)
                      if (err) alert(err)
                      else setTab('canvas')
                    }}
                  >
                    بازنشانی
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}


      {tab === 'compare' && (
        <div className="flex-1 overflow-auto p-6" dir="rtl">
          <h1 className="mb-2 text-lg text-white">مقایسه خروجی‌ها و فریم‌ها</h1>
          <p className="mb-4 text-xs text-slate-400">
            دو گره را انتخاب کنید. اگر خروجی شامل لینک تصویر (مثلاً PNG فigma) باشد، پیش‌نمایش بصری هم نشان داده می‌شود.
          </p>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-500">چیدمان تصاویر:</span>
            <button
              type="button"
              onClick={() => setCmpMode('side')}
              className={`rounded-lg px-2 py-1 text-[11px] ${cmpMode === 'side' ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-300'}`}
            >
              کنار هم
            </button>
            <button
              type="button"
              onClick={() => setCmpMode('grid')}
              className={`rounded-lg px-2 py-1 text-[11px] ${cmpMode === 'grid' ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-300'}`}
            >
              شبکه همه فریم‌ها
            </button>
            <button
              type="button"
              onClick={() => setCmpMode('slider')}
              className={`rounded-lg px-2 py-1 text-[11px] ${cmpMode === 'slider' ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-300'}`}
            >
              اسلایدر قبل/بعد
            </button>
          </div>
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] text-slate-400">خروجی الف</label>
              <select
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                value={cmpA}
                onChange={(e) => setCmpA(e.target.value)}
              >
                <option value="">— انتخاب —</option>
                {project.nodes
                  .filter((n) => n.data.result)
                  .map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.data.title} ({n.data.status})
                      {extractImageUrls(n.data.result).length ? ` · ${extractImageUrls(n.data.result).length} تصویر` : ''}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-slate-400">خروجی ب</label>
              <select
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                value={cmpB}
                onChange={(e) => setCmpB(e.target.value)}
              >
                <option value="">— انتخاب —</option>
                {project.nodes
                  .filter((n) => n.data.result)
                  .map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.data.title} ({n.data.status})
                      {extractImageUrls(n.data.result).length ? ` · ${extractImageUrls(n.data.result).length} تصویر` : ''}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {cmpMode === 'grid' && (cmpA || cmpB) && (
            <div className="mb-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
              <div className="mb-2 text-sm text-white">همه فریم‌های انتخاب‌شده</div>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
                {[cmpA, cmpB]
                  .filter(Boolean)
                  .flatMap((id, side) => {
                    const n = project.nodes.find((x) => x.id === id)
                    return extractImageUrls(n?.data.result).map((src, idx) => ({
                      src,
                      label: `${side === 0 ? 'الف' : 'ب'} · ${n?.data.title || ''} · ${idx + 1}`,
                    }))
                  })
                  .map((item) => (
                    <a
                      key={item.src + item.label}
                      href={item.src}
                      target="_blank"
                      rel="noreferrer"
                      className="group overflow-hidden rounded-xl border border-slate-700 bg-slate-950"
                    >
                      <img
                        src={item.src}
                        alt={item.label}
                        className="h-32 w-full object-cover transition group-hover:opacity-90"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                      <div className="truncate px-2 py-1 text-[10px] text-slate-400">{item.label}</div>
                    </a>
                  ))}
              </div>
            </div>
          )}

          {cmpMode === 'slider' && (
            <div className="mb-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-4" dir="rtl">
              <div className="mb-3 text-sm text-white">اسلایدر قبل / بعد</div>
              {(() => {
                const nodeA = project.nodes.find((x) => x.id === cmpA)
                const nodeB = project.nodes.find((x) => x.id === cmpB)
                const imgsA = extractImageUrls(nodeA?.data.result)
                const imgsB = extractImageUrls(nodeB?.data.result)
                const beforeSrc = imgsA[sliderBefore] || imgsA[0]
                const afterSrc = imgsB[sliderAfter] || imgsB[0] || imgsA[1]
                if (!beforeSrc || !afterSrc) {
                  return (
                    <p className="text-xs text-slate-500">
                      برای اسلایدر، هر دو سمت (یا یک سمت با حداقل دو تصویر) باید لینک تصویر داشته باشند. اول گره
                      figma را اجرا کنید.
                    </p>
                  )
                }
                return (
                  <>
                    <div className="mb-3 grid gap-2 sm:grid-cols-2">
                      <label className="text-[11px] text-slate-400">
                        تصویر قبل (الف)
                        <select
                          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs"
                          value={sliderBefore}
                          onChange={(e) => setSliderBefore(Number(e.target.value))}
                        >
                          {imgsA.map((src, i) => (
                            <option key={src} value={i}>
                              الف · فریم {i + 1}
                            </option>
                          ))}
                          {imgsA.length === 0 && <option value={0}>—</option>}
                        </select>
                      </label>
                      <label className="text-[11px] text-slate-400">
                        تصویر بعد (ب)
                        <select
                          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs"
                          value={sliderAfter}
                          onChange={(e) => setSliderAfter(Number(e.target.value))}
                        >
                          {(imgsB.length ? imgsB : imgsA).map((src, i) => (
                            <option key={src} value={i}>
                              {(imgsB.length ? 'ب' : 'الف')} · فریم {i + 1}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <BeforeAfterSlider
                      beforeSrc={beforeSrc}
                      afterSrc={afterSrc}
                      beforeLabel={nodeA?.data.title || 'قبل'}
                      afterLabel={nodeB?.data.title || nodeA?.data.title || 'بعد'}
                    />
                  </>
                )
              })()}
            </div>
          )}

          <div className="grid gap-3 lg:grid-cols-2">
            {[cmpA, cmpB].map((id, i) => {
              const n = project.nodes.find((x) => x.id === id)
              const imgs = extractImageUrls(n?.data.result)
              return (
                <div key={i} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                  <div className="mb-2 text-sm font-medium text-white">
                    {n ? n.data.title : `سمت ${i === 0 ? 'الف' : 'ب'}`}
                    {imgs.length > 0 && (
                      <span className="mr-2 text-[10px] font-normal text-violet-300">{imgs.length} تصویر</span>
                    )}
                  </div>
                  {cmpMode === 'side' && imgs.length > 0 && (
                    <div className="mb-3 grid grid-cols-2 gap-2">
                      {imgs.map((src) => (
                        <a
                          key={src}
                          href={src}
                          target="_blank"
                          rel="noreferrer"
                          className="overflow-hidden rounded-xl border border-slate-700 bg-slate-950"
                        >
                          <img
                            src={src}
                            alt=""
                            className="h-36 w-full object-cover"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                  <pre className="max-h-[40vh] overflow-auto whitespace-pre-wrap text-xs text-slate-300">
                    {n?.data.result || 'نتیجه‌ای نیست'}
                  </pre>
                  {n?.data.result && (
                    <button
                      type="button"
                      className="mt-3 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs text-white"
                      onClick={() => {
                        const fin = project.nodes.find((x) => x.data.kind === 'final')
                        if (fin) {
                          updateNode(fin.id, { result: n.data.result, status: 'success' })
                          alert('به گره خروجی نهایی کپی شد')
                        } else {
                          alert('گره خروجی نهایی در گراف نیست')
                        }
                      }}
                    >
                      انتخاب به‌عنوان خروجی نهایی
                    </button>
                  )}
                </div>
              )
            })}
          </div>
          {cmpA && cmpB && cmpA === cmpB && (
            <p className="mt-3 text-xs text-amber-300">هر دو سمت یک گره است؛ برای مقایسه دو نتیجه متفاوت انتخاب کنید.</p>
          )}
        </div>
      )}

      {tab === 'plugins' && (
        <div className="flex-1 overflow-auto p-6" dir="rtl">
          <h1 className="mb-4 text-lg text-white">مرکز افزونه‌ها</h1>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { id: 'code' as NodeKind, s: 'آماده', d: 'تولید کد' },
              { id: 'image' as NodeKind, s: 'آماده', d: 'تولید/شرح تصویر' },
              { id: 'text' as NodeKind, s: 'آماده', d: 'متن' },
              { id: 'prompt' as NodeKind, s: 'آماده', d: 'پرامپت پایه' },
              { id: 'condition' as NodeKind, s: 'آماده', d: 'شرط (true/false)' },
              { id: 'loop' as NodeKind, s: 'آماده · سقف ۵', d: 'حلقه محدود' },
              { id: 'memory' as NodeKind, s: 'آماده', d: 'حافظه گراف' },
              { id: 'agent' as NodeKind, s: 'آماده', d: 'ایجنت برنامه‌ریز' },
              { id: 'figma' as NodeKind, s: 'نیاز OAuth', d: 'خواندن فایل Figma' },
            ].map((p) => (
              <div key={p.id} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
                <div className="text-sm text-white">{p.d}</div>
                <div className="mt-1 text-[11px] text-emerald-400">{p.s}</div>
                <button
                  type="button"
                  className="mt-3 rounded-lg bg-violet-600 px-3 py-1.5 text-xs text-white"
                  onClick={() => {
                    addNode(p.id)
                    setTab('canvas')
                  }}
                >
                  افزودن به بوم
                </button>
              </div>
            ))}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4 opacity-70">
              <div className="text-sm text-white">ویدیو / Figma / GitHub</div>
              <div className="mt-1 text-[11px] text-amber-300">نیازمند اتصال واقعی یا به‌زودی</div>
            </div>
          </div>
        </div>
      )}

      {tab === 'settings' && (
        <div className="flex-1 p-6" dir="rtl">
          <h1 className="mb-2 text-lg text-white">تنظیمات</h1>
          <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="mb-2 text-sm text-white">کش thumbnail محلی</div>
            <p className="mb-2 text-[11px] text-slate-400">{listCached().length} مورد در مرورگر</p>
            <button
              type="button"
              className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-200"
              onClick={() => {
                clearImageCache()
                alert('کش تصاویر پاک شد')
              }}
            >
              پاک کردن کش تصاویر
            </button>
          </div>
          <label className="mb-1 block text-xs text-slate-400">کلید API (GapGPT / سازگار OpenAI)</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            placeholder="sk-..."
          />
          <p className="mt-2 max-w-md text-xs text-slate-500">
            بدون کلید، خروجی نمونهٔ محلی ساخته می‌شود و به سرویس بیرونی درخواست نمی‌رود.
          </p>
        </div>
      )}

      {tab === 'output' && (
        <div className="flex-1 overflow-auto p-6" dir="rtl">
          <h1 className="mb-2 text-lg text-white">خروجی نهایی · دریافت محلی</h1>
          <p className="mb-4 text-xs text-slate-400">انتشار راه‌دور جداست و بدون اتصال معتبر انجام نمی‌شود.</p>
          <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap rounded-xl border border-slate-800 bg-slate-900 p-4 text-xs text-slate-200">
            {finalNode?.data.result || 'هنوز خروجی‌ای نیست. گراف را اجرا کنید.'}
          </pre>
          <button
            type="button"
            className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-sm text-white"
            onClick={() => setPublishOpen(true)}
          >
            دریافت / انتشار با تأیید
          </button>
        </div>
      )}

      {tab === 'canvas' && (
        <div className="flex min-h-0 flex-1">
          <aside className="w-72 shrink-0 overflow-y-auto border-l border-slate-800 bg-slate-950 p-4" dir="rtl">
            <div className="mb-3 text-sm font-medium text-white">ویژگی‌ها</div>
            {!selected ? (
              <p className="text-xs text-slate-500">یک گره را تک‌کلیک کنید.</p>
            ) : (
              <>
                <label className="mb-1 block text-[11px] text-slate-400">عنوان</label>
                <input
                  className="mb-3 w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs"
                  value={selected.data.title}
                  onChange={(e) => updateNode(selected.id, { title: e.target.value })}
                />
                <label className="mb-1 block text-[11px] text-slate-400">پرامپت</label>
                <textarea
                  className="mb-3 h-28 w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs"
                  value={selected.data.prompt}
                  onChange={(e) => updateNode(selected.id, { prompt: e.target.value })}
                />
                <label className="mb-1 block text-[11px] text-slate-400">مدل</label>
                <input
                  className="mb-3 w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs"
                  value={selected.data.model}
                  onChange={(e) => updateNode(selected.id, { model: e.target.value })}
                />
                {selected.data.kind === 'loop' && (
                  <>
                    <label className="mb-1 block text-[11px] text-slate-400">حداکثر دور (۱–۵)</label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      className="mb-3 w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs"
                      value={selected.data.config?.maxIterations ?? 3}
                      onChange={(e) =>
                        updateNode(selected.id, {
                          config: {
                            ...selected.data.config,
                            maxIterations: Math.min(5, Math.max(1, Number(e.target.value) || 1)),
                          },
                        })
                      }
                    />
                  </>
                )}
                {selected.data.kind === 'memory' && (
                  <>
                    <label className="mb-1 block text-[11px] text-slate-400">کلید حافظه</label>
                    <input
                      className="mb-3 w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs"
                      value={selected.data.config?.memoryKey ?? 'default'}
                      onChange={(e) =>
                        updateNode(selected.id, {
                          config: { ...selected.data.config, memoryKey: e.target.value || 'default' },
                        })
                      }
                    />
                  </>
                )}
                {selected.data.kind === 'figma' && (
                  <>
                    <label className="mb-1 block text-[11px] text-slate-400">کلید فایل یا لینک Figma</label>
                    <input
                      className="mb-3 w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs"
                      value={selected.data.config?.figmaFileKey || selected.data.prompt}
                      onChange={(e) =>
                        updateNode(selected.id, {
                          prompt: e.target.value,
                          config: { ...selected.data.config, figmaFileKey: e.target.value },
                        })
                      }
                      placeholder="https://www.figma.com/design/XXXX/..."
                    />
                    <p className="mb-2 text-[10px] text-slate-500">
                      با اجرا: ساختار + PNG. یا از فهرست زیر فریم را انتخاب کنید.
                    </p>
                    <FigmaFramePicker
                      result={selected.data.result}
                      busy={running}
                      onApply={(ids) => applyFigmaFrames(selected.id, ids)}
                    />
                  </>
                )}
                {selected.data.kind === 'condition' && (
                  <p className="mb-3 text-[10px] text-slate-500">
                    اگر ورودی شامل بله / yes / true باشد مسیر «درست» فعال می‌شود؛ وگرنه «نادرست».
                  </p>
                )}
                {selected.data.result &&
                  (selected.data.result.match(/https?:\/\/[^\s\)]+/g) || []).filter((u) =>
                    /png|jpg|jpeg|figma|images|webp/i.test(u)
                  ).length > 0 && (
                    <div className="mb-3">
                      <div className="mb-1 text-[11px] text-slate-400">پیش‌نمایش تصاویر</div>
                      <div className="grid grid-cols-2 gap-1">
                        {(selected.data.result.match(/https?:\/\/[^\s\)]+/g) || [])
                          .filter((u) => /png|jpg|jpeg|figma|images|webp/i.test(u))
                          .slice(0, 4)
                          .map((src) => (
                            <a key={src} href={src} target="_blank" rel="noreferrer">
                              <img src={src} alt="" className="h-20 w-full rounded-lg object-cover border border-slate-700" referrerPolicy="no-referrer" />
                            </a>
                          ))}
                      </div>
                    </div>
                  )}
                <div className="mb-3 text-[11px] text-slate-400">وضعیت: {selected.data.status}</div>
                {selected.data.result && (
                  <pre className="mb-3 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-900 p-2 text-[10px] text-slate-300">
                    {selected.data.result}
                  </pre>
                )}
                {selected.data.status === 'error' && (
                  <button
                    type="button"
                    onClick={() => void retryNode(selected.id)}
                    className="mb-2 w-full rounded-lg bg-amber-600/80 py-2 text-xs text-white"
                  >
                    تلاش دوباره فقط این گره
                  </button>
                )}
                <button
                  type="button"
                  onClick={removeSelected}
                  className="w-full rounded-lg border border-red-500/40 py-2 text-xs text-red-200"
                >
                  حذف گره
                </button>
              </>
            )}
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="relative flex h-10 items-center gap-2 border-b border-slate-800 px-2" dir="rtl">
              <select
                className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[11px]"
                defaultValue=""
                onChange={(e) => {
                  const k = e.target.value as NodeKind
                  if (k) addNode(k)
                  e.target.value = ''
                }}
              >
                <option value="">+ افزودن گره</option>
                {KINDS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setModelsOpen(true)}
                className="rounded-lg bg-violet-600/20 px-2 py-1 text-[11px] text-violet-200"
              >
                مدل‌ها و تعداد
              </button>
              <button
                type="button"
                onClick={() => snapshotVersion()}
                className="rounded-lg bg-slate-800 px-2 py-1 text-[11px] text-slate-200"
              >
                ذخیره نسخه
              </button>
              <button
                type="button"
                onClick={() => {
                  const name = prompt('نام الگو', project.name)
                  if (!name) return
                  const desc = prompt('توضیح کوتاه (اختیاری)', '') || undefined
                  const err = saveAsUserTemplate(name, desc)
                  if (err) alert(err)
                  else alert('الگو ذخیره شد. از صفحه پروژه‌ها → الگوهای من باز کنید.')
                }}
                className="rounded-lg bg-slate-800 px-2 py-1 text-[11px] text-slate-200"
              >
                ذخیره به‌عنوان الگو
              </button>
              <button
                type="button"
                onClick={() => {
                  const desc = prompt('توضیح فایل (اختیاری)', '') || ''
                  downloadTemplateFile(projectToTemplateFile({ ...project, name: project.name }, desc))
                }}
                className="rounded-lg bg-slate-800 px-2 py-1 text-[11px] text-slate-200"
              >
                خروجی فایل الگو
              </button>
              <button
                type="button"
                onClick={() => downloadProjectFile(project)}
                className="rounded-lg bg-slate-800 px-2 py-1 text-[11px] text-slate-200"
              >
                خروجی پروژه
              </button>
              {selectedId && (
                <button
                  type="button"
                  onClick={() => duplicateNode(selectedId)}
                  className="rounded-lg bg-slate-800 px-2 py-1 text-[11px] text-slate-200"
                >
                  تکثیر
                </button>
              )}
              {selectedIds.length >= 2 && (
              <button
                type="button"
                className="rounded-lg bg-cyan-800/80 px-2 py-1 text-[11px] text-cyan-100"
                onClick={() => {
                  const name = prompt('نام گروه (اختیاری)')
                  groupSelected(name || undefined)
                }}
              >
                گروه‌بندی ({selectedIds.length})
              </button>
            )}
            {(selectedIds.length > 0 || selectedId) && (
              <button
                type="button"
                className="rounded-lg bg-slate-800 px-2 py-1 text-[11px] text-slate-300"
                onClick={() => ungroupSelected()}
              >
                لغو گروه
              </button>
            )}
            {groups.length > 0 && (
              <select
                className="max-w-[120px] rounded-lg border border-slate-700 bg-slate-900 px-1 py-1 text-[11px] text-slate-300"
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) selectGroup(e.target.value)
                  e.target.value = ''
                }}
              >
                <option value="">گروه‌ها…</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label} ({g.count})
                  </option>
                ))}
              </select>
            )}
            <button
                type="button"
                onClick={() => undo()}
                disabled={!undoStack.length}
                className="rounded-lg bg-slate-800 px-2 py-1 text-[11px] text-slate-200 disabled:opacity-40"
                title="Ctrl+Z"
              >
                Undo{undoStack.length ? ` (${undoStack.length})` : ''}
              </button>
              <button
                type="button"
                onClick={() => redo()}
                disabled={!redoStack.length}
                className="rounded-lg bg-slate-800 px-2 py-1 text-[11px] text-slate-200 disabled:opacity-40"
                title="Ctrl+Shift+Z / Ctrl+Y"
              >
                Redo{redoStack.length ? ` (${redoStack.length})` : ''}
              </button>
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="جستجو عنوان/نتیجه/گروه… (Ctrl+F)"
                className="w-36 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-200"
              />
              <button
                type="button"
                onClick={() => setHelpOpen(true)}
                className="rounded-lg bg-slate-800 px-2 py-1 text-[11px] text-slate-400"
                title="میانبرها"
              >
                ?
              </button>
              {running ? (
                <button
                  type="button"
                  onClick={requestCancel}
                  className="rounded-lg bg-red-600/80 px-3 py-1 text-[11px] text-white"
                >
                  لغو
                </button>
              ) : (
                <button
                  type="button"
                  onClick={openPreflight}
                  className="rounded-lg bg-emerald-600 px-3 py-1 text-[11px] text-white"
                >
                  اجرای گراف
                </button>
              )}
              <span className="text-[11px] text-slate-500">
                {lastSavedAt ? `ذخیره ${new Date(lastSavedAt).toLocaleTimeString('fa-IR')}` : 'هنوز ذخیره نشده'}
                {' · '}
                {project.nodes.length} گره · {project.edges.length} اتصال
                {project.settings.memory && Object.keys(project.settings.memory).length > 0
                  ? ` · حافظه: ${Object.keys(project.settings.memory).length}`
                  : ''}
              </span>
              {query.trim() && (
                <div className="absolute top-10 left-2 z-20 max-h-48 w-56 overflow-auto rounded-xl border border-slate-700 bg-slate-950 shadow-xl" dir="rtl">
                  {project.nodes
                    .filter((n) => {
                      const q = query.trim().toLowerCase()
                      return (
                        n.data.title.toLowerCase().includes(q) ||
                        n.data.kind.toLowerCase().includes(q) ||
                        (n.data.prompt || '').toLowerCase().includes(q) ||
                        (n.data.result || '').toLowerCase().includes(q) ||
                        (n.groupLabel || '').toLowerCase().includes(q)
                      )
                    })
                    .map((n) => {
                      const q = query.trim().toLowerCase()
                      let snippet = n.data.kind
                      if ((n.data.result || '').toLowerCase().includes(q)) {
                        const r = n.data.result || ''
                        const i = r.toLowerCase().indexOf(q)
                        snippet = r.slice(Math.max(0, i - 12), i + q.length + 28).replace(/\s+/g, ' ')
                      } else if (n.groupLabel) snippet = `گروه: ${n.groupLabel}`
                      return (
                      <button
                        key={n.id}
                        type="button"
                        className="block w-full px-3 py-2 text-right text-[11px] text-slate-200 hover:bg-slate-800"
                        onClick={() => {
                          select(n.id)
                          setFocusNodeId(n.id)
                          setQuery('')
                        }}
                      >
                        <div className="text-white">{n.data.title}
                          <span className="mr-2 text-slate-500">{n.data.kind}</span>
                        </div>
                        <div className="truncate text-[10px] text-slate-500">{snippet}</div>
                      </button>
                      )
                    })}
                </div>
              )}
            </div>

            <div
              className="min-h-0 flex-1"
              onContextMenu={(e) => {
                e.preventDefault()
                setCtx({ x: e.clientX, y: e.clientY })
              }}
            >
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeDragStop={onNodeDragStop}
                onNodeClick={onNodeClick}
                nodeTypes={nodeTypes as any}
                onPaneClick={() => {
                  clearSelection()
                  setCtx(null)
                }}
                onNodesDelete={(deleted) => {
                  const ids = new Set(deleted.map((d) => d.id))
                  if (!project) return
                  pushUndo()
                  const nodes2 = project.nodes.filter((n) => !ids.has(n.id))
                  const edges2 = project.edges.filter((e) => !ids.has(e.source) && !ids.has(e.target))
                  setNodesStore(nodes2)
                  useStore.getState().setEdges(edges2)
                  select(null)
                }}
                onEdgesDelete={(deleted) => {
                  removeEdges(deleted.map((d) => d.id))
                }}
                edgesFocusable
                elementsSelectable
                fitView
                deleteKeyCode={['Backspace', 'Delete']}
              >
                <Background gap={18} color="#1e293b" />
                <Controls />
                <MiniMap />
              </ReactFlow>
            </div>
          </div>
        </div>
      )}

      {ctx && tab === 'canvas' && (
        <div
          className="fixed z-40 w-40 rounded-xl border border-slate-700 bg-slate-950 py-1 shadow-xl"
          style={{ left: ctx.x, top: ctx.y }}
          dir="rtl"
        >
          {KINDS.map((k) => (
            <button
              key={k}
              type="button"
              className="w-full px-3 py-1.5 text-right text-xs text-slate-200 hover:bg-slate-800"
              onClick={() => {
                addNode(k)
                setCtx(null)
              }}
            >
              افزودن {k}
            </button>
          ))}
        </div>
      )}

      <PreflightModal
        open={preflightOpen}
        issues={issues}
        onClose={closePreflight}
        onConfirm={() => void confirmRun()}
      />
      <PublishModal open={publishOpen} project={project} onClose={() => setPublishOpen(false)} />
      <ShortcutsHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
      <ModelsModal
        open={modelsOpen}
        models={project.settings.models || [{ id: 'gpt-4o-mini', count: 1 }]}
        parallel={project.settings.parallel}
        onClose={() => setModelsOpen(false)}
        onApply={(models, parallel) => {
          setModels(models)
          setParallel(parallel)
          // apply first model to selected or all text-like nodes
          const primary = models[0]?.id
          if (primary) {
            project.nodes.forEach((n) => {
              if (['text', 'code', 'image', 'prompt'].includes(n.data.kind)) {
                updateNode(n.id, { model: primary })
              }
            })
          }
        }}
      />
    </div>
  )
}
