import { useMemo, useState } from 'react'
import { addDays, controllerFor, dow, fmtDate, parseDate, todayStr, type GameEvent, type ScheduleState } from '../lib/rotation'
import { Avatar, Btn, Icon, ICONS, Pill, SectionTitle, Sheet, fmtDay, fmtLong, fmtMonth, fmtShort, fmtYear } from './ui'

interface Props { state: ScheduleState; canEdit: boolean; onChange: (s: ScheduleState) => void; onNeedUnlock: () => void }

export default function CalendarView({ state, canEdit, onChange, onNeedUnlock }: Props) {
  const today = todayStr()
  const [cursor, setCursor] = useState(today.slice(0, 7))
  const [selected, setSelected] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const events = state.events ?? []
  const eventOn = (d: string) => events.filter((e) => e.date === d)
  const monthEvents = events.filter((e) => e.date.startsWith(cursor)).sort((a, b) => a.date.localeCompare(b.date))
  const guard = (fn: () => void) => () => (canEdit ? fn() : onNeedUnlock())
  const first = `${cursor}-01`

  const cells = useMemo(() => {
    const start = addDays(first, -((dow(first) + 6) % 7)) // Monday-first
    return Array.from({ length: 42 }, (_, i) => addDays(start, i)).filter((_, i, a) => i < 35 || a[35].startsWith(cursor))
  }, [first, cursor])
  const shift = (n: number) => {
    const d = parseDate(first)
    d.setUTCMonth(d.getUTCMonth() + n)
    setCursor(fmtDate(d).slice(0, 7))
  }
  const sundays = cells.filter((d) => d.startsWith(cursor) && dow(d) === 0)

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <h1 className="font-display text-5xl leading-[0.95] sm:text-7xl">{fmtMonth(first)} <span className="text-mute">{fmtYear(first)}</span></h1>
        <div className="flex gap-2">
          <Btn onClick={guard(() => setAdding(true))} className="hidden sm:inline-flex"><Icon d={ICONS.trophy} size={18} />Playoffs</Btn>
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
            const c = (w === 0 || w === 3) && inMonth ? controllerFor(state, d) : null
            const match = inMonth && (w === 0 || w === 3)
            const isToday = d === today
            const ev = inMonth ? eventOn(d) : []
            const clickable = match || ev.length > 0
            return (
              <button key={d} disabled={!clickable} onClick={() => setSelected(d)} aria-label={fmtLong(d)}
                className={`flex h-14 flex-col items-center justify-start gap-1 relative rounded-2xl pt-1.5 transition sm:h-20 ${clickable ? 'hover:bg-sand' : ''} ${inMonth ? '' : 'opacity-30'}`}>
                <span className={`grid size-7 place-items-center rounded-full text-sm ${isToday ? 'bg-ink font-semibold text-paper' : w === 0 || w === 3 ? 'font-semibold' : 'text-mute'}`}>{fmtDay(d)}</span>
                {c && <Avatar m={c} size={22} />}
                {ev.length > 0 && <span className="absolute right-1 top-1 text-gold" title={ev[0].title}><Icon d={ICONS.trophy} size={14} /></span>}
                {inMonth && match && !c && state.skipped.includes(w === 3 ? addDays(d, 4) : d) && <span className="text-[10px] text-mute">off</span>}
              </button>
            )
          })}
        </div>
        <div className="mt-3 flex items-center gap-4 border-t border-hair px-2 pt-3 text-xs text-mute">
          <span>Wednesday and Sunday: same player both nights</span>
          <span className="flex items-center gap-1 text-gold"><Icon d={ICONS.trophy} size={13} />Playoffs</span>
        </div>
      </div>

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

      <section>
        <SectionTitle>Who’s up this month</SectionTitle>
        <div className="divide-y divide-hair overflow-hidden rounded-2xl border border-hair bg-card">
          {sundays.map((d) => {
            const c = controllerFor(state, d)
            return (
              <button key={d} onClick={() => setSelected(d)} className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-sand/60">
                <span className="w-8 font-display text-3xl leading-none">{fmtDay(d)}</span>
                {c ? <><Avatar m={c} size={36} /><span className="flex-1 font-medium">{c.name}</span></> : <span className="flex-1 text-mute">{state.skipped.includes(d) ? 'No game' : 'Before rotation start'}</span>}
                {state.overrides[d] && <Pill>Swapped</Pill>}
                <Icon d={ICONS.right} size={18} className="text-mute" />
              </button>
            )
          })}
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
  const key = dow(date) === 3 ? addDays(date, 4) : date // swaps/skips live on the Sunday and cover that week's Wed + Sun
  const c = controllerFor(state, key)
  const skipped = state.skipped.includes(key)
  const set = (patch: Partial<ScheduleState>) => onChange({ ...state, ...patch })
  const guard = (fn: () => void) => () => (canEdit ? fn() : onNeedUnlock())

  return (
    <Sheet title={fmtLong(date)} onClose={onClose}>
      {dayEvents.map((e) => (
        <div key={e.id} className="mb-4 flex items-center gap-3 rounded-2xl border border-gold/50 bg-gold/10 p-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gold/20 text-gold"><Icon d={ICONS.trophy} size={20} /></span>
          <p className="min-w-0 flex-1 truncate font-semibold">{e.title}</p>
          <Btn variant="danger" onClick={guard(() => { onChange({ ...state, events: (state.events ?? []).filter((x) => x.id !== e.id) }); onClose() })}>Remove</Btn>
        </div>
      ))}
      {isMatch && <>
      <div className="mb-5 flex items-center gap-3 rounded-2xl bg-sand p-3">
        {c ? <><Avatar m={c} size={48} /><div><p className="text-xs text-mute">On the sticks</p><p className="text-lg font-semibold">{c.name}</p></div></> : <p className="px-1 text-mute">{skipped ? 'No games this week.' : 'No one scheduled.'}</p>}
      </div>
      <p className="mb-4 text-sm text-mute">Changes apply to both nights that week ({fmtShort(addDays(key, -4))} + {fmtShort(key)}).</p>
      {!skipped && (
        <>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-mute">Swap for this week</p>
          <div className="mb-5 flex flex-wrap gap-2">
            {state.members.filter((m) => m.active).map((m) => (
              <button key={m.id} onClick={guard(() => { set({ overrides: { ...state.overrides, [key]: m.id } }); onClose() })}
                className={`flex min-h-11 items-center gap-2 rounded-full border py-1 pl-1.5 pr-4 text-sm font-medium ${c?.id === m.id ? 'border-accent bg-accent/15 text-ink' : 'border-hair hover:bg-sand'}`}>
                <Avatar m={m} size={28} />{m.name}
              </button>
            ))}
          </div>
        </>
      )}
      <div className="flex flex-wrap gap-2">
        {state.overrides[key] && <Btn onClick={guard(() => { const o = { ...state.overrides }; delete o[key]; set({ overrides: o }); onClose() })}>Undo swap</Btn>}
        <Btn onClick={guard(() => { set({ skipped: skipped ? state.skipped.filter((s) => s !== key) : [...state.skipped, key] }); onClose() })}>
          {skipped ? 'Restore week' : 'Skip this week'}
        </Btn>
      </div>
      </>}
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
