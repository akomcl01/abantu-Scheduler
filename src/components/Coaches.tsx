import { useState } from 'react'
import { careerFor, coachGames, compOf, controllerFor, tally, todayStr, winRate, type Comp, type Member, type ScheduleState } from '../lib/rotation'
import PlayerCard from './PlayerCard'
import { Avatar, Btn, Card, Icon, ICONS, Pill, RateChip, RecordBar, ResultChip, Segmented, Sheet } from './ui'

type Filter = 'all' | Comp

/** Coach league table: ranked by win rate, with form (last five). */
export function CoachTable({ state, onOpen }: { state: ScheduleState; onOpen: (m: Member) => void }) {
  const [f, setF] = useState<Filter>('all')
  const by = coachGames(state)
  const nowId = controllerFor(state, todayStr())?.id
  const rows = state.members
    .map((m) => {
      const games = (by.get(m.id) ?? []).filter((g) => f === 'all' || compOf(g) === f)
      const t = tally(games)
      return { m, t, n: games.length, pct: winRate(t), form: games.slice(-5) }
    })
    .sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1) || b.t.w - a.t.w || b.n - a.n)

  return (
    <div className="space-y-4">
      <Segmented<Filter> label="Competition" value={f} onChange={setF} options={[{ id: 'all', label: 'All' }, { id: 'league', label: 'League' }, { id: 'playoff', label: 'Playoffs' }]} />
      <Card className="overflow-hidden">
        <div className="grid grid-cols-[1.5rem_1fr_2rem_2rem_2rem_3.5rem] items-center gap-x-2 border-b border-hair px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-mute">
          <span>#</span><span>Coach</span><span className="text-center">W</span><span className="text-center">D</span><span className="text-center">L</span><span className="text-center">Win</span>
        </div>
        {rows.map(({ m, t, n, pct, form }, i) => (
          <button key={m.id} onClick={() => onOpen(m)} className="grid w-full grid-cols-[1.5rem_1fr_2rem_2rem_2rem_3.5rem] items-center gap-x-2 border-b border-hair px-4 py-3 text-left last:border-0 hover:bg-sand/60">
            <span className="font-display text-xl leading-none text-mute">{i + 1}</span>
            <span className="flex min-w-0 items-center gap-3">
              <Avatar m={m} size={34} ring={m.id === nowId} />
              <span className="min-w-0">
                <span className="block truncate font-medium">{m.name}</span>
                <span className="mt-1 flex items-center gap-1">
                  {form.length ? form.map((g) => <ResultChip key={g.id} r={g.result} size={16} />) : <span className="text-xs text-mute">No games</span>}
                </span>
              </span>
            </span>
            <span className="text-center font-semibold text-win">{t.w}</span>
            <span className="text-center text-mute">{t.d}</span>
            <span className="text-center font-semibold text-loss">{t.l}</span>
            <span className="text-center">{n ? <RateChip pct={pct} /> : <RateChip pct={null} />}</span>
          </button>
        ))}
      </Card>
      <p className="px-1 text-xs text-mute">Ranked by win rate. Games count for whoever was coach at the time. Tap a coach for their career.</p>
    </div>
  )
}

/** One coach: card, overall record and a season-by-season career. */
export function CoachSheet({ state, m, onClose, onEdit }: { state: ScheduleState; m: Member; onClose: () => void; onEdit: () => void }) {
  const games = coachGames(state).get(m.id) ?? []
  const t = tally(games)
  const career = careerFor(state, m.id)
  const nowId = controllerFor(state, todayStr())?.id
  return (
    <Sheet title={m.name} onClose={onClose}>
      <div className="flex items-start gap-4">
        <PlayerCard m={m} className="w-28 shrink-0" />
        <div className="min-w-0 flex-1">
          {m.id === nowId && <Pill tone="accent">Coaching now</Pill>}
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-mute">Overall record</p>
          <p className="mt-1 font-display text-4xl leading-none"><span className="text-win">{t.w}</span> <span className="text-mute">{t.d}</span> <span className="text-loss">{t.l}</span></p>
          <div className="mt-3"><RecordBar {...t} /></div>
          <p className="mt-2 text-sm text-mute">{games.length} game{games.length === 1 ? '' : 's'} · <b className="text-ink">{winRate(t) ?? 0}%</b> wins</p>
        </div>
      </div>

      <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-mute">Career</p>
      {career.length === 0 ? <p className="text-sm text-mute">No games as coach yet.</p> : (
        <div className="divide-y divide-hair overflow-hidden rounded-2xl border border-hair">
          {career.map((c) => (
            <div key={c.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{c.name}</p>
                <p className="text-sm text-mute">League {c.league.w}-{c.league.d}-{c.league.l}{c.playoff.w + c.playoff.d + c.playoff.l > 0 && <span className="text-gold"> · Playoffs {c.playoff.w}-{c.playoff.d}-{c.playoff.l}</span>}</p>
              </div>
              <RateChip pct={winRate(c.all)} />
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 flex gap-2">
        <Btn onClick={onEdit} className="flex-1"><Icon d={ICONS.gear} size={18} />Edit card</Btn>
        <Btn onClick={onClose}>Close</Btn>
      </div>
    </Sheet>
  )
}
