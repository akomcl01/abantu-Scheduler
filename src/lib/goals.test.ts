import { describe, expect, it } from 'vitest'
import { GOALS_START, announceDay, clipId, clipsOf, commentsFor, countdown, goalFromSearch, hasStarted, MAX_CLIPS_PER_WEEK, isClosed, newClipId, nextDrop, pastWinners, rank, shareTitle, shareUrl, startOfDay, voteBlock, voteId, weekStart, winnerOf, type Clip, type Comment, type Vote } from './goals'

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

describe('goal of the week: sharing', () => {
  it('titles a shared goal with the date of its week', () => {
    expect(shareTitle('2026-10-11')).toBe('Abantu FC - 11 Oct Goal of the week Contender')
    expect(shareTitle('2026-10-18')).toBe('Abantu FC - 18 Oct Goal of the week Contender')
  })
  it('makes a direct link that reads back to the same goal', () => {
    const id = clipId(W, 'abc-123')
    const url = shareUrl('https://abantu-scheduler.vercel.app', id)
    expect(url).toBe('https://abantu-scheduler.vercel.app/?goal=2026-10-11__abc-123')
    expect(goalFromSearch(new URL(url).search)).toBe(id)
  })
  it('finds no goal when the link has none', () => {
    expect(goalFromSearch('')).toBeNull()
    expect(goalFromSearch('?goal=')).toBeNull()
    expect(goalFromSearch('?x=1')).toBeNull()
  })
})

describe('goal of the week: several goals from one player', () => {
  const mk = (playerId: string, n: string, at: string): Clip => ({ id: newClipId(W, playerId, () => n), week: W, playerId, title: n, url: 'https://x/v.mp4', at })
  it('gives each new post its own id, still tied to the player and week', () => {
    expect(newClipId(W, 'abc', () => 'k3j9')).toBe('2026-10-11__abc__k3j9')
    expect(newClipId(W, 'abc')).not.toBe(newClipId(W, 'abc'))
    expect(newClipId(W, 'abc')).toMatch(/^2026-10-11__abc__[a-z0-9]+$/)
  })
  it('lists one player\'s posts for a week, nobody else\'s', () => {
    const all = [mk('a', 'one', '2026-10-12T10:00:00'), mk('a', 'two', '2026-10-12T11:00:00'), mk('b', 'three', '2026-10-12T12:00:00'), { ...mk('a', 'old', '2026-10-05T10:00:00'), week: '2026-10-04' }]
    expect(clipsOf(all, W, 'a').map((c) => c.title)).toEqual(['one', 'two'])
    expect(MAX_CLIPS_PER_WEEK).toBeGreaterThan(1)
  })
  it('each post is ranked on its own votes; your own posts never get your votes', () => {
    const a1 = mk('a', 'one', '2026-10-12T10:00:00'), a2 = mk('a', 'two', '2026-10-12T11:00:00'), b1 = mk('b', 'three', '2026-10-12T12:00:00')
    const votes: Vote[] = [
      { id: voteId(W, 'b'), week: W, voterId: 'b', clipId: a2.id }, // b votes for a's second post
      { id: voteId(W, 'a'), week: W, voterId: 'a', clipId: a1.id }, // a votes for their own: ignored
    ]
    expect(rank([a1, a2, b1], votes, W).map((r) => [r.clip.title, r.votes])).toEqual([['two', 1], ['one', 0], ['three', 0]])
    expect(voteBlock(a1, 'a', '2026-10-14')).toBe('Your own clip')
    expect(voteBlock(a2, 'a', '2026-10-14')).toBe('Your own clip')
    expect(voteBlock(a2, 'b', '2026-10-14')).toBeNull()
  })
  it('a player with two good goals can still win with only one of them', () => {
    const a1 = mk('a', 'one', '2026-10-12T10:00:00'), a2 = mk('a', 'two', '2026-10-12T11:00:00')
    const votes: Vote[] = [{ id: voteId(W, 'b'), week: W, voterId: 'b', clipId: a1.id }, { id: voteId(W, 'c'), week: W, voterId: 'c', clipId: a1.id }, { id: voteId(W, 'd'), week: W, voterId: 'd', clipId: a2.id }]
    expect(winnerOf([a1, a2], votes, W)?.clip.title).toBe('one')
  })
})
