import { useState } from 'react'
import { addDays, compOf, controllerFor, dow, seasonOn, tally, todayStr, type ScheduleState } from '../lib/rotation'
import { Avatar, Icon, ICONS, ResultChip, fmtDay, fmtLong, fmtShort } from './ui'

const monday = (d: string) => addDays(d, -((dow(d) + 6) % 7))
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function WeekStrip({ state }: { state: ScheduleState }) {
  const today = todayStr()
  const [start, setStart] = useState(monday(today))
  const [sel, setSel] = useState(today)
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i))
  const events = state.events ?? []
  const thisWeek = start === monday(today)
  const go = (n: number) => {
    const next = addDays(start, n * 7)
    setStart(next)
    setSel(next === monday(today) ? today : next)
  }

  const isMatch = (d: string) => dow(d) === 0 || dow(d) === 3
  const coach = isMatch(sel) ? controllerFor(state, sel) : null
  const games = state.games.filter((g) => g.date === sel).sort((a, b) => a.at.localeCompare(b.at))
  const t = tally(games)
  const dayEvents = events.filter((e) => e.date === sel)
  const season = seasonOn(state, sel)

  return (
    <section aria-label="This week">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mute">{thisWeek ? 'This week' : 'Week of'}</p>
          <p className="font-display text-2xl leading-none">{fmtShort(days[0]).replace(/^\w+ /, '')} – {fmtShort(days[6]).replace(/^\w+ /, '')}</p>
        </div>
        <div className="flex items-center gap-2">
          {!thisWeek && <button onClick={() => { setStart(monday(today)); setSel(today) }} className="min-h-10 rounded-full bg-sand px-4 text-xs font-semibold">Today</button>}
          <button onClick={() => go(-1)} aria-label="Previous week" className="grid size-10 place-items-center rounded-full bg-sand text-mute hover:bg-hair"><Icon d={ICONS.left} /></button>
          <button onClick={() => go(1)} aria-label="Next week" className="grid size-10 place-items-center rounded-full bg-sand text-mute hover:bg-hair"><Icon d={ICONS.right} /></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {days.map((d, i) => {
          const on = d === sel
          const match = isMatch(d)
          const c = match ? controllerFor(state, d) : null
          const ev = events.some((e) => e.date === d)
          const played = state.games.some((g) => g.date === d)
          return (
            <button key={d} onClick={() => setSel(d)} aria-pressed={on} aria-label={fmtLong(d)}
              className={`relative flex min-h-[4.5rem] flex-col items-center justify-between rounded-2xl border px-1 pb-2 pt-2.5 transition ${on ? 'border-transparent bg-ink text-paper' : d === today ? 'border-accent/70 bg-card' : 'border-hair bg-card'} ${d < today && !on ? 'opacity-70' : ''}`}>
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${on ? 'text-paper/70' : 'text-mute'}`}>{DAYS[i]}</span>
              <span className="font-display text-xl leading-none">{fmtDay(d)}</span>
              <span className="flex h-6 items-center justify-center">
                {c ? <Avatar m={c} size={22} /> : ev ? <Icon d={ICONS.trophy} size={16} className={on ? 'text-paper' : 'text-gold'} /> : <span className={`size-1 rounded-full ${on ? 'bg-paper/40' : 'bg-hair'}`} />}
              </span>
              {c && ev && <Icon d={ICONS.trophy} size={11} className={`absolute right-1 top-1 ${on ? 'text-paper' : 'text-gold'}`} />}
              {played && <span className={`absolute left-1.5 top-1.5 size-1.5 rounded-full ${on ? 'bg-paper' : 'bg-accent'}`} />}
            </button>
          )
        })}
      </div>

      <div className="mt-3 rounded-2xl border border-hair bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="font-medium">{sel === today ? 'Today · ' : ''}{fmtLong(sel)}</p>
          {season && <span className="shrink-0 text-xs text-mute">{season.name}</span>}
        </div>
        {coach ? (
          <div className="mt-3 flex items-center gap-3">
            <Avatar m={coach} size={36} />
            <div className="min-w-0 flex-1"><p className="truncate font-semibold">{coach.name}</p><p className="text-sm text-mute">Coach · {dow(sel) === 0 ? 'Sunday' : 'Wednesday'} game</p></div>
          </div>
        ) : <p className="mt-2 text-sm text-mute">{isMatch(sel) ? 'Before the rotation starts.' : 'No game day.'}</p>}

        {games.length > 0 && (
          <div className="mt-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {games.map((g) => <span key={g.id} className={compOf(g) === 'playoff' ? 'rounded-lg ring-1 ring-gold' : ''}><ResultChip r={g.result} size={26} /></span>)}
            </div>
            <p className="mt-2 text-sm text-mute"><b className="text-ink">{t.w}W {t.d}D {t.l}L</b> that day</p>
          </div>
        )}
        {dayEvents.map((e) => (
          <div key={e.id} className="mt-3 flex items-center gap-2 text-sm text-gold"><Icon d={ICONS.trophy} size={16} /><span className="font-semibold">{e.title}</span></div>
        ))}
        {isMatch(sel) && coach && games.length === 0 && sel <= today && <p className="mt-3 text-sm text-mute">No games logged.</p>}
      </div>
    </section>
  )
}
