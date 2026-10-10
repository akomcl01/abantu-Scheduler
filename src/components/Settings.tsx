import { useState, type ReactNode } from 'react'
import { isShared } from '../lib/store'
import { buildStints, controllerFor, todayStr, who, type ScheduleState } from '../lib/rotation'
import { Avatar, Btn, Card, Icon, ICONS, SectionTitle, Sheet, fmtShort } from './ui'

interface Props { state: ScheduleState; canEdit: boolean; onChange: (s: ScheduleState) => void; onNeedUnlock: () => void; onLock: () => void; theme: 'fc' | 'classic'; onTheme: (t: 'fc' | 'classic') => void; onReplay?: () => void }

const Row = ({ title, desc, children }: { title: string; desc: string; children?: ReactNode }) => (
  <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
    <div className="max-w-md"><h2 className="font-medium">{title}</h2><p className="text-sm text-mute">{desc}</p></div>
    {children}
  </div>
)

export default function Settings({ state, canEdit, onChange, onNeedUnlock, onLock, theme, onTheme, onReplay }: Props) {
  const [copied, setCopied] = useState(false)
  const [addingSeason, setAddingSeason] = useState(false)
  const [addingHandover, setAddingHandover] = useState(false)
  const stints = buildStints(state)
  const handovers = [...new Set(state.benches)].sort().map((at) => {
    const i = stints.findIndex((st) => st.reason === 'benched' && st.at === at)
    return { at, ignored: i < 1, from: i > 0 ? state.members.find((m) => m.id === stints[i - 1].memberId) : undefined, to: i > 0 ? state.members.find((m) => m.id === stints[i].memberId) : undefined }
  })
  const seasons = [...state.seasons].sort((a, b) => a.start.localeCompare(b.start))
  const guard = (fn: () => void) => () => (canEdit ? fn() : onNeedUnlock())
  return (
    <div className="space-y-8">
      <h1 className="font-display text-5xl leading-[0.95] sm:text-7xl">Settings</h1>
      <Card className="divide-y divide-hair overflow-hidden">
        <Row title="First player starts" desc="The day the first player in the squad takes over. Everyone after follows in squad order.">
          <input type="date" value={state.startDate} className="min-h-11 rounded-2xl border border-hair bg-paper px-4"
            onChange={(e) => { const v = e.target.value; if (v) guard(() => onChange({ ...state, startDate: v }))() }} />
        </Row>
        <Row title="Look" desc="FC is the dark game-menu style. Classic is the warm paper style.">
          <div className="flex gap-1 rounded-full bg-sand p-1" role="group" aria-label="Look">
            {(['fc', 'classic'] as const).map((t) => (
              <button key={t} onClick={() => onTheme(t)} aria-pressed={theme === t}
                className={`min-h-10 rounded-full px-5 text-sm font-semibold ${theme === t ? 'bg-ink text-paper' : 'text-mute'}`}>{t === 'fc' ? 'FC' : 'Classic'}</button>
            ))}
          </div>
        </Row>
        {onReplay && <Row title="Handover ceremony" desc="Watch the latest Coach change again: the thank-you and the contract."><Btn onClick={onReplay}>Replay</Btn></Row>}
        <Row title="How it works" desc="One player has the team for a whole season, on Wednesdays and Sundays. If they lose 3 in a row, the next player takes over early." />
        <Row title="Share" desc={isShared ? 'Anyone with this link sees the live schedule.' : 'Saved on this device only for now. Publish the site to share it with the group.'}>
          <Btn onClick={() => { navigator.clipboard?.writeText(location.href); setCopied(true); setTimeout(() => setCopied(false), 1500) }}>{copied ? 'Copied' : 'Copy link'}</Btn>
        </Row>
        {isShared && (
          <Row title="Editing" desc={canEdit ? 'Editing is unlocked on this device.' : 'Enter the group PIN to make changes.'}>
            {canEdit ? <Btn onClick={onLock}>Lock editing</Btn> : <Btn variant="primary" onClick={onNeedUnlock}>Unlock</Btn>}
          </Row>
        )}
      </Card>

      <section>
        <SectionTitle aside={<button onClick={guard(() => setAddingSeason(true))} className="flex min-h-9 items-center gap-1.5 text-xs font-semibold text-gold"><Icon d={ICONS.plus} size={14} />Add season</button>}>Seasons</SectionTitle>
        <Card className="divide-y divide-hair overflow-hidden">
          {seasons.length === 0 && <p className="p-5 text-sm text-mute">No seasons yet. Add each FC27 season with its start and end date. A new season hands the team to the next player.</p>}
          {seasons.map((x) => {
            const c = controllerFor(state, x.start > state.startDate ? x.start : state.startDate)
            return (
              <div key={x.id} className="flex items-center gap-4 px-5 py-4">
                {c ? <Avatar m={c} size={36} /> : <span className="size-9 rounded-full bg-sand" />}
                <div className="min-w-0 flex-1"><p className="truncate font-medium">{x.name}</p><p className="text-sm text-mute">{fmtShort(x.start)} to {fmtShort(x.end)}{c ? ` · ${c.name}` : ''}</p></div>
                <button aria-label={`Remove ${x.name}`} onClick={guard(() => onChange({ ...state, seasons: state.seasons.filter((y) => y.id !== x.id) }))} className="grid size-10 place-items-center rounded-full text-mute hover:bg-sand"><Icon d="M6 6l12 12M18 6L6 18" size={18} /></button>
              </div>
            )
          })}
        </Card>
      </section>

      <section>
        <SectionTitle aside={<button onClick={guard(() => setAddingHandover(true))} className="flex min-h-9 items-center gap-1.5 text-xs font-semibold text-gold"><Icon d={ICONS.plus} size={14} />Add handover</button>}>Handovers</SectionTitle>
        <Card className="divide-y divide-hair overflow-hidden">
          {handovers.length === 0 && <p className="p-5 text-sm text-mute">No early handovers yet. When a Coach loses 3 in a row, Home offers the handover. Use Add handover to record one that already happened, so Previous shows the right Coach.</p>}
          {handovers.map((h) => (
            <div key={h.at} className="flex items-center gap-4 px-5 py-4">
              <div className="min-w-0 flex-1"><p className="truncate font-medium">{h.ignored ? 'Handover not counted' : `${h.from ? who(h.from) : '?'} → ${h.to ? who(h.to) : '?'}`}</p><p className={`text-sm ${h.ignored ? 'text-loss' : 'text-mute'}`}>{fmtShort(h.at.slice(0, 10))}{h.at.length > 10 ? ` · ${h.at.slice(11, 16)}` : ''}{h.ignored ? ' · before the first player starts, so it is ignored' : ''}</p></div>
              <button aria-label="Remove handover" onClick={guard(() => onChange({ ...state, benches: state.benches.filter((b) => b !== h.at) }))} className="grid size-10 place-items-center rounded-full text-mute hover:bg-sand"><Icon d="M6 6l12 12M18 6L6 18" size={18} /></button>
            </div>
          ))}
        </Card>
      </section>

      {addingHandover && <AddHandover onClose={() => setAddingHandover(false)} onSave={(at) => { if (!state.benches.includes(at)) onChange({ ...state, benches: [...state.benches, at] }); setAddingHandover(false) }} />}
      {addingSeason && <AddSeason n={seasons.length + 1} last={seasons[seasons.length - 1]?.end} onClose={() => setAddingSeason(false)} onSave={(x) => { onChange({ ...state, seasons: [...state.seasons, x] }); setAddingSeason(false) }} />}
    </div>
  )
}

function AddSeason({ n, last, onSave, onClose }: { n: number; last?: string; onSave: (s: ScheduleState['seasons'][number]) => void; onClose: () => void }) {
  const [name, setName] = useState(`Season ${n}`)
  const [start, setStart] = useState(last ? new Date(Date.parse(last) + 86_400_000).toISOString().slice(0, 10) : todayStr())
  const [end, setEnd] = useState('')
  const field = 'mt-2 min-h-12 w-full rounded-xl border border-hair bg-paper px-4'
  return (
    <Sheet title="Add season" onClose={onClose}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (name.trim() && start && end && end >= start) onSave({ id: crypto.randomUUID(), name: name.trim(), start, end }) }}>
        <label className="block text-sm font-medium">Name<input className={field} value={name} onChange={(e) => setName(e.target.value)} /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium">Starts<input type="date" className={field} value={start} onChange={(e) => setStart(e.target.value)} /></label>
          <label className="block text-sm font-medium">Ends<input type="date" className={field} value={end} min={start} onChange={(e) => setEnd(e.target.value)} /></label>
        </div>
        <Btn type="submit" variant="primary" className="w-full" disabled={!end || end < start}>Add season</Btn>
      </form>
    </Sheet>
  )
}

function AddHandover({ onSave, onClose }: { onSave: (at: string) => void; onClose: () => void }) {
  const [at, setAt] = useState(`${todayStr()}T12:00`)
  return (
    <Sheet title="Add handover" onClose={onClose}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (at) onSave(`${at}:00`) }}>
        <p className="text-sm text-mute">The next player in the squad order takes over at this moment. Games before it count for the Coach who had the team; games after it count for the next one.</p>
        <label className="block text-sm font-medium">When<input type="datetime-local" className="mt-2 min-h-12 w-full rounded-xl border border-hair bg-paper px-4" value={at} onChange={(e) => setAt(e.target.value)} /></label>
        <Btn type="submit" variant="primary" className="w-full" disabled={!at}>Add handover</Btn>
      </form>
    </Sheet>
  )
}
