#!/usr/bin/env node
/**
 * Verified PostgreSQL backups for the identity/MCP database.
 *   npm run backup            → create
 *   npm run backup:verify     → verify latest dump
 *   npm run backup:restore    → restore latest dump (asks for confirmation unless --yes)
 */
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'

const exec = promisify(execFile)
const command = (process.argv[2] || 'create').toLowerCase()
const dir = path.resolve(process.env.BACKUP_DIR || 'backups')
const databaseUrl = process.env.DATABASE_URL || ''

function usage() {
  console.log('Usage: node server/backupCli.mjs <create|verify|restore> [--file path] [--yes]')
}

async function latestDump() {
  const entries = (await readdir(dir)).filter((f) => f.endsWith('.dump')).sort()
  if (!entries.length) throw new Error(`No backups found in ${dir}. Run: npm run backup`)
  return path.join(dir, entries[entries.length - 1])
}

async function sha256(file) {
  const data = await readFile(file)
  return createHash('sha256').update(data).digest('hex')
}

async function create() {
  if (!databaseUrl) throw new Error('DATABASE_URL is required to create a backup')
  await mkdir(dir, { recursive: true })
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const file = path.join(dir, `hadi-identity-${stamp}.dump`)
  await exec('pg_dump', ['--format=custom', '--no-owner', '--no-privileges', `--file=${file}`, databaseUrl])
  const info = await stat(file)
  if (!info.size) throw new Error('pg_dump produced an empty file')
  const hash = await sha256(file)
  await writeFile(`${file}.sha256`, `${hash}  ${path.basename(file)}\n`)
  console.log(`✓ backup created: ${file} (${info.size} bytes)`)
  console.log(`  sha256: ${hash}`)
}

async function verify() {
  const file = process.argv.includes('--file') ? process.argv[process.argv.indexOf('--file') + 1] : await latestDump()
  const info = await stat(file)
  if (!info.size) throw new Error(`${file} is empty`)
  await exec('pg_restore', ['--list', file])
  const recorded = await readFile(`${file}.sha256`, 'utf8').catch(() => '')
  if (recorded) {
    const expected = recorded.trim().split(/\s+/)[0]
    const actual = await sha256(file)
    if (expected !== actual) throw new Error(`Checksum mismatch for ${file}`)
    console.log(`✓ checksum matches: ${file}`)
  } else {
    console.log('· no .sha256 sidecar found; skipping checksum')
  }
  console.log(`✓ archive is readable (${info.size} bytes): ${file}`)
}

async function restore() {
  if (!databaseUrl) throw new Error('DATABASE_URL is required to restore a backup')
  const file = process.argv.includes('--file') ? process.argv[process.argv.indexOf('--file') + 1] : await latestDump()
  if (!process.argv.includes('--yes')) {
    throw new Error(`Refusing to overwrite the database without --yes. Target file: ${file}`)
  }
  await verify()
  await exec('pg_restore', ['--clean', '--if-exists', '--no-owner', '--no-privileges', `--dbname=${databaseUrl}`, file])
  console.log(`✓ restored ${file} into DATABASE_URL`)
}

try {
  if (command === 'create') await create()
  else if (command === 'verify') await verify()
  else if (command === 'restore') await restore()
  else { usage(); process.exit(2) }
} catch (error) {
  console.error(`✗ ${error.message}`)
  process.exit(1)
}
