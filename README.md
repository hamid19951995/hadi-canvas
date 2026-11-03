# Hadi

**محیط گراف‌محور چندمدلی هوش مصنوعی**

Hadi یک بوم نودبیس است برای کار موازی با چندین مدل، تولید تصویر/ویدیو و ساخت پروژه‌های متصل.

> اتصال مدل‌ها از طریق API سازگار با OpenAI (مثلاً `api.gapgpt.app`) انجام می‌شود؛ نام محصول **Hadi** است.

**ریپو:** https://github.com/hamid19951995/hadi

---

## لینک‌ها

| منبع | آدرس |
|------|------|
| **GitHub** | https://github.com/hamid19951995/hadi |
| **Figma** | [Design System](https://www.figma.com/design/6TtVm7Y3O7SddMj77Wguys) |
| **Canva** | [پرزنتیشن](https://canva.link/0rmc00upjb16qo8) |
| **Handoff** | [docs/handoff.md](./docs/handoff.md) |

---

## شروع سریع

```bash
git clone https://github.com/hamid19951995/hadi.git
cd hadi
npm install
npm run dev
```

کلید API را در نوار بالای اپ وارد کنید.

---

## ساختار

```
src/
├── App.tsx
├── nodes/          # Text, Image, Video, Merge, Conditional, Loop, Memory, File
├── store/          # Zustand
├── engine/         # DAG execution
├── services/       # API + project storage
└── styles/         # Design tokens
```

## قابلیت‌ها

- ۸ نوع نود با حالت empty / running / success / error
- موتور اجرای گراف (موازی + توپولوژیک)
- Properties Panel
- ذخیره / بارگذاری پروژه (localStorage + فایل `.hadi.json`)
- Design Tokens یکپارچه با Tailwind

## مستندات

- [Handoff](./docs/handoff.md)
- [Graph Engine](./docs/graph-engine.md)
- [Design Tokens](./docs/design-tokens.md)
- [Phases](./docs/phases.md)

---

Hadi
