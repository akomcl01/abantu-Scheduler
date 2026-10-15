import { describe, expect, it } from 'vitest'
import { benchStamp, careerFor, coachGames, winRate, recordFor, buildStints, controllerFor, lossStreak, coachesDuring, matchesFrom, playoffsOn, nextMember, previousCoach, seasonOn, type ScheduleState, ceremonyDue, coachOfGame, dayGroups, handoverDefault } from './rotation'

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

describe('playoffs', () => {
  const ev = { id: 'p', date: '2026-10-15', title: 'Clubs playoffs' }
  it('runs on from the start date until an end date is set', () => {
    const s = { ...base, events: [ev] }
    expect(playoffsOn(s, '2026-10-14')).toBeNull()
    expect(playoffsOn(s, '2026-10-18')?.id).toBe('p')
    const closed = { ...base, events: [{ ...ev, end: '2026-10-25' }] }
    expect(playoffsOn(closed, '2026-10-25')?.id).toBe('p')
    expect(playoffsOn(closed, '2026-10-26')).toBeNull()
  })
  it('stops when the next season starts if no end is set', () => {
    expect(playoffsOn({ ...base, events: [ev] }, '2026-10-23')).toBeNull()
  })
  it('a season starting inside playoffs with a known end hands over after them', () => {
    const s = { ...base, events: [{ ...ev, date: '2026-10-15', end: '2026-10-28' }] }
    expect(controllerFor(s, '2026-10-23')?.id).toBe('a')
    expect(controllerFor(s, '2026-10-29')?.id).toBe('b')
  })
})

describe('coaches in a season', () => {
  it('lists the starter and whoever took over mid-season', () => {
    const s = { ...base, benches: ['2026-10-07T21:00:00'] }
    expect(coachesDuring(s, '2026-09-27', '2026-10-22').map((m) => m.id)).toEqual(['a', 'b'])
  })
  it('does not include the previous season coach when a season starts with a handover', () => {
    expect(coachesDuring(base, '2026-10-23', '2026-12-03').map((m) => m.id)).toEqual(['b'])
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
    expect(lossStreak(s, '2026-10-07').streak).toBe(1) // b's own game that day
    expect(coachGames(s).get('a')?.length).toBe(4)
    expect(coachGames(s).get('b')?.length).toBe(1)
    expect(previousCoach(s, '2026-10-09')?.to).toBe('2026-10-07')
  })
})

describe('loss streak', () => {
  const day = '2026-10-12'
  const run = (games: ReturnType<typeof g>[], today = day) => lossStreak({ ...base, games }, today).streak
  it('counts trailing losses and resets on a win or draw', () => {
    expect(run([g(day, 'L', '18:00:00'), g(day, 'L', '18:20:00'), g(day, 'L', '18:40:00')])).toBe(3)
    expect(run([g(day, 'L', '18:00:00'), g(day, 'W', '18:20:00'), g(day, 'L', '18:40:00')])).toBe(1)
    expect(run([g(day, 'L', '18:00:00'), g(day, 'L', '18:20:00'), g(day, 'D', '18:40:00')])).toBe(0)
  })
  it('handles many games in one day, in the order they were logged', () => {
    const games = [g(day, 'W', '18:00:00'), g(day, 'L', '18:20:00'), g(day, 'L', '18:40:00'), g(day, 'L', '19:00:00')]
    expect(run(games)).toBe(3)
    expect(run([...games, g(day, 'W', '19:30:00')])).toBe(0)
    expect(lossStreak({ ...base, games }, day).today).toEqual({ w: 1, d: 0, l: 3 })
  })
  it('starts every game day at 0: yesterday\'s last loss does not carry over', () => {
    const sunday = [g('2026-10-11', 'W', '20:00:00'), g('2026-10-11', 'L', '21:00:00'), g('2026-10-11', 'L', '22:00:00')]
    expect(run(sunday, '2026-10-11')).toBe(2)
    expect(run(sunday, '2026-10-14')).toBe(0)
    expect(lossStreak({ ...base, games: sunday }, '2026-10-14').season).toEqual({ w: 1, d: 0, l: 2 }) // still in the Coach's record
    expect(run([...sunday, g('2026-10-14', 'L', '20:00:00')], '2026-10-14')).toBe(1)
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

describe('handover ceremony: when it pops up', () => {
  const h = { key: 'p2@2026-10-14', from: '2026-10-14' }
  it('shows on the day the handover happens', () => {
    expect(ceremonyDue(h, '2026-10-14', [], h.key)).toBe(true)
  })
  it('shows live when the handover happens while the app is open', () => {
    expect(ceremonyDue(h, '2026-10-14', [], 'p1@2026-09-27')).toBe(true)
    expect(ceremonyDue({ ...h, from: '2026-10-13' }, '2026-10-14', [], 'p1@2026-09-27')).toBe(true) // e.g. past midnight
  })
  it('does not show days later, however often the app is opened', () => {
    expect(ceremonyDue(h, '2026-10-15', [], h.key)).toBe(false)
    expect(ceremonyDue(h, '2026-10-20', [], h.key)).toBe(false)
  })
  it('shows only once per device', () => {
    expect(ceremonyDue(h, '2026-10-14', [h.key], h.key)).toBe(false)
    expect(ceremonyDue(h, '2026-10-14', [h.key], 'p1@2026-09-27')).toBe(false)
  })
})

describe('the loss that completes a run stays with the Coach who played it', () => {
  const mm = (id: string) => ({ id, name: id, color: '#fff', active: true })
  const gg = (id: string, at: string, result: 'W' | 'D' | 'L') => ({ id, at, date: at.slice(0, 10), result })
  const games = [gg('1', '2026-10-14T20:00:00', 'W'), gg('2', '2026-10-14T20:30:00', 'L'), gg('3', '2026-10-14T21:00:00', 'L'), gg('4', '2026-10-14T21:30:00', 'L')]
  const state = (g: typeof games, benches: string[] = []): ScheduleState => ({ members: [mm('A'), mm('B'), mm('C')], startDate: '2026-10-11', seasons: [], benches, games: g, events: [], recordPics: {} })

  it('the Add handover default lands after the last game that day, not at noon', () => {
    expect(handoverDefault(state(games), '2026-10-14')).toBe('2026-10-14T21:31')
    expect(handoverDefault(state(games), '2026-10-15')).toBe('2026-10-15T12:00')
  })
  it('rolls past midnight and the hour correctly', () => {
    expect(handoverDefault(state([gg('1', '2026-10-14T23:59:30', 'L')]), '2026-10-14')).toBe('2026-10-15T00:00')
    expect(handoverDefault(state([gg('1', '2026-10-14T20:59:00', 'L')]), '2026-10-14')).toBe('2026-10-14T21:00')
  })
  it('a handover added with that default keeps all four games with A', () => {
    const s = state(games, [`${handoverDefault(state(games), '2026-10-14')}:00`])
    expect(coachOfGame(s, games[3])?.id).toBe('A')
    expect(dayGroups(s, '2026-10-14').map((x) => [x.coach?.id, x.games.length])).toEqual([['A', 4]])
  })
  it('a day split by a handover shows each Coach with the games they played', () => {
    const more = [...games, gg('5', '2026-10-14T22:00:00', 'W')]
    const s = state(more, ['2026-10-14T21:30:00.5'])
    expect(dayGroups(s, '2026-10-14').map((x) => [x.coach?.id, x.games.map((g) => g.id)])).toEqual([['A', ['1', '2', '3', '4']], ['B', ['5']]])
  })
  it('a day with no games shows whoever has the team', () => {
    const s = state(games, ['2026-10-14T21:30:00.5'])
    expect(dayGroups(s, '2026-10-15').map((x) => [x.coach?.id, x.games.length])).toEqual([['B', 0]])
  })
})
