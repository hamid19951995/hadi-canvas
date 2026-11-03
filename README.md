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

| سرویس | لینک |
|-------|------|
| **Figma (جدید)** | [GapGPT Node Canvas - Design System](https://www.figma.com/design/6TtVm7Y3O7SddMj77Wguys) |
| **Figma (قبلی)** | [طراحی اولیه](https://www.figma.com/design/GjuH4saP1RX4JB85zPR8Y1) |
| **GitHub** | این ریپازیتوری |
| **Canva Presentation** | [پرزنتیشن معرفی پروژه](https://canva.link/0rmc00upjb16qo8) |

---

## فازهای طراحی (Figma)

| فاز | عنوان | وضعیت |
|-----|------|-------|
| ۰۰–۰۷ | Cover تا Node States | ✅ |
| **۰۸** | Empty State + Onboarding + Quick Start | ✅ انجام شد |
| ۰۹ | نسخه تبلت / ریسپانسیو | ⏳ |
| ۱۰ | نودهای پیشرفته | ⏳ |
| ۱۱ | Design Tokens | ⏳ |
| ۱۲ | پروتوتایپ تعاملی | ⏳ |
| ۱۳ | Handoff | ⏳ |

---

## شروع سریع (کد)

```bash
npm install
npm run dev
```

پروژه روی `http://localhost:5173` اجرا می‌شود.

### ساختار فعلی کد

```
src/
├── main.tsx
├── App.tsx              # بوم اصلی با React Flow
├── index.css
└── nodes/
    ├── TextNode.tsx     # نود متنی با حالت‌ها
    └── ImageNode.tsx    # نود تصویر
```

---

## تکنولوژی‌ها

- React 18 + TypeScript
- XYFlow (React Flow) برای گراف
- Zustand (آماده برای state)
- Tailwind CSS
- Vite

---

## وضعیت فعلی (۳ نوامبر ۲۰۲۶)

- ✅ ریپازیتوری ایجاد و اسکلت فرانت‌اند آماده
- ✅ فاز ۸ طراحی (Empty State + Onboarding) در Figma جدید
- ✅ پرزنتیشن Canva آماده
- 🔄 ادامه فازهای طراحی و توسعه نودها

---

ساخته‌شده با همکاری Grok | xAI
