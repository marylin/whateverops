import { createHash } from 'node:crypto'

/**
 * Node-compatible replacement for Bun.hash().
 * Returns a numeric-like hash that supports .toString(radix).
 */
export function quickHash(input: string): { toString(radix?: number): string } {
  const hex = createHash('md5').update(input).digest('hex')
  const num = BigInt('0x' + hex.slice(0, 16))
  return {
    toString(radix = 10) {
      return num.toString(radix)
    },
  }
}
