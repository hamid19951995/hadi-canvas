-- Hadi Canvas identity/auth schema for PostgreSQL. Apply once to a dedicated DB.
-- Back up first. Run with a privileged migration role; runtime role gets least privilege.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  display_name text NOT NULL DEFAULT '',
  password_hash text,
  email_verified_at timestamptz,
  disabled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT app_users_email_nonempty CHECK (length(trim(email)) > 3),
  CONSTRAINT app_users_password_hash_format CHECK (password_hash IS NULL OR password_hash LIKE 'scrypt$%')
);
CREATE UNIQUE INDEX IF NOT EXISTS app_users_email_lower_uq ON app_users (lower(email));

CREATE TABLE IF NOT EXISTS workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(trim(name)) > 0),
  created_by uuid NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS workspace_memberships (
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id)
);
CREATE INDEX IF NOT EXISTS workspace_memberships_user_idx ON workspace_memberships (user_id, workspace_id);

CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  token_hash bytea NOT NULL UNIQUE CHECK (octet_length(token_hash) = 32),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  last_seen_at timestamptz,
  user_agent text,
  CONSTRAINT user_sessions_expiry CHECK (expires_at > created_at)
);
CREATE INDEX IF NOT EXISTS user_sessions_active_user_idx ON user_sessions (user_id, expires_at) WHERE revoked_at IS NULL;
REVOKE ALL ON app_users, workspaces, workspace_memberships, user_sessions FROM PUBLIC;

-- Workspace-scoped MCP connections. Secrets are encrypted by the application before storage.
CREATE TABLE IF NOT EXISTS workspace_connectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('figma', 'linear', 'neon', 'supabase')),
  endpoint text NOT NULL,
  status text NOT NULL DEFAULT 'configured' CHECK (status IN ('configured', 'connected', 'needs_auth', 'revoked')),
  created_by uuid NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, provider),
  UNIQUE (id, workspace_id)
);
CREATE TABLE IF NOT EXISTS connector_credentials (
  connector_id uuid NOT NULL,
  workspace_id uuid NOT NULL,
  encrypted_secret jsonb NOT NULL,
  secret_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  rotated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (connector_id),
  FOREIGN KEY (connector_id, workspace_id) REFERENCES workspace_connectors(id, workspace_id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS security_audit_log (
  id bigserial PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES app_users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS workspace_connectors_workspace_idx ON workspace_connectors(workspace_id);
CREATE INDEX IF NOT EXISTS security_audit_workspace_created_idx ON security_audit_log(workspace_id, created_at DESC);
REVOKE ALL ON workspace_connectors, connector_credentials, security_audit_log FROM PUBLIC;
