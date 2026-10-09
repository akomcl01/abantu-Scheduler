import { useMemo, useState } from 'react'
import { addDays, controllerFor, dow, fmtDate, nowStr, parseDate, seasonOn, tally, todayStr, type GameEvent, type Result, type ScheduleState } from '../lib/rotation'
import { Avatar, Btn, Icon, ICONS, ResultButtons, ResultChip, SectionTitle, Sheet, fmtDay, fmtLong, fmtMonth, fmtShort, fmtYear } from './ui'

interface Props { state: ScheduleState; canEdit: boolean; onChange: (s: ScheduleState) => void; onNeedUnlock: () => void }

export default function CalendarView({ state, canEdit, onChange, onNeedUnlock }: Props) {
  const today = todayStr()
  const [cursor, setCursor] = useState(today.slice(0, 7))
  const [selected, setSelected] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const events = state.events ?? []
  const first = `${cursor}-01`
  const guard = (fn: () => void) => () => (canEdit ? fn() : onNeedUnlock())

  const cells = useMemo(() => {
    const start = addDays(first, -((dow(first) + 6) % 7)) // Monday-first
    return Array.from({ length: 42 }, (_, i) => addDays(start, i)).filter((_, i, a) => i < 35 || a[35].startsWith(cursor))
  }, [first, cursor])
  const shift = (n: number) => {
    const d = parseDate(first)
    d.setUTCMonth(d.getUTCMonth() + n)
    setCursor(fmtDate(d).slice(0, 7))
  }
  const monthEvents = events.filter((e) => e.date.startsWith(cursor)).sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <h1 className="font-display text-5xl leading-[0.95] sm:text-7xl">{fmtMonth(first)} <span className="text-mute">{fmtYear(first)}</span></h1>
        <div className="flex gap-2">
          <Btn onClick={() => shift(-1)} aria-label="Previous month" className="!px-0 w-11"><Icon d={ICONS.left} /></Btn>
          <Btn onClick={() => shift(1)} aria-label="Next month" className="!px-0 w-11"><Icon d={ICONS.right} /></Btn>
        </div>
      </div>

      <div className="rounded-2xl border border-hair bg-card p-3 sm:p-5">
        <div className="mb-2 grid grid-cols-7 text-center text-[11px] font-semibold uppercase tracking-wider text-mute">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <div key={d} className="py-2">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((d) => {
            const inMonth = d.startsWith(cursor)
            const w = dow(d)
            const match = inMonth && (w === 0 || w === 3)
            const c = match ? controllerFor(state, d) : null
            const t = tally(state.games.filter((g) => g.date === d))
            const played = t.w + t.d + t.l > 0
            const ev = inMonth ? events.filter((e) => e.date === d) : []
            const clickable = match || ev.length > 0
            return (
              <button key={d} disabled={!clickable} onClick={() => setSelected(d)} aria-label={fmtLong(d)}
                className={`relative flex h-14 flex-col items-center justify-start gap-1 rounded-2xl pt-1.5 transition sm:h-20 ${clickable ? 'hover:bg-sand' : ''} ${inMonth ? '' : 'opacity-30'}`}>
                <span className={`grid size-7 place-items-center rounded-full text-sm ${d === today ? 'bg-ink font-semibold text-paper' : match ? 'font-semibold' : 'text-mute'}`}>{fmtDay(d)}</span>
                {c && <Avatar m={c} size={22} />}
                {played && <span className={`absolute left-1 top-1 text-[10px] font-bold ${t.w > t.l ? 'text-win' : t.l > t.w ? 'text-loss' : 'text-mute'}`}>{t.w}-{t.l}</span>}
                {ev.length > 0 && <span className="absolute right-1 top-1 text-gold" title={ev[0].title}><Icon d={ICONS.trophy} size={14} /></span>}
              </button>
            )
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-hair px-2 pt-3 text-xs text-mute">
          <span>Wed + Sun games</span>
          <span>Small numbers: wins-losses that day</span>
          <span className="flex items-center gap-1 text-gold"><Icon d={ICONS.trophy} size={13} />Playoffs</span>
        </div>
      </div>

      <section>
        <SectionTitle>Seasons</SectionTitle>
        <div className="divide-y divide-hair overflow-hidden rounded-2xl border border-hair bg-card">
          {state.seasons.length === 0 && <p className="px-5 py-4 text-sm text-mute">Add the season dates in Settings to see who plays each one.</p>}
          {[...state.seasons].sort((a, b) => a.start.localeCompare(b.start)).map((s) => {
            const c = controllerFor(state, s.start > state.startDate ? s.start : state.startDate)
            const live = seasonOn(state, today)?.id === s.id
            return (
              <div key={s.id} className="flex items-center gap-4 px-5 py-4">
                {c ? <Avatar m={c} size={40} ring={live} /> : <span className="size-10 rounded-full bg-sand" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{c?.name ?? 'Not started'}</p>
                  <p className="text-sm text-mute">{s.name} · {fmtShort(s.start)} to {fmtShort(s.end)}</p>
                </div>
                {live && <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-on-accent">Now</span>}
              </div>
            )
          })}
        </div>
      </section>

      <section>
        <SectionTitle aside={<button onClick={guard(() => setAdding(true))} className="flex min-h-9 items-center gap-1.5 text-xs font-semibold text-gold"><Icon d={ICONS.plus} size={14} />Add playoffs</button>}>Playoffs &amp; events</SectionTitle>
        <div className="divide-y divide-hair overflow-hidden rounded-2xl border border-hair bg-card">
          {monthEvents.length === 0 && <p className="px-5 py-4 text-sm text-mute">Nothing added for {fmtMonth(first)}. When the Clubs playoffs are announced, add the date here.</p>}
          {monthEvents.map((e) => (
            <button key={e.id} onClick={() => setSelected(e.date)} className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-sand/60">
              <span className="w-8 font-display text-3xl leading-none">{fmtDay(e.date)}</span>
              <span className="grid size-9 place-items-center rounded-full bg-gold/15 text-gold"><Icon d={ICONS.trophy} size={18} /></span>
              <span className="min-w-0 flex-1"><span className="block truncate font-medium">{e.title}</span><span className="block text-sm text-mute">{fmtShort(e.date)}</span></span>
              <Icon d={ICONS.right} size={18} className="text-mute" />
            </button>
          ))}
        </div>
      </section>

      {adding && <AddEvent onClose={() => setAdding(false)} onSave={(e) => { onChange({ ...state, events: [...events, e] }); setCursor(e.date.slice(0, 7)); setAdding(false) }} />}
      {selected && <DaySheet date={selected} state={state} canEdit={canEdit} onChange={onChange} onNeedUnlock={onNeedUnlock} onClose={() => setSelected(null)} />}
    </div>
  )
}

function DaySheet({ date, state, canEdit, onChange, onNeedUnlock, onClose }: Props & { date: string; onClose: () => void }) {
  const dayEvents = (state.events ?? []).filter((e) => e.date === date)
  const isMatch = dow(date) === 0 || dow(date) === 3
  const c = isMatch ? controllerFor(state, date) : null
  const season = seasonOn(state, date)
  const played = date <= todayStr()
  const guard = (fn: () => void) => () => (canEdit ? fn() : onNeedUnlock())
  const dayGames = state.games.filter((g) => g.date === date).sort((a, b) => a.at.localeCompare(b.at))
  const addGame = (result: Result) => onChange({ ...state, games: [...state.games, { id: crypto.randomUUID(), at: date === todayStr() ? nowStr() : `${date}T23:00:00`, date, result }] })
  const removeGame = (id: string) => onChange({ ...state, games: state.games.filter((g) => g.id !== id) })

  return (
    <Sheet title={fmtLong(date)} onClose={onClose}>
      {dayEvents.map((e) => (
        <div key={e.id} className="mb-4 flex items-center gap-3 rounded-2xl border border-gold/50 bg-gold/10 p-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gold/20 text-gold"><Icon d={ICONS.trophy} size={20} /></span>
          <p className="min-w-0 flex-1 truncate font-semibold">{e.title}</p>
          <Btn variant="danger" onClick={guard(() => { onChange({ ...state, events: (state.events ?? []).filter((x) => x.id !== e.id) }); onClose() })}>Remove</Btn>
        </div>
      ))}
      {isMatch && (
        <>
          <div className="mb-5 flex items-center gap-3 rounded-2xl bg-sand p-3">
            {c ? <><Avatar m={c} size={48} /><div><p className="text-xs text-mute">On the sticks{season ? ` · ${season.name}` : ''}</p><p className="text-lg font-semibold">{c.name}</p></div></> : <p className="px-1 text-mute">Before the rotation starts.</p>}
          </div>
          {c && (played ? (
            <>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-mute">Games {dayGames.length > 0 && <span className="normal-case tracking-normal">· tap one to remove it</span>}</p>
              {dayGames.length === 0 ? <p className="mb-4 text-sm text-mute">Nothing logged.</p> : (
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {dayGames.map((g) => <button key={g.id} aria-label={`Remove ${g.result}`} onClick={guard(() => removeGame(g.id))}><ResultChip r={g.result} size={32} /></button>)}
                </div>
              )}
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-mute">Add a game</p>
              <ResultButtons onPick={(r) => (canEdit ? addGame(r) : onNeedUnlock())} />
            </>
          ) : <p className="text-sm text-mute">You can log games once they’re played.</p>)}
        </>
      )}
      {!canEdit && <p className="mt-4 text-sm text-mute">Unlock editing to change the schedule.</p>}
    </Sheet>
  )
}

function AddEvent({ onSave, onClose }: { onSave: (e: GameEvent) => void; onClose: () => void }) {
  const [date, setDate] = useState(todayStr())
  const [title, setTitle] = useState('Clubs playoffs')
  const field = 'mt-2 min-h-12 w-full rounded-xl border border-hair bg-paper px-4'
  return (
    <Sheet title="Add playoffs" onClose={onClose}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (date && title.trim()) onSave({ id: crypto.randomUUID(), date, title: title.trim() }) }}>
        <label className="block text-sm font-medium">What
          <input className={field} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Clubs playoffs" />
        </label>
        <label className="block text-sm font-medium">Date
          <input type="date" className={field} value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <Btn type="submit" variant="primary" className="w-full">Add to calendar</Btn>
      </form>
    </Sheet>
  )
}
