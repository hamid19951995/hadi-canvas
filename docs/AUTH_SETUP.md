# Hadi Canvas account API — development setup

This phase replaces the former browser-only demo login with a PostgreSQL-backed registration/login API.

## 1. Prepare PostgreSQL

Create a dedicated database and apply `server/db/identity-auth.sql` using a migration/owner role. The script creates users, workspaces, workspace memberships, and revocable sessions. It has **not** been run against a live database by this change. Configure a separate runtime role with only the required `SELECT`, `INSERT`, and `UPDATE` permissions on these tables; do not expose them directly to the browser.

## 2. Configure the server

Copy `.env.example` to `.env`, then set:

- `DATABASE_URL` to the PostgreSQL connection string.
- `DATABASE_SSL=require` for hosted PostgreSQL (or `disable` only for local development).
- `AUTH_ALLOWED_ORIGINS` to the exact UI origins, comma-separated. Never use `*`.
- `AUTH_HOST=127.0.0.1` behind a reverse proxy, or a private interface reachable only by the proxy.
- `VITE_AUTH_API` to the auth API origin. Prefer routing `/api/auth/*` through the same HTTPS site in production.

Start the UI and account API in separate terminals: `npm run dev` and `npm run auth`.

The Vite dev server (and `vite preview`) proxies `/api/auth` and `/api/mcp` to `AUTH_PROXY_TARGET` (default `http://127.0.0.1:8788`). Keep `VITE_AUTH_API` empty so the browser and the API share one origin; this is what makes the HttpOnly session cookie persist.

### Session cookie

- Default `AUTH_COOKIE_SAMESITE=Lax` (same-origin deployment).
- Cross-site deployments only: `AUTH_COOKIE_SAMESITE=None` **and** `AUTH_HTTPS=1` (browsers reject `SameSite=None` without `Secure`).
- `AUTH_ALLOW_REGISTRATION=0` closes public registration.

### Health

`GET /health` now executes `select 1`; it returns `503` with `database: "unreachable"` when PostgreSQL is down.

## 3. Current routes

- `POST /api/auth/register` — creates an account, a personal workspace, an owner membership, and a server-side session.
- `POST /api/auth/login` — verifies a scrypt password hash and creates a session.
- `GET /api/auth/me` — resolves the HttpOnly session cookie and workspace membership.
- `POST /api/auth/logout` — revokes the server-side session and clears the cookie.
- `GET /health` — process health only; it does not prove database readiness.

Request bodies are capped at 16 KiB. Passwords are scrypt-hashed with a random salt. Session tokens are random 256-bit values; only SHA-256 hashes are stored. Mutating requests require an exact allowed Origin. Cookies are HttpOnly and SameSite=Lax, and Secure in production.

## 4. Important release blockers

This is an initial account API, **not yet production-ready identity**. Email verification, password reset, MFA, OAuth sign-in, account deletion, session listing, persistent/distributed rate limiting, audit logging, and automated schema migration are not implemented. Registration currently creates an unverified account and the UI explicitly labels this as a development limitation. Do not open public registration until verification and abuse controls are implemented. The in-memory rate limiter is per-process and is not sufficient behind multiple workers. A production deployment also needs HTTPS, secret management, database backups, and integration tests against a real PostgreSQL instance.
