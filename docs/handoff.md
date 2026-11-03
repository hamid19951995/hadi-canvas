# Handoff — Hadi

**نسخه:** 0.1.0  
**تاریخ:** نوامبر ۲۰۲۶  
**مخاطب:** توسعه‌دهندگان فرانت‌اند / فول‌استک

---

## ۱. خلاصه محصول

**Hadi** محیط گراف‌محور (Node-based) برای کار موازی با چندین مدل هوش مصنوعی است.

- هر نود = یک مدل یا عملیات (متن، تصویر، ویدیو، ادغام، شرط، حلقه، حافظه، فایل)
- اتصال نودها = جریان داده
- اجرای نودهای متنی از طریق API سازگار با OpenAI (پیش‌فرض: `https://api.gapgpt.app/v1`)

---

## ۲. لینک‌ها

| منبع | آدرس |
|------|------|
| GitHub | https://github.com/hamid19951995/hadi |
| Figma | https://www.figma.com/design/6TtVm7Y3O7SddMj77Wguys |
| Canva Pitch | https://canva.link/0rmc00upjb16qo8 |
| API Docs | https://gapgpt.app/platform-v2/docs/quickstart |

---

## ۳. راه‌اندازی محلی

```bash
git clone https://github.com/hamid19951995/hadi.git
cd hadi
npm install
npm run dev
```

اپ روی `http://localhost:5173` اجرا می‌شود.

کلید API را در نوار بالای اپ وارد کنید (در `localStorage` با کلید `hadi_api_key` ذخیره می‌شود).

---

## ۴. ساختار پروژه

```
src/
├── main.tsx
├── App.tsx
├── index.css
├── nodes/
│   ├── TextNode.tsx
│   ├── ImageNode.tsx
│   ├── VideoNode.tsx
│   ├── MergeNode.tsx
│   ├── ConditionalNode.tsx
│   ├── LoopNode.tsx
│   ├── MemoryNode.tsx
│   └── FileNode.tsx
├── components/
│   └── PropertiesPanel.tsx
├── engine/
│   └── graphEngine.ts
├── store/
│   └── useCanvasStore.ts
├── services/
│   ├── gapgpt.ts
│   └── projectStorage.ts
└── styles/
    ├── tokens.css
    └── tokens.ts
```

---

## ۵. نقشه طراحی → کد

| عنصر Figma | پیاده‌سازی |
|------------|-------------|
| Desktop App Layout | `App.tsx` + ReactFlow |
| Node types | `src/nodes/*` |
| Node states | `data.status` |
| Design Tokens | `tokens.css` + `tokens.ts` |
| Properties Panel | `PropertiesPanel.tsx` |
| Graph execution | `graphEngine.ts` |

---

## ۶. قرارداد نود

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
    condition?: string
    iterations?: number
    keys?: string[]
    mode?: 'input' | 'output'
    fileName?: string
  }
}
```

---

## ۷. API

```ts
// Base (OpenAI-compatible)
https://api.gapgpt.app/v1

POST /chat/completions
Authorization: Bearer <API_KEY>
```

> در production کلید API را در فرانت نگه ندارید.

---

## ۸. ذخیره پروژه

- localStorage: `hadi_canvas_project`
- فایل خروجی: `*.hadi.json`

---

## ۹. مالکیت

- GitHub: `hamid19951995/hadi`
- محصول: **Hadi**

---

*Hadi Handoff*
