import { useState } from 'react'
import { addDays, controllerFor, lossStreak, matchesFrom, nextMember, parseDate, seasonOn, todayStr, type Match, type Result, type ScheduleState } from '../lib/rotation'
import PlayerCard from './PlayerCard'
import { Avatar, Btn, Card, Icon, ICONS, Pill, ResultButtons, ResultChip, SectionTitle, Sheet, fmtDay, fmtMon, fmtShort, fmtWeekday } from './ui'

interface Props { state: ScheduleState; canEdit: boolean; onChange: (s: ScheduleState) => void; onNeedUnlock: () => void }

const daysUntil = (d: string) => Math.round((parseDate(d).getTime() - parseDate(todayStr()).getTime()) / 86_400_000)
const when = (d: string) => { const n = daysUntil(d); return n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : `In ${n} days` }

export default function Home({ state, canEdit, onChange, onNeedUnlock }: Props) {
  const today = todayStr()
  const [logging, setLogging] = useState(false)
  const guard = (fn: () => void) => () => (canEdit ? fn() : onNeedUnlock())
  const active = state.members.filter((m) => m.active)
  const cur = controllerFor(state, today) ?? active[0] ?? null
  const next = cur ? nextMember(state, cur.id) : null
  const { streak, recent } = lossStreak(state, today)
  const season = seasonOn(state, today)
  const upcoming = matchesFrom(state, today, 30).filter((m) => m.controller).slice(0, 5)
  const nextEvents = (state.events ?? []).filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 2)
  const benched = streak >= 3 && cur && next

  return (
    <div className="space-y-8">
      {!active.length && <Card className="p-6 text-mute">Add players in the Squad tab to start.</Card>}

      {benched && (
        <div className="rounded-2xl border border-loss/60 bg-loss/10 p-4">
          <p className="font-semibold text-loss">{cur.name} has lost {streak} in a row</p>
          <p className="mt-1 text-sm text-mute">That’s three. {next.name} takes the team now.</p>
          <Btn variant="primary" className="mt-3 w-full sm:w-auto" onClick={guard(() => onChange({ ...state, benches: [...state.benches, today] }))}>Hand over to {next.name}</Btn>
        </div>
      )}

      {nextEvents.map((e) => (
        <div key={e.id} className="flex items-center gap-4 rounded-2xl border border-gold/50 bg-gold/10 p-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-gold/20 text-gold"><Icon d={ICONS.trophy} size={22} /></span>
          <div className="min-w-0 flex-1"><p className="truncate font-semibold">{e.title}</p><p className="text-sm text-mute">{fmtShort(e.date)}</p></div>
          <Pill tone="gold">{when(e.date)}</Pill>
        </div>
      ))}

      {cur && (
        <section>
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-mute">On the sticks</p>
          <div className="grid grid-cols-[auto_1fr] items-start gap-5 sm:gap-10">
            <PlayerCard m={cur} className="w-36 sm:w-56" />
            <div className="min-w-0">
              <h1 className="break-words font-display text-5xl leading-[0.92] sm:text-7xl">{cur.name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Pill tone="gold">{season ? season.name : 'This season'}</Pill>
                {season && <span className="text-sm text-mute">until {fmtShort(season.end)}</span>}
              </div>

              <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-mute">Losses in a row</p>
              <div className="flex items-center gap-2" aria-label={`${streak} of 3 losses in a row`}>
                {[0, 1, 2].map((i) => <span key={i} className={`size-5 rounded-full border-2 ${i < streak ? 'border-loss bg-loss' : 'border-hair'}`} />)}
                <span className="ml-1 text-sm text-mute">{streak}/3</span>
              </div>

              {recent.length > 0 && (
                <div className="mt-4 flex gap-1.5" aria-label="Recent results">{recent.map((g) => <ResultChip key={g.date} r={g.result} />)}</div>
              )}

              <Btn variant="primary" className="mt-5" onClick={guard(() => setLogging(true))}>Log result</Btn>
            </div>
          </div>
          {next && (
            <div className="mt-6 flex items-center">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-mute">Next up</span>
              <span className="ml-4 flex h-11 items-center gap-2 rounded-lg border border-gold bg-gold/10 px-3 text-sm font-semibold text-gold"><Avatar m={next} size={22} />{next.name}</span>
            </div>
          )}
        </section>
      )}

      {!state.seasons.length && cur && (
        <Card className="p-4 text-sm text-mute">Add the season dates in Settings so the app knows when {next?.name ?? 'the next player'} takes over.</Card>
      )}

      {active.length > 0 && (
        <section>
          <SectionTitle>Order of play</SectionTitle>
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-4 pt-8 sm:mx-0 sm:flex-wrap sm:px-0">
            {active.map((m) => {
              const now = m.id === cur?.id
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

      {upcoming.length > 0 && (
        <section>
          <SectionTitle>Next games</SectionTitle>
          <Card className="divide-y divide-hair overflow-hidden">
            {upcoming.map((m) => <Row key={m.date} m={m} result={state.results[m.date]} />)}
          </Card>
        </section>
      )}

      {logging && <LogResult state={state} onChange={onChange} onClose={() => setLogging(false)} />}
    </div>
  )
}

function Row({ m, result }: { m: Match; result?: Result }) {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <div className="w-12 shrink-0">
        <p className="font-display text-3xl leading-none">{fmtDay(m.date)}</p>
        <p className="mt-1 text-xs uppercase tracking-wide text-mute">{fmtMon(m.date)}</p>
      </div>
      {m.controller && <Avatar m={m.controller} size={40} />}
      <div className="min-w-0 flex-1"><p className="truncate font-medium">{m.controller?.name}</p><p className="text-sm text-mute">{fmtWeekday(m.date)}</p></div>
      {result ? <ResultChip r={result} /> : <span className="shrink-0 text-sm text-mute">{when(m.date)}</span>}
    </div>
  )
}

function LogResult({ state, onChange, onClose }: { state: ScheduleState; onChange: (s: ScheduleState) => void; onClose: () => void }) {
  const today = todayStr()
  const days = matchesFrom(state, addDays(today, -21), 22).filter((m) => m.date <= today).reverse().slice(0, 5)
  const firstOpen = days.find((m) => !state.results[m.date]) ?? days[0]
  const [date, setDate] = useState(firstOpen?.date ?? today)
  const save = (r: Result | null) => {
    const results = { ...state.results }
    if (r) results[date] = r; else delete results[date]
    onChange({ ...state, results })
    onClose()
  }
  return (
    <Sheet title="Log result" onClose={onClose}>
      {days.length === 0 ? <p className="text-mute">No games to log yet.</p> : (
        <>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-mute">Which game</p>
          <div className="mb-5 flex flex-wrap gap-2">
            {days.map((m) => (
              <button key={m.date} onClick={() => setDate(m.date)} aria-pressed={date === m.date}
                className={`flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium ${date === m.date ? 'border-accent bg-accent/15 text-ink' : 'border-hair hover:bg-sand'}`}>
                {fmtShort(m.date)}{state.results[m.date] && <ResultChip r={state.results[m.date]} size={22} />}
              </button>
            ))}
          </div>
          <ResultButtons value={state.results[date]} onPick={save} onClear={() => save(null)} />
        </>
      )}
    </Sheet>
  )
}
