import { describe, expect, it } from 'vitest'
import { farewell, welcome } from './messages'

const base = { out: 'Theo', inn: 'Olamide', games: 12, w: 7, d: 1, l: 4 }
const f = (seed: string, reason: 'season' | 'benched') => farewell({ seed, reason, ...base })
const text = (x: { paragraphs: string[] }) => x.paragraphs.join('\n')

describe('handover messages', () => {
  it('reads the same for the same handover and varies across handovers', () => {
    expect(text(f('a', 'benched'))).toBe(text(f('a', 'benched')))
    const variants = new Set(Array.from({ length: 30 }, (_, i) => text(f(`s${i}`, 'benched'))))
    expect(variants.size).toBeGreaterThan(5)
  })
  it('never leaves a placeholder unfilled and names the right people', () => {
    for (let i = 0; i < 30; i++) {
      for (const reason of ['season', 'benched'] as const) {
        const t = text(f(`s${i}`, reason))
        expect(t).not.toMatch(/\{\w+\}/)
        expect(t).toContain('Theo')
      }
      const w = welcome({ seed: `s${i}`, name: 'Olamide', out: 'Theo', season: 'Season 2', term: 'x', contractNo: 3 })
      expect(`${w.intro}${w.clauses.join('')}`).not.toMatch(/\{\w+\}/)
      expect(w.intro).toContain('Olamide')
      expect(w.headline).toBe('Welcome, Olamide')
      expect(w.kicker).toBe('Communicado Official')
      expect(w.paragraphs[0]).toMatch(/coach/i) // welcomed as a coach
      expect(w.paragraphs.join(' ')).not.toMatch(/\bplayer\b|signing|skill/i)
      expect(w.paragraphs.join(' ')).not.toMatch(/\{\w+\}/)
      expect(w.clauses).toHaveLength(4)
      expect(w.clauses.some((c) => /Three \(3\)/.test(c))).toBe(true)
    }
  })
  it('both farewells carry the Communicado Official label and name the outgoing coach in the title', () => {
    for (const reason of ['season', 'benched'] as const) {
      const m = f('x', reason)
      expect(m.kicker).toBe('📣 Communicado Official')
      expect(m.headline).toContain('Theo')
    }
  })
  it('the comedy send-off welcomes the new coach; the formal one adds stats when games were played', () => {
    expect(text(f('x', 'benched'))).toContain('Olamide')
    expect(text(f('x', 'season'))).toMatch(/12 games/)
    expect(text(farewell({ seed: 'x', reason: 'season', ...base, games: 0, w: 0, d: 0, l: 0 }))).not.toMatch(/\b0 games/)
  })
})
