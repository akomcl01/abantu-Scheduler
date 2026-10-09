import type { Game, ScheduleState } from './rotation'

/**
 * How the shared data is split across Firestore documents:
 *  - club/state   the small config (members, dates, seasons, benches, events)
 *  - games/{id}   one document per game, so two people logging at once never overwrite each other
 *  - pics/{id}    one document per record screenshot
 * These helpers convert between that layout and the app's single ScheduleState. Pure, so they are unit tested.
 */
export type Config = Pick<ScheduleState, 'members' | 'startDate' | 'seasons' | 'benches'> & { events: NonNullable<ScheduleState['events']> }

export interface Pic {
  id: string
  key: string // season id or 'all'
  kind: 'league' | 'playoff'
  dataUrl: string
}

export const picId = (key: string, kind: Pic['kind']) => `${key}__${kind}`

/** Firestore rejects `undefined`, so round-trip through JSON. */
const clean = <T>(x: T): T => JSON.parse(JSON.stringify(x))

export const configOf = (s: ScheduleState): Config =>
  clean({ members: s.members, startDate: s.startDate, seasons: s.seasons, benches: s.benches, events: s.events ?? [] })

export const picsOf = (s: ScheduleState): Pic[] =>
  Object.entries(s.recordPics ?? {}).flatMap(([key, v]) =>
    (['league', 'playoff'] as const).filter((k) => v[k]).map((kind) => ({ id: picId(key, kind), key, kind, dataUrl: v[kind]! })),
  )

export function joinState(config: Partial<Config> | null, games: Game[], pics: Pic[], fallback: ScheduleState): ScheduleState {
  const recordPics: NonNullable<ScheduleState['recordPics']> = {}
  for (const p of pics) recordPics[p.key] = { ...recordPics[p.key], [p.kind]: p.dataUrl }
  return {
    ...fallback,
    ...(config ?? {}),
    members: config?.members ?? fallback.members,
    seasons: config?.seasons ?? [],
    benches: config?.benches ?? [],
    events: config?.events ?? [],
    games: [...games].sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id)),
    recordPics,
  }
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/** What has to be written to turn `prev` into `next`. */
export function diffState(prev: ScheduleState, next: ScheduleState) {
  const config = same(configOf(prev), configOf(next)) ? null : configOf(next)

  const prevGames = new Map(prev.games.map((g) => [g.id, g]))
  const nextIds = new Set(next.games.map((g) => g.id))
  const gamesSet = next.games.filter((g) => !same(prevGames.get(g.id), g)).map((g) => clean(g))
  const gamesDel = prev.games.filter((g) => !nextIds.has(g.id)).map((g) => g.id)

  const prevPics = new Map(picsOf(prev).map((p) => [p.id, p]))
  const nextPics = picsOf(next)
  const nextPicIds = new Set(nextPics.map((p) => p.id))
  const picsSet = nextPics.filter((p) => prevPics.get(p.id)?.dataUrl !== p.dataUrl)
  const picsDel = [...prevPics.keys()].filter((id) => !nextPicIds.has(id))

  return { config, gamesSet, gamesDel, picsSet, picsDel }
}
