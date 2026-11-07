import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

function keyFromEnv(value = process.env.MCP_TOKEN_ENCRYPTION_KEY) {
  if (!value) throw new Error('MCP_TOKEN_ENCRYPTION_KEY is required')
  const key = Buffer.from(value, 'base64')
  if (key.length !== 32) throw new Error('MCP_TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key')
  return key
}

export function encryptSecret(plaintext, keyValue) {
  if (typeof plaintext !== 'string' || plaintext.length < 1 || plaintext.length > 8192) throw new Error('Invalid credential')
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', keyFromEnv(keyValue), iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  return { version: 1, iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), data: ciphertext.toString('base64') }
}

export function decryptSecret(payload, keyValue) {
  if (!payload || payload.version !== 1) throw new Error('Unsupported encrypted credential version')
  const decipher = createDecipheriv('aes-256-gcm', keyFromEnv(keyValue), Buffer.from(payload.iv, 'base64'))
  decipher.setAuthTag(Buffer.from(payload.tag, 'base64'))
  return Buffer.concat([decipher.update(Buffer.from(payload.data, 'base64')), decipher.final()]).toString('utf8')
}
