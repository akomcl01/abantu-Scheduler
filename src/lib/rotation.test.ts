import { describe, expect, it } from 'vitest'
import { benchStamp, careerFor, coachGames, winRate, recordFor, buildStints, controllerFor, lossStreak, matchesFrom, nextMember, previousCoach, seasonOn, type ScheduleState } from './rotation'

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
  games: [],
}
let n = 0
const g = (date: string, result: 'W' | 'D' | 'L', time = '12:00:00') => ({ id: String(n++), date, at: `${date}T${time}`, result })

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

describe('duplicate and early benches', () => {
  it('counts the same handover once', () => {
    const s = { ...base, benches: ['2026-10-07T21:00:00', '2026-10-07T21:00:00', '2026-10-07T21:00:00'] }
    expect(controllerFor(s, '2026-10-09')?.id).toBe('b')
  })
  it('ignores a handover dated before the start date', () => {
    const s = { ...base, startDate: '2026-10-09', benches: ['2026-10-07T21:00:00'] }
    expect(controllerFor(s, '2026-10-10')?.id).toBe('a')
  })
})

describe('previous coach', () => {
  it('is null until someone has taken over', () => {
    expect(previousCoach(base, '2026-10-05')).toBeNull()
  })
  it('after a bench, names the benched coach and their dates', () => {
    const s = { ...base, benches: ['2026-10-07T21:30:00'] }
    const p = previousCoach(s, '2026-10-09')
    expect(p?.member.id).toBe('a')
    expect(p?.from).toBe('2026-09-27')
    expect(p?.to).toBe('2026-10-07')
  })
  it('after a season change, ends the day before the new season', () => {
    const p = previousCoach(base, '2026-10-24')
    expect(p?.member.id).toBe('a')
    expect(p?.to).toBe('2026-10-22')
  })
})

describe('bench stamp', () => {
  it('hands over right after the third loss, so those losses stay with the benched coach', () => {
    const games = [g('2026-10-04', 'W'), g('2026-10-07', 'L', '19:00:00'), g('2026-10-07', 'L', '19:20:00'), g('2026-10-07', 'L', '19:40:00')]
    const s0 = { ...base, games }
    const stamp = benchStamp(s0, '2026-10-09')
    expect(stamp.startsWith('2026-10-07T19:40:00')).toBe(true)
    const s = { ...s0, benches: [stamp], games: [...games, g('2026-10-07', 'L', '20:00:00')] }
    expect(controllerFor(s, '2026-10-09')?.id).toBe('b')
    expect(lossStreak(s, '2026-10-09').streak).toBe(1)
    expect(coachGames(s).get('a')?.length).toBe(4)
    expect(coachGames(s).get('b')?.length).toBe(1)
    expect(previousCoach(s, '2026-10-09')?.to).toBe('2026-10-07')
  })
})

describe('loss streak', () => {
  const run = (games: ReturnType<typeof g>[]) => lossStreak({ ...base, games }, '2026-10-12').streak
  it('counts trailing losses and resets on a win or draw', () => {
    expect(run([g('2026-10-04', 'L'), g('2026-10-07', 'L'), g('2026-10-11', 'L')])).toBe(3)
    expect(run([g('2026-10-04', 'L'), g('2026-10-07', 'W'), g('2026-10-11', 'L')])).toBe(1)
    expect(run([g('2026-10-04', 'L'), g('2026-10-07', 'L'), g('2026-10-11', 'D')])).toBe(0)
  })
  it('handles many games in one day, in the order they were logged', () => {
    const day = [g('2026-10-11', 'W', '18:00:00'), g('2026-10-11', 'L', '18:20:00'), g('2026-10-11', 'L', '18:40:00'), g('2026-10-11', 'L', '19:00:00')]
    expect(run(day)).toBe(3)
    expect(run([...day, g('2026-10-11', 'W', '19:30:00')])).toBe(0)
    expect(lossStreak({ ...base, games: day }, '2026-10-11').today).toEqual({ w: 1, d: 0, l: 3 })
  })
  it('only counts games since the current player took over, even within the same day', () => {
    const games = [g('2026-10-11', 'L', '18:00:00'), g('2026-10-11', 'L', '18:20:00'), g('2026-10-11', 'L', '18:40:00'), g('2026-10-11', 'L', '19:10:00')]
    const s = { ...base, benches: ['2026-10-11T18:50:00'], games }
    expect(lossStreak(s, '2026-10-11').streak).toBe(1) // b has only the 19:10 game
    expect(controllerFor(s, '2026-10-11')?.id).toBe('b')
  })
})

describe('match days', () => {
  it('lists Wednesdays and Sundays with the controller', () => {
    const m = matchesFrom(base, '2026-10-04', 8)
    expect(m.map((x) => x.kind)).toEqual(['sunday', 'wednesday', 'sunday'])
    expect(m.every((x) => x.controller?.id === 'a')).toBe(true)
  })
})

describe('league vs playoff record', () => {
  it('splits a season record by competition and treats old games as league', () => {
    const games = [
      { ...g('2026-10-04', 'W') },
      { ...g('2026-10-07', 'L'), kind: 'playoff' as const },
      { ...g('2026-10-11', 'W'), kind: 'playoff' as const },
      { ...g('2026-11-01', 'L') }, // other season
    ]
    const r = recordFor(games, base.seasons[0])
    expect(r.league).toEqual({ w: 1, d: 0, l: 0 })
    expect(r.playoff).toEqual({ w: 1, d: 0, l: 1 })
    expect(recordFor(games, null).league.l).toBe(1)
  })
})

describe('coach records', () => {
  it('credits each game to whoever was coach at that time, even mid-day', () => {
    const games = [g('2026-10-04', 'W'), g('2026-10-11', 'L', '18:00:00'), g('2026-10-11', 'L', '19:30:00'), g('2026-10-24', 'W')]
    const s = { ...base, benches: ['2026-10-11T19:00:00'], games }
    const by = coachGames(s)
    expect(by.get('a')?.map((x) => x.result)).toEqual(['W', 'L'])
    expect(by.get('b')?.map((x) => x.result)).toEqual(['L']) // 19:30 on the 11th, after the bench
    expect(by.get('c')?.map((x) => x.result)).toEqual(['W']) // season 2 start 23 Oct
  })
  it('builds a season-by-season career with league/playoff splits and win rate', () => {
    const games = [g('2026-09-30', 'W'), { ...g('2026-10-04', 'L'), kind: 'playoff' as const }, g('2026-10-07', 'W')]
    const c = careerFor({ ...base, games }, 'a')
    expect(c).toHaveLength(1)
    expect(c[0].name).toBe('Season 1')
    expect(c[0].league).toEqual({ w: 2, d: 0, l: 0 })
    expect(c[0].playoff).toEqual({ w: 0, d: 0, l: 1 })
    expect(winRate(c[0].all)).toBe(67)
    expect(winRate({ w: 0, d: 0, l: 0 })).toBeNull()
  })
})
