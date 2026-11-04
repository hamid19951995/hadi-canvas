import type { GEdge, GNode, NodeKind, Project } from '../domain/types'
import { compatible, portsOf } from '../domain/types'

function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

function label(kind: NodeKind): string {
  const m: Record<NodeKind, string> = {
    prompt: 'پرامپت پایه',
    text: 'متن',
    image: 'تصویر',
    code: 'کد',
    merge: 'ادغام',
    final: 'خروجی نهایی',
    condition: 'شرط',
    loop: 'حلقه',
    memory: 'حافظه',
    agent: 'ایجنت',
  }
  return m[kind]
}

function node(
  kind: NodeKind,
  pos: { x: number; y: number },
  extra?: Partial<GNode['data']> & { title?: string }
): GNode {
  const config =
    kind === 'loop'
      ? { maxIterations: extra?.config?.maxIterations ?? 2 }
      : kind === 'memory'
        ? { memoryKey: extra?.config?.memoryKey ?? 'default' }
        : kind === 'condition'
          ? { conditionHint: extra?.config?.conditionHint ?? 'شامل بله؟' }
          : extra?.config
  return {
    id: uid('n'),
    type: kind,
    position: pos,
    data: {
      title: extra?.title || label(kind),
      kind,
      prompt: extra?.prompt ?? '',
      model: extra?.model ?? 'gpt-4o-mini',
      status: 'idle',
      config,
    },
  }
}

function wire(a: GNode, b: GNode, sourceHandle?: string, targetHandle?: string): GEdge {
  const out =
    portsOf(a.data.kind).find((p) => p.direction === 'out' && (!sourceHandle || p.id === sourceHandle)) ||
    portsOf(a.data.kind).find((p) => p.direction === 'out')
  const inn =
    portsOf(b.data.kind).find((p) => p.direction === 'in' && (!targetHandle || p.id === targetHandle)) ||
    portsOf(b.data.kind).find((p) => p.direction === 'in')
  const from = out?.dataType || 'any'
  const to = inn?.dataType || 'any'
  const ok = compatible(from, to)
  return {
    id: uid('e'),
    source: a.id,
    target: b.id,
    sourceHandle: sourceHandle || out?.id,
    targetHandle: targetHandle || inn?.id,
    valid: ok,
    reason: ok ? undefined : `نوع ${from} با ${to} سازگار نیست`,
  }
}

export interface TemplateMeta {
  id: string
  name: string
  description: string
  tags: string[]
}

export const TEMPLATE_META: TemplateMeta[] = [
  {
    id: 'circuit',
    name: 'مدار',
    description: 'پرامپت → کد + تصویر → ادغام → خروجی نهایی',
    tags: ['پایه', 'چندمسیره'],
  },
  {
    id: 'agent-plan',
    name: 'برنامه ایجنت',
    description: 'هدف → ایجنت → حافظه → متن نهایی',
    tags: ['ایجنت', 'حافظه'],
  },
  {
    id: 'branch-review',
    name: 'بازبینی شرطی',
    description: 'متن → شرط → مسیر تأیید یا اصلاح با حلقه',
    tags: ['شرط', 'حلقه'],
  },
  {
    id: 'content-pack',
    name: 'بسته محتوا',
    description: 'یک ایده → متن معرفی + کد نمونه → ادغام',
    tags: ['محتوا', 'کد'],
  },
  {
    id: 'figma-to-code',
    name: 'Figma → کد',
    description: 'خواندن فایل Figma → ایجنت تحلیل → تولید کد React',
    tags: ['figma', 'کد', 'UI'],
  },
]

export function buildTemplate(id: string): Project | null {
  const settings = {
    parallel: true,
    models: [{ id: 'gpt-4o-mini', count: 1 }],
    memory: {} as Record<string, string>,
  }

  if (id === 'circuit') {
    const prompt = node('prompt', { x: 80, y: 180 }, {
      title: 'پرامپت پایه',
      prompt: 'یک صفحه معرفی ساده برای محصول «مدار» بنویس',
    })
    const code = node('code', { x: 380, y: 80 })
    const image = node('image', { x: 380, y: 280 })
    const merge = node('merge', { x: 680, y: 160 })
    const fin = node('final', { x: 960, y: 160 })
    return {
      id: uid('p'),
      name: 'مدار',
      updatedAt: new Date().toISOString(),
      nodes: [prompt, code, image, merge, fin],
      edges: [wire(prompt, code), wire(prompt, image), wire(code, merge), wire(image, merge), wire(merge, fin)],
      settings,
    }
  }

  if (id === 'agent-plan') {
    const goal = node('prompt', { x: 60, y: 160 }, {
      title: 'هدف کاربر',
      prompt: 'می‌خواهم یک لندینگ برای اپ مدیریت کار شخصی طراحی کنم',
    })
    const agent = node('agent', { x: 340, y: 160 }, {
      title: 'ایجنت برنامه‌ریز',
      prompt: 'هدف را خلاصه کن و سه قدم عملی بده',
    })
    const mem = node('memory', { x: 620, y: 160 }, {
      title: 'ذخیره طرح',
      config: { memoryKey: 'plan' },
    })
    const text = node('text', { x: 900, y: 160 }, {
      title: 'نگارش نهایی',
      prompt: 'بر اساس طرح ذخیره‌شده یک پاراگراف معرفی بنویس',
    })
    const fin = node('final', { x: 1180, y: 160 })
    return {
      id: uid('p'),
      name: 'برنامه ایجنت',
      updatedAt: new Date().toISOString(),
      nodes: [goal, agent, mem, text, fin],
      edges: [wire(goal, agent), wire(agent, mem), wire(mem, text), wire(text, fin)],
      settings,
    }
  }

  if (id === 'branch-review') {
    const draft = node('prompt', { x: 40, y: 200 }, {
      title: 'پیش‌نویس',
      prompt: 'این متن آماده انتشار است؟ بله — لحن رسمی و کوتاه است.',
    })
    const cond = node('condition', { x: 320, y: 200 }, {
      title: 'آیا تأیید شد؟',
      prompt: 'شامل بله؟',
    })
    const okText = node('text', { x: 600, y: 80 }, {
      title: 'مسیر تأیید',
      prompt: 'متن را برای انتشار نهایی کوتاه و تمیز کن',
    })
    const fixLoop = node('loop', { x: 600, y: 320 }, {
      title: 'اصلاح با حلقه',
      prompt: 'متن را بازنویسی و بهبود بده',
      config: { maxIterations: 2 },
    })
    const merge = node('merge', { x: 880, y: 200 })
    const fin = node('final', { x: 1140, y: 200 })
    return {
      id: uid('p'),
      name: 'بازبینی شرطی',
      updatedAt: new Date().toISOString(),
      nodes: [draft, cond, okText, fixLoop, merge, fin],
      edges: [
        wire(draft, cond),
        wire(cond, okText, 'true'),
        wire(cond, fixLoop, 'false'),
        wire(okText, merge, undefined, 'a'),
        wire(fixLoop, merge, undefined, 'b'),
        wire(merge, fin),
      ],
      settings,
    }
  }

  if (id === 'content-pack') {
    const idea = node('prompt', { x: 60, y: 160 }, {
      title: 'ایده',
      prompt: 'اپ پیگیری عادت روزانه با یادآوری هوشمند',
    })
    const copy = node('text', { x: 360, y: 60 }, {
      title: 'متن معرفی',
      prompt: 'یک معرفی سه‌خطی جذاب بنویس',
    })
    const code = node('code', { x: 360, y: 260 }, {
      title: 'نمونه کد',
      prompt: 'یک تابع TypeScript برای ثبت عادت پیشنهاد بده',
    })
    const merge = node('merge', { x: 660, y: 160 })
    const fin = node('final', { x: 920, y: 160 })
    return {
      id: uid('p'),
      name: 'بسته محتوا',
      updatedAt: new Date().toISOString(),
      nodes: [idea, copy, code, merge, fin],
      edges: [wire(idea, copy), wire(idea, code), wire(copy, merge, undefined, 'a'), wire(code, merge, undefined, 'b'), wire(merge, fin)],
      settings,
    }
  }


  if (id === 'figma-to-code') {
    const figma = node('figma', { x: 40, y: 180 }, {
      title: 'خواندن Figma',
      prompt: 'لینک فایل Figma را اینجا بگذارید\nمثال: https://www.figma.com/design/XXXX/Name',
    })
    const agent = node('agent', { x: 320, y: 180 }, {
      title: 'تحلیل UI',
      prompt:
        'از ساختار و فریم‌های Figma، سلسله‌مراتب صفحات، اجزای اصلی و نکات پیاده‌سازی را استخراج کن. کوتاه و عملی.',
    })
    const code = node('code', { x: 600, y: 100 }, {
      title: 'کد React',
      prompt:
        'بر اساس تحلیل UI، یک کامپوننت React + Tailwind پیشنهاد بده. فقط کد و توضیح خیلی کوتاه.',
    })
    const text = node('text', { x: 600, y: 280 }, {
      title: 'چک‌لیست handoff',
      prompt: 'چک‌لیست پیاده‌سازی و وابستگی‌ها را از روی تحلیل بنویس.',
    })
    const merge = node('merge', { x: 880, y: 180 })
    const fin = node('final', { x: 1140, y: 180 })
    return {
      id: uid('p'),
      name: 'Figma → کد',
      updatedAt: new Date().toISOString(),
      nodes: [figma, agent, code, text, merge, fin],
      edges: [
        wire(figma, agent),
        wire(agent, code),
        wire(agent, text),
        wire(code, merge, undefined, 'a'),
        wire(text, merge, undefined, 'b'),
        wire(merge, fin),
      ],
      settings,
    }
  }

  return null
}
