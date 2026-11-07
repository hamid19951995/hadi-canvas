import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const service = readFileSync(new URL('../src/services/connectors.ts', import.meta.url), 'utf8')
const panel = readFileSync(new URL('../src/components/ConnectorsPanel.tsx', import.meta.url), 'utf8')

test('MCP connection uses authenticated server API and does not trust opaque no-cors fetch', () => {
  assert.match(service, /credentials:\s*'include'/)
  assert.match(service, /\/api\/mcp\/connections/)
  assert.doesNotMatch(service, /mode:\s*'no-cors'/)
})

test('MCP credentials are not stored in browser localStorage by connectMcp', () => {
  const start = service.indexOf('export async function connectMcp')
  const end = service.indexOf('export async function disconnectConnector', start)
  const body = service.slice(start, end)
  assert.doesNotMatch(body, /setApiKey\(|localStorage\.setItem/)
})

test('UI distinguishes configured MCP entries from verified live connections', () => {
  assert.match(panel, /تنظیم‌شده؛ تأییدنشده/)
  assert.match(panel, /اتصال زنده هنوز تأیید نشده/)
})
