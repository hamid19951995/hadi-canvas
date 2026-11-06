# راه‌اندازی و اجرا با GitHub

ریپو: https://github.com/hamid19951995/hadi-canvas

## ۱) نقش GitHub در این پروژه

| کار | روی GitHub؟ |
|-----|-------------|
| نگهداری کد + CI (تست/بیلد) | بله — Actions |
| اجرای زنده اپ برای کاربران | **خیر** — روی VPS / سرور شما |
| OAuth App (GitHub login) | تنظیم در Settings → Developer |
| Secretها | Settings → Secrets and variables |

**GitHub هاست اپ نیست.** Actions فقط CI است؛ سرویس واقعی با `npm run oauth` + `npm run preview` روی سرور بالا می‌آید.

## ۲) فعال‌سازی Actions

1. بروید به: https://github.com/hamid19951995/hadi-canvas/actions
2. اگر خواست: Enable workflows
3. بعد از هر `git push` به `main`، workflow **CI** اجرا می‌شود
4. دستی: Actions → **CI** → **Run workflow**

فایل: `.github/workflows/ci.yml`

## ۳) کلون و اجرای محلی (از GitHub)

```bash
git clone https://github.com/hamid19951995/hadi-canvas.git
cd hadi-canvas
cp .env.example .env
# CREDENTIAL_VAULT_KEY را پر کنید: openssl rand -hex 32
npm ci
npm run oauth    # ترمینال ۱ — کارگزار :8787
npm run dev      # ترمینال ۲ — UI :5173
```

یا production-like:

```bash
npm run build
npm run oauth
npm run preview
```

## ۴) Push کامل سورس (اگر درخت ناقص است)

روی سیستم خودتان پوشهٔ کامل پروژه را با ریپو یکی کنید:

```powershell
cd $HOME\Documents\hadi-canvas
git remote set-url origin https://github.com/hamid19951995/hadi-canvas.git
git pull origin main
git add -A
git commit -m "release: full hadi-canvas tree"
git push origin main
```

بعد از push کامل، CI می‌تواند `npm test` و `smoke:flow` را هم اجرا کند.

## ۵) Secrets / Variables (اختیاری)

Repository → Settings → Secrets and variables → Actions:

| نام | نوع | کاربرد |
|-----|-----|--------|
| `VITE_OAUTH_API` | Variable | آدرس API در بیلد |

کلیدهای GapGPT/OpenAI را در GitHub Secrets برای اپ کاربر نگذارید؛ کاربر در UI وصل می‌کند.

## ۶) استقرار واقعی (VPS)

راهنما: `docs/DEPLOY_VPS.md` (اگر در ریپو باشد) یا:

1. کلون روی سرور
2. `.env` production
3. `npm ci && npm run build`
4. systemd: `deploy/hadi-broker.service` + `hadi-ui.service`
5. Nginx + certbot

## ۷) workflow دیگر

`.github/workflows/hadi-command.yml` — پاسخ به `repository_dispatch` نوع `hadi_command` (فرمان ایجنت).
