# Design Tokens — Phase 11

منبع واحد حقیقت برای رنگ‌ها، تایپوگرافی، فاصله‌ها و سایر مقادیر طراحی.

## فایل‌ها

| فایل | کاربرد |
|------|--------|
| `src/styles/tokens.css` | CSS Variables (`--color-*`, `--space-*`, ...) |
| `src/styles/tokens.ts` | TypeScript object برای import در کامپوننت‌ها |
| `tailwind.config.js` | گسترش تم Tailwind با همان مقادیر |

## Colors

### Background
- `--color-bg-base` → `#111827`
- `--color-bg-elevated` → `#0f172a`
- `--color-bg-card` → `#1e293b`

### Node Accents
| نود | توکن | Hex |
|-----|------|-----|
| متن | `accent/blue` | `#3b82f6` |
| تصویر | `accent/purple` | `#8b5cf6` |
| ویدیو | `accent/pink` | `#ec4899` |
| ادغام | `accent/amber` | `#f59e0b` |
| شرطی | `accent/orange` | `#f97316` |
| حلقه | `accent/teal` | `#14b8a6` |
| حافظه | `accent/indigo` | `#6366f1` |
| فایل | `accent/emerald` | `#10b981` |

### Status
- success: `#22c55e`
- error: `#ef4444`
- running: `#3b82f6`

## Typography

| توکن | Size | Weight |
|------|------|--------|
| display | 28px | Bold |
| title | 22px | Bold |
| heading | 16px | SemiBold |
| body | 14px | Regular |
| caption | 12px | Regular |
| micro | 10px | Medium |

Font: **Inter**

## Spacing

`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48` px

## Radius

`sm:4 · md:8 · lg:12 · xl:16 · full:9999`

## Layout

- Topbar: `56px`
- Sidebar: `260px` (collapsed: `64px`)
- Properties panel: `300px`

## استفاده در کد

```ts
import { colors, nodeTypeColor } from './styles/tokens'

// یا CSS
background: var(--color-bg-card);
border-color: var(--color-accent-blue);
```
