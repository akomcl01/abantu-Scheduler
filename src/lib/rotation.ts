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
  benches: string[] // dates the current player was benched after 3 losses in a row
  results: Record<string, Result> // match date -> result for whoever had the team
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
export const todayStr = () => {
  const n = new Date()
  return fmtDate(new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate())))
}

export function nextOnOrAfter(s: string, weekday: number) {
  return addDays(s, (weekday - dow(s) + 7) % 7)
}

export interface Stint {
  memberId: string
  from: string
  reason: 'start' | 'season' | 'benched'
}

/** Every handover in date order: season starts and bench events each move to the next active player. */
export function buildStints(state: ScheduleState): Stint[] {
  const active = state.members.filter((m) => m.active)
  if (!active.length) return []
  const changes = [
    ...state.seasons.filter((x) => x.start > state.startDate).map((x) => ({ date: x.start, reason: 'season' as const, order: 0 })),
    ...state.benches.filter((d) => d > state.startDate).map((d) => ({ date: d, reason: 'benched' as const, order: 1 })),
  ].sort((a, b) => a.date.localeCompare(b.date) || a.order - b.order)
  const out: Stint[] = [{ memberId: active[0].id, from: state.startDate, reason: 'start' }]
  changes.forEach((c, i) => out.push({ memberId: active[(i + 1) % active.length].id, from: c.date, reason: c.reason }))
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

/** Consecutive losses for whoever has the team now, counting only their own games. */
export function lossStreak(state: ScheduleState, today: string) {
  const st = stintOn(state, today)
  const games = Object.entries(state.results)
    .filter(([d]) => st && d >= st.from && d <= today)
    .sort(([a], [b]) => a.localeCompare(b))
  let streak = 0
  for (let i = games.length - 1; i >= 0 && games[i][1] === 'L'; i--) streak++
  return { streak, recent: games.slice(-5).map(([date, result]) => ({ date, result })) }
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
