import { useState } from 'react'
import CalendarView from './components/CalendarView'
import Home from './components/Home'
import Settings from './components/Settings'
import Squad from './components/Squad'
import { Btn, Icon, ICONS, Sheet } from './components/ui'
import { isShared, useSchedule } from './lib/store'

const tabs = [
  { id: 'home', label: 'Next up', icon: ICONS.home },
  { id: 'calendar', label: 'Calendar', icon: ICONS.cal },
  { id: 'squad', label: 'Squad', icon: ICONS.users },
  { id: 'settings', label: 'Settings', icon: ICONS.gear },
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
    <div className="mx-auto min-h-screen max-w-2xl px-4 sm:px-6">
      <header className="hidden items-center justify-between pb-2 pt-8 sm:flex">
        <p className="font-display text-3xl leading-none">Abantu</p>
        <Nav tab={tab} setTab={setTab} />
        <span className="w-[74px]" />
      </header>
      <div className="sm:hidden"><div className="pt-6"><p className="font-display text-2xl leading-none">Abantu</p></div></div>

      <main className="pb-32 pt-6 sm:pb-16 sm:pt-8">
        {error && <p className="mb-4 rounded-2xl border border-accent/40 bg-card p-3 text-sm text-accent">{error}</p>}
        {tab === 'home' && <Home state={state} />}
        {tab === 'calendar' && <CalendarView state={state} canEdit={canEdit} onChange={save} onNeedUnlock={need} />}
        {tab === 'squad' && <Squad state={state} canEdit={canEdit} onChange={save} onNeedUnlock={need} />}
        {tab === 'settings' && <Settings state={state} canEdit={canEdit} onChange={save} onNeedUnlock={need} onLock={() => unlock(null)} />}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:hidden">
        <Nav tab={tab} setTab={setTab} mobile />
      </div>

      {askPin && (
        <Sheet title="Group PIN" onClose={() => setAskPin(false)}>
          <form className="space-y-3" onSubmit={async (e) => { e.preventDefault(); const ok = await unlock(pin); setBad(!ok); if (ok) { setAskPin(false); setPin('') } }}>
            <input autoFocus type="password" inputMode="text" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Enter PIN" className="min-h-12 w-full rounded-2xl border border-hair bg-paper px-4" />
            {bad && <p className="text-sm text-accent">Wrong PIN.</p>}
            <Btn type="submit" variant="primary" className="w-full">Unlock editing</Btn>
          </form>
        </Sheet>
      )}
    </div>
  )
}

function Nav({ tab, setTab, mobile = false }: { tab: Tab; setTab: (t: Tab) => void; mobile?: boolean }) {
  return (
    <nav aria-label="Main" className="flex gap-1 rounded-full border border-hair bg-card/95 p-1.5 shadow-[0_8px_30px_rgba(29,27,24,0.10)] backdrop-blur">
      {tabs.map((t) => {
        const on = tab === t.id
        return (
          <button key={t.id} onClick={() => setTab(t.id)} aria-current={on ? 'page' : undefined} aria-label={t.label}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-full text-sm font-semibold transition ${mobile ? 'px-4' : 'px-4'} ${on ? 'bg-ink text-card' : 'text-mute hover:text-ink'}`}>
            <Icon d={t.icon} size={20} />
            <span className={on ? '' : 'hidden lg:inline'}>{on || !mobile ? t.label : ''}</span>
          </button>
        )
      })}
    </nav>
  )
}
