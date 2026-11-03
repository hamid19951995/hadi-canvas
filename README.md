# GapGPT Node Canvas

**Visual Node-based Multi-Model AI Canvas for GapGPT**

یک محیط گراف‌محور (Node-based) برای کار موازی با چندین مدل هوش مصنوعی، تولید تصویر و ویدیو، و ساخت پروژه‌های پیچیده به صورت متصل و بصری.

---

## لینک‌های مرتبط

| سرویس | لینک |
|-------|------|
| **Figma** | [Design System](https://www.figma.com/design/6TtVm7Y3O7SddMj77Wguys) |
| **GitHub** | این ریپازیتوری |
| **Canva** | [پرزنتیشن](https://canva.link/0rmc00upjb16qo8) |
| **GapGPT API Docs** | [Quickstart](https://gapgpt.app/platform-v2/docs/quickstart) |

---

## فازهای طراحی (Figma)

| فاز | عنوان | وضعیت |
|-----|------|-------|
| ۰۰–۰۸ | Cover تا Empty State & Onboarding | ✅ |
| **۰۹** | Tablet & Responsive | ✅ انجام شد |
| ۱۰ | نودهای پیشرفته | ⏳ |
| ۱۱ | Design Tokens | ⏳ |
| ۱۲ | پروتوتایپ تعاملی | ⏳ |
| ۱۳ | Handoff | ⏳ |

---

## شروع سریع

```bash
npm install
npm run dev
```

سپس کلید API گپ‌جی‌پی‌تی را از [پنل توسعه‌دهندگان](https://gapgpt.app/platform-v2/docs/quickstart) بگیرید و در نوار بالای اپ وارد کنید.

### ساختار کد

```
src/
├── main.tsx
├── App.tsx                 # بوم اصلی + کنترل‌ها
├── index.css
├── nodes/
│   ├── TextNode.tsx
│   ├── ImageNode.tsx
│   ├── VideoNode.tsx
│   └── MergeNode.tsx
├── store/
│   └── useCanvasStore.ts   # Zustand state
└── services/
    └── gapgpt.ts           # اتصال واقعی به API
```

---

## قابلیت‌های فعلی

- ✅ ۴ نوع نود: متن، تصویر، ویدیو، ادغام
- ✅ مدیریت state با Zustand
- ✅ اتصال واقعی به GapGPT API (OpenAI-compatible)
- ✅ اجرای نودهای متنی با یک کلیک
- ✅ افزودن نود جدید از نوار بالا
- ✅ طراحی ریسپانسیو (تبلت + موبایل) در Figma

---

## GapGPT API

```ts
// Base URL
https://api.gapgpt.app/v1

// مثال
const client = new OpenAI({
  baseURL: 'https://api.gapgpt.app/v1',
  apiKey: 'YOUR_KEY',
})
```

مدل‌های پشتیبانی‌شده: `gpt-4o`, `claude-3`, `gemini-pro` و سایر مدل‌های موجود در پنل.

---

ساخته‌شده با همکاری Grok | xAI
