import { describe, test, expect } from 'bun:test'
import { encrypt, decrypt } from '../../../backend/src/lib/crypto'

const KEY = 'test-secret-key-for-unit-tests'
const ALT_KEY = 'different-key-that-will-fail'

describe('crypto', () => {
  describe('encrypt()', () => {
    test('produces a string in format "base64:base64:base64"', () => {
      const result = encrypt('hello world', KEY)
      const parts = result.split(':')
      expect(parts).toHaveLength(3)

      // Each part must be valid non-empty base64
      const base64Re = /^[A-Za-z0-9+/]+=*$/
      for (const part of parts) {
        expect(part.length).toBeGreaterThan(0)
        expect(base64Re.test(part)).toBe(true)
      }
    })

    test('produces different ciphertexts for the same plaintext (different IVs)', () => {
      const a = encrypt('same plaintext', KEY)
      const b = encrypt('same plaintext', KEY)
      expect(a).not.toBe(b)

      // IVs (first segment) must differ
      expect(a.split(':')[0]).not.toBe(b.split(':')[0])
    })
  })

  describe('decrypt()', () => {
    test('round-trips: decrypt(encrypt(x)) === x', () => {
      const plaintext = 'hello world'
      const ciphertext = encrypt(plaintext, KEY)
      expect(decrypt(ciphertext, KEY)).toBe(plaintext)
    })

    test('throws with wrong key', () => {
      const ciphertext = encrypt('sensitive data', KEY)
      expect(() => decrypt(ciphertext, ALT_KEY)).toThrow()
    })

    test('throws with malformed ciphertext — too few segments', () => {
      expect(() => decrypt('onlyone', KEY)).toThrow('Invalid ciphertext format')
    })

    test('throws with malformed ciphertext — too many segments', () => {
      expect(() => decrypt('a:b:c:d', KEY)).toThrow('Invalid ciphertext format')
    })

    test('throws with invalid auth tag length', () => {
      // Craft a ciphertext with a truncated tag (< 16 bytes)
      const valid = encrypt('data', KEY)
      const [iv, enc] = valid.split(':')
      const shortTag = Buffer.alloc(8).toString('base64') // 8 bytes, not 16
      expect(() => decrypt(`${iv}:${enc}:${shortTag}`, KEY)).toThrow()
    })

    test('throws when ciphertext is tampered', () => {
      const ciphertext = encrypt('original', KEY)
      const [iv, enc, tag] = ciphertext.split(':')
      // Flip a byte in the encrypted payload
      const tamperedEnc = Buffer.from(enc!, 'base64')
      tamperedEnc[0] = tamperedEnc[0]! ^ 0xff
      const tampered = `${iv}:${tamperedEnc.toString('base64')}:${tag}`
      expect(() => decrypt(tampered, KEY)).toThrow()
    })
  })

  describe('edge cases', () => {
    test('encrypt/decrypt empty string', () => {
      const ciphertext = encrypt('', KEY)
      expect(decrypt(ciphertext, KEY)).toBe('')
    })

    test('encrypt/decrypt special characters and unicode', () => {
      const special = '日本語 🚀 <script>alert("xss")</script> \n\t\r €£¥'
      const ciphertext = encrypt(special, KEY)
      expect(decrypt(ciphertext, KEY)).toBe(special)
    })

    test('encrypt/decrypt long string', () => {
      const long = 'A'.repeat(100_000)
      expect(decrypt(encrypt(long, KEY), KEY)).toBe(long)
    })
  })
})
