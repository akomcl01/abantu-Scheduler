import { useState, type ReactNode } from 'react'
import { isShared } from '../lib/store'
import { dow, nextOnOrAfter, type ScheduleState } from '../lib/rotation'
import { Btn, Card } from './ui'

interface Props { state: ScheduleState; canEdit: boolean; onChange: (s: ScheduleState) => void; onNeedUnlock: () => void; onLock: () => void; theme: 'fc' | 'classic'; onTheme: (t: 'fc' | 'classic') => void }

const Row = ({ title, desc, children }: { title: string; desc: string; children?: ReactNode }) => (
  <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
    <div className="max-w-md"><h2 className="font-medium">{title}</h2><p className="text-sm text-mute">{desc}</p></div>
    {children}
  </div>
)

export default function Settings({ state, canEdit, onChange, onNeedUnlock, onLock, theme, onTheme }: Props) {
  const [copied, setCopied] = useState(false)
  const guard = (fn: () => void) => () => (canEdit ? fn() : onNeedUnlock())
  return (
    <div className="space-y-8">
      <h1 className="font-display text-5xl leading-[0.95] sm:text-7xl">Settings</h1>
      <Card className="divide-y divide-hair overflow-hidden">
        <Row title="Rotation starts" desc="The first Sunday in the loop. The first player in the squad goes first.">
          <input type="date" value={state.startDate} className="min-h-11 rounded-2xl border border-hair bg-paper px-4"
            onChange={(e) => { if (!e.target.value) return; const v = e.target.value; guard(() => onChange({ ...state, startDate: dow(v) === 0 ? v : nextOnOrAfter(v, 0) }))() }} />
        </Row>
        <Row title="Look" desc="FC is the dark game-menu style. Classic is the warm paper style.">
          <div className="flex gap-1 rounded-full bg-sand p-1" role="group" aria-label="Look">
            {(['fc', 'classic'] as const).map((t) => (
              <button key={t} onClick={() => onTheme(t)} aria-pressed={theme === t}
                className={`min-h-10 rounded-full px-5 text-sm font-semibold ${theme === t ? 'bg-ink text-paper' : 'text-mute'}`}>{t === 'fc' ? 'FC' : 'Classic'}</button>
            ))}
          </div>
        </Row>
        <Row title="Play days" desc="Wednesday and Sunday. One player covers both nights each week." />
        <Row title="Share" desc={isShared ? 'Anyone with this link sees the live schedule.' : 'Saved on this device only for now. Publish the site to share it with the group.'}>
          <Btn onClick={() => { navigator.clipboard?.writeText(location.href); setCopied(true); setTimeout(() => setCopied(false), 1500) }}>{copied ? 'Copied' : 'Copy link'}</Btn>
        </Row>
        {isShared && (
          <Row title="Editing" desc={canEdit ? 'Editing is unlocked on this device.' : 'Enter the group PIN to make changes.'}>
            {canEdit ? <Btn onClick={onLock}>Lock editing</Btn> : <Btn variant="primary" onClick={onNeedUnlock}>Unlock</Btn>}
          </Row>
        )}
      </Card>
    </div>
  )
}
