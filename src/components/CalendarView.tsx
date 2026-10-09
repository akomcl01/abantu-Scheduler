import { useMemo, useState } from 'react'
import { addDays, controllerFor, dow, fmtDate, parseDate, todayStr, type ScheduleState } from '../lib/rotation'
import { Avatar, Btn, Icon, ICONS, Pill, SectionTitle, Sheet, fmtDay, fmtLong, fmtMonth, fmtYear } from './ui'

interface Props { state: ScheduleState; canEdit: boolean; onChange: (s: ScheduleState) => void; onNeedUnlock: () => void }

export default function CalendarView({ state, canEdit, onChange, onNeedUnlock }: Props) {
  const today = todayStr()
  const [cursor, setCursor] = useState(today.slice(0, 7))
  const [selected, setSelected] = useState<string | null>(null)
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
            const c = w === 0 && inMonth ? controllerFor(state, d) : null
            const match = inMonth && (w === 0 || w === 3)
            const isToday = d === today
            return (
              <button key={d} disabled={!match} onClick={() => setSelected(d)} aria-label={fmtLong(d)}
                className={`flex h-14 flex-col items-center justify-start gap-1 rounded-2xl pt-1.5 transition sm:h-20 ${match ? 'hover:bg-sand' : ''} ${inMonth ? '' : 'opacity-30'}`}>
                <span className={`grid size-7 place-items-center rounded-full text-sm ${isToday ? 'bg-white font-semibold text-[#0D0F11]' : w === 0 || w === 3 ? 'font-semibold' : 'text-mute'}`}>{fmtDay(d)}</span>
                {c && <Avatar m={c} size={22} />}
                {inMonth && w === 0 && !c && state.skipped.includes(d) && <span className="text-[10px] text-mute">off</span>}
                {inMonth && w === 3 && <span className="size-1.5 rounded-full bg-accent" />}
              </button>
            )
          })}
        </div>
        <div className="mt-3 flex items-center gap-4 border-t border-hair px-2 pt-3 text-xs text-mute">
          <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-accent" />Wednesday group night</span>
          <span>Sundays show who’s up</span>
        </div>
      </div>

      <section>
        <SectionTitle>Sundays this month</SectionTitle>
        <div className="divide-y divide-hair overflow-hidden rounded-[28px] border border-hair bg-card">
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

      {selected && <DaySheet date={selected} state={state} canEdit={canEdit} onChange={onChange} onNeedUnlock={onNeedUnlock} onClose={() => setSelected(null)} />}
    </div>
  )
}

function DaySheet({ date, state, canEdit, onChange, onNeedUnlock, onClose }: Props & { date: string; onClose: () => void }) {
  const sunday = dow(date) === 0
  const c = controllerFor(state, date)
  const skipped = state.skipped.includes(date)
  const set = (patch: Partial<ScheduleState>) => onChange({ ...state, ...patch })
  const guard = (fn: () => void) => () => (canEdit ? fn() : onNeedUnlock())

  return (
    <Sheet title={fmtLong(date)} onClose={onClose}>
      {!sunday ? (
        <p className="text-mute">Group night. Everyone plays, no turns to take.</p>
      ) : (
        <>
          <div className="mb-5 flex items-center gap-3 rounded-2xl bg-sand p-3">
            {c ? <><Avatar m={c} size={48} /><div><p className="text-xs text-mute">On the sticks</p><p className="text-lg font-semibold">{c.name}</p></div></> : <p className="px-1 text-mute">{skipped ? 'No game this Sunday.' : 'No one scheduled.'}</p>}
          </div>
          {!skipped && (
            <>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-mute">Swap for this day</p>
              <div className="mb-5 flex flex-wrap gap-2">
                {state.members.filter((m) => m.active).map((m) => (
                  <button key={m.id} onClick={guard(() => { set({ overrides: { ...state.overrides, [date]: m.id } }); onClose() })}
                    className={`flex min-h-11 items-center gap-2 rounded-full border py-1 pl-1.5 pr-4 text-sm font-medium ${c?.id === m.id ? 'border-accent bg-accent/15 text-white' : 'border-hair hover:bg-sand'}`}>
                    <Avatar m={m} size={28} />{m.name}
                  </button>
                ))}
              </div>
            </>
          )}
          <div className="flex flex-wrap gap-2">
            {state.overrides[date] && <Btn onClick={guard(() => { const o = { ...state.overrides }; delete o[date]; set({ overrides: o }); onClose() })}>Undo swap</Btn>}
            <Btn onClick={guard(() => { set({ skipped: skipped ? state.skipped.filter((s) => s !== date) : [...state.skipped, date] }); onClose() })}>
              {skipped ? 'Restore game' : 'Skip this Sunday'}
            </Btn>
          </div>
          {!canEdit && <p className="mt-4 text-sm text-mute">Unlock editing to change the schedule.</p>}
        </>
      )}
    </Sheet>
  )
}
