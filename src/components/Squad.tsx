import { useState } from 'react'
import { newMember } from '../lib/store'
import type { Member, ScheduleState } from '../lib/rotation'
import { controllerFor, nextOnOrAfter, todayStr } from '../lib/rotation'
import { Avatar, Btn, Card, Pill, Sheet } from './ui'

interface Props { state: ScheduleState; canEdit: boolean; onChange: (s: ScheduleState) => void; onNeedUnlock: () => void }

export default function Squad({ state, canEdit, onChange, onNeedUnlock }: Props) {
  const [editing, setEditing] = useState<Member | null>(null)
  const nextSun = nextOnOrAfter(todayStr(), 0)
  const upNext = controllerFor(state, nextSun)?.id
  const guard = (fn: () => void) => () => (canEdit ? fn() : onNeedUnlock())
  const setMembers = (members: Member[]) => onChange({ ...state, members })
  const move = (i: number, d: number) => {
    const a = [...state.members]; const j = i + d
    if (j < 0 || j >= a.length) return
    ;[a[i], a[j]] = [a[j], a[i]]; setMembers(a)
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Squad</h1>
        <Btn variant="primary" onClick={guard(() => setEditing(newMember(state.members.length)))}>+ Add player</Btn>
      </div>
      <p className="mb-5 text-mute">Sunday rotation order, top to bottom. It loops.</p>

      <ul className="space-y-2">
        {state.members.map((m, i) => (
          <li key={m.id}>
            <Card className={`flex items-center gap-3 p-3 pr-2 sm:gap-4 sm:p-4 ${m.active ? '' : 'opacity-50'}`}>
              <span className="w-5 text-center font-display text-sm font-bold text-mute">{i + 1}</span>
              <Avatar m={m} size={44} />
              <button className="min-w-0 flex-1 text-left" onClick={guard(() => setEditing(m))}>
                <p className="flex items-center gap-2 truncate font-semibold">{m.name || 'Unnamed'} {m.id === upNext && <Pill tone="lime">Up next</Pill>}</p>
                <p className="truncate text-sm text-mute">{m.team || 'No team'}{m.active ? '' : ' · sitting out'}</p>
              </button>
              <div className="flex">
                <button aria-label={`Move ${m.name} up`} disabled={i === 0} onClick={guard(() => move(i, -1))} className="grid size-11 place-items-center rounded-full text-mute hover:bg-line disabled:opacity-20">↑</button>
                <button aria-label={`Move ${m.name} down`} disabled={i === state.members.length - 1} onClick={guard(() => move(i, 1))} className="grid size-11 place-items-center rounded-full text-mute hover:bg-line disabled:opacity-20">↓</button>
              </div>
            </Card>
          </li>
        ))}
      </ul>

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

const input = 'min-h-11 w-full rounded-2xl border border-line bg-pitch px-4 text-chalk placeholder:text-mute'

function EditSheet({ member, isNew, onSave, onDelete, onClose }: { member: Member; isNew: boolean; onSave: (m: Member) => void; onDelete: () => void; onClose: () => void }) {
  const [m, setM] = useState(member)
  return (
    <Sheet title={isNew ? 'Add player' : 'Edit player'} onClose={onClose}>
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (m.name.trim()) onSave({ ...m, name: m.name.trim(), team: m.team.trim() }) }}>
        <label className="block text-sm text-mute">Character name<input autoFocus className={`${input} mt-1`} value={m.name} onChange={(e) => setM({ ...m, name: e.target.value })} placeholder="e.g. Kwame" /></label>
        <label className="block text-sm text-mute">Team<input className={`${input} mt-1`} value={m.team} onChange={(e) => setM({ ...m, team: e.target.value })} placeholder="e.g. Arsenal" /></label>
        <label className="block text-sm text-mute">Colour<input type="color" className="mt-1 block h-11 w-20 rounded-xl border border-line bg-pitch" value={m.color} onChange={(e) => setM({ ...m, color: e.target.value })} /></label>
        <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" className="size-5 accent-[#c6f24e]" checked={m.active} onChange={(e) => setM({ ...m, active: e.target.checked })} />Playing in the rotation</label>
        <div className="flex gap-2 pt-2">
          <Btn type="submit" variant="primary" className="flex-1">Save</Btn>
          {!isNew && <Btn type="button" variant="danger" onClick={onDelete}>Remove</Btn>}
        </div>
      </form>
    </Sheet>
  )
}
