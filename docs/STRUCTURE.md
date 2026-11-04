# ساختار hadi-canvas

```
hadi-canvas/
├── index.html              # ورودی HTML
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── server/
│   └── oauth.mjs           # فقط secretهای OAuth (GitHub/Figma/Canva)
├── docs/
│   ├── DEPLOY.md
│   ├── SMOKE.md
│   └── STRUCTURE.md
└── src/
    ├── main.tsx            # bootstrap + ErrorBoundary
    ├── App.tsx             # مسیریابی ساده: پروژه‌ها | استودیو | OAuth callback
    ├── index.css
    ├── domain/             # انواع و قرارداد داده (بدون UI)
    │   └── types.ts
    ├── engine/             # منطق اجرا (بدون React)
    │   ├── preflight.ts
    │   └── runGraph.ts
    ├── store/              # Zustand — وضعیت پروژه و اقدامات
    │   └── useStore.ts
    ├── nodes/              # کامپوننت گره روی بوم
    │   └── HadiNode.tsx
    ├── pages/              # صفحات کامل
    │   ├── ProjectsPage.tsx
    │   ├── StudioPage.tsx
    │   └── OAuthCallbackPage.tsx
    ├── components/         # UI مشترک (مودال، پنل، …)
    ├── services/           # API و ذخیره‌سازی مرورگر
    ├── templates/          # الگوهای گراف آماده
    └── utils/
```

## لایه‌ها

| لایه | مسئولیت |
|------|----------|
| **domain** | NodeKind، DataType، سازگاری پورت |
| **engine** | preflight + اجرای DAG |
| **store** | پروژه، Undo، اجرا، نسخه |
| **services** | LLM، OAuth، Figma، localStorage |
| **pages/components** | فقط UI |

ادغام‌های اختیاری (OAuth): بدون `.env` و `npm run oauth` اپ هسته کار می‌کند؛ فقط اتصال‌های بیرونی غیرفعال می‌مانند.
