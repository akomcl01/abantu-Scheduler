export interface Member {
  id: string
  name: string
  team: string
  color: string
  active: boolean
}

export interface ScheduleState {
  members: Member[] // order = rotation order
  startDate: string // first Sunday of the rotation, YYYY-MM-DD
  skipped: string[] // Sundays with no turn (doesn't consume a turn)
  overrides: Record<string, string> // date -> member id (swap, doesn't shift rotation)
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

/** Who controls the team on a given Sunday (null if skipped / before start / nobody active). */
export function controllerFor(state: ScheduleState, date: string): Member | null {
  if (dow(date) !== 0 || state.skipped.includes(date)) return null
  const active = state.members.filter((m) => m.active)
  if (!active.length) return null
  const override = state.overrides[date]
  if (override) return active.find((m) => m.id === override) ?? null
  const diff = Math.round((parseDate(date).getTime() - parseDate(state.startDate).getTime()) / DAY)
  if (diff < 0 || diff % 7 !== 0) return null
  const turnsBefore = diff / 7 - state.skipped.filter((s) => dow(s) === 0 && s >= state.startDate && s < date).length
  return active[((turnsBefore % active.length) + active.length) % active.length]
}

export interface Match {
  date: string
  kind: 'sunday' | 'wednesday'
  controller: Member | null
  skipped: boolean
}

/** Match days (Wed + Sun) from `from` for `count` days. */
export function matchesFrom(state: ScheduleState, from: string, days: number): Match[] {
  const out: Match[] = []
  for (let i = 0; i < days; i++) {
    const date = addDays(from, i)
    const w = dow(date)
    if (w === 0) out.push({ date, kind: 'sunday', controller: controllerFor(state, date), skipped: state.skipped.includes(date) })
    else if (w === 3) out.push({ date, kind: 'wednesday', controller: null, skipped: false })
  }
  return out
}
