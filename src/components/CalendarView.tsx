import { useMemo, useState } from 'react'
import { addDays, controllerFor, dow, fmtDate, parseDate, todayStr, type ScheduleState } from '../lib/rotation'
import { Avatar, Btn, Pill, Sheet, fmtLong, fmtMonth } from './ui'

interface Props { state: ScheduleState; canEdit: boolean; onChange: (s: ScheduleState) => void; onNeedUnlock: () => void }

export default function CalendarView({ state, canEdit, onChange, onNeedUnlock }: Props) {
  const today = todayStr()
  const [cursor, setCursor] = useState(today.slice(0, 7)) // YYYY-MM
  const [selected, setSelected] = useState<string | null>(null)

  const cells = useMemo(() => {
    const first = `${cursor}-01`
    const start = addDays(first, -dow(first))
    return Array.from({ length: 42 }, (_, i) => addDays(start, i))
  }, [cursor])
  const shift = (n: number) => {
    const d = parseDate(`${cursor}-01`)
    d.setUTCMonth(d.getUTCMonth() + n)
    setCursor(fmtDate(d).slice(0, 7))
  }
  const matchDays = cells.filter((d) => d.startsWith(cursor) && [0, 3].includes(dow(d)))

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">{fmtMonth(`${cursor}-01`)}</h1>
        <div className="flex gap-2">
          <Btn onClick={() => setCursor(today.slice(0, 7))} className="hidden sm:inline-flex">Today</Btn>
          <Btn onClick={() => shift(-1)} aria-label="Previous month" className="!px-0 w-11">‹</Btn>
          <Btn onClick={() => shift(1)} aria-label="Next month" className="!px-0 w-11">›</Btn>
        </div>
      </div>

      {/* Month grid (tablet/desktop) */}
      <div className="hidden overflow-hidden rounded-3xl border border-line bg-turf sm:block">
        <div className="grid grid-cols-7 border-b border-line text-center text-xs font-semibold uppercase tracking-wider text-mute">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d} className="py-3">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((d) => {
            const inMonth = d.startsWith(cursor)
            const w = dow(d)
            const c = w === 0 ? controllerFor(state, d) : null
            const match = w === 0 || w === 3
            return (
              <button key={d} disabled={!match || !inMonth} onClick={() => setSelected(d)}
                className={`min-h-24 border-b border-r border-line p-2 text-left align-top transition enabled:hover:bg-line/50 ${inMonth ? '' : 'opacity-25'}`}>
                <span className={`inline-grid size-7 place-items-center rounded-full text-sm ${d === today ? 'bg-lime font-bold text-pitch' : 'text-mute'}`}>{Number(d.slice(8))}</span>
                {inMonth && w === 0 && (state.skipped.includes(d) ? <p className="mt-2 text-xs text-mute">No game</p> : c && (
                  <div className="mt-2 flex items-center gap-1.5"><Avatar m={c} size={22} /><span className="truncate text-xs font-semibold">{c.name}</span></div>
                ))}
                {inMonth && w === 3 && <p className="mt-2 text-xs font-medium text-lime">Group night</p>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Agenda (mobile) */}
      <ul className="space-y-2 sm:hidden">
        {matchDays.map((d) => {
          const c = controllerFor(state, d)
          return (
            <li key={d}>
              <button onClick={() => setSelected(d)} className={`flex min-h-16 w-full items-center gap-4 rounded-2xl border bg-turf px-4 py-3 text-left ${d === today ? 'border-lime' : 'border-line'}`}>
                <div className="w-12 text-center"><p className="text-xs uppercase text-mute">{dow(d) === 0 ? 'Sun' : 'Wed'}</p><p className="font-display text-xl font-bold">{Number(d.slice(8))}</p></div>
                {dow(d) === 3 ? <p className="font-semibold text-lime">Group night</p> : state.skipped.includes(d) ? <p className="text-mute">No game</p> : c ? (
                  <><Avatar m={c} /><div className="min-w-0"><p className="truncate font-semibold">{c.name}</p><p className="truncate text-sm text-mute">{c.team}</p></div></>
                ) : <p className="text-mute">Before rotation start</p>}
              </button>
            </li>
          )
        })}
      </ul>

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
        <p className="text-mute">Wednesday group night — everyone plays, no turns.</p>
      ) : (
        <>
          <div className="mb-5 flex items-center gap-3">
            {c ? <><Avatar m={c} size={52} /><div><p className="font-display text-xl font-bold">{c.name}</p><p className="text-mute">{c.team}</p></div></> : <p className="text-mute">{skipped ? 'No game this Sunday.' : 'No one scheduled.'}</p>}
          </div>
          {state.overrides[date] && <div className="mb-3"><Pill>Swapped</Pill></div>}
          {!skipped && (
            <>
              <p className="mb-2 text-sm font-semibold text-mute">Swap for this day</p>
              <div className="mb-4 flex flex-wrap gap-2">
                {state.members.filter((m) => m.active).map((m) => (
                  <button key={m.id} onClick={guard(() => { set({ overrides: { ...state.overrides, [date]: m.id } }); onClose() })}
                    className={`flex min-h-11 items-center gap-2 rounded-full border px-3 text-sm ${c?.id === m.id ? 'border-lime' : 'border-line hover:bg-line/60'}`}>
                    <Avatar m={m} size={24} />{m.name}
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
