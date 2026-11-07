#!/usr/bin/env node
/**
 * Apply server/db/identity-auth.sql to DATABASE_URL.
 *   npm run migrate            → dry run (validates connection, lists statements)
 *   npm run migrate:apply      → apply
 */
import { readFile } from 'node:fs/promises'
import postgres from 'postgres'

const apply = process.argv.includes('--apply')
const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('✗ DATABASE_URL is required')
  process.exit(1)
}

const sqlFile = new URL('../server/db/identity-auth.sql', import.meta.url)
const raw = await readFile(sqlFile, 'utf8')

// Split on semicolons outside of dollar-quoted bodies (none in this schema, but stay safe).
const statements = raw
  .split(/;\s*(?:\r?\n|$)/)
  .map((s) => s.trim())
  .filter((s) => s && !s.split('\n').every((line) => line.trim().startsWith('--')))

console.log(`· ${statements.length} statements in ${sqlFile.pathname}`)
for (const statement of statements) console.log(`  - ${statement.split('\n').find((l) => l.trim() && !l.trim().startsWith('--'))?.slice(0, 80)}`)

if (!apply) {
  console.log('\nDry run. Re-run with --apply to execute.')
  process.exit(0)
}

const sql = postgres(databaseUrl, {
  max: 1,
  ssl: process.env.DATABASE_SSL === 'disable' ? false : 'require',
  connect_timeout: 10,
})

try {
  for (const statement of statements) await sql.unsafe(statement)
  const tables = await sql`
    select table_name from information_schema.tables
    where table_schema = 'public'
      and table_name in ('app_users','workspaces','workspace_memberships','user_sessions','workspace_connectors','connector_credentials','security_audit_log')
    order by table_name`
  console.log(`✓ migration applied; tables: ${tables.map((t) => t.table_name).join(', ')}`)
} catch (error) {
  console.error(`✗ migration failed: ${error.message}`)
  process.exitCode = 1
} finally {
  await sql.end({ timeout: 5 })
}
