import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12 // 96-bit IV recommended for GCM
const TAG_LENGTH = 16 // 128-bit auth tag

/**
 * Derive a 32-byte AES key from the raw key string using SHA-256.
 * Accepts any length input and produces a fixed-length key.
 */
function deriveKey(key: string): Buffer {
  return createHash('sha256').update(key).digest()
}

/**
 * Encrypt plaintext using AES-256-GCM.
 * Returns a colon-delimited base64 string: `iv:ciphertext:tag`
 */
export function encrypt(plaintext: string, key: string): string {
  const derivedKey = deriveKey(key)
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, derivedKey, iv)

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  return [iv.toString('base64'), encrypted.toString('base64'), tag.toString('base64')].join(':')
}

/**
 * Decrypt a ciphertext produced by `encrypt`.
 * Expects the format `iv:ciphertext:tag` in base64.
 * Throws if the format is invalid or authentication fails.
 */
export function decrypt(ciphertext: string, key: string): string {
  const parts = ciphertext.split(':')
  if (parts.length !== 3) {
    throw new Error('Invalid ciphertext format — expected iv:ciphertext:tag')
  }

  const [ivB64, encryptedB64, tagB64] = parts
  const derivedKey = deriveKey(key)
  const iv = Buffer.from(ivB64!, 'base64')
  const encrypted = Buffer.from(encryptedB64!, 'base64')
  const tag = Buffer.from(tagB64!, 'base64')

  if (tag.length !== TAG_LENGTH) {
    throw new Error('Invalid auth tag length')
  }

  const decipher = createDecipheriv(ALGORITHM, derivedKey, iv)
  decipher.setAuthTag(tag)

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
}
