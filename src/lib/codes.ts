/**
 * Personal player codes. The Coach makes one per player in Settings and sends it to them privately. Entering it
 * once on a phone "claims" that player's name for that phone (see the claims rules in firestore.rules).
 * No 0/O, 1/I/L, so a code read out loud or typed from a screenshot is hard to get wrong.
 */
export const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
export const CODE_LENGTH = 6

export function newCode(random: (n: number) => number = (n) => crypto.getRandomValues(new Uint32Array(1))[0] % n): string {
  return Array.from({ length: CODE_LENGTH }, () => CODE_ALPHABET[random(CODE_ALPHABET.length)]).join('')
}

/** What the rules compare: upper case, no spaces or dashes, so "abc-def" and "ABC DEF" both work. */
export const normalizeCode = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '')

/** ABCDEF -> ABC-DEF, for showing. */
export const showCode = (c: string) => `${c.slice(0, 3)}-${c.slice(3)}`
