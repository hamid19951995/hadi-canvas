# Handoff — GapGPT Node Canvas

**نسخه:** 0.1.0  
**تاریخ:** نوامبر ۲۰۲۶  
**مخاطب:** توسعه‌دهندگان فرانت‌اند / فول‌استک

---

## ۱. خلاصه محصول

محیط گراف‌محور (Node-based) برای کار موازی با چندین مدل هوش مصنوعی از طریق GapGPT API.

- هر نود = یک مدل یا عملیات (متن، تصویر، ویدیو، ادغام، شرط، حلقه، حافظه، فایل)
- اتصال نودها = جریان داده
- اجرای واقعی نودهای متنی از طریق `https://api.gapgpt.app/v1`

---

## ۲. لینک‌ها

| منبع | آدرس |
|------|------|
| GitHub | https://github.com/hamid19951995/gapgpt-node-canvas |
| Figma | https://www.figma.com/design/6TtVm7Y3O7SddMj77Wguys |
| Canva Pitch | https://canva.link/0rmc00upjb16qo8 |
| GapGPT API Docs | https://gapgpt.app/platform-v2/docs/quickstart |

---

## ۳. راه‌اندازی محلی

```bash
git clone https://github.com/hamid19951995/gapgpt-node-canvas.git
cd gapgpt-node-canvas
npm install
npm run dev
```

اپ روی `http://localhost:5173` اجرا می‌شود.

کلید API را از پنل GapGPT بگیرید و در نوار بالای اپ وارد کنید (در `localStorage` با کلید `gapgpt_api_key` ذخیره می‌شود).

---

## ۴. ساختار پروژه

```
src/
├── main.tsx                 # Entry
├── App.tsx                  # Canvas shell + toolbar + run
├── index.css                # Global + token import
├── nodes/
│   ├── TextNode.tsx
│   ├── ImageNode.tsx
│   ├── VideoNode.tsx
│   ├── MergeNode.tsx
│   ├── ConditionalNode.tsx
│   ├── LoopNode.tsx
│   ├── MemoryNode.tsx
│   └── FileNode.tsx
├── store/
│   └── useCanvasStore.ts    # Zustand: nodes, edges, apiKey, status
├── services/
│   └── gapgpt.ts            # chatCompletion, runTextNode, generateImage
└── styles/
    ├── tokens.css           # CSS variables
    └── tokens.ts            # TS tokens + nodeTypeColor
```

---

## ۵. نقشه طراحی → کد

| عنصر Figma | پیاده‌سازی |
|------------|-------------|
| Desktop App Layout | `App.tsx` top bar + ReactFlow canvas |
| Text / Image / Video / Merge nodes | `src/nodes/*` |
| Conditional / Loop / Memory / File | `src/nodes/*` (فاز ۱۰) |
| Node states (empty/running/success/error) | `data.status` + border colors |
| Empty State + Onboarding | طراحی در Figma؛ UI خالی در کد هنوز ساده است |
| Design Tokens | `tokens.css` + `tokens.ts` + Tailwind extend |
| Prototype flows | Figma Present mode |

---

## ۶. قرارداد نود (Node Contract)

هر نود React Flow:

```ts
{
  id: string
  type: 'text' | 'image' | 'video' | 'merge' | 'conditional' | 'loop' | 'memory' | 'file'
  position: { x: number; y: number }
  data: {
    label: string
    status: 'empty' | 'running' | 'success' | 'error'
    model?: string
    prompt?: string
    result?: string
    error?: string
    // نوع‌محور:
    condition?: string       // conditional
    iterations?: number      // loop
    keys?: string[]          // memory
    mode?: 'input'|'output'  // file
    fileName?: string
  }
}
```

ثبت نود جدید:
1. کامپوننت در `src/nodes/`
2. اضافه به `nodeTypes` در `App.tsx`
3. لیبل و default data در `useCanvasStore.addNode`
4. رنگ در `nodeTypeColor` / MiniMap

---

## ۷. GapGPT API

```ts
// Base
https://api.gapgpt.app/v1

// Chat
POST /chat/completions
Authorization: Bearer <API_KEY>
{
  "model": "gpt-4o",
  "messages": [{ "role": "user", "content": "..." }]
}

// Image (در صورت پشتیبانی پروکسی)
POST /images/generations
```

کتابخانه سازگار با OpenAI:

```ts
import OpenAI from 'openai'
const client = new OpenAI({
  baseURL: 'https://api.gapgpt.app/v1',
  apiKey: 'YOUR_KEY',
  dangerouslyAllowBrowser: true, // فقط برای دمو؛ در production از بک‌اند استفاده کنید
})
```

> **امنیت:** در production کلید API را در فرانت نگه ندارید؛ از یک BFF/بک‌اند استفاده کنید.

---

## ۸. Design Tokens (خلاصه)

| دسته | نمونه |
|------|--------|
| bg | `#111827` base, `#1e293b` card |
| text | primary `#fff`, muted `#94a3b8` |
| node accents | blue, purple, pink, amber, orange, teal, indigo, emerald |
| status | success `#22c55e`, error `#ef4444` |
| spacing | 4 / 8 / 12 / 16 / 24 / 32 / 48 |
| radius | sm 4, md 8, lg 12, xl 16 |
| topbar | 56px |

جزئیات: `docs/design-tokens.md`

---

## ۹. کارهای باقی‌مانده (پیشنهادی)

### اولویت بالا
- [ ] موتور اجرای گراف (DAG): ترتیب توپولوژیک + اجرای موازی نودهای مستقل
- [ ] Properties Panel سمت راست برای ویرایش prompt/model/condition
- [ ] پراکسی بک‌اند برای API key
- [ ] اتصال واقعی Image/Video nodes به endpointهای مربوط

### اولویت متوسط
- [ ] منطق Conditional (مسیر true/false)
- [ ] منطق Loop با شمارنده
- [ ] Memory به‌عنوان context برای پرامپت‌های بعدی
- [ ] File upload/read
- [ ] ذخیره/بارگذاری پروژه (JSON به localStorage یا سرور)

### اولویت پایین
- [ ] Empty State و Onboarding واقعی در React
- [ ] نسخه ریسپانسیو موبایل در UI
- [ ] Undo/Redo
- [ ] اشتراک‌گذاری لینک پروژه

---

## ۱۰. چک‌لیست تحویل

- [x] ریپازیتوری با اسکلت اجرا‌شونده
- [x] ۸ نوع نود UI
- [x] Zustand store
- [x] سرویس GapGPT (chat)
- [x] Design tokens (CSS + TS + Tailwind)
- [x] طراحی Figma تا فاز ۱۲ + Prototype
- [x] مستندات phases / tokens / prototype / handoff
- [ ] تست E2E
- [ ] CI/CD
- [ ] بک‌اند production

---

## ۱۱. تماس / مالکیت

- GitHub: `hamid19951995`
- طراحی و اسکلت اولیه با همکاری Grok (xAI)

---

*پایان Handoff فاز ۱۳*
