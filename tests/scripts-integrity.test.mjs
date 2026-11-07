import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))

function targetsOf(script) {
  const found = []
  const re = /(?:node|bash|sh)\s+((?:--[^\s]+\s+)*)([^\s;&|]+\.(?:mjs|js|sh))/g
  let match
  while ((match = re.exec(script))) found.push(match[2])
  return found
}

test('every npm script points at a file that exists', () => {
  const root = new URL('..', import.meta.url)
  for (const [name, script] of Object.entries(pkg.scripts)) {
    for (const target of targetsOf(script)) {
      assert.ok(existsSync(new URL(target, root)), `${name} → missing ${target}`)
    }
  }
})

test('test script runs the TypeScript resolver and real .test.mjs files', () => {
  assert.match(pkg.scripts.test, /--import \.\/tests\/ts-resolve\.mjs/)
  assert.match(pkg.scripts.test, /tests\/\*\.test\.mjs/)
})

test('documented commands exist (check, smoke, backup, integrations)', () => {
  for (const name of ['check', 'smoke', 'smoke:flow', 'backup', 'backup:verify', 'health', 'integrations:check', 'start:prod']) {
    assert.ok(pkg.scripts[name], `missing script ${name}`)
  }
})
