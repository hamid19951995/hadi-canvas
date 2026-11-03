# GapGPT Node Canvas

**Visual Node-based Multi-Model AI Canvas for GapGPT**

یک محیط گراف‌محور (Node-based) برای کار موازی با چندین مدل هوش مصنوعی، تولید تصویر و ویدیو، و ساخت پروژه‌های پیچیده به صورت متصل و بصری.

---

## هدف پروژه

تبدیل تجربه فعلی GapGPT (چت‌های جداگانه) به یک بوم گرافیکی متصل که در آن:

- هر **گره (Node)** یک مدل انتخاب‌شده است (GPT، Claude، Gemini، Grok، مدل تصویر، مدل ویدیو و ...)
- گره‌ها می‌توانند به هم متصل شوند و خروجی یکی ورودی دیگری شود
- چندین مدل به صورت **موازی** کار کنند
- خروجی متنی مستقیماً به نود تصویر یا ویدیو وصل شود
- پروژه‌های مختلف قابل ادغام باشند
- تمام قابلیت‌های GapGPT داخل همین محیط در دسترس باشد

---

## لینک‌های مرتبط

| سرویس | لینک / وضعیت |
|-------|-------------|
| **Figma Design** | [طراحی UI/UX](https://www.figma.com/design/GjuH4saP1RX4JB85zPR8Y1) |
| **GitHub Repo** | این ریپازیتوری |
| **Canva** | مستندات و پرزنتیشن‌ها (به‌زودی) |

---

## فازهای طراحی (Figma)

| فاز | عنوان | وضعیت |
|-----|------|-------|
| ۰۰ | Cover | ✅ انجام شد |
| ۰۱ | Desktop App Layout | ✅ انجام شد |
| ۰۲ | Sample Nodes & Connections | ✅ انجام شد |
| ۰۳ | Sidebar & Actions | ✅ انجام شد |
| ۰۴ | Properties Panel | ✅ انجام شد |
| ۰۵ | Components & Design System | ✅ انجام شد |
| ۰۶ | بهبود کانکتورها و جریان داده | ✅ انجام شد |
| ۰۷ | حالت‌های مختلف نود (Running / Success / Error / Empty) | ✅ انجام شد |
| ۰۸ | Empty State + Onboarding | 🔄 در حال انجام |
| ۰۹ | نسخه تبلت / ریسپانسیو | ⏳ |
| ۱۰ | نودهای پیشرفته (شرطی، حلقه، حافظه، فایل) | ⏳ |
| ۱۱ | Design Tokens + تایپوگرافی + Spacing | ⏳ |
| ۱۲ | پروتوتایپ تعاملی (Prototype) | ⏳ |
| ۱۳ | مستندسازی و Handoff برای توسعه | ⏳ |

---

## ساختار پیشنهادی پروژه (کد)

```
gapgpt-node-canvas/
├── apps/
│   ├── web/                 # فرانت‌اند (React + React Flow)
│   └── api/                 # بک‌اند (Node.js / Python)
├── packages/
│   ├── ui/                  # کامپوننت‌های مشترک
│   ├── nodes/               # تعریف انواع نودها
│   └── engine/              # موتور اجرای گراف (DAG)
├── docs/
│   ├── design/              # لینک و اسکرین‌شات‌های Figma
│   └── architecture/        # معماری سیستم
└── README.md
```

---

## تکنولوژی‌های پیشنهادی

- **Frontend**: React + TypeScript + React Flow (یا XYFlow)
- **Backend**: Node.js / NestJS یا Python (FastAPI)
- **State**: Zustand یا Redux Toolkit
- **Realtime**: WebSocket برای اجرای موازی
- **AI Integration**: APIهای GapGPT + مدل‌های دیگر
- **Database**: PostgreSQL + Redis (برای صف اجرا)

---

## وضعیت فعلی

- طراحی UI در Figma تا فاز ۷ کامل شده
- ریپازیتوری جدید ایجاد شد
- فازهای بعدی طراحی و سپس پیاده‌سازی کد شروع خواهد شد

---

ساخته‌شده با همکاری Grok | xAI
