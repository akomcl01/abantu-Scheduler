import { describe, expect, it } from 'vitest'
import { announceDay, clipId, isClosed, pastWinners, rank, voteBlock, voteId, weekStart, winnerOf, type Clip, type Vote } from './goals'

const W = '2026-10-05' // a Monday
const clip = (playerId: string, at: string, week = W): Clip => ({ id: clipId(week, playerId), week, playerId, title: '', url: 'https://x/v.mp4', at })
const vote = (voterId: string, forPlayer: string, week = W): Vote => ({ id: voteId(week, voterId), week, voterId, clipId: clipId(week, forPlayer) })

describe('goal of the week: the week', () => {
  it('starts on Monday and is announced on Sunday, the 2nd game day', () => {
    expect(weekStart('2026-10-05')).toBe(W)
    expect(weekStart('2026-10-07')).toBe(W) // Wed
    expect(weekStart('2026-10-11')).toBe(W) // Sun
    expect(weekStart('2026-10-12')).toBe('2026-10-12')
    expect(announceDay(W)).toBe('2026-10-11')
  })
  it('is open Monday to Saturday and closed from Sunday', () => {
    expect(isClosed(W, '2026-10-10')).toBe(false)
    expect(isClosed(W, '2026-10-11')).toBe(true)
    expect(isClosed(W, '2026-10-14')).toBe(true)
  })
})

describe('goal of the week: ranking', () => {
  const clips = [clip('a', '2026-10-06T10:00:00'), clip('b', '2026-10-06T11:00:00'), clip('c', '2026-10-07T09:00:00')]

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
    const next = '2026-10-12'
    const all = [...clips, clip('a', '2026-10-13T10:00:00', next)]
    expect(rank(all, [], W)).toHaveLength(3)
    expect(winnerOf(all, [vote('a', 'zzz'), vote('a', 'b', next)], W)).toBeNull()
  })
})

describe('goal of the week: past winners and voting', () => {
  it('lists winners of finished weeks, newest first', () => {
    const w2 = '2026-10-12'
    const clips = [clip('a', '2026-10-06T10:00:00'), clip('b', '2026-10-06T11:00:00'), clip('a', '2026-10-13T10:00:00', w2), clip('b', '2026-10-13T11:00:00', w2)]
    const votes = [vote('a', 'b'), vote('a', 'b', w2), vote('b', 'a', w2)]
    const winners = pastWinners(clips, votes, '2026-10-18')
    expect(winners.map((x) => [x.week, x.clip.playerId])).toEqual([[w2, 'a'], [W, 'b']])
    // the week in progress is not announced yet
    expect(pastWinners(clips, votes, '2026-10-14').map((x) => x.week)).toEqual([W])
  })
  it('blocks voting for yourself and after the week closes', () => {
    const c = clip('a', '2026-10-06T10:00:00')
    expect(voteBlock(c, 'b', '2026-10-09')).toBeNull()
    expect(voteBlock(c, 'a', '2026-10-09')).toBe('Your own clip')
    expect(voteBlock(c, 'b', '2026-10-11')).toBe('Voting is closed')
  })
})
