import { useState } from 'react'
import { isShared } from '../lib/store'
import { dow, nextOnOrAfter, type ScheduleState } from '../lib/rotation'
import { Btn, Card } from './ui'

interface Props { state: ScheduleState; canEdit: boolean; onChange: (s: ScheduleState) => void; onNeedUnlock: () => void; onLock: () => void }

export default function Settings({ state, canEdit, onChange, onNeedUnlock, onLock }: Props) {
  const [copied, setCopied] = useState(false)
  const guard = (fn: () => void) => () => (canEdit ? fn() : onNeedUnlock())
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Settings</h1>

      <Card className="p-5">
        <h2 className="font-semibold">Rotation start</h2>
        <p className="mb-3 text-sm text-mute">The first Sunday in the loop. Player #1 goes first.</p>
        <input type="date" value={state.startDate} className="min-h-11 rounded-2xl border border-line bg-pitch px-4"
          onChange={(e) => { if (!e.target.value) return; guard(() => onChange({ ...state, startDate: dow(e.target.value) === 0 ? e.target.value : nextOnOrAfter(e.target.value, 0) }))() }} />
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold">Play days</h2>
        <p className="text-sm text-mute">Wednesday = group night, Sunday = rotation.</p>
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold">Share</h2>
        <p className="mb-3 text-sm text-mute">{isShared ? 'Everyone with this link sees the live schedule.' : 'Local mode: this schedule is saved on this device only. Connect Supabase (see README) to share it.'}</p>
        <Btn onClick={() => { navigator.clipboard?.writeText(location.href); setCopied(true); setTimeout(() => setCopied(false), 1500) }}>{copied ? 'Copied ✓' : 'Copy link'}</Btn>
      </Card>

      {isShared && (
        <Card className="p-5">
          <h2 className="font-semibold">Editing</h2>
          <p className="mb-3 text-sm text-mute">{canEdit ? 'Editing is unlocked on this device.' : 'Enter the group PIN to make changes.'}</p>
          {canEdit ? <Btn onClick={onLock}>Lock editing</Btn> : <Btn variant="primary" onClick={onNeedUnlock}>Unlock</Btn>}
        </Card>
      )}
    </div>
  )
}
