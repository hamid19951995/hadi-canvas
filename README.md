# GapGPT Node Canvas

**Visual Node-based Multi-Model AI Canvas for GapGPT**

محیط گراف‌محور برای کار موازی با چندین مدل هوش مصنوعی، تولید تصویر/ویدیو و ساخت پروژه‌های متصل.

---

## لینک‌ها

| منبع | آدرس |
|------|------|
| **Figma** | [Design System](https://www.figma.com/design/6TtVm7Y3O7SddMj77Wguys) |
| **Canva** | [پرزنتیشن](https://canva.link/0rmc00upjb16qo8) |
| **Handoff** | [docs/handoff.md](./docs/handoff.md) |
| **GapGPT API** | [Quickstart](https://gapgpt.app/platform-v2/docs/quickstart) |

---

## فازها (همه کامل شدند)

| فاز | عنوان | وضعیت |
|-----|------|-------|
| ۰۰–۰۸ | Layout تا Empty State & Onboarding | ✅ |
| ۰۹ | Tablet & Responsive | ✅ |
| ۱۰ | Advanced Nodes | ✅ |
| ۱۱ | Design Tokens | ✅ |
| ۱۲ | Interactive Prototype | ✅ |
| ۱۳ | Handoff | ✅ |

---

## شروع سریع

```bash
npm install
npm run dev
```

کلید API را از [پنل GapGPT](https://gapgpt.app/platform-v2/docs/quickstart) بگیرید و در نوار بالای اپ وارد کنید.

---

## ساختار

```
src/
├── App.tsx
├── nodes/          # Text, Image, Video, Merge, Conditional, Loop, Memory, File
├── store/          # Zustand
├── services/       # GapGPT API
└── styles/         # Design tokens (CSS + TS)
```

## قابلیت‌ها

- ۸ نوع نود با حالت empty / running / success / error
- Zustand برای state
- اتصال واقعی به GapGPT (`/v1/chat/completions`)
- Design Tokens یکپارچه با Tailwind
- Prototype تعاملی در Figma

## مستندات

- [Handoff برای توسعه‌دهنده](./docs/handoff.md)
- [Design Tokens](./docs/design-tokens.md)
- [Prototype](./docs/prototype.md)
- [Phases](./docs/phases.md)
- [Architecture](./docs/architecture.md)

---

ساخته‌شده با همکاری Grok | xAI
