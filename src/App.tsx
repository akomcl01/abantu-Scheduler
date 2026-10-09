import { useState } from 'react'
import CalendarView from './components/CalendarView'
import Home from './components/Home'
import Settings from './components/Settings'
import Squad from './components/Squad'
import { Btn, Sheet } from './components/ui'
import { isShared, useSchedule } from './lib/store'

const tabs = [
  { id: 'home', label: 'Next up', icon: '⚽' },
  { id: 'calendar', label: 'Calendar', icon: '📅' },
  { id: 'squad', label: 'Squad', icon: '👥' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
] as const
type Tab = (typeof tabs)[number]['id']

export default function App() {
  const { state, save, canEdit, unlock, error } = useSchedule()
  const [tab, setTab] = useState<Tab>('home')
  const [askPin, setAskPin] = useState(false)
  const [pin, setPin] = useState('')
  const [bad, setBad] = useState(false)

  if (!state) return <div className="grid min-h-screen place-items-center text-mute">Loading…</div>
  const need = () => (isShared ? setAskPin(true) : undefined)

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col sm:flex-row">
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-line bg-pitch/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:static sm:flex sm:w-56 sm:shrink-0 sm:flex-col sm:gap-1 sm:border-0 sm:bg-transparent sm:p-6 sm:pt-10">
        <p className="hidden px-3 pb-6 font-display text-xl font-bold sm:block">Abantu<span className="text-lime"> FC</span></p>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} aria-current={tab === t.id ? 'page' : undefined}
            className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-semibold transition sm:min-h-12 sm:flex-row sm:justify-start sm:gap-3 sm:rounded-full sm:px-4 sm:text-sm ${tab === t.id ? 'text-lime sm:bg-line/70' : 'text-mute hover:text-chalk'}`}>
            <span className="text-lg sm:text-base" aria-hidden>{t.icon}</span>{t.label}
          </button>
        ))}
      </nav>

      <main className="flex-1 px-4 pb-28 pt-6 sm:px-6 sm:pb-10 sm:pt-10">
        {error && <p className="mb-4 rounded-2xl border border-red-400/40 p-3 text-sm text-red-300">{error}</p>}
        {tab === 'home' && <Home state={state} />}
        {tab === 'calendar' && <CalendarView state={state} canEdit={canEdit} onChange={save} onNeedUnlock={need} />}
        {tab === 'squad' && <Squad state={state} canEdit={canEdit} onChange={save} onNeedUnlock={need} />}
        {tab === 'settings' && <Settings state={state} canEdit={canEdit} onChange={save} onNeedUnlock={need} onLock={() => unlock(null)} />}
      </main>

      {askPin && (
        <Sheet title="Group PIN" onClose={() => setAskPin(false)}>
          <form className="space-y-3" onSubmit={async (e) => { e.preventDefault(); const ok = await unlock(pin); setBad(!ok); if (ok) { setAskPin(false); setPin('') } }}>
            <input autoFocus type="password" inputMode="text" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Enter PIN" className="min-h-11 w-full rounded-2xl border border-line bg-pitch px-4" />
            {bad && <p className="text-sm text-red-300">Wrong PIN.</p>}
            <Btn type="submit" variant="primary" className="w-full">Unlock editing</Btn>
          </form>
        </Sheet>
      )}
    </div>
  )
}
