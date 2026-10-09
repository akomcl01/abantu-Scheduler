import { matchesFrom, parseDate, todayStr, type Match, type ScheduleState } from '../lib/rotation'
import { Avatar, Card, Icon, ICONS, Pill, SectionTitle, fmtDay, fmtLong, fmtMon, fmtWeekday } from './ui'

const daysUntil = (d: string) => Math.round((parseDate(d).getTime() - parseDate(todayStr()).getTime()) / 86_400_000)
const when = (d: string) => { const n = daysUntil(d); return n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : `In ${n} days` }

export default function Home({ state }: { state: ScheduleState }) {
  const upcoming = matchesFrom(state, todayStr(), 90).filter((m) => !m.skipped)
  const hero = upcoming.find((m) => m.kind === 'sunday' && m.controller)
  const list = upcoming.filter((m) => m !== hero && (m.kind === 'wednesday' || m.controller)).slice(0, 6)
  const active = state.members.filter((m) => m.active)
  const sundayLabel = hero ? when(hero.date) : ''

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm text-mute">{fmtLong(todayStr())}</p>
        <h1 className="font-display text-5xl leading-none sm:text-6xl">Who’s on the sticks?</h1>
      </header>

      {!active.length && <Card className="p-6 text-mute">Add players in the Squad tab to start the rotation.</Card>}

      {hero?.controller && (
        <section className="relative overflow-hidden rounded-[32px] bg-ink p-6 text-card sm:p-8">
          <div className="absolute -right-10 -top-10 size-48 rounded-full opacity-90" style={{ background: hero.controller.color }} />
          <div className="absolute -right-2 top-24 size-20 rounded-full bg-accent" />
          <div className="relative">
            <Pill tone="accent">{sundayLabel}</Pill>
            <p className="mt-10 text-sm text-card/60">{fmtWeekday(hero.date)} · {fmtDay(hero.date)} {fmtMon(hero.date)}</p>
            <h2 className="mt-1 break-words font-display text-6xl leading-[0.95] sm:text-7xl">{hero.controller.name}</h2>
            <p className="mt-4 text-card/70">is controlling Abantu</p>
          </div>
        </section>
      )}

      {active.length > 0 && (
        <section>
          <SectionTitle>Rotation</SectionTitle>
          <div className="-mx-4 flex gap-4 overflow-x-auto px-5 py-2 sm:mx-0 sm:flex-wrap sm:px-1">
            {active.map((m, i) => {
              const now = m.id === hero?.controller?.id
              return (
                <div key={m.id} className={`flex w-16 shrink-0 flex-col items-center gap-2 ${now ? '' : 'opacity-60'}`}>
                  <div className="relative">
                    <Avatar m={m} size={52} ring={now} />
                    <span className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full bg-card text-[10px] font-bold ring-1 ring-hair">{i + 1}</span>
                  </div>
                  <span className={`max-w-full truncate text-xs ${now ? 'font-semibold' : ''}`}>{m.name}</span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {list.length > 0 && (
        <section>
          <SectionTitle>Coming up</SectionTitle>
          <Card className="divide-y divide-hair overflow-hidden">
            {list.map((m) => <Row key={m.date} m={m} />)}
          </Card>
        </section>
      )}
    </div>
  )
}

function Row({ m }: { m: Match }) {
  const wed = m.kind === 'wednesday'
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <div className="w-12 shrink-0">
        <p className="font-display text-3xl leading-none">{fmtDay(m.date)}</p>
        <p className="mt-1 text-xs uppercase tracking-wide text-mute">{fmtMon(m.date)}</p>
      </div>
      {wed ? (
        <>
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sand text-mute"><Icon d={ICONS.users} size={18} /></span>
          <div className="min-w-0 flex-1"><p className="font-medium">Group night</p><p className="text-sm text-mute">Wednesday · everyone plays</p></div>
        </>
      ) : (
        <>
          {m.controller && <Avatar m={m.controller} size={40} />}
          <div className="min-w-0 flex-1"><p className="truncate font-medium">{m.controller?.name}</p><p className="text-sm text-mute">Sunday</p></div>
        </>
      )}
      <span className="shrink-0 text-sm text-mute">{when(m.date)}</span>
    </div>
  )
}

