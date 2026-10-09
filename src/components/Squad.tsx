import { useState } from 'react'
import { COLORS, newMember } from '../lib/store'
import type { Member, ScheduleState } from '../lib/rotation'
import { controllerFor, nextOnOrAfter, todayStr } from '../lib/rotation'
import { Avatar, Btn, Card, Icon, ICONS, Pill, Sheet } from './ui'

interface Props { state: ScheduleState; canEdit: boolean; onChange: (s: ScheduleState) => void; onNeedUnlock: () => void }

export default function Squad({ state, canEdit, onChange, onNeedUnlock }: Props) {
  const [editing, setEditing] = useState<Member | null>(null)
  const upNext = controllerFor(state, nextOnOrAfter(todayStr(), 0))?.id
  const guard = (fn: () => void) => () => (canEdit ? fn() : onNeedUnlock())
  const setMembers = (members: Member[]) => onChange({ ...state, members })
  const move = (i: number, d: number) => {
    const a = [...state.members]; const j = i + d
    if (j < 0 || j >= a.length) return
    ;[a[i], a[j]] = [a[j], a[i]]; setMembers(a)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl leading-none sm:text-6xl">The squad</h1>
          <p className="mt-2 text-mute">Sunday order, top to bottom. It loops.</p>
        </div>
        <Btn variant="primary" onClick={guard(() => setEditing(newMember(state.members.length)))}><Icon d={ICONS.plus} size={18} />Add</Btn>
      </div>

      <Card className="divide-y divide-hair overflow-hidden">
        {state.members.map((m, i) => (
          <div key={m.id} className={`flex items-center gap-3 py-3 pl-5 pr-2 ${m.active ? '' : 'opacity-50'}`}>
            <span className="w-4 font-display text-2xl leading-none text-mute">{i + 1}</span>
            <Avatar m={m} size={44} />
            <button className="min-w-0 flex-1 py-1 text-left" onClick={guard(() => setEditing(m))}>
              <p className="flex items-center gap-2 truncate font-medium">{m.name || 'Unnamed'} {m.id === upNext && <Pill tone="accent">Up next</Pill>}</p>
              {!m.active && <p className="text-sm text-mute">Sitting out</p>}
            </button>
            <button aria-label={`Move ${m.name} up`} disabled={i === 0} onClick={guard(() => move(i, -1))} className="grid size-11 place-items-center rounded-full text-mute hover:bg-sand disabled:opacity-20"><Icon d={ICONS.up} /></button>
            <button aria-label={`Move ${m.name} down`} disabled={i === state.members.length - 1} onClick={guard(() => move(i, 1))} className="grid size-11 place-items-center rounded-full text-mute hover:bg-sand disabled:opacity-20"><Icon d={ICONS.down} /></button>
          </div>
        ))}
        {!state.members.length && <p className="p-6 text-mute">No players yet. Add the first one.</p>}
      </Card>

      {editing && (
        <EditSheet
          member={editing}
          isNew={!state.members.some((m) => m.id === editing.id)}
          onClose={() => setEditing(null)}
          onSave={(m) => {
            setMembers(state.members.some((x) => x.id === m.id) ? state.members.map((x) => (x.id === m.id ? m : x)) : [...state.members, m])
            setEditing(null)
          }}
          onDelete={() => { setMembers(state.members.filter((x) => x.id !== editing.id)); setEditing(null) }}
        />
      )}
    </div>
  )
}

function EditSheet({ member, isNew, onSave, onDelete, onClose }: { member: Member; isNew: boolean; onSave: (m: Member) => void; onDelete: () => void; onClose: () => void }) {
  const [m, setM] = useState(member)
  return (
    <Sheet title={isNew ? 'Add player' : 'Edit player'} onClose={onClose}>
      <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); if (m.name.trim()) onSave({ ...m, name: m.name.trim() }) }}>
        <label className="block text-sm font-medium">Character name
          <input autoFocus className="mt-2 min-h-12 w-full rounded-2xl border border-hair bg-paper px-4 placeholder:text-mute" value={m.name} onChange={(e) => setM({ ...m, name: e.target.value })} placeholder="e.g. Kwame" />
        </label>
        <div>
          <p className="mb-2 text-sm font-medium">Colour</p>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button type="button" key={c} aria-label={`Colour ${c}`} aria-pressed={m.color === c} onClick={() => setM({ ...m, color: c })}
                className={`size-10 rounded-full ${m.color === c ? 'ring-2 ring-ink ring-offset-2 ring-offset-card' : ''}`} style={{ background: c }} />
            ))}
          </div>
        </div>
        <label className="flex min-h-11 items-center gap-3 text-sm font-medium"><input type="checkbox" className="size-5 accent-[#1D1B18]" checked={m.active} onChange={(e) => setM({ ...m, active: e.target.checked })} />Playing in the rotation</label>
        <div className="flex gap-2">
          <Btn type="submit" variant="primary" className="flex-1">Save</Btn>
          {!isNew && <Btn type="button" variant="danger" onClick={onDelete}>Remove</Btn>}
        </div>
      </form>
    </Sheet>
  )
}
