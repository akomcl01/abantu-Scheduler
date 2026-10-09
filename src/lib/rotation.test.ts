import { describe, expect, it } from 'vitest'
import { controllerFor, matchesFrom, nextOnOrAfter, type ScheduleState } from './rotation'

const mk = (id: string, active = true) => ({ id, name: id, color: '#fff', active })
const base: ScheduleState = {
  members: [mk('a'), mk('b'), mk('c')],
  startDate: '2026-10-04', // a Sunday
  skipped: [],
  overrides: {},
}

describe('rotation', () => {
  it('loops through the fixed order', () => {
    expect(controllerFor(base, '2026-10-04')?.id).toBe('a')
    expect(controllerFor(base, '2026-10-11')?.id).toBe('b')
    expect(controllerFor(base, '2026-10-18')?.id).toBe('c')
    expect(controllerFor(base, '2026-10-25')?.id).toBe('a')
  })
  it('skipped Sundays do not consume a turn', () => {
    const s = { ...base, skipped: ['2026-10-11'] }
    expect(controllerFor(s, '2026-10-11')).toBeNull()
    expect(controllerFor(s, '2026-10-18')?.id).toBe('b')
  })
  it('overrides one day without shifting the rotation', () => {
    const s = { ...base, overrides: { '2026-10-11': 'c' } }
    expect(controllerFor(s, '2026-10-11')?.id).toBe('c')
    expect(controllerFor(s, '2026-10-18')?.id).toBe('c')
  })
  it('ignores inactive members and non-Sundays', () => {
    const s = { ...base, members: [mk('a'), mk('b', false), mk('c')] }
    expect(controllerFor(s, '2026-10-11')?.id).toBe('c')
    expect(controllerFor(base, '2026-10-08')).toBeNull()
  })
  it('gives Wednesday to the same player as the Sunday after it', () => {
    expect(controllerFor(base, '2026-10-07')?.id).toBe('b')
    const s = { ...base, overrides: { '2026-10-11': 'c' }, skipped: ['2026-10-18'] }
    expect(controllerFor(s, '2026-10-07')?.id).toBe('c')
    expect(controllerFor(s, '2026-10-14')).toBeNull()
  })
  it('lists Wednesdays and Sundays', () => {
    const m = matchesFrom(base, '2026-10-04', 8)
    expect(m.map((x) => x.kind)).toEqual(['sunday', 'wednesday', 'sunday'])
    expect(nextOnOrAfter('2026-10-05', 0)).toBe('2026-10-11')
  })
})
