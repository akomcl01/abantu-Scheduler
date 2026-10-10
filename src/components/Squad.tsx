import { useRef, useState } from 'react'
import { compressImage } from '../lib/image'
import { COLORS, newMember } from '../lib/store'
import type { Member, ScheduleState } from '../lib/rotation'
import { controllerFor, nextMember, todayStr } from '../lib/rotation'
import PlayerCard from './PlayerCard'
import { CoachSheet, CoachTable } from './Coaches'
import { Btn, Card, Icon, ICONS, Pill, Segmented, Sheet } from './ui'

interface Props { state: ScheduleState; canEdit: boolean; onChange: (s: ScheduleState) => void; onNeedUnlock: () => void }

export default function Squad({ state, canEdit, onChange, onNeedUnlock }: Props) {
  const [editing, setEditing] = useState<Member | null>(null)
  const [profile, setProfile] = useState<Member | null>(null)
  const [view, setView] = useState<'cards' | 'table'>('cards')
  const nowId = (controllerFor(state, todayStr()) ?? state.members.find((m) => m.active))?.id
  const nextId = nowId ? nextMember(state, nowId)?.id : undefined
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
          <h1 className="font-display text-5xl leading-[0.95] sm:text-7xl">The squad</h1>
          <p className="mt-2 text-mute">Order of play. Each player takes a whole season.</p>
        </div>
        <Btn variant="primary" onClick={guard(() => setEditing(newMember(state.members.length)))}><Icon d={ICONS.plus} size={18} />Add</Btn>
      </div>

      <Segmented<'cards' | 'table'> label="View" value={view} onChange={setView} options={[{ id: 'cards', label: 'Squad' }, { id: 'table', label: 'Table' }]} />

      {view === 'table' ? <CoachTable state={state} onOpen={setProfile} /> : (
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3">
        {state.members.map((m, i) => (
          <div key={m.id} className="flex flex-col items-center gap-3">
            <button onClick={() => setProfile(m)} className="w-full" aria-label={`${m.name} profile`}>
              <PlayerCard m={m} dim={!m.active} className="mx-auto w-full max-w-[200px]" />
            </button>
            {m.realName?.trim() && <p className="-mb-1 w-full truncate text-center font-semibold">{m.realName.trim()}</p>}
            <div className="flex items-center gap-1">
              <button aria-label={`Move ${m.name} earlier`} disabled={i === 0} onClick={guard(() => move(i, -1))} className="grid size-10 place-items-center rounded-full text-mute hover:bg-sand disabled:opacity-20"><Icon d={ICONS.left} /></button>
              <span className="min-w-14 text-center">
                {m.id === nowId ? <Pill tone="accent">Playing</Pill> : m.id === nextId ? <Pill tone="gold">Next</Pill> : <span className="font-display text-2xl leading-none text-mute">{i + 1}</span>}
              </span>
              <button aria-label={`Move ${m.name} later`} disabled={i === state.members.length - 1} onClick={guard(() => move(i, 1))} className="grid size-10 place-items-center rounded-full text-mute hover:bg-sand disabled:opacity-20"><Icon d={ICONS.right} /></button>
            </div>
            {!m.active && <span className="-mt-1 text-xs text-mute">Sitting out</span>}
          </div>
        ))}
      </div>
      )}
      {!state.members.length && <Card className="p-6 text-mute">No players yet. Add the first one.</Card>}

      {profile && <CoachSheet state={state} m={profile} onClose={() => setProfile(null)} onEdit={guard(() => { setEditing(profile); setProfile(null) })} />}

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

const field = 'mt-2 min-h-12 w-full rounded-2xl border border-hair bg-paper px-4 placeholder:text-mute'

function EditSheet({ member, isNew, onSave, onDelete, onClose }: { member: Member; isNew: boolean; onSave: (m: Member) => void; onDelete: () => void; onClose: () => void }) {
  const [m, setM] = useState<Member>({ ...member })
  const file = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const onFile = async (f?: File) => {
    if (!f) return
    setBusy(true)
    try { const url = await compressImage(f, 900, 0.85, true); setM((x) => ({ ...x, cardImage: url })) } finally { setBusy(false); if (file.current) file.current.value = '' }
  }
  return (
    <Sheet title={isNew ? 'Add player' : 'Edit player'} onClose={onClose}>
      <form className="space-y-5" onPaste={(e) => { const f = [...e.clipboardData.files].find((x) => x.type.startsWith('image/')); if (f) { e.preventDefault(); onFile(f) } }} onSubmit={(e) => { e.preventDefault(); if (m.name.trim()) onSave({ ...m, name: m.name.trim(), realName: m.realName?.trim() || undefined, cardImage: m.cardImage?.trim() || undefined }) }}>
        <PlayerCard m={m} className="mx-auto w-36" />
        <label className="block text-sm font-medium">Real name
          <input autoFocus className={field} value={m.realName ?? ''} onChange={(e) => setM({ ...m, realName: e.target.value })} placeholder="e.g. Theo" />
        </label>
        <label className="block text-sm font-medium">Character name
          <input className={field} value={m.name} onChange={(e) => setM({ ...m, name: e.target.value })} placeholder="e.g. Ferragosto" />
        </label>
        <div>
          <p className="text-sm font-medium">Card picture</p>
          <p className="mt-1 text-xs text-mute">The player's card from the game, cropped to the card's edge. It fills the frame above. Upload it, or paste it (Ctrl or Cmd + V).</p>
          <input ref={file} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          <div className="mt-2 flex gap-2">
            <Btn type="button" className="flex-1" disabled={busy} onClick={() => file.current?.click()}>{busy ? 'Uploading…' : m.cardImage ? 'Replace image' : 'Upload image'}</Btn>
            {m.cardImage && <Btn type="button" onClick={() => setM({ ...m, cardImage: undefined })}>Remove</Btn>}
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Colour</p>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button type="button" key={c} aria-label={`Colour ${c}`} aria-pressed={m.color === c} onClick={() => setM({ ...m, color: c })}
                className={`size-10 rounded-full ${m.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-card' : ''}`} style={{ background: c }} />
            ))}
          </div>
        </div>
        <label className="flex min-h-11 items-center gap-3 text-sm font-medium"><input type="checkbox" className="size-5 accent-[#34E0A1]" checked={m.active} onChange={(e) => setM({ ...m, active: e.target.checked })} />Playing in the rotation</label>
        <div className="flex gap-2">
          <Btn type="submit" variant="primary" className="flex-1">Save</Btn>
          {!isNew && <Btn type="button" variant="danger" onClick={onDelete}>Remove</Btn>}
        </div>
      </form>
    </Sheet>
  )
}
