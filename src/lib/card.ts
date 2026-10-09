import type { Member } from './rotation'

export const STAT_LABELS = ['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY'] as const
export const POSITIONS = ['ST', 'CF', 'LW', 'RW', 'CAM', 'CM', 'CDM', 'LB', 'CB', 'RB', 'GK'] as const

const hash = (s: string) => {
  let h = 2166136261
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return h >>> 0
}

/** Stable "random" defaults from the name, until someone sets real numbers. */
export const getStats = (m: Pick<Member, 'name' | 'stats'>) =>
  m.stats?.length === 6 ? m.stats : Array.from({ length: 6 }, (_, i) => 62 + (hash(`${m.name}${i}`) % 31))
export const getRating = (m: Pick<Member, 'name' | 'stats' | 'rating'>) =>
  m.rating ?? Math.round(getStats(m).reduce((a, b) => a + b, 0) / 6)
export const getPosition = (m: Pick<Member, 'name' | 'position'>) => m.position ?? POSITIONS[hash(m.name) % POSITIONS.length]

export type Tier = 'icon' | 'rare' | 'gold' | 'silver' | 'bronze'
export const tierOf = (r: number): Tier => (r >= 90 ? 'icon' : r >= 85 ? 'rare' : r >= 75 ? 'gold' : r >= 65 ? 'silver' : 'bronze')
