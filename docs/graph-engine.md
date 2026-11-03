# فاز ۱۴ — موتور اجرای گراف (Graph Execution Engine)

## فایل
`src/engine/graphEngine.ts`

## رفتار

1. **ساخت گراف** از `nodes` + `edges` (adjacency، in-degree، predecessors)
2. **مرتب‌سازی توپولوژیک** (Kahn) — در صورت حلقه: `GraphCycleError`
3. **موج‌های موازی (waves)** — نودهایی که به هم وابسته نیستند همزمان اجرا می‌شوند
4. **اجرای هر نود** با به‌روزرسانی `status` و انتقال خروجی بالادستی

```
Wave 0:  [text-A]  [text-B]     ← موازی
Wave 1:  [merge]               ← بعد از A و B
Wave 2:  [image] [conditional] ← موازی
```

## انواع نود در موتور

| نوع | رفتار اجرا |
|-----|------------|
| `text` | فراخوانی GapGPT API با پرامپت + ورودی بالادستی |
| `merge` | الحاق خروجی‌های ورودی |
| `conditional` | بررسی شرط روی متن بالادستی → TRUE/FALSE |
| `loop` | تکرار محلی N بار (بدون API اضافه) |
| `memory` | ذخیره خروجی بالادستی |
| `file` | ثبت خروجی با نام فایل |
| `image` / `video` | placeholder تا اتصال کامل media API |

## API عمومی

```ts
import { executeGraph, GraphCycleError } from './engine/graphEngine'

await executeGraph(nodes, edges, {
  apiKey,
  results: new Map(),
  onNodeUpdate: (id, patch) => updateNodeData(id, patch),
})
```

## محدودیت‌های فعلی

- شاخه‌سازی واقعی یال true/false در conditional هنوز مسیر گراف را قطع نمی‌کند (فقط برچسب نتیجه)
- image/video هنوز API واقعی ندارند
- loop به‌صورت پیش‌فرض API را تکرار نمی‌کند (جلوگیری از هزینه)

## بعدی پیشنهادی

- Properties Panel برای ویرایش prompt قبل از اجرا
- قطع اجرا (AbortController)
- لاگ موج‌ها در UI
