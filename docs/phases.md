# فازهای پروژه GapGPT Node Canvas

## فازهای طراحی و تحویل

| فاز | عنوان | وضعیت |
|-----|------|-------|
| ۰۰–۰۸ | Cover تا Empty State & Onboarding | ✅ |
| ۰۹ | Tablet & Responsive | ✅ |
| ۱۰ | Advanced Nodes | ✅ |
| ۱۱ | Design Tokens | ✅ |
| ۱۲ | Interactive Prototype | ✅ |
| ۱۳ | Handoff | ✅ |

## فازهای توسعه

| فاز | عنوان | وضعیت |
|-----|------|-------|
| **۱۴** | موتور اجرای گراف (DAG + موازی) | ✅ |
| ۱۵ | Properties Panel | ⏳ |
| ۱۶ | ذخیره/بارگذاری پروژه | ⏳ |
| ۱۷ | بک‌اند محافظ API key | ⏳ |

جزئیات موتور: [graph-engine.md](./graph-engine.md)  
Handoff: [handoff.md](./handoff.md)

## نودهای پیاده‌شده

| نوع | کامپوننت | اجرا در موتور |
|-----|----------|----------------|
| متن | TextNode | GapGPT API |
| تصویر | ImageNode | placeholder |
| ویدیو | VideoNode | placeholder |
| ادغام | MergeNode | الحاق ورودی‌ها |
| شرطی | ConditionalNode | TRUE/FALSE |
| حلقه | LoopNode | تکرار محلی |
| حافظه | MemoryNode | ذخیره context |
| فایل | FileNode | خروجی نام‌دار |
