import { matchesFrom, parseDate, todayStr, type Match, type ScheduleState } from '../lib/rotation'
import PlayerCard from './PlayerCard'
import { Avatar, Card, Icon, ICONS, Pill, SectionTitle, fmtDay, fmtLong, fmtMon, fmtWeekday } from './ui'

const daysUntil = (d: string) => Math.round((parseDate(d).getTime() - parseDate(todayStr()).getTime()) / 86_400_000)
const when = (d: string) => { const n = daysUntil(d); return n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : `In ${n} days` }

export default function Home({ state }: { state: ScheduleState }) {
  const upcoming = matchesFrom(state, todayStr(), 90).filter((m) => !m.skipped)
  const hero = upcoming.find((m) => m.kind === 'sunday' && m.controller)
  const list = upcoming.filter((m) => m !== hero && (m.kind === 'wednesday' || m.controller)).slice(0, 6)
  const active = state.members.filter((m) => m.active)
  const sundayLabel = hero ? when(hero.date) : ''
  const following = upcoming.find((m) => m !== hero && m.kind === 'sunday' && m.controller)
  const rotationIndex = Math.max(0, active.findIndex((m) => m.id === hero?.controller?.id))

  return (
    <div className="space-y-8">
      {!active.length && <Card className="p-6 text-mute">Add players in the Squad tab to start the rotation.</Card>}

      {hero?.controller && (
        <section>
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-mute">On the sticks</p>
          <div className="grid grid-cols-[auto_1fr] items-start gap-5 sm:gap-10">
            <PlayerCard m={hero.controller} className="w-36 sm:w-56" />
            <div className="min-w-0">
              <h1 className="break-words font-display text-5xl leading-[0.92] sm:text-7xl">{hero.controller.name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Pill tone="gold">{sundayLabel}</Pill>
                <span className="text-sm text-mute">{fmtWeekday(hero.date)} {fmtDay(hero.date)} {fmtMon(hero.date)}</span>
              </div>
              <p className="mt-4 hidden text-[15px] leading-relaxed text-mute sm:block">Controlling the whole Abantu team this Sunday. Everyone else is on the sofa with opinions.</p>

              <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-mute">Turn</p>
              <div className="flex items-center">
                <span className="grid h-11 min-w-11 place-items-center rounded-lg bg-sand px-3 font-display text-xl">{rotationIndex + 1}</span>
                <span className="h-0.5 w-5 bg-hair sm:w-10" />
                <span className="flex h-11 items-center gap-2 rounded-lg border border-gold bg-gold/10 px-3 text-sm font-semibold text-gold">
                  {following?.controller ? <><Avatar m={following.controller} size={22} />{following.controller.name}</> : 'Next up'}
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {active.length > 0 && (
        <section>
          <SectionTitle>Rotation</SectionTitle>
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-4 pt-8 sm:mx-0 sm:flex-wrap sm:px-0">
            {active.map((m) => {
              const now = m.id === hero?.controller?.id
              return (
                <div key={m.id} className="relative shrink-0">
                  {now && <span className="absolute -top-6 left-1/2 size-0 -translate-x-1/2 border-x-[9px] border-t-[11px] border-x-transparent border-t-accent" />}
                  <PlayerCard m={m} compact dim={!now} className={`w-24 transition ${now ? 'scale-105' : ''}`} />
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

