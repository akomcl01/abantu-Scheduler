import { useRef, useState } from 'react'
import { compressImage } from '../lib/image'
import { COLORS, newMember } from '../lib/store'
import type { Member, ScheduleState } from '../lib/rotation'
import { controllerFor, nextMember, todayStr } from '../lib/rotation'
import PlayerCard from './PlayerCard'
import { getPosition, getRating, getStats, POSITIONS, STAT_LABELS } from '../lib/card'
import { Btn, Card, Icon, ICONS, Pill, Sheet } from './ui'

interface Props { state: ScheduleState; canEdit: boolean; onChange: (s: ScheduleState) => void; onNeedUnlock: () => void }

export default function Squad({ state, canEdit, onChange, onNeedUnlock }: Props) {
  const [editing, setEditing] = useState<Member | null>(null)
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

      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3">
        {state.members.map((m, i) => (
          <div key={m.id} className="flex flex-col items-center gap-3">
            <button onClick={guard(() => setEditing(m))} className="w-full" aria-label={`Edit ${m.name}`}>
              <PlayerCard m={m} dim={!m.active} className="mx-auto w-full max-w-[200px]" />
            </button>
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
      {!state.members.length && <Card className="p-6 text-mute">No players yet. Add the first one.</Card>}

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
  const [m, setM] = useState<Member>({ ...member, position: getPosition(member), stats: getStats(member), rating: getRating(member) })
  const file = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const onFile = async (f?: File) => {
    if (!f) return
    setBusy(true)
    try { const url = await compressImage(f, 900, 0.85, true); setM((x) => ({ ...x, cardImage: url })) } finally { setBusy(false); if (file.current) file.current.value = '' }
  }
  const setStat = (i: number, v: string) => setM({ ...m, stats: m.stats!.map((x, j) => (j === i ? Math.min(99, Math.max(1, Number(v) || 1)) : x)) })
  return (
    <Sheet title={isNew ? 'Add player' : 'Edit player'} onClose={onClose}>
      <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); if (m.name.trim()) onSave({ ...m, name: m.name.trim(), cardImage: m.cardImage?.trim() || undefined }) }}>
        <PlayerCard m={m} className="mx-auto w-36" />
        <label className="block text-sm font-medium">Character name
          <input autoFocus className={field} value={m.name} onChange={(e) => setM({ ...m, name: e.target.value })} placeholder="e.g. Kwame" />
        </label>
        <div>
          <p className="text-sm font-medium">Player picture</p>
          <p className="mt-1 text-xs text-mute">Goes inside the card. A cut-out PNG of your Clubs player (no background) looks best.</p>
          <input ref={file} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          <div className="mt-2 flex gap-2">
            <Btn type="button" className="flex-1" disabled={busy} onClick={() => file.current?.click()}>{busy ? 'Uploading…' : m.cardImage ? 'Replace image' : 'Upload image'}</Btn>
            {m.cardImage && <Btn type="button" onClick={() => setM({ ...m, cardImage: undefined })}>Remove</Btn>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium">Position
            <select className={field} value={m.position} onChange={(e) => setM({ ...m, position: e.target.value })}>{POSITIONS.map((p) => <option key={p}>{p}</option>)}</select>
          </label>
          <label className="block text-sm font-medium">Overall
            <input type="number" min={1} max={99} className={field} value={m.rating} onChange={(e) => setM({ ...m, rating: Math.min(99, Math.max(1, Number(e.target.value) || 1)) })} />
          </label>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Stats</p>
          <div className="grid grid-cols-3 gap-2">
            {STAT_LABELS.map((l, i) => (
              <label key={l} className="text-xs font-semibold text-mute">{l}
                <input type="number" min={1} max={99} className="mt-1 min-h-11 w-full rounded-xl border border-hair bg-paper px-3 text-base text-ink" value={m.stats![i]} onChange={(e) => setStat(i, e.target.value)} />
              </label>
            ))}
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
