# Integrations (in-app only)

All OAuth apps and model providers are configured **inside hadi-canvas**.

## Env (server)

Copy `.env.example` → `.env` and set:

- `CREDENTIAL_VAULT_KEY`
- `ALLOWED_ORIGIN` / `VITE_OAUTH_API` / `OAUTH_REDIRECT_URI`
- Optional: `GITHUB_CLIENT_ID/SECRET`, Figma, Canva

## Model keys

Users connect GapGPT / OpenAI / … in **Studio → Connectors**. Keys stay in the broker vault.

## Check

```bash
npm run integrations:check
```
