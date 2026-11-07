# استقرار hadi-canvas

## پیش‌نیاز
- Node.js 18+
- npm 9+

## توسعه محلی
```bash
npm install
npm run dev
```
فرانت: http://localhost:5173

### OAuth (اختیاری ولی لازم برای GitHub/Figma/Canva)
1. کپی `.env.example` → `.env` و پر کردن Client ID/Secret
2. در ترمینال جدا:
```bash
npm run oauth
```
3. Callback: `http://localhost:5173/oauth/callback`

## بیلد تولید
```bash
npm run build
npm run preview
```
خروجی استاتیک در `dist/`.

### نکات production
- `client_secret` فقط روی سرور OAuth؛ نه در باندل فرانت.
- برای دامنه واقعی redirect URI را در OAuth App عوض کنید.
- کلیدهای LLM کاربر در localStorage مرورگر می‌ماند.

## چک‌لیست دود
به `docs/SMOKE.md` مراجعه کنید.
