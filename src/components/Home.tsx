import { controllerFor, lossStreak, matchesFrom, benchStamp, nextMember, nowStr, parseDate, playoffsOn, previousCoach, todayStr, type Comp, type Match, type Result, type ScheduleState } from '../lib/rotation'
import { useState } from 'react'
import PlayerCard from './PlayerCard'
import WeekStrip from './WeekStrip'
import { Avatar, Btn, Card, Pill, SectionTitle, Sheet, fmtDay, fmtMon, fmtShort, fmtWeekday } from './ui'

interface Props { state: ScheduleState; canEdit: boolean; onChange: (s: ScheduleState) => void; onNeedUnlock: () => void }

const daysUntil = (d: string) => Math.round((parseDate(d).getTime() - parseDate(todayStr()).getTime()) / 86_400_000)
const when = (d: string) => { const n = daysUntil(d); return n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : `In ${n} days` }

export default function Home({ state, canEdit, onChange, onNeedUnlock }: Props) {
  const today = todayStr()
  const [comp, setCompState] = useState<Comp>(() => { try { return localStorage.getItem('abantu-comp') === 'playoff' ? 'playoff' : 'league' } catch { return 'league' } })
  const setComp = (c: Comp) => { setCompState(c); try { localStorage.setItem('abantu-comp', c) } catch { /* ignore */ } }
  const guard = (fn: () => void) => () => (canEdit ? fn() : onNeedUnlock())
  const active = state.members.filter((m) => m.active)
  const cur = controllerFor(state, today) ?? active[0] ?? null
  const next = cur ? nextMember(state, cur.id) : null
  const { streak } = lossStreak(state, today)
  const log = (result: Result) => {
    navigator.vibrate?.(12)
    onChange({ ...state, games: [...state.games, { id: crypto.randomUUID(), at: nowStr(), date: today, result, kind: comp }] })
  }
  const undo = () => onChange({ ...state, games: state.games.filter((g) => g.id !== state.games[state.games.length - 1]?.id) })
  const upcoming = matchesFrom(state, today, 30).filter((m) => m.controller).slice(0, 3)
  const prev = previousCoach(state, today)
  const playoff = playoffsOn(state, today) ?? (state.events ?? []).filter((e) => e.date > today && (e.playoffs ?? /playoff/i.test(e.title))).sort((a, b) => a.date.localeCompare(b.date))[0] ?? null
  const benched = streak >= 3 && cur && next
  // Pop the handover up the moment the third loss is logged. Dismissing it keeps it quiet until the next game changes things.
  const lastGame = state.games[state.games.length - 1]?.id
  const [dismissed, setDismissed] = useState<string | undefined>()
  const appoint = guard(() => onChange({ ...state, benches: [...state.benches, benchStamp(state, today)] }))

  return (
    <div className="space-y-6">
      <WeekStrip state={state} />

      {!active.length && <Card className="p-6 text-mute">Add players in the Squad tab to start.</Card>}

      {cur && (
        <section>
          <div className="flex items-center gap-4">
            <PlayerCard m={cur} className="w-28 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mute">Coach</p>
              <h1 className="break-words font-display text-4xl leading-[0.95]">{cur.name}</h1>
              <div className="mt-2 flex items-center gap-1.5" aria-label={`${streak} of 3 losses in a row`}>
                {[0, 1, 2].map((i) => <span key={i} className={`size-4 rounded-full border-2 ${i < streak ? 'border-loss bg-loss' : 'border-hair'}`} />)}
                <span className="ml-1 text-xs text-mute">{streak}/3 losses</span>
              </div>
            </div>
          </div>
          {(prev || next) && (
            <div className="mt-6 grid grid-cols-2 gap-3">
              {prev && (
                <div className="min-w-0">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-mute">Previous</p>
                  <span className="flex items-center gap-3 rounded-lg border border-hair bg-sand p-2 pr-3 text-sm font-semibold">
                    <PlayerCard m={prev.member} compact dim className="w-12 shrink-0" />
                    <span className="min-w-0"><span className="block truncate">{prev.member.name}</span><span className="block text-xs font-normal text-mute">{fmtShort(prev.from)} – {fmtShort(prev.to)}</span></span>
                  </span>
                </div>
              )}
              {next && (
                <div className="min-w-0">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-mute">Next up</p>
                  <span className="flex items-center gap-3 rounded-lg border border-gold bg-gold/10 p-2 pr-3 text-sm font-semibold text-gold"><PlayerCard m={next} compact className="w-12 shrink-0" /><span className="min-w-0 truncate">{next.name}</span></span>
                </div>
              )}
            </div>
          )}
          {benched && (
            <div className="mt-4 rounded-2xl border border-loss/60 bg-loss/10 p-4">
              <p className="font-semibold text-loss">{cur.name} has lost {streak} in a row</p>
              <p className="mt-1 text-sm text-mute">That’s three. {next.name} takes over as Coach.</p>
              <Btn variant="primary" className="mt-3 w-full sm:w-auto" onClick={appoint}>Appoint {next.name} as Coach</Btn>
            </div>
          )}
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mute">Log a game</p>
              <div className="flex gap-1 rounded-full bg-sand p-1" role="group" aria-label="Competition">
                {(['league', 'playoff'] as const).map((c) => (
                  <button key={c} onClick={() => setComp(c)} aria-pressed={comp === c} className={`min-h-9 rounded-full px-4 text-xs font-semibold ${comp === c ? (c === 'playoff' ? 'bg-gold text-[#1b1405]' : 'bg-ink text-paper') : 'text-mute'}`}>{c === 'league' ? 'League' : 'Playoffs'}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={guard(() => log('W'))} className="min-h-14 rounded-xl bg-win/15 font-display text-xl text-win active:scale-95">Win</button>
              <button onClick={guard(() => log('D'))} className="min-h-14 rounded-xl bg-sand font-display text-xl text-mute active:scale-95">Draw</button>
              <button onClick={guard(() => log('L'))} className="min-h-14 rounded-xl bg-loss/15 font-display text-xl text-loss active:scale-95">Loss</button>
            </div>
            <button onClick={guard(undo)} disabled={!state.games.length} className="mt-1 min-h-10 text-sm text-mute underline disabled:no-underline disabled:opacity-40">Undo last game</button>
          </div>
        </section>
      )}

      {active.length > 0 && (
        <section>
          <SectionTitle>Order of play</SectionTitle>
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-4 pt-8 sm:mx-0 sm:flex-wrap sm:px-0">
            {active.map((m) => {
              const now = m.id === cur?.id
              return (
                <div key={m.id} className="relative shrink-0">
                  {!now && next?.id === m.id && <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold uppercase tracking-[0.18em] text-gold">Next</span>}
                  {now && <span className="absolute -top-6 left-1/2 size-0 -translate-x-1/2 border-x-[9px] border-t-[11px] border-x-transparent border-t-accent" />}
                  <PlayerCard m={m} compact dim={!now} className={`w-24 transition ${now ? 'scale-105' : ''}`} />
                </div>
              )
            })}
          </div>
        </section>
      )}

      {canEdit && benched && dismissed !== lastGame && (
        <Sheet title="Handover time" onClose={() => setDismissed(lastGame)}>
          <p className="text-lg font-semibold text-loss">{cur.name} has lost {streak} in a row</p>
          <p className="mt-2 text-mute">That’s three. {next.name} takes over as Coach.</p>
          <div className="mt-5 flex gap-2">
            <Btn variant="primary" className="flex-1" onClick={appoint}>Appoint {next.name} as Coach</Btn>
            <Btn onClick={() => setDismissed(lastGame)}>Not now</Btn>
          </div>
        </Sheet>
      )}

      {upcoming.length > 0 && (
        <section>
          <SectionTitle>Next games</SectionTitle>
          {playoff && <p className="mb-3 text-sm text-mute"><b className="text-gold">Playoffs {playoff.end ? `until ${fmtShort(playoff.end)}` : `from ${fmtShort(playoff.date)}`}.</b> {playoff.end ? '' : 'End date not set yet. '}The Coach keeps the team until they finish.</p>}
          <Card className="divide-y divide-hair overflow-hidden">
            {upcoming.map((m) => <Row key={m.date} m={m} playoffs={!!playoffsOn(state, m.date)} />)}
          </Card>
        </section>
      )}

      {!state.seasons.length && cur && (
        <Card className="p-4 text-sm text-mute">Add the season dates in Settings so the app knows when {next ? next.name : 'the next player'} takes over.</Card>
      )}
    </div>
  )
}

function Row({ m, playoffs }: { m: Match; playoffs: boolean }) {
  return (
    <div className={`flex items-center gap-4 px-5 py-4 ${playoffs ? 'border-l-4 border-gold bg-gold/10' : ''}`}>
      <div className="w-12 shrink-0">
        <p className="font-display text-3xl leading-none">{fmtDay(m.date)}</p>
        <p className="mt-1 text-xs uppercase tracking-wide text-mute">{fmtMon(m.date)}</p>
      </div>
      {m.controller && <Avatar m={m.controller} size={40} />}
      <div className="min-w-0 flex-1"><p className="truncate font-medium">{m.controller ? m.controller.name : ''}</p><p className="text-sm text-mute">{fmtWeekday(m.date)}</p></div>
      <span className="flex shrink-0 flex-col items-end gap-1 text-sm text-mute">{playoffs && <Pill tone="gold">Playoffs</Pill>}{when(m.date)}</span>
    </div>
  )
}
