import { describe, expect, it } from 'vitest'
import { buildStints, controllerFor, lossStreak, matchesFrom, nextMember, seasonOn, type ScheduleState } from './rotation'

const mk = (id: string, active = true) => ({ id, name: id, color: '#fff', active })
const base: ScheduleState = {
  members: [mk('a'), mk('b'), mk('c')],
  startDate: '2026-09-27',
  seasons: [
    { id: 's1', name: 'Season 1', start: '2026-09-27', end: '2026-10-22' },
    { id: 's2', name: 'Season 2', start: '2026-10-23', end: '2026-12-03' },
    { id: 's3', name: 'Season 3', start: '2026-12-04', end: '2027-01-20' },
  ],
  benches: [],
  results: {},
}

describe('season rotation', () => {
  it('gives one player the whole season, then the next', () => {
    expect(controllerFor(base, '2026-09-27')?.id).toBe('a')
    expect(controllerFor(base, '2026-10-22')?.id).toBe('a')
    expect(controllerFor(base, '2026-10-23')?.id).toBe('b')
    expect(controllerFor(base, '2026-12-06')?.id).toBe('c')
    expect(controllerFor(base, '2027-01-03')?.id).toBe('c')
  })
  it('wraps back to the first player', () => {
    const s = { ...base, seasons: [...base.seasons, { id: 's4', name: 'Season 4', start: '2027-01-21', end: '2027-03-01' }] }
    expect(controllerFor(s, '2027-01-24')?.id).toBe('a')
  })
  it('is null before the rotation starts', () => {
    expect(controllerFor(base, '2026-09-20')).toBeNull()
  })
  it('works with no seasons: first player keeps the team', () => {
    const s = { ...base, seasons: [] }
    expect(controllerFor(s, '2027-05-01')?.id).toBe('a')
  })
  it('a bench hands over early and the next season moves on again', () => {
    const s = { ...base, benches: ['2026-10-07'] }
    expect(controllerFor(s, '2026-10-04')?.id).toBe('a')
    expect(controllerFor(s, '2026-10-07')?.id).toBe('b')
    expect(controllerFor(s, '2026-10-23')?.id).toBe('c')
    expect(buildStints(s).map((x) => x.reason)).toEqual(['start', 'benched', 'season', 'season'])
  })
  it('ignores inactive players', () => {
    const s = { ...base, members: [mk('a'), mk('b', false), mk('c')] }
    expect(controllerFor(s, '2026-10-24')?.id).toBe('c')
    expect(nextMember(s, 'a')?.id).toBe('c')
  })
  it('finds the season for a date', () => {
    expect(seasonOn(base, '2026-11-01')?.id).toBe('s2')
    expect(seasonOn(base, '2028-01-01')).toBeNull()
  })
})

describe('loss streak', () => {
  it('counts trailing losses and resets on a win or draw', () => {
    const r = (x: Record<string, 'W' | 'D' | 'L'>) => lossStreak({ ...base, results: x }, '2026-10-12').streak
    expect(r({ '2026-10-04': 'L', '2026-10-07': 'L', '2026-10-11': 'L' })).toBe(3)
    expect(r({ '2026-10-04': 'L', '2026-10-07': 'W', '2026-10-11': 'L' })).toBe(1)
    expect(r({ '2026-10-04': 'L', '2026-10-07': 'L', '2026-10-11': 'D' })).toBe(0)
  })
  it('only counts the current player’s games', () => {
    const s = { ...base, benches: ['2026-10-08'], results: { '2026-10-04': 'L' as const, '2026-10-07': 'L' as const, '2026-10-11': 'L' as const } }
    expect(lossStreak(s, '2026-10-12').streak).toBe(1) // b only has the 11th
  })
})

describe('match days', () => {
  it('lists Wednesdays and Sundays with the controller', () => {
    const m = matchesFrom(base, '2026-10-04', 8)
    expect(m.map((x) => x.kind)).toEqual(['sunday', 'wednesday', 'sunday'])
    expect(m.every((x) => x.controller?.id === 'a')).toBe(true)
  })
})
