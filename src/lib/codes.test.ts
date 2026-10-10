import { describe, expect, it } from 'vitest'
import { CODE_ALPHABET, CODE_LENGTH, newCode, normalizeCode, showCode } from './codes'

describe('player codes', () => {
  it('makes a code of the right length from the safe alphabet', () => {
    for (let i = 0; i < 200; i++) {
      const c = newCode()
      expect(c).toHaveLength(CODE_LENGTH)
      expect([...c].every((ch) => CODE_ALPHABET.includes(ch))).toBe(true)
    }
  })
  it('has no look-alike characters', () => {
    expect(/[01OIL]/.test(CODE_ALPHABET)).toBe(false)
  })
  it('uses the random source it is given', () => {
    expect(newCode(() => 0)).toBe('AAAAAA')
    expect(newCode((n) => n - 1)).toBe('999999')
  })
  it('accepts a code however it was typed', () => {
    expect(normalizeCode(' abc-def ')).toBe('ABCDEF')
    expect(normalizeCode('abc def')).toBe('ABCDEF')
    expect(normalizeCode('ABCDEF')).toBe('ABCDEF')
  })
  it('shows a code in two halves', () => {
    expect(showCode('ABCDEF')).toBe('ABC-DEF')
  })
})
