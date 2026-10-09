import { describe, expect, it } from 'vitest'
import type { ScheduleState } from './rotation'
import { diffState, joinState, picsOf } from './sync'

const base: ScheduleState = {
  members: [{ id: 'a', name: 'A', color: '#fff', active: true, cardImage: undefined }],
  startDate: '2026-09-27',
  seasons: [],
  benches: [],
  games: [],
  events: [],
  recordPics: {},
}
const game = (id: string, at: string) => ({ id, at, date: at.slice(0, 10), result: 'W' as const })

describe('shared data layout', () => {
  it('writes nothing when nothing changed', () => {
    const d = diffState(base, { ...base })
    expect(d.config).toBeNull()
    expect([d.gamesSet, d.gamesDel, d.picsSet, d.picsDel].every((x) => x.length === 0)).toBe(true)
  })
  it('logging a game writes only that game, and undo deletes only that game', () => {
    const g1 = game('g1', '2026-10-07T10:00:00')
    const g2 = game('g2', '2026-10-07T10:05:00')
    const a = diffState({ ...base, games: [g1] }, { ...base, games: [g1, g2] })
    expect(a.config).toBeNull()
    expect(a.gamesSet.map((g) => g.id)).toEqual(['g2'])
    const b = diffState({ ...base, games: [g1, g2] }, { ...base, games: [g1] })
    expect(b.gamesDel).toEqual(['g2'])
    expect(b.gamesSet).toEqual([])
  })
  it('config changes write the config only, and drop undefined fields', () => {
    const d = diffState(base, { ...base, benches: ['2026-10-09T09:00:00'] })
    expect(d.config?.benches).toEqual(['2026-10-09T09:00:00'])
    expect(JSON.stringify(d.config)).not.toContain('undefined')
    expect(d.gamesSet).toEqual([])
  })
  it('screenshots become one doc each and round-trip', () => {
    const next = { ...base, recordPics: { s1: { league: 'data:a', playoff: 'data:b' } } }
    const d = diffState(base, next)
    expect(d.picsSet.map((p) => p.id).sort()).toEqual(['s1__league', 's1__playoff'])
    expect(joinState(null, [], picsOf(next), base).recordPics).toEqual(next.recordPics)
    const removed = diffState(next, { ...next, recordPics: { s1: { league: 'data:a' } } })
    expect(removed.picsDel).toEqual(['s1__playoff'])
  })
  it('keeps uploaded player pictures out of the config doc and puts them back on read', () => {
    const withPic = { ...base, members: [{ ...base.members[0], cardImage: 'data:image/webp;base64,AAAA' }, { id: 'b', name: 'B', color: '#000', active: true, cardImage: '/cards/b.png' }] }
    const d = diffState(base, withPic)
    expect(JSON.stringify(d.config)).not.toContain('data:image')
    expect(d.config?.members[1].cardImage).toBe('/cards/b.png') // file paths stay inline
    expect(d.picsSet.map((p) => p.id)).toEqual(['a__player'])
    expect(joinState(d.config, [], d.picsSet, base).members[0].cardImage).toBe('data:image/webp;base64,AAAA')
    // changing only the picture does not rewrite the config
    const changed = diffState(withPic, { ...withPic, members: [{ ...withPic.members[0], cardImage: 'data:image/webp;base64,BBBB' }, withPic.members[1]] })
    expect(changed.config).toBeNull()
    expect(changed.picsSet).toHaveLength(1)
    // removing it deletes the pic doc
    expect(diffState(withPic, { ...withPic, members: [{ ...withPic.members[0], cardImage: undefined }, withPic.members[1]] }).picsDel).toEqual(['a__player'])
  })
  it('joins config, games and pics into one state with games in time order', () => {
    const s = joinState({ startDate: '2026-10-01' }, [game('b', '2026-10-07T12:00:00'), game('a', '2026-10-07T10:00:00')], [], base)
    expect(s.startDate).toBe('2026-10-01')
    expect(s.games.map((g) => g.id)).toEqual(['a', 'b'])
    expect(s.members).toEqual(base.members)
  })
})
