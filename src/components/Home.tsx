import { matchesFrom, todayStr, parseDate, type Match, type ScheduleState } from '../lib/rotation'
import { Avatar, Card, Pill, fmtLong, fmtShort } from './ui'

const daysUntil = (d: string) => Math.round((parseDate(d).getTime() - parseDate(todayStr()).getTime()) / 86_400_000)
const when = (d: string) => { const n = daysUntil(d); return n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : `In ${n} days` }

export default function Home({ state }: { state: ScheduleState }) {
  const upcoming = matchesFrom(state, todayStr(), 120)
  const nextSunday = upcoming.find((m) => m.kind === 'sunday' && !m.skipped)
  const next = upcoming.filter((m) => !m.skipped)[0]
  const following = upcoming.filter((m) => m.kind === 'sunday' && !m.skipped && m !== nextSunday).slice(0, 3)
  const noOne = !state.members.some((m) => m.active)

  return (
    <div className="space-y-6">
      {noOne && <Card className="p-6 text-mute">Add players in the Squad tab to start the rotation.</Card>}

      {nextSunday?.controller && (
        <Card className="relative overflow-hidden p-6 sm:p-8">
          <div className="absolute -right-16 -top-16 size-64 rounded-full opacity-20 blur-3xl" style={{ background: nextSunday.controller.color }} />
          <div className="relative">
            <div className="flex items-center gap-2"><Pill tone="lime">{when(nextSunday.date)}</Pill><span className="text-sm text-mute">{fmtLong(nextSunday.date)}</span></div>
            <p className="mt-6 text-sm font-medium uppercase tracking-widest text-mute">On the sticks</p>
            <div className="mt-3 flex items-center gap-4">
              <Avatar m={nextSunday.controller} size={72} />
              <div className="min-w-0">
                <h1 className="truncate font-display text-4xl font-bold leading-tight sm:text-5xl">{nextSunday.controller.name}</h1>
                <p className="text-lg text-mute">{nextSunday.controller.team}</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {next && next.kind === 'wednesday' && (
        <Card className="flex items-center justify-between gap-4 p-5">
          <div><p className="font-display text-lg font-bold">Group night</p><p className="text-sm text-mute">{fmtLong(next.date)} · everyone plays</p></div>
          <Pill>{when(next.date)}</Pill>
        </Card>
      )}

      {following.length > 0 && (
        <section>
          <h2 className="mb-3 px-1 font-display text-lg font-bold">Coming up</h2>
          <ul className="space-y-2">
            {following.map((m) => <Row key={m.date} m={m} />)}
          </ul>
        </section>
      )}
      <p className="px-1 text-center text-xs text-mute">Wednesdays are group nights. Sundays rotate in a fixed loop.</p>
    </div>
  )
}

function Row({ m }: { m: Match }) {
  return (
    <li className="flex items-center gap-4 rounded-2xl border border-line bg-turf px-4 py-3">
      {m.controller && <Avatar m={m.controller} />}
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{m.controller?.name}</p>
        <p className="truncate text-sm text-mute">{m.controller?.team}</p>
      </div>
      <span className="shrink-0 text-sm text-mute">{fmtShort(m.date)}</span>
    </li>
  )
}
