import { addDays, dow } from './rotation'

/**
 * Goal of the week. A week runs Monday to Sunday. Uploads and votes are open Monday to Saturday; on Sunday
 * (the 2nd game day) they close and the winner is announced. Pure helpers, unit tested.
 */
export interface Clip {
  id: string // clipId(week, playerId): one clip per player per week
  week: string // the Monday of the week, YYYY-MM-DD
  playerId: string
  title: string
  url: string
  at: string // local upload time
}

export interface Vote {
  id: string // voteId(week, voterId): one vote per player per week
  week: string
  voterId: string
  clipId: string
}

export const MAX_CLIP_MB = 100
export const MAX_TITLE = 80

export const clipId = (week: string, playerId: string) => `${week}__${playerId}`
export const voteId = clipId

export const weekStart = (date: string) => addDays(date, -((dow(date) + 6) % 7))
/** Sunday of that week: voting is over and the winner is shown. */
export const announceDay = (week: string) => addDays(week, 6)
export const isClosed = (week: string, today: string) => today >= announceDay(week)

export interface Ranked { clip: Clip; votes: number }

/** Clips of one week, best first. Own-clip and orphan votes never count. Ties go to the earlier upload. */
export function rank(clips: Clip[], votes: Vote[], week: string): Ranked[] {
  const mine = clips.filter((c) => c.week === week)
  const byId = new Map(mine.map((c) => [c.id, c]))
  const counts = new Map<string, number>()
  for (const v of votes) {
    const c = byId.get(v.clipId)
    if (v.week !== week || !c || c.playerId === v.voterId) continue
    counts.set(c.id, (counts.get(c.id) ?? 0) + 1)
  }
  return mine
    .map((clip) => ({ clip, votes: counts.get(clip.id) ?? 0 }))
    .sort((a, b) => b.votes - a.votes || a.clip.at.localeCompare(b.clip.at) || a.clip.id.localeCompare(b.clip.id))
}

/** The winner of a week, or null when nobody voted. */
export function winnerOf(clips: Clip[], votes: Vote[], week: string): Ranked | null {
  const top = rank(clips, votes, week)[0]
  return top && top.votes > 0 ? top : null
}

/** Winners of every finished week, newest first. */
export function pastWinners(clips: Clip[], votes: Vote[], today: string): (Ranked & { week: string })[] {
  return [...new Set(clips.map((c) => c.week))]
    .filter((w) => isClosed(w, today))
    .sort((a, b) => b.localeCompare(a))
    .flatMap((week) => { const w = winnerOf(clips, votes, week); return w ? [{ ...w, week }] : [] })
}

export const voteOf = (votes: Vote[], week: string, voterId: string) => votes.find((v) => v.week === week && v.voterId === voterId)

/** Why a vote can't be cast, or null when it can. */
export function voteBlock(clip: Clip, voterId: string, today: string): string | null {
  if (isClosed(clip.week, today) || clip.week !== weekStart(today)) return 'Voting is closed'
  if (clip.playerId === voterId) return 'Your own clip'
  return null
}
