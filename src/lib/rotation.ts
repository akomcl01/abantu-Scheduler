export interface Member {
  id: string
  name: string
  color: string
  active: boolean
  position?: string // card position, e.g. ST
  rating?: number // card overall
  stats?: number[] // PAC SHO PAS DRI DEF PHY
  cardImage?: string // real FC card image (URL or /cards/x.png); falls back to /cards/<name>.png
}

export interface GameEvent {
  id: string
  date: string // YYYY-MM-DD
  title: string // e.g. Clubs playoffs
}

export type Result = 'W' | 'D' | 'L'

/** One game, logged with a tap. `at` is local time (YYYY-MM-DDTHH:mm:ss) so order within a day is kept. */
export interface Game {
  id: string
  at: string
  date: string
  result: Result
}

export interface Season {
  id: string
  name: string // e.g. Season 1
  start: string
  end: string
}

/**
 * One player has the team for a whole season. The next player in the squad order takes over at the
 * next season start, or early if the current player is benched after 3 straight losses.
 */
export interface ScheduleState {
  members: Member[] // order = order of play
  startDate: string // day the first player takes over
  seasons: Season[]
  benches: string[] // when the current player was benched after 3 losses in a row (date or local timestamp)
  games: Game[] // every game logged, oldest first
  events?: GameEvent[] // playoffs and other one-off dates
}

const DAY = 86_400_000

export const parseDate = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}
export const fmtDate = (d: Date) => d.toISOString().slice(0, 10)
export const addDays = (s: string, n: number) => fmtDate(new Date(parseDate(s).getTime() + n * DAY))
export const dow = (s: string) => parseDate(s).getUTCDay() // 0 = Sun, 3 = Wed
export const nowStr = () => {
  const n = new Date()
  const p = (x: number) => String(x).padStart(2, '0')
  return `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())}T${p(n.getHours())}:${p(n.getMinutes())}:${p(n.getSeconds())}`
}
export const todayStr = () => {
  const n = new Date()
  return fmtDate(new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate())))
}

export function nextOnOrAfter(s: string, weekday: number) {
  return addDays(s, (weekday - dow(s) + 7) % 7)
}

export interface Stint {
  memberId: string
  from: string // date the stint begins
  at: string // exact start (a bench can happen mid-day)
  reason: 'start' | 'season' | 'benched'
}

/** Every handover in date order: season starts and bench events each move to the next active player. */
export function buildStints(state: ScheduleState): Stint[] {
  const active = state.members.filter((m) => m.active)
  if (!active.length) return []
  const changes = [
    ...state.seasons.filter((x) => x.start > state.startDate).map((x) => ({ date: x.start, at: x.start, reason: 'season' as const, order: 0 })),
    ...state.benches.filter((d) => d > state.startDate).map((d) => ({ date: d.slice(0, 10), at: d, reason: 'benched' as const, order: 1 })),
  ].sort((a, b) => a.date.localeCompare(b.date) || a.order - b.order)
  const out: Stint[] = [{ memberId: active[0].id, from: state.startDate, at: state.startDate, reason: 'start' }]
  changes.forEach((c, i) => out.push({ memberId: active[(i + 1) % active.length].id, from: c.date, at: c.at, reason: c.reason }))
  return out
}

export function stintOn(state: ScheduleState, date: string): Stint | null {
  const hit = buildStints(state).filter((s) => s.from <= date)
  return hit.length ? hit[hit.length - 1] : null
}

/** Who has the team on a match day (null before the rotation starts). */
export function controllerFor(state: ScheduleState, date: string): Member | null {
  const st = stintOn(state, date)
  return st ? state.members.find((m) => m.id === st.memberId) ?? null : null
}

/** The player after `id` in the squad order. */
export function nextMember(state: ScheduleState, id: string): Member | null {
  const active = state.members.filter((m) => m.active)
  if (active.length < 2) return null
  const i = active.findIndex((m) => m.id === id)
  return active[(i + 1) % active.length]
}

export const seasonOn = (state: ScheduleState, date: string) => state.seasons.find((x) => x.start <= date && date <= x.end) ?? null

export const tally = (games: Game[]) => ({
  w: games.filter((g) => g.result === 'W').length,
  d: games.filter((g) => g.result === 'D').length,
  l: games.filter((g) => g.result === 'L').length,
})

/** Consecutive losses for whoever has the team now, counting only games since they took over. */
export function lossStreak(state: ScheduleState, today: string) {
  const st = stintOn(state, today)
  const mine = state.games.filter((g) => st && g.at >= st.at && g.date <= today).sort((a, b) => a.at.localeCompare(b.at))
  let streak = 0
  for (let i = mine.length - 1; i >= 0 && mine[i].result === 'L'; i--) streak++
  return { streak, recent: mine.slice(-8), today: tally(mine.filter((g) => g.date === today)), season: tally(mine) }
}

export interface Match {
  date: string
  kind: 'sunday' | 'wednesday'
  controller: Member | null
}

/** Match days (Wed + Sun) from `from` for `days` days. */
export function matchesFrom(state: ScheduleState, from: string, days: number): Match[] {
  const out: Match[] = []
  for (let i = 0; i < days; i++) {
    const date = addDays(from, i)
    const w = dow(date)
    if (w === 0 || w === 3) out.push({ date, kind: w === 0 ? 'sunday' : 'wednesday', controller: controllerFor(state, date) })
  }
  return out
}
