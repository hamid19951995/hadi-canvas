import http from 'node:http'
import postgres from 'postgres'
import { randomBytes, createHash } from 'node:crypto'
import { hashPassword, verifyPassword } from './password.mjs'
import { MCP_CATALOG, getCatalogEntry } from '../mcp/catalog.mjs'
import { encryptSecret } from '../mcp/crypto.mjs'

const PORT = Number(process.env.AUTH_PORT || 8788)
const DATABASE_URL = process.env.DATABASE_URL || ''
const APP_ORIGINS = new Set((process.env.AUTH_ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173').split(',').map(x => x.trim()).filter(Boolean))
const COOKIE = 'hadi_session'
/**
 * The recommended deployment serves the UI and /api/auth from one origin (Vite proxy in
 * development, nginx in production), so Lax keeps the cookie working both locally and in
 * production. Set AUTH_COOKIE_SAMESITE=None + AUTH_HTTPS=1 only for cross-site deployments.
 */
const COOKIE_SAMESITE = (process.env.AUTH_COOKIE_SAMESITE || '').trim() || 'Lax'
const FORCE_SECURE = process.env.AUTH_COOKIE_SECURE === '1' || process.env.NODE_ENV === 'production'
const IS_HTTPS = process.env.AUTH_HTTPS === '1' || Boolean(process.env.TLS_CERT_PATH)
const COOKIE_SECURE = FORCE_SECURE || (COOKIE_SAMESITE.toLowerCase() === 'none' && IS_HTTPS)
const TTL = 7 * 24 * 60 * 60
const MAX_BODY = 16 * 1024
const attempts = new Map()

if (!DATABASE_URL) {
  console.error('[hadi-auth] DATABASE_URL is required')
  process.exit(1)
}
const sql = postgres(DATABASE_URL, { max: 10, idle_timeout: 20, connect_timeout: 10, ssl: process.env.DATABASE_SSL === 'disable' ? false : 'require' })

function send(res, status, data, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers })
  res.end(JSON.stringify(data))
}
function cookie(token, maxAge = TTL) {
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=${COOKIE_SAMESITE}; Max-Age=${maxAge}${COOKIE_SECURE ? '; Secure' : ''}`
}
function clearCookie() { return cookie('', 0) }
function getCookie(req) {
  const item = (req.headers.cookie || '').split(';').map(x => x.trim()).find(x => x.startsWith(`${COOKIE}=`))
  const token = item?.slice(COOKIE.length + 1) || ''
  return /^[A-Za-z0-9_-]{43}$/.test(token) ? token : null
}
function hashToken(token) { return createHash('sha256').update(token).digest() }
async function readJson(req) {
  const chunks = []; let size = 0
  for await (const chunk of req) { size += chunk.length; if (size > MAX_BODY) throw Object.assign(new Error('درخواست بیش از حد بزرگ است'), { status: 413 }); chunks.push(chunk) }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')) } catch { throw Object.assign(new Error('JSON نامعتبر است'), { status: 400 }) }
}
function checkOrigin(req) {
  const origin = req.headers.origin
  if (!origin || !APP_ORIGINS.has(origin)) throw Object.assign(new Error('مبدأ درخواست مجاز نیست'), { status: 403 })
}
function rateLimit(req, key) {
  const ip = req.socket.remoteAddress || 'unknown'; const id = `${key}:${ip}`; const now = Date.now()
  if (attempts.size > 10_000) {
    for (const [staleId, stale] of attempts) if (now > stale.reset) attempts.delete(staleId)
    if (attempts.size > 10_000) attempts.clear()
  }
  const entry = attempts.get(id) || { count: 0, reset: now + 60_000 }
  if (now > entry.reset) { entry.count = 0; entry.reset = now + 60_000 }
  entry.count++; attempts.set(id, entry)
  if (entry.count > 12) throw Object.assign(new Error('تعداد تلاش‌ها بیش از حد مجاز است؛ یک دقیقه بعد تلاش کنید'), { status: 429 })
}
async function createSession(userId, req, res) {
  const token = randomBytes(32).toString('base64url')
  await sql`insert into user_sessions (user_id, token_hash, expires_at, user_agent) values (${userId}, ${hashToken(token)}, now() + interval '7 days', ${String(req.headers['user-agent'] || '').slice(0, 300)})`
  res.setHeader('Set-Cookie', cookie(token))
}
async function currentUser(req) {
  const token = getCookie(req); if (!token) return null
  const rows = await sql`
    select u.id, u.email, u.display_name, s.expires_at,
      m.workspace_id, m.role, w.name as workspace_name
    from user_sessions s
    join app_users u on u.id = s.user_id
    left join workspace_memberships m on m.user_id = u.id
    left join workspaces w on w.id = m.workspace_id
    where s.token_hash = ${hashToken(token)} and s.revoked_at is null and s.expires_at > now() and u.disabled_at is null
    order by (m.role = 'owner') desc limit 1`
  return rows[0] || null
}
async function handle(req, res) {
  const origin = req.headers.origin
  if (origin && APP_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Vary', 'Origin')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS')
  }
  if (req.method === 'OPTIONS') {
    if (!origin || !APP_ORIGINS.has(origin)) return send(res, 403, { error: 'مبدأ درخواست مجاز نیست' })
    res.writeHead(204); return res.end()
  }
  const url = new URL(req.url || '/', 'http://localhost')
  if (req.method === 'GET' && url.pathname === '/health') {
    try {
      await sql`select 1`
      return send(res, 200, { ok: true, service: 'hadi-auth', databaseConfigured: true, database: 'reachable' })
    } catch (error) {
      console.error('[hadi-auth] health database check failed:', error.message)
      return send(res, 503, { ok: false, service: 'hadi-auth', databaseConfigured: true, database: 'unreachable' })
    }
  }
  if (!url.pathname.startsWith('/api/auth/') && !url.pathname.startsWith('/api/mcp/')) return send(res, 404, { error: 'یافت نشد' })
  try {
    if (req.method !== 'GET') checkOrigin(req)
    if (url.pathname.startsWith('/api/mcp/')) {
      const user = await currentUser(req)
      if (!user) return send(res, 401, { error: 'ابتدا وارد حساب شوید' })
      if (!user.workspace_id) return send(res, 403, { error: 'فضای کاری فعالی برای حساب وجود ندارد' })
      if (req.method === 'GET' && url.pathname === '/api/mcp/catalog') {
        return send(res, 200, { providers: MCP_CATALOG })
      }
      if (req.method === 'GET' && url.pathname === '/api/mcp/connections') {
        const rows = await sql`select provider, endpoint, status, created_at, updated_at from workspace_connectors where workspace_id = ${user.workspace_id} order by provider`
        return send(res, 200, { connections: rows })
      }
      if (req.method === 'POST' && url.pathname === '/api/mcp/connections') {
        if (!['owner', 'admin'].includes(user.role)) return send(res, 403, { error: 'فقط مدیر فضای کاری می‌تواند اتصال افزونه را تغییر دهد' })
        const body = await readJson(req)
        const provider = String(body.provider || '')
        const entry = getCatalogEntry(provider)
        if (!entry) return send(res, 400, { error: 'ارائه‌دهنده پشتیبانی نمی‌شود' })
        let endpoint = entry.endpoint
        if (provider === 'supabase') {
          const projectRef = String(body.projectRef || '')
          if (!/^[a-z0-9]{20}$/.test(projectRef)) return send(res, 400, { error: 'شناسه پروژه Supabase باید ۲۰ نویسه کوچک و عددی باشد' })
          endpoint = endpoint.replace('{project-ref}', projectRef)
        }
        const secret = body.token == null ? '' : String(body.token)
        if (secret.length > 8192) return send(res, 400, { error: 'اطلاعات اتصال بیش از حد بزرگ است' })
        if (secret && !process.env.MCP_TOKEN_ENCRYPTION_KEY) return send(res, 503, { error: 'رمزنگاری امن فعال نشده است؛ MCP_TOKEN_ENCRYPTION_KEY را تنظیم کنید' })
        const encrypted = secret ? encryptSecret(secret) : null
        const result = await sql.begin(async tx => {
          const rows = await tx`insert into workspace_connectors (workspace_id, provider, endpoint, status, created_by) values (${user.workspace_id}, ${provider}, ${endpoint}, ${secret ? 'configured' : 'needs_auth'}, ${user.id}) on conflict (workspace_id, provider) do update set endpoint = excluded.endpoint, status = excluded.status, updated_at = now() returning id, provider, endpoint, status, created_at, updated_at`
          const connector = rows[0]
          if (encrypted) await tx`insert into connector_credentials (connector_id, workspace_id, encrypted_secret) values (${connector.id}, ${user.workspace_id}, ${JSON.stringify(encrypted)}::jsonb) on conflict (connector_id) do update set encrypted_secret = excluded.encrypted_secret, rotated_at = now()`
          else await tx`delete from connector_credentials where connector_id = ${connector.id}`
          await tx`insert into security_audit_log (workspace_id, actor_user_id, event_type, resource_type, resource_id, details) values (${user.workspace_id}, ${user.id}, 'connector.configured', 'connector', ${connector.id}, ${JSON.stringify({ provider, credentialStored: Boolean(encrypted) })}::jsonb)`
          return connector
        })
        return send(res, 200, { connection: result, authentication: encrypted ? 'credential_stored' : 'provider_authorization_required' })
      }
      const disconnect = url.pathname.match(/^\/api\/mcp\/connections\/([a-z0-9-]+)$/)
      if (req.method === 'DELETE' && disconnect) {
        if (!['owner', 'admin'].includes(user.role)) return send(res, 403, { error: 'فقط مدیر فضای کاری می‌تواند اتصال افزونه را حذف کند' })
        const provider = disconnect[1]
        const removed = await sql.begin(async tx => {
          const rows = await tx`delete from workspace_connectors where workspace_id = ${user.workspace_id} and provider = ${provider} returning id`
          if (rows[0]) await tx`insert into security_audit_log (workspace_id, actor_user_id, event_type, resource_type, resource_id, details) values (${user.workspace_id}, ${user.id}, 'connector.disconnected', 'connector', ${rows[0].id}, ${JSON.stringify({ provider })}::jsonb)`
          return rows.length > 0
        })
        return send(res, removed ? 200 : 404, removed ? { ok: true } : { error: 'اتصال پیدا نشد' })
      }
      return send(res, 404, { error: 'مسیر MCP پیدا نشد' })
    }
    if (req.method === 'POST' && url.pathname === '/api/auth/register') {
      if (process.env.AUTH_ALLOW_REGISTRATION === '0') return send(res, 403, { error: 'ثبت‌نام عمومی غیرفعال است' })
      rateLimit(req, 'register')
      const body = await readJson(req)
      const email = String(body.email || '').trim().toLowerCase()
      const name = String(body.name || '').trim().slice(0, 80)
      const password = String(body.password || '')
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return send(res, 400, { error: 'ایمیل معتبر وارد کنید' })
      if (password.length < 12 || password.length > 128) return send(res, 400, { error: 'رمز عبور باید حداقل ۱۲ و حداکثر ۱۲۸ نویسه باشد' })
      if (name.length < 2) return send(res, 400, { error: 'نام باید حداقل ۲ نویسه باشد' })
      const passwordHash = await hashPassword(password)
      const result = await sql.begin(async tx => {
        const users = await tx`insert into app_users (email, display_name, password_hash) values (${email}, ${name}, ${passwordHash}) returning id, email, display_name`
        const user = users[0]
        const workspaces = await tx`insert into workspaces (name, created_by) values (${`${name} workspace`}, ${user.id}) returning id, name`
        await tx`insert into workspace_memberships (workspace_id, user_id, role) values (${workspaces[0].id}, ${user.id}, 'owner')`
        return { user, workspace: workspaces[0] }
      })
      await createSession(result.user.id, req, res)
      return send(res, 201, { user: result.user, workspace: result.workspace, emailVerification: 'not_configured' })
    }
    if (req.method === 'POST' && url.pathname === '/api/auth/login') {
      rateLimit(req, 'login')
      const body = await readJson(req); const email = String(body.email || '').trim().toLowerCase(); const password = String(body.password || '')
      const rows = await sql`select id, email, display_name, password_hash from app_users where lower(email) = ${email} and disabled_at is null limit 1`
      const user = rows[0]
      if (!user || !user.password_hash) return send(res, 401, { error: 'ایمیل یا رمز عبور نادرست است' })
      if (!await verifyPassword(password, user.password_hash)) return send(res, 401, { error: 'ایمیل یا رمز عبور نادرست است' })
      await createSession(user.id, req, res)
      return send(res, 200, { user: { id: user.id, email: user.email, display_name: user.display_name } })
    }
    if (req.method === 'GET' && url.pathname === '/api/auth/me') {
      const user = await currentUser(req)
      return send(res, user ? 200 : 401, user ? { user } : { error: 'وارد حساب نشده‌اید' })
    }
    if (req.method === 'POST' && url.pathname === '/api/auth/logout') {
      const token = getCookie(req)
      if (token) await sql`update user_sessions set revoked_at = now() where token_hash = ${hashToken(token)} and revoked_at is null`
      return send(res, 200, { ok: true }, { 'Set-Cookie': clearCookie() })
    }
    return send(res, 404, { error: 'یافت نشد' })
  } catch (error) {
    if (error.code === '23505') return send(res, 409, { error: 'این ایمیل قبلاً ثبت شده است' })
    console.error('[hadi-auth]', error.message)
    return send(res, error.status || 500, { error: error.status ? error.message : 'خطای داخلی سرور' })
  }
}

const server = http.createServer((req, res) => { void handle(req, res) })
server.listen(PORT, process.env.AUTH_HOST || '127.0.0.1', () => {
  console.log(`[hadi-auth] listening on ${process.env.AUTH_HOST || '127.0.0.1'}:${PORT}`)
  console.log(`[hadi-auth] cookie SameSite=${COOKIE_SAMESITE} Secure=${COOKIE_SECURE}`)
  if (COOKIE_SAMESITE.toLowerCase() === 'none' && !COOKIE_SECURE) {
    console.log('[hadi-auth] note: SameSite=None+Secure is required across sites; set AUTH_HTTPS=1 behind HTTPS (recommended) or AUTH_COOKIE_SAMESITE=Lax for same-site local use')
  }
})
process.on('SIGTERM', async () => { server.close(); await sql.end({ timeout: 5 }); process.exit(0) })
