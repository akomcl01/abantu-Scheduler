import { describe, expect, it } from 'vitest'
import { GOALS_START, announceDay, clipId, commentsFor, countdown, hasStarted, isClosed, nextDrop, pastWinners, rank, startOfDay, voteBlock, voteId, weekStart, winnerOf, type Clip, type Comment, type Vote } from './goals'

const W = '2026-10-11' // the kickoff Sunday
const clip = (playerId: string, at: string, week = W): Clip => ({ id: clipId(week, playerId), week, playerId, title: '', url: 'https://x/v.mp4', at })
const vote = (voterId: string, forPlayer: string, week = W): Vote => ({ id: voteId(week, voterId), week, voterId, clipId: clipId(week, forPlayer) })

describe('goal of the week: the week', () => {
  it('kicks off on a Sunday', () => {
    expect(new Date(GOALS_START + 'T12:00:00Z').getUTCDay()).toBe(0)
    expect(hasStarted('2026-10-10')).toBe(false)
    expect(hasStarted('2026-10-11')).toBe(true)
  })
  it('runs Sunday to Saturday and is announced the next Sunday, the 2nd game day', () => {
    expect(weekStart('2026-10-11')).toBe(W) // Sun
    expect(weekStart('2026-10-14')).toBe(W) // Wed
    expect(weekStart('2026-10-17')).toBe(W) // Sat
    expect(weekStart('2026-10-18')).toBe('2026-10-18') // next Sun starts a new week
    expect(announceDay(W)).toBe('2026-10-18')
  })
  it('is open all week and closed from the next Sunday', () => {
    expect(isClosed(W, '2026-10-17')).toBe(false)
    expect(isClosed(W, '2026-10-18')).toBe(true)
    expect(isClosed(W, '2026-10-21')).toBe(true)
  })
  it('counts down to the kickoff, then to each Sunday announcement', () => {
    expect(nextDrop('2026-10-08')).toBe('2026-10-11')
    expect(nextDrop('2026-10-11')).toBe('2026-10-18')
    expect(nextDrop('2026-10-17')).toBe('2026-10-18')
    expect(nextDrop('2026-10-18')).toBe('2026-10-25')
  })
})

describe('goal of the week: countdown', () => {
  it('splits the time left', () => {
    expect(countdown(((2 * 24 + 3) * 3600 + 4 * 60 + 5) * 1000)).toEqual({ d: 2, h: 3, m: 4, s: 5, done: false })
    expect(countdown(0).done).toBe(true)
  })
  it('is not done during the last second', () => {
    expect(countdown(999)).toEqual({ d: 0, h: 0, m: 0, s: 0, done: false })
    expect(countdown(1).done).toBe(false)
  })
  it('never goes negative', () => {
    expect(countdown(-5000)).toEqual({ d: 0, h: 0, m: 0, s: 0, done: true })
  })
  it('counts to local midnight of the day', () => {
    const d = new Date(startOfDay('2026-10-11'))
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()]).toEqual([2026, 9, 11, 0, 0])
  })
})

describe('goal of the week: ranking', () => {
  const clips = [clip('a', '2026-10-12T10:00:00'), clip('b', '2026-10-12T11:00:00'), clip('c', '2026-10-13T09:00:00')]

  it('most votes wins', () => {
    const votes = [vote('a', 'b'), vote('c', 'b'), vote('b', 'a')]
    expect(rank(clips, votes, W).map((r) => [r.clip.playerId, r.votes])).toEqual([['b', 2], ['a', 1], ['c', 0]])
    expect(winnerOf(clips, votes, W)?.clip.playerId).toBe('b')
  })
  it('a tie goes to the earlier upload', () => {
    const votes = [vote('a', 'c'), vote('c', 'b')]
    expect(winnerOf(clips, votes, W)?.clip.playerId).toBe('b')
  })
  it('own-clip votes do not count', () => {
    expect(winnerOf(clips, [vote('a', 'a'), vote('b', 'a')], W)?.votes).toBe(1)
    expect(winnerOf(clips, [vote('a', 'a')], W)).toBeNull()
  })
  it('no votes means no winner', () => {
    expect(winnerOf(clips, [], W)).toBeNull()
  })
  it('ignores other weeks and votes for clips that do not exist', () => {
    const next = '2026-10-18'
    const all = [...clips, clip('a', '2026-10-19T10:00:00', next)]
    expect(rank(all, [], W)).toHaveLength(3)
    expect(winnerOf(all, [vote('a', 'zzz'), vote('a', 'b', next)], W)).toBeNull()
  })
})

describe('goal of the week: past winners and voting', () => {
  it('lists winners of finished weeks, newest first', () => {
    const w2 = '2026-10-18'
    const clips = [clip('a', '2026-10-12T10:00:00'), clip('b', '2026-10-12T11:00:00'), clip('a', '2026-10-19T10:00:00', w2), clip('b', '2026-10-19T11:00:00', w2)]
    const votes = [vote('a', 'b'), vote('a', 'b', w2), vote('b', 'a', w2)]
    const winners = pastWinners(clips, votes, '2026-10-25')
    expect(winners.map((x) => [x.week, x.clip.playerId])).toEqual([[w2, 'a'], [W, 'b']])
    // the week in progress is not announced yet; the first week is announced on the next Sunday
    expect(pastWinners(clips, votes, '2026-10-20').map((x) => x.week)).toEqual([W])
    expect(pastWinners(clips, votes, '2026-10-17')).toEqual([])
  })
  it('blocks voting for yourself and after the week closes', () => {
    const c = clip('a', '2026-10-12T10:00:00')
    expect(voteBlock(c, 'b', '2026-10-14')).toBeNull()
    expect(voteBlock(c, 'a', '2026-10-14')).toBe('Your own clip')
    expect(voteBlock(c, 'b', '2026-10-18')).toBe('Voting is closed')
  })
})

describe('goal of the week: comments', () => {
  it('lists one clip\'s comments oldest first', () => {
    const c = (id: string, clip: string, at: string): Comment => ({ id, clipId: clip, authorId: 'a', text: id, at })
    const all = [c('2', 'x', '2026-10-12T12:00:00'), c('1', 'x', '2026-10-12T11:00:00'), c('3', 'y', '2026-10-12T10:00:00')]
    expect(commentsFor(all, 'x').map((k) => k.id)).toEqual(['1', '2'])
  })
})
