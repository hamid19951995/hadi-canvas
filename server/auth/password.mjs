import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
const scrypt = promisify(scryptCallback)

export async function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 12 || password.length > 128) throw new RangeError('Password must contain 12 to 128 characters')
  const salt = randomBytes(16)
  const derived = Buffer.from(await scrypt(password, salt, 64))
  return `scrypt$${salt.toString('base64')}$${derived.toString('base64')}`
}

export async function verifyPassword(password, encoded) {
  if (typeof password !== 'string' || typeof encoded !== 'string') return false
  const [scheme, salt64, hash64, extra] = encoded.split('$')
  if (scheme !== 'scrypt' || !salt64 || !hash64 || extra !== undefined) return false
  let salt, expected
  try { salt = Buffer.from(salt64, 'base64'); expected = Buffer.from(hash64, 'base64') } catch { return false }
  if (salt.length !== 16 || expected.length !== 64) return false
  const actual = Buffer.from(await scrypt(password, salt, expected.length))
  return timingSafeEqual(expected, actual)
}
