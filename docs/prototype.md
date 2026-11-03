# فاز ۱۲ — Interactive Prototype

## فایل Figma
https://www.figma.com/design/6TtVm7Y3O7SddMj77Wguys

## جریان تعامل (User Flow)

```
Onboarding (Welcome)
       │  کلیک «شروع کنیم»
       ▼
Quick Start Templates
       │  کلیک روی یکی از قالب‌ها
       ▼
Empty State / Canvas
       │  کلیک «افزودن اولین نود»
       ▼
Onboarding (بازگشت ممکن)
```

## تعاملات ثبت‌شده

| مبدأ | تریگر | مقصد | انتقال |
|------|--------|------|--------|
| Empty State → دکمه CTA | ON_CLICK | Onboarding | Dissolve 0.3s |
| Onboarding → «شروع کنیم» | ON_CLICK | Quick Start | Dissolve 0.3s |
| Quick Start → کارت‌های قالب (۵ عدد) | ON_CLICK | Empty State | Dissolve 0.3s |

## نحوه پخش

1. فایل را در Figma باز کنید
2. دکمه **Present (▶)** را بزنید
3. از فریم Onboarding یا Empty State شروع کنید
4. روی دکمه‌ها و کارت‌ها کلیک کنید

## نقشه جریان

فریم `12 - Prototype Flow Map` روی بوم قرار دارد و مراحل را خلاصه می‌کند:

1. Onboarding  
2. Quick Start  
3. Empty Canvas  
4. Desktop Nodes  
5. Responsive (Tablet / Mobile)

## نکات

- پلن Starter فقط ۳ صفحه دارد؛ همه فریم‌ها روی صفحات موجود هستند
- برای Prototype پیشرفته‌تر (Smart Animate بین نودها) می‌توان بعداً variants اضافه کرد
