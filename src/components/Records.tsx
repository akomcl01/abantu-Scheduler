import { useRef, useState } from 'react'
import { compressImage } from '../lib/image'
import type { Comp, ScheduleState } from '../lib/rotation'
import { recordFor, seasonOn, todayStr } from '../lib/rotation'
import { Btn, Card, Icon, ICONS, SectionTitle, Sheet } from './ui'

interface Props { state: ScheduleState; canEdit: boolean; onChange: (s: ScheduleState) => void; onNeedUnlock: () => void }

export default function Records({ state, canEdit, onChange, onNeedUnlock }: Props) {
  const season = seasonOn(state, todayStr())
  const key = season?.id ?? 'all'
  const rec = recordFor(state.games, season)
  const pics = state.recordPics?.[key] ?? {}
  const setPic = (kind: Comp, url: string | null) => {
    const cur = { ...(state.recordPics?.[key] ?? {}) }
    if (url) cur[kind] = url; else delete cur[kind]
    onChange({ ...state, recordPics: { ...(state.recordPics ?? {}), [key]: cur } })
  }
  return (
    <section>
      <SectionTitle>Records · {season ? season.name : 'All time'}</SectionTitle>
      <div className="grid gap-3 sm:grid-cols-2">
        <RecordCard title="League record" t={rec.league} pic={pics.league} canEdit={canEdit} onNeedUnlock={onNeedUnlock} onPic={(u) => setPic('league', u)} />
        <RecordCard title="Playoff record" t={rec.playoff} pic={pics.playoff} canEdit={canEdit} onNeedUnlock={onNeedUnlock} onPic={(u) => setPic('playoff', u)} gold />
      </div>
    </section>
  )
}

function RecordCard({ title, t, pic, canEdit, onNeedUnlock, onPic, gold = false }: { title: string; t: { w: number; d: number; l: number }; pic?: string; canEdit: boolean; onNeedUnlock: () => void; onPic: (url: string | null) => void; gold?: boolean }) {
  const input = useRef<HTMLInputElement>(null)
  const [view, setView] = useState(false)
  const [busy, setBusy] = useState(false)
  const games = t.w + t.d + t.l
  const rate = games ? Math.round((t.w / games) * 100) : null
  const pick = () => (canEdit ? input.current?.click() : onNeedUnlock())
  const onFile = async (f?: File) => {
    if (!f) return
    setBusy(true)
    try { onPic(await compressImage(f)) } finally { setBusy(false); if (input.current) input.current.value = '' }
  }
  return (
    <Card className={`p-4 ${gold ? 'border-gold/40' : ''}`}>
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold">{gold && <Icon d={ICONS.trophy} size={16} className="text-gold" />}{title}</h3>
        {rate !== null && <span className="text-xs text-mute">{rate}% wins</span>}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        {([['W', t.w, 'text-win'], ['D', t.d, 'text-ink'], ['L', t.l, 'text-loss']] as const).map(([k, v, c]) => (
          <div key={k} className="rounded-xl bg-sand py-2"><p className={`font-display text-3xl leading-none ${c}`}>{v}</p><p className="mt-1 text-[11px] uppercase tracking-wider text-mute">{k === 'W' ? 'Wins' : k === 'D' ? 'Draws' : 'Losses'}</p></div>
        ))}
      </div>
      <p className="mt-2 text-xs text-mute">{games === 0 ? 'No games logged yet' : `${games} game${games === 1 ? '' : 's'} logged`}</p>

      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      {pic ? (
        <button onClick={() => setView(true)} className="mt-3 block w-full overflow-hidden rounded-xl border border-hair" aria-label={`View ${title} screenshot`}>
          <img src={pic} alt={`${title} screenshot`} className="max-h-40 w-full object-cover" />
        </button>
      ) : (
        <button onClick={pick} disabled={busy} className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-hair text-sm font-medium text-mute hover:bg-sand">
          <Icon d="M4 8h3l2-3h6l2 3h3v11H4zM12 17a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" size={18} />{busy ? 'Adding…' : 'Add screenshot of the record'}
        </button>
      )}

      {view && pic && (
        <Sheet title={title} onClose={() => setView(false)}>
          <img src={pic} alt={`${title} screenshot`} className="w-full rounded-xl" />
          <div className="mt-4 flex gap-2">
            <Btn onClick={() => { setView(false); pick() }} className="flex-1">Replace</Btn>
            <Btn variant="danger" onClick={() => { if (canEdit) { onPic(null); setView(false) } else onNeedUnlock() }}>Remove</Btn>
          </div>
        </Sheet>
      )}
    </Card>
  )
}
