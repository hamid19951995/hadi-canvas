# MCP connectors — Phase 9 foundation

## What is implemented

- A provider catalog with fixed HTTPS Streamable HTTP endpoints.
- Workspace-scoped connector records and credential records in PostgreSQL.
- AES-256-GCM authenticated encryption for optional bearer credentials.
- Owner/admin-only connector changes, session authentication, and audit events.
- Provider selection from a fixed allowlist; callers cannot submit arbitrary MCP URLs.

## Configure

1. Apply `server/db/identity-auth.sql` using a privileged migration account.
2. Set `MCP_TOKEN_ENCRYPTION_KEY` to a base64-encoded random 32-byte key. Keep it in the server secret manager; never use a `VITE_` variable.
3. Start the auth API and authenticate through the existing account API.
4. Fetch `/api/mcp/catalog` and then configure a provider using `/api/mcp/connections`.

Generate a key with:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

For Supabase, supply the project ref; the server constructs the endpoint from the fixed official deployment pattern. Figma and Linear may require provider OAuth. A provider entry with no credential is marked `needs_auth`; storing a bearer credential marks it `configured`, but does not perform a remote MCP handshake.

## Not yet implemented

This phase does not perform OAuth callback/token refresh, remote MCP initialization, `tools/list`, `tools/call`, tool-level approval prompts, or live provider health checks. Do not label a connector operational until those protocol and authorization steps are completed and tested. The `configured` state means a credential was stored, not that the remote service accepted it.
