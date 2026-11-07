# hadi-canvas

**استودیوی گراف‌محور** برای تبدیل ایده به خروجی قابل بررسی (متن، کد، تصویر، Figma).

نسخه **3.7.0**

## اجرا

```bash
npm install
npm run dev
```

باز کنید: http://localhost:5173 — خود اپ (بوم، اجرای گراف، تاریخچه، نسخه‌ها) بدون هیچ سرویس بیرونی کار می‌کند.

### اجرای کامل (حساب کاربری + اتصال‌ها)

```bash
cp .env.example .env      # DATABASE_URL و کلیدهای لازم را پر کنید
npm run auth              # ترمینال ۱ — API حساب و MCP روی :8788
npm run dev               # ترمینال ۲ — UI روی :5173 (‎/api از طریق proxy همان‌مبدأ است)
```

وضعیت واقعی سرویس‌ها:

```bash
npm run health            # health واقعی (اتصال دیتابیس هم بررسی می‌شود)
npm run smoke             # typecheck + تست + build + بالا آوردن dev server
npm run smoke:flow        # جریان واقعی ثبت‌نام/ورود (نیازمند DATABASE_URL)
npm run integrations:check
```

> مسیر `/api/auth` و `/api/mcp` از طریق proxy همان مبدأ سرو می‌شود تا کوکی نشست در مرورگر ذخیره شود. برای استقرار cross-site باید `AUTH_COOKIE_SAMESITE=None` و `AUTH_HTTPS=1` تنظیم شود.

### OAuth (اختیاری)

```bash
cp .env.example .env
# Client ID/Secret را پر کنید
npm run oauth    # ترمینال جدا — پورت 8787
npm run dev
```

جزئیات: [docs/DEPLOY.md](docs/DEPLOY.md)

## هسته محصول

1. ساخت / باز کردن پروژه  
2. افزودن گره و اتصال **typed**  
3. بررسی پیش از اجرا (preflight)  
4. اجرای موازی موجی  
5. تاریخچه، نسخه، مقایسه، خروجی / انتشار با تأیید  

الگوهای آماده: **مدار** · برنامه ایجنت · بازبینی شرطی · بسته محتوا · Figma→کد

## ساختار

→ [docs/STRUCTURE.md](docs/STRUCTURE.md)

## چک‌لیست تست

→ [docs/SMOKE.md](docs/SMOKE.md)

## اصل‌ها

- اتصال = داده واقعی + وابستگی اجرا  
- سهمیه از **حساب خود کاربر**  
- ذخیره پروژه ≠ دریافت محلی ≠ انتشار  
- قابلیت آماده‌نشده صریحاً «به‌زودی / نیازمند اتصال» است  


## Account API (development foundation)

The browser-only demo login has been replaced with a PostgreSQL-backed account API. See `docs/AUTH_SETUP.md` for database setup, environment variables, routes, and production blockers. Start it with `npm run auth` after applying `server/db/identity-auth.sql` and configuring `.env`. Public registration must remain disabled until email verification and abuse controls are implemented.

### MCP connector catalog (Phase 9 foundation)

The authenticated API exposes `GET /api/mcp/catalog`, `GET /api/mcp/connections`, `POST /api/mcp/connections`, and `DELETE /api/mcp/connections/:provider`. Connections are scoped to the authenticated user's workspace; only workspace owners/admins can change them. Optional bearer credentials are encrypted at rest with AES-256-GCM using the server-only `MCP_TOKEN_ENCRYPTION_KEY`. Configure that key before storing credentials. Provider endpoints are selected from a fixed catalog (not arbitrary client URLs) to reduce SSRF risk. OAuth providers still require their own authorization flow; a configured URL is not proof of a live MCP session. The current phase stores connector configuration and credentials but does not yet implement MCP `tools/list` or `tools/call`.

Official endpoint references: [Figma MCP](https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/), [Linear MCP](https://linear.app/docs/mcp), [Supabase MCP deployment guide](https://supabase.com/docs/guides/ai-tools/byo-mcp). Neon endpoint was supplied by the project owner.
